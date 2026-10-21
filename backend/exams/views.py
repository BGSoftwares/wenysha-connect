import re
from collections import defaultdict
from decimal import Decimal, ROUND_HALF_UP

from django.db.models import Q
from rest_framework import status, viewsets
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Exam, ExamSchedule, ExamMark, MarkSubmission
from .serializers import ExamSerializer, ExamScheduleSerializer, ExamMarkSerializer, MarkSubmissionSerializer
from core.roles import display_name, is_admin, portal_role
from school.models import SchoolClass, Student, Teacher, TeacherSubjectClass


def get_level_name(class_name):
    match = re.match(r'^\s*(.+?\d+)', class_name)
    return match.group(1).strip() if match else None


class ExamViewSet(viewsets.ModelViewSet):
    queryset = Exam.objects.prefetch_related('classes', 'subjects').all()
    serializer_class = ExamSerializer
    filterset_fields = ['term', 'year', 'status', 'report_type', 'results_published']

    @staticmethod
    def _is_publish_request(value):
        return value is True or str(value).lower() in {'true', '1'}

    @staticmethod
    def _validate_publish_request(exam, value):
        if value is None or not ExamViewSet._is_publish_request(value):
            return
        if exam.status != 'completed':
            raise ValidationError({'results_published': 'Complete the exam before sending results to student portals.'})
        if not exam.marks.exists():
            raise ValidationError({'results_published': 'Enter marks before sending results to student portals.'})

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if is_admin(user):
            return queryset

        role = portal_role(user)
        if role == 'teacher':
            teacher = Teacher.objects.filter(user=user).first()
            if not teacher:
                return queryset.none()
            allocation_pairs = list(teacher.allocations.values_list('school_class_id', 'subject_id'))
            matching_pair = Q()
            for class_id, subject_id in allocation_pairs:
                matching_pair |= Q(classes=class_id, subjects=subject_id)
            return queryset.filter(matching_pair).distinct() if allocation_pairs else queryset.none()

        if role == 'student':
            student = Student.objects.filter(user=user).only('school_class_id').first()
            if not student:
                return queryset.none()
            return queryset.filter(
                results_published=True,
                status='completed',
                classes=student.school_class_id,
            ).distinct()
        return queryset.none()

    def create(self, request, *args, **kwargs):
        if not is_admin(request.user):
            raise PermissionDenied('Only administrators can create exams.')
        if self._is_publish_request(request.data.get('results_published')):
            raise ValidationError({'results_published': 'Create the exam and enter marks before sending results to student portals.'})
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if not is_admin(request.user):
            raise PermissionDenied('Only administrators can edit exam details.')
        exam = self.get_object()
        self._validate_publish_request(exam, request.data.get('results_published'))
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        if is_admin(request.user):
            exam = self.get_object()
            self._validate_publish_request(exam, request.data.get('results_published'))
            return super().partial_update(request, *args, **kwargs)
        if portal_role(request.user) != 'teacher':
            raise PermissionDenied('Your account cannot edit this exam.')

        exam = self.get_object()
        if set(request.data.keys()) != {'report_type'}:
            raise PermissionDenied('Teachers can only select the report type before marks are entered.')
        if exam.results_published:
            raise PermissionDenied('A published report type can only be changed by an administrator.')
        if exam.marks.exists() and request.data.get('report_type') != exam.report_type:
            raise ValidationError({'report_type': 'The report type is locked after marks have been entered.'})
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if not is_admin(request.user):
            raise PermissionDenied('Only administrators can delete exams.')
        return super().destroy(request, *args, **kwargs)


