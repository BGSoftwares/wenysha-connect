from django.db import transaction
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from core.roles import is_admin, portal_role, teacher_class_ids
from parents.models import StudentParent
from .models import AttendanceRecord
from .serializers import AttendanceRecordSerializer


class AttendanceRecordViewSet(viewsets.ModelViewSet):
    queryset = AttendanceRecord.objects.select_related('student', 'student__school_class').all()
    serializer_class = AttendanceRecordSerializer
    filterset_fields = ['student', 'date', 'status']

    def get_queryset(self):
        user = self.request.user
        role = portal_role(user)
        queryset = super().get_queryset()
        if is_admin(user):
            return queryset
        if role == 'student':
            return queryset.filter(student__user=user)
        if role == 'parent':
            linked_ids = StudentParent.objects.filter(parent__user=user).values_list('student_id', flat=True)
            return queryset.filter(student_id__in=linked_ids)
        if role == 'teacher':
            return queryset.filter(student__school_class_id__in=teacher_class_ids(user))
        return queryset.none()

    def _require_teacher_or_admin(self, student):
        user = self.request.user
        if is_admin(user):
            return
        if portal_role(user) != 'teacher' or student.school_class_id not in teacher_class_ids(user):
            raise PermissionDenied('Only an administrator or a teacher assigned to the class can change attendance.')

    def perform_create(self, serializer):
        self._require_teacher_or_admin(serializer.validated_data['student'])
        serializer.save()

    def perform_update(self, serializer):
        instance = self.get_object()
        self._require_teacher_or_admin(serializer.validated_data.get('student', instance.student))
        serializer.save()

    def perform_destroy(self, instance):
        self._require_teacher_or_admin(instance.student)
        instance.delete()

    @action(detail=False, methods=['post'])
    def bulk(self, request):
        serializer = self.get_serializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)
        for record in serializer.validated_data:
            self._require_teacher_or_admin(record['student'])
        with transaction.atomic():
            records = serializer.save()
        return Response(self.get_serializer(records, many=True).data, status=status.HTTP_201_CREATED)
