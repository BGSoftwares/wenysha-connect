from django.db import transaction
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import AttendanceRecord
from .serializers import AttendanceRecordSerializer


class AttendanceRecordViewSet(viewsets.ModelViewSet):
    queryset = AttendanceRecord.objects.select_related('student', 'student__school_class').all()
    serializer_class = AttendanceRecordSerializer
    filterset_fields = ['student', 'date', 'status']

    @action(detail=False, methods=['post'])
    def bulk(self, request):
        serializer = self.get_serializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            records = serializer.save()
        return Response(self.get_serializer(records, many=True).data, status=status.HTTP_201_CREATED)
