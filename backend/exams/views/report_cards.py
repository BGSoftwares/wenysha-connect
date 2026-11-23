from collections import defaultdict
from core.roles import is_admin, portal_role
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from school.models import Student, Teacher, TeacherSubjectClass
from ..models import Exam, ExamMark, ReportCardReview
from ..serializers import ReportCardClassSubmitSerializer, ReportCardCommentBatchSerializer, ReportCardReviewSerializer
from .helpers import expected_subject_ids_by_class, linked_student_ids


class ReportCardReviewViewSet(viewsets.ModelViewSet):
    queryset = ReportCardReview.objects.select_related(
        'exam', 'student', 'student__school_class',
        'class_teacher_submitted_by', 'principal_reviewed_by',
        'class_teacher_submitted_by__signature', 'principal_reviewed_by__signature',
    ).all()
    serializer_class = ReportCardReviewSerializer
    filterset_fields = ['exam', 'student']
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if is_admin(user):
            return queryset
        role = portal_role(user)
        if role == 'teacher':
            return queryset.filter(
                Q(student__school_class__class_teacher__user=user)
                | Q(
                    student__school_class__class_teacher__isnull=True,
                    student__school_class__allocations__teacher__user=user,
                )
            ).distinct()
        if role == 'student':
            return queryset.filter(
                student__user=user,
                exam__results_published=True,
                exam__status='completed',
            )
        if role == 'parent':
            return queryset.filter(
                student_id__in=linked_student_ids(user),
                exam__results_published=True,
                exam__status='completed',
            )
        return queryset.none()

    @staticmethod
    def _can_manage_class_comments(user, school_class):
        teacher = Teacher.objects.filter(user=user).first()
        if not teacher:
            return False
        if school_class.class_teacher_id:
            return school_class.class_teacher_id == teacher.pk
        return TeacherSubjectClass.objects.filter(
            teacher=teacher,
            school_class=school_class,
        ).exists()

    @staticmethod
    def _comment_from_request(request, field):
        comment = request.data.get(field)
        if not isinstance(comment, str):
            raise ValidationError({field: 'Enter a valid comment.'})
        comment = comment.strip()
        if len(comment) > 2000:
            raise ValidationError({field: 'Comments cannot exceed 2000 characters.'})
        return comment

    def create(self, request, *args, **kwargs):
        raise PermissionDenied('Use the class-teacher comment workflow to create report reviews.')

    def partial_update(self, request, *args, **kwargs):
        review = self.get_object()
        submitted_fields = set(request.data.keys())
        if is_admin(request.user):
            if submitted_fields != {'principal_comment'}:
                raise PermissionDenied('Administrators can only edit the principal comment.')
            comment = self._comment_from_request(request, 'principal_comment')
            review.principal_comment = comment
            review.principal_reviewed_by = request.user if comment else None
            review.principal_reviewed_at = timezone.now() if comment else None
            review.save(update_fields=[
                'principal_comment', 'principal_reviewed_by', 'principal_reviewed_at',
            ])
            return Response(self.get_serializer(review).data)

        if portal_role(request.user) != 'teacher':
            raise PermissionDenied('Your account cannot edit report-card comments.')
        if submitted_fields != {'class_teacher_comment'}:
            raise PermissionDenied('Class teachers can only edit their own class comment.')
        if not self._can_manage_class_comments(request.user, review.student.school_class):
            raise PermissionDenied('Only the assigned class teacher can edit this report.')
        if review.class_teacher_submitted_at:
            raise ValidationError({'detail': 'This class report has already been submitted to the principal.'})
        review.class_teacher_comment = self._comment_from_request(request, 'class_teacher_comment')
        review.save(update_fields=['class_teacher_comment'        ])
        return Response(self.get_serializer(review).data)

    @action(detail=False, methods=['post'], url_path='save-principal-comment')
    @transaction.atomic
    def save_principal_comment(self, request):
        if not is_admin(request.user):
            raise PermissionDenied('Only administrators can add principal report comments.')
        try:
            exam_id = int(request.data.get('exam'))
            student_id = int(request.data.get('student'))
        except (TypeError, ValueError):
            raise ValidationError({'detail': 'Choose a valid exam and student report.'})
        exam = Exam.objects.filter(pk=exam_id).first()
        student = Student.objects.filter(pk=student_id).select_related('school_class').first()
        if not exam or not student or not exam.classes.filter(pk=student.school_class_id).exists():
            raise ValidationError({'detail': 'The selected student does not belong to this exam.'})
        comment = self._comment_from_request(request, 'principal_comment')
        review, _ = ReportCardReview.objects.get_or_create(exam=exam, student=student)
        review.principal_comment = comment
        review.principal_reviewed_by = request.user if comment else None
        review.principal_reviewed_at = timezone.now() if comment else None
        review.save(update_fields=[
            'principal_comment', 'principal_reviewed_by', 'principal_reviewed_at',
        ])
        return Response(self.get_serializer(review).data)

    @action(detail=False, methods=['post'], url_path='save-class-comments')
    @transaction.atomic
    def save_class_comments(self, request):
        if portal_role(request.user) != 'teacher':
            raise PermissionDenied('Only class teachers can save class report comments.')
        serializer = ReportCardCommentBatchSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        values = serializer.validated_data
        school_class = values['school_class']
        exam = values['exam']
        if not self._can_manage_class_comments(request.user, school_class):
            raise PermissionDenied('Only the assigned class teacher can save comments for this class.')
        if exam.results_published:
            raise ValidationError({'detail': 'Published report-card comments cannot be changed.'})

        saved_reviews = []
        for row in values['comments']:
            review, _ = ReportCardReview.objects.get_or_create(exam=exam, student=row['student'])
            if review.class_teacher_submitted_at:
                raise ValidationError({'detail': 'This class report has already been submitted to the principal.'})
            review.class_teacher_comment = row['comment']
            fields = ['class_teacher_comment']
            if 'next_term_begins' in values:
                review.next_term_begins = values['next_term_begins']
                fields.append('next_term_begins')
            review.save(update_fields=fields)
            saved_reviews.append(review)
        return Response(
            ReportCardReviewSerializer(saved_reviews, many=True).data,
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['post'], url_path='submit-class')
    @transaction.atomic
    def submit_class(self, request):
        if portal_role(request.user) != 'teacher':
            raise PermissionDenied('Only class teachers can submit reports to the principal.')
        serializer = ReportCardClassSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        exam = serializer.validated_data['exam']
        school_class = serializer.validated_data['school_class']
        if not self._can_manage_class_comments(request.user, school_class):
            raise PermissionDenied('Only the assigned class teacher can submit this class.')
        if exam.results_published:
            raise ValidationError({'detail': 'Published report cards cannot be submitted for review.'})

        students = list(school_class.students.filter(status='Active').order_by('pk'))
        if not students:
            raise ValidationError({'detail': 'There are no active learners in this class.'})
        reviews = {
            review.student_id: review
            for review in ReportCardReview.objects.filter(exam=exam, student__in=students)
        }
        missing_comments = [student.name for student in students if not (
            reviews.get(student.pk) and reviews[student.pk].class_teacher_comment.strip()
        )]
        if missing_comments:
            raise ValidationError({
                'class_teacher_comment': 'Add a class-teacher comment for every learner before submitting.',
                'learners': missing_comments,
            })

        expected_subject_ids = expected_subject_ids_by_class(exam, [school_class.pk])[school_class.pk]
        subject_names = dict(exam.subjects.filter(pk__in=expected_subject_ids).values_list('pk', 'name'))
        marks = ExamMark.objects.filter(
            exam=exam,
            student__in=students,
            subject_id__in=expected_subject_ids,
        ).values_list('student_id', 'subject_id')
        marks_by_student = defaultdict(set)
        for student_id, subject_id in marks:
            marks_by_student[student_id].add(subject_id)
        incomplete = [
            {
                'learner': student.name,
                'missing_subjects': [
                    subject_names[subject_id]
                    for subject_id in sorted(expected_subject_ids - marks_by_student[student.pk])
                ],
            }
            for student in students
            if expected_subject_ids - marks_by_student[student.pk]
        ]
        if incomplete:
            raise ValidationError({
                'marks': 'Complete every assigned subject mark before submitting the class reports.',
                'missing_marks': incomplete,
            })

        if any(reviews[student.pk].next_term_begins is None for student in students):
            raise ValidationError({
                'next_term_begins': 'Enter the date the next term begins before submitting the class reports.',
            })

        submitted_at = timezone.now()
        submitted_reviews = []
        for student in students:
            review = reviews[student.pk]
            review.class_teacher_submitted_at = submitted_at
            review.class_teacher_submitted_by = request.user
            review.save(update_fields=['class_teacher_submitted_at', 'class_teacher_submitted_by'])
            submitted_reviews.append(review)
        return Response(
            ReportCardReviewSerializer(submitted_reviews, many=True).data,
            status=status.HTTP_200_OK,
        )
