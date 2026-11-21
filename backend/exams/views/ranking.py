from collections import defaultdict
from core.roles import is_admin, portal_role
from decimal import Decimal, ROUND_HALF_UP
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView
from school.models import SchoolClass, Student, Teacher, TeacherSubjectClass
from .. import ranking_cache
from ..models import Exam, ExamMark
from .helpers import get_level_name, linked_student_ids


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

        def build_ranking(class_ids_for_ranking):
            active_students = Student.objects.filter(
                status='Active',
                school_class_id__in=class_ids_for_ranking,
            )
            totals = defaultdict(lambda: [Decimal('0'), 0, Decimal('0'), defaultdict(int)])
            marks = ExamMark.objects.filter(
                exam=exam,
                absent=False,
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

            return candidate_keys, active_students.count()

        def calculate_positions(class_ids_for_ranking):
            candidate_keys, active_total = ranking_cache.cached_ranking(
                exam.pk, class_ids_for_ranking, lambda: build_ranking(class_ids_for_ranking),
            )
            target_key = candidate_keys.get(student.id)
            if target_key is None:
                return None, active_total
            return 1 + sum(key > target_key for key in candidate_keys.values()), active_total

        class_position, class_total = calculate_positions(class_ids)
        level_position, level_total = calculate_positions(level_class_ids)

        return Response({
            'class_position': class_position,
            'class_total': class_total,
            'level_position': level_position if level_name else None,
            'level_total': level_total if level_name else None,
            'level_name': level_name,
        })
