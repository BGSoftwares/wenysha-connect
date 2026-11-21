from core.roles import display_name, is_admin, portal_role
from django.db.models import Q
from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied, ValidationError
from school.models import Teacher, TeacherSubjectClass
from ..models import MarkSubmission
from ..serializers import MarkSubmissionSerializer


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
        matching_pair |= Q(school_class__class_teacher=teacher)
        return queryset.filter(matching_pair).distinct()

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
