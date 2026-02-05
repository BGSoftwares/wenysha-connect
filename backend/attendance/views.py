from rest_framework import viewsets
from .models import AttendanceRecord
from .serializers import AttendanceRecordSerializer


class AttendanceRecordViewSet(viewsets.ModelViewSet):
    queryset = AttendanceRecord.objects.select_related('student', 'student__school_class').all()
    serializer_class = AttendanceRecordSerializer
    filterset_fields = ['student', 'date', 'status']
