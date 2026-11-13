from rest_framework import status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework_simplejwt.tokens import RefreshToken
import logging
import secrets
from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import Q
from .models import Role, UserProfile, PendingApproval
from .roles import is_admin, normalize_role_name, portal_role
from .permissions import IsPortalAdmin
from .caching import get_cached_portal_profile, set_cached_portal_profile, invalidate_user_cache
from .throttling import LoginRateThrottle, MFARateThrottle, AccountLockoutManager
from .mfa import is_mfa_enabled_for_user, generate_mfa_challenge, verify_mfa_challenge, mask_email
from school.models import Student, SchoolClass
from .serializers import (
    RoleSerializer,
    UserProfileSerializer,
    PendingApprovalSerializer,
    SignUpSerializer,
    LoginSerializer,
    PendingApprovalActionSerializer,
    AdminAccountSerializer,
)

logger = logging.getLogger('ablegod.accounts')


def get_tokens_for_user(user, role=None, full_name=None):
    refresh = RefreshToken.for_user(user)
    session_id = secrets.token_urlsafe(24)
    if role:
        refresh['role'] = role
    if full_name:
        refresh['full_name'] = full_name
    refresh['session_id'] = session_id

    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
        'session_id': session_id,
        'user': {
            'id': user.id,
            'email': user.email,
            'username': user.username,
        }
    }