class ExamScheduleViewSet(viewsets.ModelViewSet):
    queryset = ExamSchedule.objects.select_related('exam', 'subject', 'school_class').all()
    serializer_class = ExamScheduleSerializer
    filterset_fields = ['exam', 'subject', 'school_class']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if is_admin(user):
            return queryset
        role = portal_role(user)
        if role == 'teacher':
            teacher = Teacher.objects.filter(user=user).first()
            if not teacher:
                return queryset.none()
            matching_pair = Q()
            for class_id, subject_id in teacher.allocations.values_list('school_class_id', 'subject_id'):
                matching_pair |= Q(school_class_id=class_id, subject_id=subject_id)
            return queryset.filter(matching_pair).distinct() if matching_pair else queryset.none()
        if role == 'student':
            student = Student.objects.filter(user=user).first()
            return queryset.filter(school_class_id=student.school_class_id) if student else queryset.none()
        return queryset.none()

    def create(self, request, *args, **kwargs):
        if not is_admin(request.user):
            raise PermissionDenied('Only administrators can create exam schedules.')
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if not is_admin(request.user):
            raise PermissionDenied('Only administrators can edit exam schedules.')
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        if not is_admin(request.user):
            raise PermissionDenied('Only administrators can edit exam schedules.')
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if not is_admin(request.user):
            raise PermissionDenied('Only administrators can delete exam schedules.')
        return super().destroy(request, *args, **kwargs)


class ExamMarkViewSet(viewsets.ModelViewSet):
    queryset = ExamMark.objects.select_related('exam', 'student', 'subject').all()
    serializer_class = ExamMarkSerializer
    filterset_fields = ['exam', 'student', 'subject']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if is_admin(user):
            return queryset

        role = portal_role(user)
        if role == 'student':
            student = Student.objects.filter(user=user).first()
            if not student:
                return queryset.none()
            return queryset.filter(
                student=student,
                exam__results_published=True,
                exam__status='completed',
                exam__classes=student.school_class_id,
            ).distinct()

        if role == 'teacher':
            teacher = Teacher.objects.filter(user=user).first()
            if not teacher:
                return queryset.none()
            matching_pair = Q()
            allocation_pairs = list(teacher.allocations.values_list('school_class_id', 'subject_id'))
            for class_id, subject_id in allocation_pairs:
                matching_pair |= Q(
                    student__school_class_id=class_id,
                    subject_id=subject_id,
                    exam__classes=class_id,
                    exam__subjects=subject_id,
                )
            return queryset.filter(matching_pair).distinct() if allocation_pairs else queryset.none()
        return queryset.none()

    def perform_create(self, serializer):
        if not (is_admin(self.request.user) or portal_role(self.request.user) == 'teacher'):
            raise PermissionDenied('Your account cannot enter examination marks.')
        serializer.save()

    def perform_update(self, serializer):
        if not (is_admin(self.request.user) or portal_role(self.request.user) == 'teacher'):
            raise PermissionDenied('Your account cannot update examination marks.')
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        if not is_admin(request.user):
            raise PermissionDenied('Only administrators can delete examination marks.')
        return super().destroy(request, *args, **kwargs)


