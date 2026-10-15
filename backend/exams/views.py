import re
from collections import defaultdict
from decimal import Decimal, ROUND_HALF_UP

from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Exam, ExamSchedule, ExamMark, MarkSubmission
from .serializers import ExamSerializer, ExamScheduleSerializer, ExamMarkSerializer, MarkSubmissionSerializer
from school.models import SchoolClass, Student


def get_level_name(class_name):
    match = re.match(r'^\s*(.+?\d+)', class_name)
    return match.group(1).strip() if match else None


class ExamViewSet(viewsets.ModelViewSet):
    queryset = Exam.objects.prefetch_related('classes', 'subjects').all()
    serializer_class = ExamSerializer
    filterset_fields = ['term', 'year', 'status']


class ExamScheduleViewSet(viewsets.ModelViewSet):
    queryset = ExamSchedule.objects.select_related('exam', 'subject', 'school_class').all()
    serializer_class = ExamScheduleSerializer
    filterset_fields = ['exam', 'subject', 'school_class']


class ExamMarkViewSet(viewsets.ModelViewSet):
    queryset = ExamMark.objects.select_related('exam', 'student', 'subject').all()
    serializer_class = ExamMarkSerializer
    filterset_fields = ['exam', 'student', 'subject']


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
