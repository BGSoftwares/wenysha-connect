from core.roles import is_admin, portal_role
from django.db import connection, transaction
from django.db.models import F, Q
from rest_framework import status, viewsets
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from school.models import SchoolClass, Student, Teacher
from .. import ranking_cache
from ..models import ExamMark
from ..serializers import ExamMarkSerializer, ExamMarkSheetSerializer
from .helpers import linked_student_ids


class ExamMarkViewSet(viewsets.ModelViewSet):
    queryset = ExamMark.objects.select_related('exam', 'student', 'subject').all()
    serializer_class = ExamMarkSerializer
    filterset_fields = ['exam', 'student', 'subject']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        school_class_id = self.request.query_params.get('school_class')
        if school_class_id is not None:
            try:
                school_class_id = int(school_class_id)
            except (TypeError, ValueError):
                raise ValidationError({'school_class': 'Enter a valid class ID.'})
            queryset = queryset.filter(student__school_class_id=school_class_id)
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

        if role == 'parent':
            return queryset.filter(
                student_id__in=linked_student_ids(user),
                exam__results_published=True,
                exam__status='completed',
                exam__classes=F('student__school_class_id'),
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
            class_teacher_classes = SchoolClass.objects.filter(
                class_teacher=teacher,
            ).values_list('pk', flat=True)
            if class_teacher_classes.exists():
                matching_pair |= Q(
                    student__school_class_id__in=class_teacher_classes,
                    exam__classes__in=class_teacher_classes,
                )
            return queryset.filter(matching_pair).distinct()
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


class ExamMarkSheetView(APIView):
    """Validate and save one class/subject/exam sheet as a single transaction."""

    @transaction.atomic
    def post(self, request):
        serializer = ExamMarkSheetSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        values = serializer.validated_data
        mark_rows = values['marks']
        student_ids = [row['student'].pk for row in mark_rows]
        if connection.features.supports_update_conflicts:
            bulk_create_options = {
                'update_conflicts': True,
                'update_fields': ['total_marks', 'scored', 'absent', 'comment'],
            }
            if connection.features.supports_update_conflicts_with_target:
                bulk_create_options['unique_fields'] = ['exam', 'student', 'subject']
            ExamMark.objects.bulk_create(
                [
                    ExamMark(
                        exam=values['exam'],
                        student=row['student'],
                        subject=values['subject'],
                        total_marks=row['total_marks'],
                        scored=row['scored'],
                        absent=row['absent'],
                        comment=row['comment'],
                    )
                    for row in mark_rows
                ],
                **bulk_create_options,
            )
        else:
            for row in mark_rows:
                ExamMark.objects.update_or_create(
                    exam=values['exam'],
                    student=row['student'],
                    subject=values['subject'],
                    defaults={
                        'total_marks': row['total_marks'],
                        'scored': row['scored'],
                        'absent': row['absent'],
                        'comment': row['comment'],
                    },
                )

        ranking_cache.bump_version()  # bulk saves do not fire per-row signals
        saved_marks_by_student = {
            mark.student_id: mark
            for mark in ExamMark.objects.filter(
                exam=values['exam'],
                subject=values['subject'],
                student_id__in=student_ids,
            ).select_related('exam', 'student', 'subject')
        }
        saved_marks = [saved_marks_by_student[student_id] for student_id in student_ids]
        return Response(
            ExamMarkSerializer(saved_marks, many=True, context={'request': request}).data,
            status=status.HTTP_200_OK,
        )
