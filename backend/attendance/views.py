from datetime import timedelta

from pathlib import Path

from django.db import transaction
from django.http import FileResponse
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from core.roles import is_admin, portal_role, teacher_class_ids
from parents.models import StudentParent
from school.models import Student, Term
from .models import (
    AttendanceAuditLog,
    AttendanceExcuse,
    AttendanceNotification,
    AttendanceRecord,
    AttendanceReportSnapshot,
    AttendanceSettings,
    AttendanceTermSummary,
    SchoolCalendarDay,
)
from .serializers import (
    AttendanceAuditLogSerializer,
    AttendanceExcuseSerializer,
    AttendanceNotificationSerializer,
    AttendanceRecordSerializer,
    AttendanceReportSnapshotSerializer,
    AttendanceSettingsSerializer,
    AttendanceTermSummarySerializer,
    SchoolCalendarDaySerializer,
)


ATTENDANCE_ADMIN_ROLES = {'admin', 'head', 'deputy head', 'senior teacher', 'admin clerk'}


def can_manage_attendance(user):
    return is_admin(user) or portal_role(user) in ATTENDANCE_ADMIN_ROLES


def term_for_date(attendance_date):
    return Term.objects.filter(
        start_date__lte=attendance_date,
        end_date__gte=attendance_date,
    ).select_related('academic_year').first()


def record_snapshot(record):
    return {
        'student': record.student_id,
        'school_class': record.school_class_id,
        'term': record.term_id,
        'date': record.date.isoformat(),
        'session': record.session,
        'status': record.status,
        'late_minutes': record.late_minutes,
        'excuse_reason': record.excuse_reason,
        'excuse_note': record.excuse_note,
    }


