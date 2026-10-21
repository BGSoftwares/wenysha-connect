from django.db.models import Q
from rest_framework import viewsets, permissions
from rest_framework.exceptions import PermissionDenied
from core.roles import display_name, is_admin, portal_role, teacher_class_ids
from parents.models import StudentParent
from school.models import SchoolClass, Student
from .models import GalleryItem, Announcement, ContactMessage, StaffMember, LearningMaterial
from .serializers import (
    GalleryItemSerializer,
    AnnouncementSerializer,
    ContactMessageSerializer,
    StaffMemberSerializer,
    LearningMaterialSerializer,
)


class GalleryItemViewSet(viewsets.ModelViewSet):
    queryset = GalleryItem.objects.all()
    serializer_class = GalleryItemSerializer
    filterset_fields = ['category', 'item_type']


class AnnouncementViewSet(viewsets.ModelViewSet):
    queryset = Announcement.objects.all()
    serializer_class = AnnouncementSerializer
    filterset_fields = ['category', 'important']


class ContactMessageViewSet(viewsets.ModelViewSet):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    # Allow unauthenticated POST for contact form
    permission_classes = [permissions.AllowAny]

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]


class StaffMemberViewSet(viewsets.ModelViewSet):
    queryset = StaffMember.objects.all()
    serializer_class = StaffMemberSerializer


class LearningMaterialViewSet(viewsets.ModelViewSet):
    queryset = LearningMaterial.objects.all()
    serializer_class = LearningMaterialSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['subject_name', 'class_name', 'visibility']

    def get_queryset(self):
        user = self.request.user
        if is_admin(user):
            return LearningMaterial.objects.all()

        role = portal_role(user)
        if role == 'accounts':
            return LearningMaterial.objects.filter(visibility='staff')
        if role == 'teacher':
            class_names = SchoolClass.objects.filter(pk__in=teacher_class_ids(user)).values_list('name', flat=True)
            return LearningMaterial.objects.filter(
                Q(visibility='class', class_name__in=class_names)
                | Q(uploaded_by_user=user, visibility='staff')
            ).distinct()
        if role == 'student':
            student = Student.objects.filter(user=user).select_related('school_class').first()
            if student:
                return LearningMaterial.objects.filter(
                    visibility='class', class_name=student.school_class.name
                )
        if role == 'parent':
            child_class_names = Student.objects.filter(
                pk__in=StudentParent.objects.filter(parent__user=user).values_list('student_id', flat=True)
            ).values_list('school_class__name', flat=True)
            return LearningMaterial.objects.filter(visibility='class', class_name__in=child_class_names)
        return LearningMaterial.objects.none()

    def _require_uploader(self):
        role = portal_role(self.request.user)
        if role not in {'admin', 'teacher', 'accounts'}:
            raise PermissionDenied('Only administrators, teachers, and accounts staff can upload learning materials.')
        return role

    def _validate_teacher_class(self, role, class_name):
        if role != 'teacher':
            return
        if class_name not in SchoolClass.objects.filter(pk__in=teacher_class_ids(self.request.user)).values_list('name', flat=True):
            raise PermissionDenied('You can only upload materials for your assigned classes.')

    def perform_create(self, serializer):
        role = self._require_uploader()
        class_name = serializer.validated_data.get('class_name', '')
        self._validate_teacher_class(role, class_name)
        visibility = 'staff' if role == 'accounts' else serializer.validated_data.get('visibility', 'class')
        serializer.save(
            visibility=visibility,
            uploaded_by=display_name(self.request.user),
            uploaded_by_user=self.request.user,
        )

    def perform_update(self, serializer):
        role = self._require_uploader()
        material = self.get_object()
        user = self.request.user
        if not is_admin(user) and material.uploaded_by_user_id != user.pk:
            raise PermissionDenied('You can only update materials that you uploaded.')
        class_name = serializer.validated_data.get('class_name', material.class_name)
        self._validate_teacher_class(role, class_name)
        old_file = material.file
        visibility = 'staff' if role == 'accounts' else serializer.validated_data.get('visibility', material.visibility)
        updated = serializer.save(visibility=visibility)
        if old_file and old_file.name and old_file.name != getattr(updated.file, 'name', ''):
            old_file.delete(save=False)

    def perform_destroy(self, instance):
        role = self._require_uploader()
        if not is_admin(self.request.user) and instance.uploaded_by_user_id != self.request.user.pk:
            raise PermissionDenied('You can only delete materials that you uploaded.')
        if instance.file and instance.file.name:
            instance.file.delete(save=False)
        instance.delete()
