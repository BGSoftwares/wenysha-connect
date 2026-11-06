import re
from collections import defaultdict
from decimal import Decimal, ROUND_HALF_UP

from django.db import connection, transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Exam, ExamSchedule, ExamMark, MarkSubmission, ReportCardReview
from .serializers import (
    ExamSerializer, ExamScheduleSerializer, ExamMarkSerializer,
    ExamMarkSheetSerializer, MarkSubmissionSerializer,
    ReportCardReviewSerializer, ReportCardCommentBatchSerializer,
    ReportCardClassSubmitSerializer,
)
from core.roles import display_name, is_admin, portal_role
from school.models import SchoolClass, Student, Teacher, TeacherSubjectClass


def get_level_name(class_name):
    match = re.match(r'^\s*(.+?\d+)', class_name)
    return match.group(1).strip() if match else None


def expected_subject_ids_by_class(exam, class_ids):
    exam_subject_ids = set(exam.subjects.values_list('pk', flat=True))
    allocations_by_class = defaultdict(set)
    for class_id, subject_id in TeacherSubjectClass.objects.filter(
        school_class_id__in=class_ids,
        subject_id__in=exam_subject_ids,
    ).values_list('school_class_id', 'subject_id'):
        allocations_by_class[class_id].add(subject_id)
    return {
        class_id: allocations_by_class[class_id] or exam_subject_ids
        for class_id in class_ids
    }


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
                'update_fields': ['total_marks', 'scored', 'comment'],
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
                        'comment': row['comment'],
                    },
                )

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

        def get_symbol(pct):
            if pct >= 70:
                return 'A'
            if pct >= 60:
                return 'B'
            if pct >= 50:
                return 'C'
            if pct >= 45:
                return 'D'
            if pct >= 40:
                return 'E'
            return 'U'

        def calculate_positions(class_ids_for_ranking):
            active_students = Student.objects.filter(
                status='Active',
                school_class_id__in=class_ids_for_ranking,
            )
            totals = defaultdict(lambda: [Decimal('0'), 0, Decimal('0'), defaultdict(int)])
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
                totals[mark['student_id']][2] += Decimal(mark['scored'])
                totals[mark['student_id']][3][get_symbol(percentage)] += 1

            # Candidate ranking key compares:
            # 1. Average percentage
            # 2. Number of 'A' symbols
            # 3. Number of 'B' symbols
            # 4. Number of 'C' symbols
            # 5. Number of 'D' symbols
            # 6. Number of 'E' symbols
            # 7. Total scored marks
            candidate_keys = {}
            for candidate_id, (total_pct, count, total_scored, symbols) in totals.items():
                if count:
                    avg = (total_pct / count).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                    candidate_keys[candidate_id] = (
                        avg,
                        symbols['A'],
                        symbols['B'],
                        symbols['C'],
                        symbols['D'],
                        symbols['E'],
                        total_scored,
                    )

            target_key = candidate_keys.get(student.id)
            if target_key is None:
                return None, active_students.count()

            position = 1 + sum(key > target_key for key in candidate_keys.values())
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


class ReportCardReviewViewSet(viewsets.ModelViewSet):
    queryset = ReportCardReview.objects.select_related(
        'exam', 'student', 'student__school_class',
        'class_teacher_submitted_by', 'principal_reviewed_by',
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
            review.save(update_fields=['class_teacher_comment'])
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
        marks = ExamMark.objects.filter(
            exam=exam,
            student__in=students,
            subject_id__in=expected_subject_ids,
        ).values_list('student_id', 'subject_id')
        marks_by_student = defaultdict(set)
        for student_id, subject_id in marks:
            marks_by_student[student_id].add(subject_id)
        incomplete = [
            student.name for student in students
            if expected_subject_ids - marks_by_student[student.pk]
        ]
        if incomplete:
            raise ValidationError({
                'marks': 'Complete every assigned subject mark before submitting the class reports.',
                'learners': incomplete,
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
