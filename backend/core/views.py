from rest_framework import status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from .models import Role, UserProfile, PendingApproval
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
            tokens['user']['role'] = profile.role.name if profile.role else None
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
        return Response({'detail': 'User approved and created.', 'user_id': user.id})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        pending = self.get_object()
        if pending.status != 'pending':
            return Response({'detail': 'Already processed.'}, status=status.HTTP_400_BAD_REQUEST)
        pending.status = 'rejected'
        pending.save(update_fields=['status'])
        return Response({'detail': 'Request rejected.'})
