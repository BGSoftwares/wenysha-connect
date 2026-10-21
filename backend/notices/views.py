from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from core.roles import display_name, is_admin, portal_role, teacher_class_ids
from parents.models import StudentParent
from school.models import Student
from .models import Notice
from .serializers import NoticeSerializer


class NoticeViewSet(viewsets.ModelViewSet):
    queryset = Notice.objects.all()
    serializer_class = NoticeSerializer
    filterset_fields = ['audience', 'priority', 'pinned']
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if is_admin(user):
            return Notice.objects.select_related('recipient_class', 'recipient_student', 'created_by').all()

        role = portal_role(user)
        if role not in {'teacher', 'accounts', 'student', 'parent'}:
            return Notice.objects.none()

        if role in {'teacher', 'accounts'}:
            visible_classes = teacher_class_ids(user) if role == 'teacher' else set()
            published = Notice.objects.filter(status='approved').filter(
                Q(recipient_type='all_students')
                | Q(recipient_type='all_parents')
                | Q(recipient_type='staff')
                | Q(recipient_class_id__in=visible_classes)
                | Q(recipient_student__school_class_id__in=visible_classes)
            )
            return (Notice.objects.filter(created_by=user) | published).select_related(
                'recipient_class', 'recipient_student', 'created_by'
            ).distinct()

        if role == 'student':
            student = Student.objects.filter(user=user).select_related('school_class').first()
            if not student:
                return Notice.objects.none()
            recipient_ids = Student.objects.filter(pk=student.pk).values_list('pk', flat=True)
            class_ids = [student.school_class_id]
        else:
            recipient_ids = StudentParent.objects.filter(parent__user=user).values_list('student_id', flat=True)
            class_ids = Student.objects.filter(pk__in=recipient_ids).values_list('school_class_id', flat=True)

        recipient_types = Q(recipient_type='all_students')
        if role == 'parent':
            recipient_types |= Q(recipient_type='all_parents')
        return Notice.objects.filter(status='approved').filter(
            recipient_types
            | Q(recipient_class_id__in=class_ids)
            | Q(recipient_student_id__in=recipient_ids)
        ).select_related('recipient_class', 'recipient_student', 'created_by').distinct()

    def _require_sender(self):
        if portal_role(self.request.user) not in {'admin', 'teacher', 'accounts'}:
            raise PermissionDenied('Only administrators, teachers, and accounts staff can send notifications.')

    def _validate_teacher_target(self, recipient_type, recipient_class, recipient_student):
        if portal_role(self.request.user) != 'teacher':
            return
        allowed_class_ids = teacher_class_ids(self.request.user)
        if recipient_type == 'all_students':
            raise PermissionDenied('Teachers can send notifications only to their assigned classes or students.')
        target_class_id = recipient_class.pk if recipient_class else None
        if recipient_student:
            target_class_id = recipient_student.school_class_id
        if target_class_id not in allowed_class_ids:
            raise PermissionDenied('You can only notify students in your assigned classes.')

    def perform_create(self, serializer):
        self._require_sender()
        recipient_type = serializer.validated_data.get('recipient_type', 'all_students')
        self._validate_teacher_target(
            recipient_type,
            serializer.validated_data.get('recipient_class'),
            serializer.validated_data.get('recipient_student'),
        )
        user = self.request.user
        administrator = is_admin(user)
        serializer.save(
            created_by=user,
            author=display_name(user),
            pinned=serializer.validated_data.get('pinned', False) if administrator else False,
            status='approved' if administrator else 'pending',
            approved_by=user if administrator else None,
            approved_at=timezone.now() if administrator else None,
        )

    def perform_update(self, serializer):
        self._require_sender()
        notice = self.get_object()
        user = self.request.user
        administrator = is_admin(user)
        if not administrator and notice.created_by_id != user.pk:
            raise PermissionDenied('You can only edit notifications you created.')
        if not administrator and notice.pinned != serializer.validated_data.get('pinned', notice.pinned):
            raise PermissionDenied('Only administrators can pin notifications.')
        recipient_type = serializer.validated_data.get('recipient_type', notice.recipient_type)
        recipient_class = serializer.validated_data.get('recipient_class', notice.recipient_class)
        recipient_student = serializer.validated_data.get('recipient_student', notice.recipient_student)
        self._validate_teacher_target(recipient_type, recipient_class, recipient_student)
        if administrator:
            serializer.save()
        else:
            serializer.save(status='pending', approved_by=None, approved_at=None, review_note='')

    def perform_destroy(self, instance):
        self._require_sender()
        if not is_admin(self.request.user):
            if instance.created_by_id != self.request.user.pk or instance.status == 'approved':
                raise PermissionDenied('You can only delete your own notifications before approval.')
        instance.delete()

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        if not is_admin(request.user):
            raise PermissionDenied('Only an administrator can approve notifications.')
        with transaction.atomic():
            notice = self.get_object()
            notice.status = 'approved'
            notice.approved_by = request.user
            notice.approved_at = timezone.now()
            notice.review_note = ''
            notice.save(update_fields=['status', 'approved_by', 'approved_at', 'review_note'])
        return Response(self.get_serializer(notice).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        if not is_admin(request.user):
            raise PermissionDenied('Only an administrator can reject notifications.')
        notice = self.get_object()
        notice.status = 'rejected'
        notice.approved_by = None
        notice.approved_at = None
        notice.review_note = str(request.data.get('review_note', '')).strip()[:500]
        notice.save(update_fields=['status', 'approved_by', 'approved_at', 'review_note'])
        return Response(self.get_serializer(notice).data)
