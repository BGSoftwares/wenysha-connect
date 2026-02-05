from rest_framework import viewsets
from .models import Exam, ExamSchedule, ExamMark
from .serializers import ExamSerializer, ExamScheduleSerializer, ExamMarkSerializer


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