class AttendanceRecordViewSet(viewsets.ModelViewSet):
    queryset = AttendanceRecord.objects.select_related(
        'student', 'student__school_class', 'school_class', 'term', 'marked_by', 'last_edited_by'
    ).all()
    serializer_class = AttendanceRecordSerializer
    filterset_fields = ['student', 'date', 'status', 'session', 'term', 'school_class']
    http_method_names = ['get', 'post', 'patch', 'put', 'delete', 'head', 'options']

    def get_queryset(self):
        user = self.request.user
        role = portal_role(user)
        queryset = super().get_queryset()
        if can_manage_attendance(user):
            return queryset
        if role == 'student':
            return queryset.filter(student__user=user)
        if role == 'parent':
            linked_ids = StudentParent.objects.filter(parent__user=user).values_list('student_id', flat=True)
            return queryset.filter(student_id__in=linked_ids)
        if role == 'teacher':
            allowed = teacher_class_ids(user)
            return queryset.filter(school_class_id__in=allowed) | queryset.filter(
                school_class__isnull=True,
                student__school_class_id__in=allowed,
            )
        return queryset.none()

    def _require_teacher_or_admin(self, student):
        user = self.request.user
        if can_manage_attendance(user):
            return
        if portal_role(user) != 'teacher' or student.school_class_id not in teacher_class_ids(user):
            raise PermissionDenied('Only an administrator or a teacher assigned to the class can change attendance.')

    def _existing_record_for_payload(self, payload):
        if not isinstance(payload, dict):
            return None
        fields = self.get_serializer().fields
        student = fields['student'].run_validation(payload.get('student'))
        attendance_date = fields['date'].run_validation(payload.get('date'))
        session = payload.get('session', 'morning')
        return AttendanceRecord.objects.filter(
            student=student,
            date=attendance_date,
            session=session,
        ).first()

    def _save_validated_record(self, validated_data, existing=None):
        values = dict(validated_data)
        reason = values.pop('reason', '').strip()
        if existing:
            for field in ('student', 'date', 'session', 'status', 'late_minutes', 'excuse_reason', 'excuse_note'):
                values.setdefault(field, getattr(existing, field))
        student = values['student']
        self._require_teacher_or_admin(student)
        attendance_date = values['date']
        term = term_for_date(attendance_date)
        class_at_marking = student.school_class
        user = self.request.user
        now = timezone.now()
        if existing:
            old_value = record_snapshot(existing)
            fields = ('date', 'session', 'status', 'late_minutes', 'excuse_reason', 'excuse_note')
            changed = any(getattr(existing, field) != values.get(field, getattr(existing, field)) for field in fields)
            if changed:
                settings = AttendanceSettings.objects.order_by('pk').first()
                cutoff_hours = settings.edit_cutoff_hours if settings else 24
                cutoff_passed = now > existing.marked_at + timedelta(hours=cutoff_hours)
                if (can_manage_attendance(user) or cutoff_passed) and not reason:
                    raise ValidationError({'reason': 'Enter a reason for correcting this attendance record.'})
                for field, value in values.items():
                    setattr(existing, field, value)
                existing.school_class = existing.school_class or class_at_marking
                existing.term = term
                existing.last_edited_by = user
                existing.last_edited_at = now
                existing.save()
                AttendanceAuditLog.objects.create(
                    attendance_record=existing,
                    student=student,
                    actor=user,
                    action='updated',
                    old_value=old_value,
                    new_value=record_snapshot(existing),
                    reason=reason,
                )
            return existing, False

        record = AttendanceRecord.objects.create(
            **values,
            school_class=class_at_marking,
            term=term,
            marked_by=user,
        )
        AttendanceAuditLog.objects.create(
            attendance_record=record,
            student=student,
            actor=user,
            action='created',
            new_value=record_snapshot(record),
        )
        return record, True

    def create(self, request, *args, **kwargs):
        existing = self._existing_record_for_payload(request.data)
        serializer = self.get_serializer(instance=existing, data=request.data)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            record, created = self._save_validated_record(serializer.validated_data, existing)
        return Response(
            self.get_serializer(record).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def perform_update(self, serializer):
        instance = self.get_object()
        self._save_validated_record(serializer.validated_data, instance)

    def perform_destroy(self, instance):
        self._require_teacher_or_admin(instance.student)
        reason = str(self.request.data.get('reason', '')).strip()
        if not can_manage_attendance(self.request.user) or not reason:
            raise ValidationError({'reason': 'An authorised administrator and a correction reason are required to delete attendance.'})
        old_value = record_snapshot(instance)
        AttendanceAuditLog.objects.create(
            attendance_record=None,
            student=instance.student,
            actor=self.request.user,
            action='deleted',
            old_value=old_value,
            reason=reason,
        )
        instance.delete()

    @action(detail=False, methods=['post'])
    def bulk(self, request):
        if not isinstance(request.data, list):
            return Response({'detail': 'Expected a list of attendance records.'}, status=status.HTTP_400_BAD_REQUEST)
        validated_records = []
        seen_student_dates = set()
        for item in request.data:
            if not isinstance(item, dict):
                return Response({'detail': 'Each attendance record must be an object.'}, status=status.HTTP_400_BAD_REQUEST)
            existing = self._existing_record_for_payload(item)
            serializer = self.get_serializer(instance=existing, data=item)
            serializer.is_valid(raise_exception=True)
            values = serializer.validated_data
            student_date = (values['student'].pk, values['date'], values.get('session', 'morning'))
            if student_date in seen_student_dates:
                return Response(
                    {'detail': 'A learner can appear only once per date and session in a bulk request.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            seen_student_dates.add(student_date)
            validated_records.append((values, existing))
        with transaction.atomic():
            saved = [self._save_validated_record(values, existing)[0] for values, existing in validated_records]
        return Response(self.get_serializer(saved, many=True).data, status=status.HTTP_200_OK)


class SchoolCalendarDayViewSet(viewsets.ModelViewSet):
    queryset = SchoolCalendarDay.objects.select_related('term', 'updated_by').all()
    serializer_class = SchoolCalendarDaySerializer
    filterset_fields = ['date', 'day_type', 'term']

    def get_queryset(self):
        return super().get_queryset()

    def perform_create(self, serializer):
        if not can_manage_attendance(self.request.user):
            raise PermissionDenied('Only authorised administrators can manage the school calendar.')
        serializer.save(updated_by=self.request.user)

    def perform_update(self, serializer):
        if not can_manage_attendance(self.request.user):
            raise PermissionDenied('Only authorised administrators can manage the school calendar.')
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        if not can_manage_attendance(self.request.user):
            raise PermissionDenied('Only authorised administrators can manage the school calendar.')
        instance.delete()


class AttendanceSettingsViewSet(viewsets.ModelViewSet):
    queryset = AttendanceSettings.objects.all()
    serializer_class = AttendanceSettingsSerializer

    def get_queryset(self):
        return super().get_queryset()

    def list(self, request, *args, **kwargs):
        settings_record = self.get_queryset().order_by('pk').first()
        if settings_record is None:
            if can_manage_attendance(request.user):
                settings_record = AttendanceSettings.objects.create(updated_by=request.user)
            else:
                settings_record = AttendanceSettings()
        return Response(self.get_serializer(settings_record).data)

    def create(self, request, *args, **kwargs):
        if not can_manage_attendance(request.user):
            raise PermissionDenied('Attendance policy settings are available to school administrators only.')
        settings_record = AttendanceSettings.objects.order_by('pk').first()
        if settings_record:
            serializer = self.get_serializer(settings_record, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save(updated_by=request.user)
            return Response(serializer.data)
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_update(self, serializer):
        if not can_manage_attendance(self.request.user):
            raise PermissionDenied('Attendance policy settings are available to school administrators only.')
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        if not can_manage_attendance(self.request.user):
            raise PermissionDenied('Attendance policy settings are available to school administrators only.')
        instance.delete()


class AttendanceExcuseViewSet(viewsets.ModelViewSet):
    queryset = AttendanceExcuse.objects.select_related('student', 'submitted_by', 'reviewed_by').all()
    serializer_class = AttendanceExcuseSerializer
    http_method_names = ['get', 'post', 'patch', 'head', 'options']
    filterset_fields = ['student', 'date', 'status']

    def get_queryset(self):
        user = self.request.user
        if can_manage_attendance(user):
            return super().get_queryset()
        role = portal_role(user)
        if role == 'parent':
            linked_ids = StudentParent.objects.filter(parent__user=user).values_list('student_id', flat=True)
            return super().get_queryset().filter(student_id__in=linked_ids)
        if role == 'student':
            return super().get_queryset().filter(student__user=user)
        if role == 'teacher':
            return super().get_queryset().filter(student__school_class_id__in=teacher_class_ids(user))
        return AttendanceExcuse.objects.none()

    def create(self, request, *args, **kwargs):
        if portal_role(request.user) != 'parent':
            raise PermissionDenied('Only a parent or guardian can submit an attendance excuse.')
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(submitted_by=self.request.user)

    def update(self, request, *args, **kwargs):
        if not can_manage_attendance(request.user):
            raise PermissionDenied('Only authorised administrators can review attendance excuses.')
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        if not can_manage_attendance(request.user):
            raise PermissionDenied('Only authorised administrators can review attendance excuses.')
        return super().partial_update(request, *args, **kwargs)

    @action(detail=True, methods=['get'], url_path='attachment')
    def attachment_download(self, request, pk=None):
        excuse = self.get_object()  # get_queryset limits this to the caller's own students
        if not excuse.attachment:
            return Response({'detail': 'This excuse has no attachment.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            response = FileResponse(excuse.attachment.open('rb'), as_attachment=True,
                                    filename=Path(excuse.attachment.name).name)
        except OSError:
            return Response({'detail': 'The attachment is unavailable.'}, status=status.HTTP_404_NOT_FOUND)
        response['X-Content-Type-Options'] = 'nosniff'
        response['Content-Security-Policy'] = "default-src 'none'; sandbox"
        return response

    @action(detail=True, methods=['post'])
    def review(self, request, pk=None):
        if not can_manage_attendance(request.user):
            raise PermissionDenied('Only authorised administrators can review attendance excuses.')
        decision = request.data.get('status')
        if decision not in {'approved', 'rejected'}:
            raise ValidationError({'status': 'Choose approved or rejected.'})
        excuse = self.get_object()
        now = timezone.now()
        with transaction.atomic():
            excuse.status = decision
            excuse.reviewed_by = request.user
            excuse.reviewed_at = now
            excuse.review_note = str(request.data.get('review_note', '')).strip()[:500]
            excuse.save(update_fields=['status', 'reviewed_by', 'reviewed_at', 'review_note'])
            if decision == 'approved':
                record, created = AttendanceRecord.objects.get_or_create(
                    student=excuse.student,
                    date=excuse.date,
                    session='morning',
                    defaults={
                        'school_class': excuse.student.school_class,
                        'term': term_for_date(excuse.date),
                        'status': 'excused',
                        'excuse_reason': excuse.reason,
                        'excuse_note': excuse.note,
                        'marked_by': request.user,
                    },
                )
                if not created:
                    old_value = record_snapshot(record)
                    record.status = 'excused'
                    record.excuse_reason = excuse.reason
                    record.excuse_note = excuse.note
                    record.last_edited_by = request.user
                    record.last_edited_at = now
                    record.save()
                    AttendanceAuditLog.objects.create(
                        attendance_record=record,
                        student=excuse.student,
                        actor=request.user,
                        action='updated',
                        old_value=old_value,
                        new_value=record_snapshot(record),
                        reason='Approved parent-submitted attendance excuse.',
                    )
                else:
                    AttendanceAuditLog.objects.create(
                        attendance_record=record,
                        student=excuse.student,
                        actor=request.user,
                        action='created',
                        new_value=record_snapshot(record),
                        reason='Approved parent-submitted attendance excuse.',
                    )
        return Response(self.get_serializer(excuse).data)


class AttendanceTermSummaryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AttendanceTermSummary.objects.select_related('student', 'term', 'term__academic_year').all()
    serializer_class = AttendanceTermSummarySerializer
    filterset_fields = ['student', 'term']

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        if can_manage_attendance(user):
            return queryset
        role = portal_role(user)
        if role == 'student':
            return queryset.filter(student__user=user)
        if role == 'parent':
            linked_ids = StudentParent.objects.filter(parent__user=user).values_list('student_id', flat=True)
            return queryset.filter(student_id__in=linked_ids)
        if role == 'teacher':
            return queryset.filter(student__school_class_id__in=teacher_class_ids(user))
        return queryset.none()

    def filter_queryset(self, queryset):
        queryset = super().filter_queryset(queryset)
        year = self.request.query_params.get('year')
        term_name = self.request.query_params.get('term_name')
        if year:
            queryset = queryset.filter(term__academic_year__name=year)
        if term_name:
            queryset = queryset.filter(term__name__iexact=term_name)
        return queryset

    @action(detail=True, methods=['post'])
    def finalize(self, request, pk=None):
        if not can_manage_attendance(request.user):
            raise PermissionDenied('Only authorised administrators can close attendance terms.')
        summary = self.get_object()
        summary.is_finalized = True
        summary.save(update_fields=['is_finalized', 'calculated_at'])
        return Response(self.get_serializer(summary).data)


class AttendanceAuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AttendanceAuditLog.objects.select_related('student', 'actor', 'attendance_record').all()
    serializer_class = AttendanceAuditLogSerializer
    filterset_fields = ['student', 'actor', 'action']

    def get_queryset(self):
        if can_manage_attendance(self.request.user):
            return super().get_queryset()
        return AttendanceAuditLog.objects.none()


class AttendanceReportSnapshotViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AttendanceReportSnapshot.objects.select_related('exam', 'student', 'term').all()
    serializer_class = AttendanceReportSnapshotSerializer
    filterset_fields = ['exam', 'student', 'term', 'is_out_of_date']

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        if can_manage_attendance(user):
            return queryset
        if portal_role(user) == 'student':
            return queryset.filter(
                student__user=user,
                exam__results_published=True,
                exam__status='completed',
            )
        if portal_role(user) == 'parent':
            student_ids = StudentParent.objects.filter(parent__user=user).values_list('student_id', flat=True)
            return queryset.filter(
                student_id__in=student_ids,
                exam__results_published=True,
                exam__status='completed',
            )
        if portal_role(user) == 'teacher':
            return queryset.filter(student__school_class_id__in=teacher_class_ids(user))
        return AttendanceReportSnapshot.objects.none()

    def list(self, request, *args, **kwargs):
        exam_id = request.query_params.get('exam')
        student_id = request.query_params.get('student')
        if exam_id and student_id and portal_role(request.user) in {'student', 'parent'}:
            student_access = Student.objects.filter(pk=student_id, user=request.user).exists()
            if portal_role(request.user) == 'parent':
                student_access = StudentParent.objects.filter(
                    student_id=student_id,
                    parent__user=request.user,
                ).exists()
            if not student_access:
                raise PermissionDenied('You cannot view attendance for this report.')
            from exams.models import Exam
            exam = Exam.objects.filter(
                pk=exam_id,
                results_published=True,
                status='completed',
                classes__students__pk=student_id,
            ).distinct().first()
            if not exam:
                raise PermissionDenied('You cannot view attendance for this report.')
            if not AttendanceReportSnapshot.objects.filter(exam_id=exam_id, student_id=student_id).exists():
                from .services import create_report_attendance_snapshots
                through_date = timezone.localdate(exam.results_published_at) if exam.results_published_at else exam.end_date
                create_report_attendance_snapshots(exam, through_date=through_date)
        return super().list(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def regenerate(self, request, pk=None):
        if not can_manage_attendance(request.user):
            raise PermissionDenied('Only authorised administrators can regenerate published report attendance.')
        from .services import refresh_report_attendance_snapshot
        snapshot = refresh_report_attendance_snapshot(self.get_object(), force_summary=True)
        return Response(self.get_serializer(snapshot).data)


class AttendanceNotificationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AttendanceNotification.objects.select_related('student', 'term').all()
    serializer_class = AttendanceNotificationSerializer

    def get_queryset(self):
        return super().get_queryset().filter(recipient=self.request.user)

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        if notification.read_at is None:
            notification.read_at = timezone.now()
            notification.save(update_fields=['read_at'])
        return Response(self.get_serializer(notification).data)