class ExamRankingView(APIView):
    def get(self, request):
        try:
            exam_id = int(request.query_params['exam'])
            student_id = int(request.query_params['student'])
        except (KeyError, TypeError, ValueError):
            return Response(
                {'detail': 'Both exam and student must be valid IDs.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            exam = Exam.objects.get(pk=exam_id)
            student = Student.objects.select_related('school_class').get(pk=student_id)
        except (Exam.DoesNotExist, Student.DoesNotExist):
            return Response(
                {'detail': 'The requested exam or student was not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        user = request.user
        if portal_role(user) == 'student':
            linked_student = Student.objects.filter(user=user).first()
            if not linked_student or linked_student.pk != student.pk or not exam.results_published or exam.status != 'completed':
                raise PermissionDenied('You can only view your own published exam ranking.')
        elif portal_role(user) == 'teacher' and not is_admin(user):
            teacher = Teacher.objects.filter(user=user).first()
            if not teacher or not TeacherSubjectClass.objects.filter(
                teacher=teacher,
                school_class=student.school_class,
                subject__in=exam.subjects.all(),
            ).exists() or not exam.classes.filter(pk=student.school_class_id).exists():
                raise PermissionDenied('You can only view rankings for your allocated classes and subjects.')
        elif not is_admin(user):
            raise PermissionDenied('Your account cannot view examination rankings.')

        level_name = get_level_name(student.school_class.name)
        level_class_ids = [
            school_class.id
            for school_class in SchoolClass.objects.only('id', 'name')
            if level_name and get_level_name(school_class.name) == level_name
        ]
        class_ids = [student.school_class_id]
        if not level_class_ids:
            level_class_ids = class_ids

        def calculate_positions(class_ids_for_ranking):
            active_students = Student.objects.filter(
                status='Active',
                school_class_id__in=class_ids_for_ranking,
            )
            totals = defaultdict(lambda: [Decimal('0'), 0])
            marks = ExamMark.objects.filter(
                exam=exam,
                student__status='Active',
                student__school_class_id__in=class_ids_for_ranking,
            ).values('student_id', 'scored', 'total_marks')
            for mark in marks:
                total_marks = mark['total_marks']
                percentage = (
                    Decimal(mark['scored']) * Decimal(100) / Decimal(total_marks)
                    if total_marks > 0
                    else Decimal(0)
                )
                totals[mark['student_id']][0] += percentage
                totals[mark['student_id']][1] += 1

            averages = {
                candidate_id: (total / count).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                for candidate_id, (total, count) in totals.items()
                if count
            }
            target_average = averages.get(student.id)
            if target_average is None:
                return None, active_students.count()

            position = 1 + sum(average > target_average for average in averages.values())
            return position, active_students.count()

        class_position, class_total = calculate_positions(class_ids)
        level_position, level_total = calculate_positions(level_class_ids)

        return Response({
            'class_position': class_position,
            'class_total': class_total,
            'level_position': level_position if level_name else None,
            'level_total': level_total if level_name else None,
            'level_name': level_name,
        })


class MarkSubmissionViewSet(viewsets.ModelViewSet):
    queryset = MarkSubmission.objects.select_related('exam', 'subject', 'school_class').all()
    serializer_class = MarkSubmissionSerializer
    filterset_fields = ['exam', 'subject', 'school_class']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if is_admin(user):
            return queryset
        if portal_role(user) != 'teacher':
            return queryset.none()
        teacher = Teacher.objects.filter(user=user).first()
        if not teacher:
            return queryset.none()
        matching_pair = Q()
        allocation_pairs = list(teacher.allocations.values_list('school_class_id', 'subject_id'))
        for class_id, subject_id in allocation_pairs:
            matching_pair |= Q(school_class_id=class_id, subject_id=subject_id)
        return queryset.filter(matching_pair).distinct() if allocation_pairs else queryset.none()

    def perform_create(self, serializer):
        user = self.request.user
        if is_admin(user):
            serializer.save()
            return
        if portal_role(user) != 'teacher':
            raise PermissionDenied('Your account cannot submit mark sheets.')
        values = serializer.validated_data
        if not TeacherSubjectClass.objects.filter(
            teacher__user=user,
            school_class=values['school_class'],
            subject=values['subject'],
        ).exists():
            raise PermissionDenied('You can only submit mark sheets for your allocated class and subject.')
        if not values['exam'].classes.filter(pk=values['school_class'].pk).exists() or not values['exam'].subjects.filter(pk=values['subject'].pk).exists():
            raise ValidationError('This class and subject are not assigned to the selected exam.')
        serializer.save(teacher_name=display_name(user))

    def update(self, request, *args, **kwargs):
        if not is_admin(request.user):
            raise PermissionDenied('Only administrators can edit submitted mark sheets.')
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        if not is_admin(request.user):
            raise PermissionDenied('Only administrators can edit submitted mark sheets.')
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if not is_admin(request.user):
            raise PermissionDenied('Only administrators can delete submitted mark sheets.')
        return super().destroy(request, *args, **kwargs)
