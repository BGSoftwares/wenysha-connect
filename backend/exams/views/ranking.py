from core.roles import is_admin, portal_role
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView
from school.models import Student, Teacher, TeacherSubjectClass
from .. import ranking_cache
from ..models import Exam, PublishedRanking
from ..rankings import build_ranking, class_names, level_for, position_of
from .helpers import linked_student_ids


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
        elif portal_role(user) == 'parent' and not is_admin(user):
            if (
                student.pk not in set(linked_student_ids(user))
                or not exam.results_published
                or exam.status != 'completed'
            ):
                raise PermissionDenied("You can only view your own child's published exam ranking.")
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

        exam_class_ids = set(exam.classes.values_list('id', flat=True))
        level_name, level_class_ids = level_for(student.school_class, None, exam_class_ids)
        level_classes = class_names(level_class_ids)

        if exam.results_published:
            stored = PublishedRanking.objects.filter(exam=exam, student=student).first()
            if stored:
                # Positions are fixed when results are published, so later mark corrections never move them.
                return Response({
                    'class_position': stored.class_position,
                    'class_total': stored.class_total,
                    'level_position': stored.level_position,
                    'level_total': stored.level_total,
                    'level_name': stored.level_name or None,
                    'level_classes': level_classes,
                })

        class_ids = [student.school_class_id]

        def calculate_positions(class_ids_for_ranking):
            candidate_keys, active_total = ranking_cache.cached_ranking(
                exam.pk, class_ids_for_ranking, lambda: build_ranking(exam, class_ids_for_ranking),
            )
            return position_of(candidate_keys, student.id), active_total

        class_position, class_total = calculate_positions(class_ids)
        level_position, level_total = calculate_positions(level_class_ids)

        return Response({
            'class_position': class_position,
            'class_total': class_total,
            'level_position': level_position if level_name else None,
            'level_total': level_total if level_name else None,
            'level_name': level_name,
            'level_classes': level_classes,
        })
