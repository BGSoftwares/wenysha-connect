from collections import defaultdict
from core.roles import is_admin, portal_role
from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied, ValidationError
from school.models import Student, Teacher
from ..models import Exam, ExamMark
from ..serializers import ExamSerializer
from .helpers import expected_subject_ids_by_class, linked_student_ids


class ExamViewSet(viewsets.ModelViewSet):
    queryset = Exam.objects.prefetch_related('classes', 'subjects').all()
    serializer_class = ExamSerializer
    filterset_fields = ['term', 'year', 'status', 'report_type', 'results_published']

    @staticmethod
    def _is_publish_request(value):
        return value is True or str(value).lower() in {'true', '1'}

    @staticmethod
    def _validate_publish_request(exam, value, status_value=None):
        if value is None or not ExamViewSet._is_publish_request(value):
            return
        if status_value is None:
            status_value = exam.status
        if status_value != 'completed':
            raise ValidationError({'results_published': 'Complete and verify the exam before publishing results to student portals.'})
        if not exam.marks.exists():
            raise ValidationError({'results_published': 'Enter marks before unlocking and publishing results to student portals.'})

        exam_classes = list(exam.classes.values_list('pk', 'name'))
        exam_class_ids = [class_id for class_id, _ in exam_classes]
        expected_subjects_by_class = expected_subject_ids_by_class(exam, exam_class_ids)
        active_students = list(
            Student.objects.filter(
                status='Active',
                school_class_id__in=exam_class_ids,
            ).values_list('pk', 'name', 'school_class_id')
        )
        marks_by_student = defaultdict(set)
        if active_students:
            for student_id, subject_id in ExamMark.objects.filter(
                exam=exam,
                student_id__in=[student_id for student_id, _, _ in active_students],
                subject_id__in=set().union(*expected_subjects_by_class.values()),
            ).values_list('student_id', 'subject_id'):
                marks_by_student[student_id].add(subject_id)

        class_names = dict(exam_classes)
        learners_missing_marks = [
            f'{student_name} ({class_names[class_id]})'
            for student_id, student_name, class_id in active_students
            if expected_subjects_by_class[class_id] - marks_by_student[student_id]
        ]
        if learners_missing_marks:
            raise ValidationError({
                'results_published': 'Complete marks for every active learner in each assigned class before publishing.',
                'learners': learners_missing_marks,
            })

        if exam.report_card_reviews.exists():
            submitted_reviews = {
                review.student_id: review
                for review in exam.report_card_reviews.all()
            }
            learners_with_marks = exam.marks.values_list('student_id', flat=True).distinct()
            learners_waiting_for_review = [
                student_id for student_id in learners_with_marks
                if not (
                    submitted_reviews.get(student_id)
                    and submitted_reviews[student_id].class_teacher_submitted_at
                    and submitted_reviews[student_id].principal_comment.strip()
                )
            ]
            if learners_waiting_for_review:
                raise ValidationError({
                    'results_published': 'Every marked learner must have a submitted class-teacher comment and principal comment before publishing.',
                    'learners': learners_waiting_for_review,
                })

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

        if role == 'parent':
            child_classes = Student.objects.filter(pk__in=linked_student_ids(user)).values('school_class_id')
            return queryset.filter(
                results_published=True,
                status='completed',
                classes__in=child_classes,
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
        self._validate_publish_request(
            exam,
            request.data.get('results_published'),
            request.data.get('status', exam.status),
        )
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        if is_admin(request.user):
            exam = self.get_object()
            self._validate_publish_request(
                exam,
                request.data.get('results_published'),
                request.data.get('status', exam.status),
            )
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

    def perform_update(self, serializer):
        exam = serializer.instance
        was_published = exam.results_published
        is_publishing = self._is_publish_request(self.request.data.get('results_published'))
        if is_publishing and not exam.results_published and not exam.results_published_at:
            updated_exam = serializer.save(results_published_at=timezone.now())
        else:
            updated_exam = serializer.save()
        if is_publishing and not was_published:
            from attendance.services import create_report_attendance_snapshots
            create_report_attendance_snapshots(
                updated_exam,
                through_date=timezone.localdate(updated_exam.results_published_at),
            )
