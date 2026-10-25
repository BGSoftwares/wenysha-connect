from rest_framework import permissions, viewsets
from rest_framework.exceptions import PermissionDenied
from core.roles import is_admin, portal_role, teacher_class_ids
from .models import Parent, StudentParent
from .serializers import ParentSerializer, StudentParentSerializer


class ParentViewSet(viewsets.ModelViewSet):
    queryset = Parent.objects.all()
    serializer_class = ParentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['status']

    def get_queryset(self):
        role = portal_role(self.request.user)
        if is_admin(self.request.user) or role == 'accounts':
            return Parent.objects.all()
        if role == 'parent':
            return Parent.objects.filter(user=self.request.user)
        return Parent.objects.none()

    def _require_staff(self):
        if not (is_admin(self.request.user) or portal_role(self.request.user) == 'accounts'):
            raise PermissionDenied('Only administration or accounts staff can manage parent records.')

    def perform_create(self, serializer):
        self._require_staff()
        serializer.save()

    def perform_update(self, serializer):
        self._require_staff()
        serializer.save()

    def perform_destroy(self, instance):
        self._require_staff()
        instance.delete()


class StudentParentViewSet(viewsets.ModelViewSet):
    queryset = StudentParent.objects.select_related('student', 'parent').all()
    serializer_class = StudentParentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['student', 'parent']

    def get_queryset(self):
        user = self.request.user
        role = portal_role(user)
        queryset = super().get_queryset()
        if is_admin(user) or role == 'accounts':
            return queryset
        if role == 'parent':
            return queryset.filter(parent__user=user)
        if role == 'student':
            return queryset.filter(student__user=user)
        if role == 'teacher':
            return queryset.filter(student__school_class_id__in=teacher_class_ids(user))
        return queryset.none()

    def _require_admin(self):
        if not is_admin(self.request.user):
            raise PermissionDenied('Only administrators can change parent-student links.')

    def perform_create(self, serializer):
        self._require_admin()
        serializer.save()

    def perform_update(self, serializer):
        self._require_admin()
        serializer.save()

    def perform_destroy(self, instance):
        self._require_admin()
        instance.delete()
