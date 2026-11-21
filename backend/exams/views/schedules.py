from core.roles import is_admin, portal_role
from django.db.models import Q
from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied
from school.models import Student, Teacher
from ..models import ExamSchedule
from ..serializers import ExamScheduleSerializer


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
