from pathlib import Path

from django.db.models import Q
from django.http import FileResponse
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from core.roles import display_name, is_admin, portal_role, teacher_class_ids
from parents.models import StudentParent
from school.models import SchoolClass, Student, Teacher, TeacherSubjectClass
from .models import (
    GalleryItem, Announcement, ContactMessage, StaffMember, LearningMaterial,
    LearningAssignment, LearningSubmission,
)
from .serializers import (
    GalleryItemSerializer,
    AnnouncementSerializer,
    ContactMessageSerializer,
    StaffMemberSerializer,
    LearningMaterialSerializer,
    LearningAssignmentSerializer,
    LearningSubmissionSerializer,
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

    def _validate_teacher_allocation(self, role, class_name, subject_name):
        if role != 'teacher':
            return
        allowed = TeacherSubjectClass.objects.filter(
            teacher__user=self.request.user,
            school_class__name=class_name,
            subject__name=subject_name,
        ).exists()
        if not allowed:
            raise PermissionDenied('You can only upload materials for subjects and classes assigned to you.')

    def perform_create(self, serializer):
        role = self._require_uploader()
        class_name = serializer.validated_data.get('class_name', '')
        subject_name = serializer.validated_data.get('subject_name', '')
        self._validate_teacher_allocation(role, class_name, subject_name)
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
        subject_name = serializer.validated_data.get('subject_name', material.subject_name)
        self._validate_teacher_allocation(role, class_name, subject_name)
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


class LearningAssignmentViewSet(viewsets.ModelViewSet):
    queryset = LearningAssignment.objects.select_related(
        'school_class', 'subject', 'teacher'
    ).all()
    serializer_class = LearningAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        if is_admin(user):
            return queryset
        role = portal_role(user)
        if role == 'teacher':
            return queryset.filter(teacher__user=user)
        if role == 'student':
            student = Student.objects.filter(user=user).only('school_class_id').first()
            if student:
                return queryset.filter(school_class_id=student.school_class_id, is_published=True)
        return queryset.none()

    def _validate_teacher_allocation(self, teacher, school_class, subject):
        if not TeacherSubjectClass.objects.filter(
            teacher=teacher, school_class=school_class, subject=subject
        ).exists():
            raise PermissionDenied('You can only publish assignments for subjects and classes assigned to you.')

    @action(detail=True, methods=['get'], url_path='attachment')
    def attachment_download(self, request, pk=None):
        assignment = self.get_object()
        if not assignment.attachment:
            return Response({'detail': 'This assignment has no attached file.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            response = FileResponse(
                assignment.attachment.open('rb'),
                as_attachment=True,
                filename=Path(assignment.attachment.name).name,
            )
        except OSError:
            return Response({'detail': 'The assignment file is unavailable.'}, status=status.HTTP_404_NOT_FOUND)
        response['X-Content-Type-Options'] = 'nosniff'
        return response

    def perform_create(self, serializer):
        user = self.request.user
        role = portal_role(user)
        if role == 'teacher':
            teacher = Teacher.objects.filter(user=user).first()
            if not teacher:
                raise PermissionDenied('Your teacher account is not linked to a teacher record yet.')
            self._validate_teacher_allocation(
                teacher,
                serializer.validated_data['school_class'],
                serializer.validated_data['subject'],
            )
        elif is_admin(user):
            teacher_id = self.request.data.get('teacher')
            teacher = Teacher.objects.filter(pk=teacher_id).first() if teacher_id else None
            if not teacher:
                raise PermissionDenied('Select the teacher responsible for this assignment.')
        else:
            raise PermissionDenied('Only teachers and administrators can create assignments.')
        serializer.save(teacher=teacher)

    def perform_update(self, serializer):
        user = self.request.user
        assignment = self.get_object()
        if not is_admin(user):
            if portal_role(user) != 'teacher' or assignment.teacher.user_id != user.pk:
                raise PermissionDenied('You can only update assignments that you created.')
            self._validate_teacher_allocation(
                assignment.teacher,
                serializer.validated_data.get('school_class', assignment.school_class),
                serializer.validated_data.get('subject', assignment.subject),
            )
        old_file = assignment.attachment
        updated = serializer.save()
        if old_file and old_file.name and old_file.name != getattr(updated.attachment, 'name', ''):
            old_file.delete(save=False)

    def perform_destroy(self, instance):
        if not is_admin(self.request.user) and (
            portal_role(self.request.user) != 'teacher' or instance.teacher.user_id != self.request.user.pk
        ):
            raise PermissionDenied('You can only delete assignments that you created.')
        for submission in instance.submissions.all():
            if submission.attachment and submission.attachment.name:
                submission.attachment.delete(save=False)
        if instance.attachment and instance.attachment.name:
            instance.attachment.delete(save=False)
        instance.delete()


class LearningSubmissionViewSet(viewsets.ModelViewSet):
    queryset = LearningSubmission.objects.select_related(
        'assignment__school_class', 'assignment__subject', 'assignment__teacher', 'student'
    ).all()
    serializer_class = LearningSubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    @action(detail=True, methods=['get'], url_path='attachment')
    def attachment_download(self, request, pk=None):
        submission = self.get_object()
        if not submission.attachment:
            return Response({'detail': 'This submission has no attached file.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            response = FileResponse(
                submission.attachment.open('rb'),
                as_attachment=True,
                filename=Path(submission.attachment.name).name,
            )
        except OSError:
            return Response({'detail': 'The submission file is unavailable.'}, status=status.HTTP_404_NOT_FOUND)
        response['X-Content-Type-Options'] = 'nosniff'
        return response

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        if is_admin(user):
            visible = queryset
        elif portal_role(user) == 'teacher':
            visible = queryset.filter(assignment__teacher__user=user)
        elif portal_role(user) == 'student':
            visible = queryset.filter(student__user=user)
        else:
            return queryset.none()
        assignment_id = self.request.query_params.get('assignment')
        if assignment_id:
            visible = visible.filter(assignment_id=assignment_id)
        return visible

    def perform_create(self, serializer):
        user = self.request.user
        if portal_role(user) != 'student':
            raise PermissionDenied('Only students can submit assignments.')
        student = Student.objects.filter(user=user).select_related('school_class').first()
        assignment = serializer.validated_data['assignment']
        if not student or assignment.school_class_id != student.school_class_id or not assignment.is_published:
            raise PermissionDenied('This assignment is not available to your student account.')
        if LearningSubmission.objects.filter(assignment=assignment, student=student).exists():
            raise PermissionDenied('You already submitted this assignment. Update your existing submission to resubmit.')
        serializer.save(student=student)

    def perform_update(self, serializer):
        submission = self.get_object()
        if portal_role(self.request.user) != 'student' or submission.student.user_id != self.request.user.pk:
            raise PermissionDenied('You can only update your own assignment submissions.')
        assignment = serializer.validated_data.get('assignment', submission.assignment)
        if assignment.school_class_id != submission.student.school_class_id or not assignment.is_published:
            raise PermissionDenied('You can only submit work for assignments published to your class.')
        old_file = submission.attachment
        updated = serializer.save(assignment=assignment)
        if old_file and old_file.name and old_file.name != getattr(updated.attachment, 'name', ''):
            old_file.delete(save=False)

    def perform_destroy(self, instance):
        if not is_admin(self.request.user):
            raise PermissionDenied('Only an administrator can remove assignment submissions.')
        if instance.attachment and instance.attachment.name:
            instance.attachment.delete(save=False)
        instance.delete()
