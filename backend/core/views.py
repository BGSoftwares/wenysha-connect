from rest_framework import status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from .models import Role, UserProfile, PendingApproval
from school.models import Student, SchoolClass
from .serializers import (
    RoleSerializer,
    UserProfileSerializer,
    PendingApprovalSerializer,
    SignUpSerializer,
    LoginSerializer,
    PendingApprovalActionSerializer,
)


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
        'user': {
            'id': user.id,
            'email': user.email,
            'username': user.username,
        }
    }


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        ser = LoginSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        email = ser.validated_data['email']
        password = ser.validated_data['password']
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'detail': 'Invalid email or password.'}, status=status.HTTP_401_UNAUTHORIZED)
        if not user.check_password(password):
            return Response({'detail': 'Invalid email or password.'}, status=status.HTTP_401_UNAUTHORIZED)
        if not user.is_active:
            return Response({'detail': 'User account is disabled.'}, status=status.HTTP_403_FORBIDDEN)
        tokens = get_tokens_for_user(user)
        # Include role if profile exists
        try:
            profile = user.profile
            # Normalize role string to a predictable lowercase value
            def _normalize_role(name: str) -> str:
                if not name:
                    return ''
                n = name.lower()
                if 'student' in n:
                    return 'student'
                if 'admin' in n:
                    return 'admin'
                if 'teacher' in n:
                    return 'teacher'
                if 'parent' in n:
                    return 'parent'
                if 'account' in n or 'accounts' in n:
                    return 'accounts'
                return n

            tokens['user']['role'] = _normalize_role(profile.role.name) if profile.role else None
            tokens['user']['full_name'] = profile.full_name or user.username
        except UserProfile.DoesNotExist:
            tokens['user']['role'] = None
            tokens['user']['full_name'] = user.username
        return Response(tokens)


class SignUpView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        ser = SignUpSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(
            {'detail': 'Registration submitted. Your account is pending administrator approval.'},
            status=status.HTTP_201_CREATED
        )


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        data = {
            'id': user.id,
            'email': user.email,
            'username': user.username,
        }
        try:
            profile = user.profile
            data['role'] = profile.role.name.lower() if profile.role else None
            data['full_name'] = profile.full_name or user.username
        except UserProfile.DoesNotExist:
            data['role'] = None
            data['full_name'] = user.username
        return Response(data)


class RoleViewSet(ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [permissions.IsAuthenticated]


class UserProfileViewSet(ModelViewSet):
    queryset = UserProfile.objects.select_related('user', 'role').all()
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]


class PendingApprovalViewSet(ModelViewSet):
    queryset = PendingApproval.objects.all()
    serializer_class = PendingApprovalSerializer
    # Only admin/staff users should approve/reject accounts
    permission_classes = [permissions.IsAdminUser]
    filterset_fields = ['status', 'role']

    def get_queryset(self):
        return PendingApproval.objects.filter(status='pending').order_by('-requested_at')

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        pending = self.get_object()
        if pending.status != 'pending':
            return Response({'detail': 'Already processed.'}, status=status.HTTP_400_BAD_REQUEST)
        user = User(username=pending.email, email=pending.email)
        user.password = pending.password_hash  # already hashed from signup
        user.save()
        pending.status = 'approved'
        pending.save(update_fields=['status'])
        role, _ = Role.objects.get_or_create(name=pending.role.capitalize(), defaults={'description': pending.role})
        UserProfile.objects.create(user=user, role=role, full_name=pending.full_name)
        # If this was a student signup, try to create a corresponding Student record
        if pending.role == 'student':
            try:
                # Try to resolve a class from additional_info (id or name), else use first available class
                class_obj = None
                info = pending.additional_info or {}
                cls_id = info.get('school_class') or info.get('school_class_id')
                cls_name = info.get('class_name')
                if cls_id:
                    try:
                        class_obj = SchoolClass.objects.get(id=cls_id)
                    except SchoolClass.DoesNotExist:
                        class_obj = None
                if not class_obj and cls_name:
                    try:
                        class_obj = SchoolClass.objects.get(name=cls_name)
                    except SchoolClass.DoesNotExist:
                        class_obj = None
                if not class_obj:
                    class_obj = SchoolClass.objects.first()

                if class_obj:
                    # Generate a simple unique student_id
                    base_num = (Student.objects.count() or 0) + 1
                    student_id = f"STU{base_num:04d}"
                    while Student.objects.filter(student_id=student_id).exists():
                        base_num += 1
                        student_id = f"STU{base_num:04d}"
                    Student.objects.create(
                        user=user,
                        student_id=student_id,
                        name=pending.full_name,
                        school_class=class_obj,
                    )
            except Exception:
                # Do not block approval if student record creation fails; admin can create later.
                pass
        return Response({'detail': 'User approved and created.', 'user_id': user.id})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        pending = self.get_object()
        if pending.status != 'pending':
            return Response({'detail': 'Already processed.'}, status=status.HTTP_400_BAD_REQUEST)
        pending.status = 'rejected'
        pending.save(update_fields=['status'])
        return Response({'detail': 'Request rejected.'})