def get_portal_profile(user):
    """Return the authoritative portal role and display name for an account, with memory caching."""
    cached = get_cached_portal_profile(user.id)
    if cached:
        return cached['role'], cached['full_name']

    full_name = user.get_full_name() or user.username
    role = None
    try:
        profile = getattr(user, 'profile', None)
        if profile is None:
            profile = user.profile
        role = profile.role.name if profile.role else None
        full_name = profile.full_name or full_name
    except (UserProfile.DoesNotExist, AttributeError):
        pass

    # Django staff and superuser accounts always belong to the admin portal,
    # including legacy accounts created before role profiles were introduced.
    if user.is_superuser or user.is_staff:
        role = 'Admin'
    elif role:
        normalized_role = normalize_role_name(role)
        role = {
            'admin': 'Admin',
            'teacher': 'Teacher',
            'student': 'Student',
            'parent': 'Parent',
            'accounts': 'Accounts',
        }.get(normalized_role, role)

    must_change = False
    try:
        must_change = bool(user.profile.preferences.get('must_change_password'))
    except Exception:
        pass

    if role:
        set_cached_portal_profile(user.id, role, full_name, must_change)

    return role, full_name


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [LoginRateThrottle]

    def post(self, request):
        ser = LoginSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        email_or_username = ser.validated_data['email']
        password = ser.validated_data['password']

        # 1. Check account lockout to prevent brute-force attacks
        is_locked, remaining_seconds = AccountLockoutManager.is_locked(email_or_username)
        if is_locked:
            minutes = max(1, remaining_seconds // 60)
            return Response(
                {
                    'detail': f'Too many failed login attempts. This account is temporarily locked for {minutes} minute(s) to prevent brute-force attacks. Please try again later.'
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        # 2. Database query with indexing and joined profile
        user = User.objects.select_related('profile__role').filter(username=email_or_username).first()
        if not user:
            user = User.objects.select_related('profile__role').filter(email=email_or_username).first()
        if not user:
            user = User.objects.select_related('profile__role').filter(
                Q(email__iexact=email_or_username) | Q(username__iexact=email_or_username)
            ).first()

        # 3. Dynamic and secure password check (never cached)
        if not user or not user.check_password(password):
            locked, remaining = AccountLockoutManager.record_failure(email_or_username)
            if locked:
                minutes = max(1, remaining // 60)
                return Response(
                    {
                        'detail': f'Too many failed login attempts. This account is temporarily locked for {minutes} minute(s) to prevent brute-force attacks. Please try again later.'
                    },
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )
            return Response({'detail': 'Invalid email or password.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active:
            return Response({'detail': 'User account is disabled.'}, status=status.HTTP_403_FORBIDDEN)

        # Password succeeded: reset lockout counters
        AccountLockoutManager.reset(email_or_username)

        # 4. Authoritative portal role
        role, full_name = get_portal_profile(user)
        if not role:
            return Response(
                {'detail': 'This account has no portal role assigned. Please contact the school administrator.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        # 5. Check if Multi-Factor Authentication is required for this account
        if is_mfa_enabled_for_user(user):
            challenge = generate_mfa_challenge(user)
            return Response(challenge, status=status.HTTP_200_OK)

        # 6. Generate secure session and access token
        tokens = get_tokens_for_user(user, role=role, full_name=full_name)
        tokens['user']['role'] = role
        tokens['user']['full_name'] = full_name
        try:
            tokens['user']['must_change_password'] = bool(user.profile.preferences.get('must_change_password'))
        except (UserProfile.DoesNotExist, AttributeError):
            tokens['user']['must_change_password'] = False
        return Response(tokens)


class MFAVerifyView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [MFARateThrottle]

    def post(self, request):
        mfa_token = request.data.get('mfa_token', '').strip()
        code = str(request.data.get('code', '')).strip()

        is_valid, user, error_msg = verify_mfa_challenge(mfa_token, code)
        if not is_valid or not user:
            return Response({'detail': error_msg or 'Invalid verification code.'}, status=status.HTTP_400_BAD_REQUEST)

        role, full_name = get_portal_profile(user)
        if not role:
            return Response(
                {'detail': 'This account has no portal role assigned. Please contact the school administrator.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        tokens = get_tokens_for_user(user, role=role, full_name=full_name)
        tokens['user']['role'] = role
        tokens['user']['full_name'] = full_name
        try:
            tokens['user']['must_change_password'] = bool(user.profile.preferences.get('must_change_password'))
        except (UserProfile.DoesNotExist, AttributeError):
            tokens['user']['must_change_password'] = False

        return Response(tokens)


class MFAResendView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [MFARateThrottle]

    def post(self, request):
        mfa_token = request.data.get('mfa_token', '').strip()
        if not mfa_token:
            return Response({'detail': 'MFA session token is required.'}, status=status.HTTP_400_BAD_REQUEST)

        from django.core.signing import TimestampSigner, BadSignature, SignatureExpired
        from .mfa import SIGNER_SALT, MFA_CHALLENGE_TIMEOUT
        signer = TimestampSigner(salt=SIGNER_SALT)
        try:
            user_id_str = signer.unsign(mfa_token, max_age=MFA_CHALLENGE_TIMEOUT)
            user = User.objects.get(id=int(user_id_str), is_active=True)
        except (SignatureExpired, BadSignature, ValueError, User.DoesNotExist):
            return Response({'detail': 'Verification session expired. Please sign in again.'}, status=status.HTTP_400_BAD_REQUEST)

        challenge = generate_mfa_challenge(user)
        return Response({
            'detail': 'A fresh verification code has been dispatched.',
            'mfa_token': challenge['mfa_token'],
            'masked_destination': challenge['masked_destination'],
            'expires_in': challenge['expires_in'],
        })


class MFAStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        enabled = is_mfa_enabled_for_user(user)
        return Response({
            'mfa_enabled': enabled,
            'email': user.email,
            'masked_email': mask_email(user.email),
        })


class MFAToggleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        enabled = bool(request.data.get('enabled', False))
        password = str(request.data.get('password', ''))

        if not request.user.check_password(password):
            return Response({'detail': 'Password confirmation is required to change MFA settings.'}, status=status.HTTP_400_BAD_REQUEST)

        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        prefs = dict(profile.preferences or {})
        prefs['mfa_enabled'] = enabled
        profile.preferences = prefs
        profile.save(update_fields=['preferences'])
        invalidate_user_cache(request.user.id)

        return Response({
            'mfa_enabled': enabled,
            'detail': f'Multi-Factor Authentication {"enabled" if enabled else "disabled"} successfully.',
        })


class CurrentUserView(APIView):
    """Return the signed-in user's profile for session restoration."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        role, full_name = get_portal_profile(user)
        from parents.models import Parent
        from school.models import Teacher
        try:
            preferences = user.profile.preferences
        except UserProfile.DoesNotExist:
            preferences = {}
        phone = Parent.objects.filter(user=user).values_list('phone', flat=True).first()
        if phone is None:
            phone = Teacher.objects.filter(user=user).values_list('phone', flat=True).first()
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': role,
            'full_name': full_name,
            'phone': phone or '',
            'preferences': preferences,
            'must_change_password': bool(preferences.get('must_change_password')),
        })

    @transaction.atomic
    def patch(self, request):
        user = request.user
        email = request.data.get('email', user.email).strip().casefold()
        username = request.data.get('username', user.username).strip()
        full_name = request.data.get('full_name', '').strip()
        role = portal_role(user)
        if not username or not full_name or (not email and role != 'student'):
            return Response({'detail': 'Name and username are required; email is required for staff and parent accounts.'}, status=status.HTTP_400_BAD_REQUEST)
        if email and User.objects.filter(email__iexact=email).exclude(pk=user.pk).exists():
            return Response({'email': ['This email is already in use.']}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(username__iexact=username).exclude(pk=user.pk).exists():
            return Response({'username': ['This username is already in use.']}, status=status.HTTP_400_BAD_REQUEST)
        preferences = request.data.get('preferences')
        if preferences is not None and not isinstance(preferences, dict):
            return Response({'preferences': ['Preferences must be a JSON object.']}, status=status.HTTP_400_BAD_REQUEST)
        user.email = email
        user.username = username
        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.full_name = full_name
        update_profile_fields = ['full_name']
        if preferences is not None:
            profile.preferences = preferences
            update_profile_fields.append('preferences')
        profile.save(update_fields=update_profile_fields)
        user.save(update_fields=['email', 'username'])
        address = request.data.get('address')
        if address is not None and role == 'student':
            Student.objects.filter(user=user).update(address=str(address).strip())
        phone = request.data.get('phone')
        if phone is not None:
            from parents.models import Parent
            from school.models import Teacher
            Parent.objects.filter(user=user).update(phone=phone.strip())
            Teacher.objects.filter(user=user).update(phone=phone.strip())
        from .sync import sync_linked_portal_records
        sync_linked_portal_records(user, full_name, email)
        return Response({
            'detail': 'Profile updated.',
            'email': user.email,
            'username': user.username,
            'full_name': full_name,
            'preferences': profile.preferences,
        })


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        current = request.data.get('current_password', '')
        new = request.data.get('new_password', '')
        confirm = request.data.get('confirm_password', new)
        try:
            profile = request.user.profile
            must_change = bool(profile.preferences.get('must_change_password'))
        except UserProfile.DoesNotExist:
            profile = None
            must_change = False
        if not must_change and not request.user.check_password(current):
            return Response({'current_password': ['Current password is incorrect.']}, status=status.HTTP_400_BAD_REQUEST)
        if len(new) < 8:
            return Response({'new_password': ['Use at least 8 characters.']}, status=status.HTTP_400_BAD_REQUEST)
        if new != confirm:
            return Response({'confirm_password': ['Passwords do not match.']}, status=status.HTTP_400_BAD_REQUEST)
        from django.contrib.auth.password_validation import validate_password
        from django.core.exceptions import ValidationError as DjangoValidationError
        try:
            validate_password(new, user=request.user)
        except DjangoValidationError as error:
            return Response({'new_password': list(error.messages)}, status=status.HTTP_400_BAD_REQUEST)
        request.user.set_password(new)
        request.user.save(update_fields=['password'])
        if profile and must_change:
            preferences = dict(profile.preferences or {})
            preferences.pop('must_change_password', None)
            profile.preferences = preferences
            profile.save(update_fields=['preferences'])
        return Response({'detail': 'Password changed.', 'must_change_password': False})


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
    permission_classes = [IsPortalAdmin]


class UserProfileViewSet(ModelViewSet):
    queryset = UserProfile.objects.select_related('user', 'role').all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsPortalAdmin]


class AdminAccountViewSet(ModelViewSet):
    queryset = User.objects.select_related('profile__role').all().order_by('username')
    serializer_class = AdminAccountSerializer
    permission_classes = [IsPortalAdmin]

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.query_params.get('portal_role', '').strip().casefold() == 'teacher':
            teacher_role_names = ('teacher', 'class teacher', 'educator', 'teaching staff')
            teacher_roles = Q()
            for role_name in teacher_role_names:
                teacher_roles |= Q(profile__role__name__iexact=role_name)
            queryset = queryset.filter(teacher_roles)
        return queryset

    def perform_create(self, serializer):
        self.created_account = serializer.save()

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        account = getattr(self, 'created_account', None)
        password = getattr(account, '_portal_temporary_password', None)
        if account and password:
            response.data['portal_credentials'] = {
                'username': account.username,
                'temporary_password': password,
            }
        return response

    def destroy(self, request, *args, **kwargs):
        account = self.get_object()
        if account.pk == request.user.pk:
            return Response({'detail': 'You cannot deactivate the account currently in use.'}, status=status.HTTP_400_BAD_REQUEST)
        account.is_active = False
        account.save(update_fields=['is_active'])
        logger.info('Account deactivated actor=%s target=%s', request.user.pk, account.pk)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['delete'], url_path='permanent-delete')
    def permanent_delete(self, request, pk=None):
        account = self.get_object()
        if account.pk == request.user.pk or account.is_superuser:
            return Response({'detail': 'This administrator account cannot be permanently deleted.'}, status=status.HTTP_400_BAD_REQUEST)
        from parents.models import Parent
        from school.models import Student, Teacher
        if (
            Student.objects.filter(user=account).exists()
            or Teacher.objects.filter(user=account).exists()
            or Parent.objects.filter(user=account).exists()
        ):
            return Response(
                {'detail': 'This account is linked to school records. Deactivate it to preserve those records.'},
                status=status.HTTP_409_CONFLICT,
            )
        target_id = account.pk
        username = account.username
        account.delete()
        logger.warning('Account permanently deleted actor=%s target=%s username=%s', request.user.pk, target_id, username)
        return Response(status=status.HTTP_204_NO_CONTENT)


class PendingApprovalViewSet(ModelViewSet):
    queryset = PendingApproval.objects.all()
    serializer_class = PendingApprovalSerializer
    permission_classes = [IsPortalAdmin]
    filterset_fields = ['status', 'role']

    def get_queryset(self):
        return PendingApproval.objects.filter(status='pending').order_by('-requested_at')

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        pending = self.get_object()
        with transaction.atomic():
            pending = PendingApproval.objects.select_for_update().get(pk=pending.pk)
            if pending.status != 'pending':
                return Response({'detail': 'Already processed.'}, status=status.HTTP_400_BAD_REQUEST)
            user = User(username=pending.email, email=pending.email)
            user.password = pending.password_hash  # already hashed from signup
            user.save()
            role, _ = Role.objects.get_or_create(name=pending.role.capitalize(), defaults={'description': pending.role})
            UserProfile.objects.create(user=user, role=role, full_name=pending.full_name)
            from .sync import sync_linked_portal_records
            sync_linked_portal_records(user, pending.full_name, pending.email)

            # If this was a student signup, create a corresponding Student record
            # in its own savepoint so failure cannot leave the approval half-saved.
            if pending.role == 'student':
                try:
                    with transaction.atomic():
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
                            Student.objects.create(
                                user=user,
                                name=pending.full_name,
                                school_class=class_obj,
                            )
                except Exception:
                    # Account approval can proceed; an admin can add the student record later.
                    pass

            pending.status = 'approved'
            pending.save(update_fields=['status'])
        return Response({'detail': 'User approved and created.', 'user_id': user.id})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        pending = self.get_object()
        with transaction.atomic():
            pending = PendingApproval.objects.select_for_update().get(pk=pending.pk)
            if pending.status != 'pending':
                return Response({'detail': 'Already processed.'}, status=status.HTTP_400_BAD_REQUEST)
            pending.status = 'rejected'
            pending.save(update_fields=['status'])
        return Response({'detail': 'Request rejected.'})
