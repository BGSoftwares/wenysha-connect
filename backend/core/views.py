import logging

from django.conf import settings
from django.contrib.auth.hashers import check_password as hasher_check_password, make_password
from django.contrib.auth.models import User
from django.core.cache import cache
from django.db import transaction
from django.db.models import Q
from rest_framework import status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Role, UserProfile, PendingApproval
from .roles import is_admin, normalize_role_name, portal_role
from .permissions import IsPortalAdmin
from .caching import get_portal_state
from .throttling import LoginRateThrottle, MFARateThrottle, SignupRateThrottle, AccountLockoutManager
from .tokens import get_tokens_for_user, revoke_user_tokens
from .mfa import (
    RESEND_COOLDOWN_SECONDS,
    backup_codes_remaining,
    begin_totp_enrollment,
    confirm_totp_enrollment,
    disable_mfa,
    enable_email_mfa,
    generate_backup_codes,
    generate_mfa_challenge,
    get_mfa_method,
    is_mfa_enabled_for_user,
    mask_email,
    parse_mfa_token,
    verify_mfa_challenge,
)
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

_LOCKED_MESSAGE = (
    'Too many failed login attempts. This account is temporarily locked for {minutes} minute(s) '
    'to prevent brute-force attacks. Please try again later.'
)
_dummy_password_hash = None


def _burn_password_hash_time(password: str) -> None:
    """
    Run one real password verification for unknown usernames so a missing
    account takes as long to reject as a wrong password (no timing oracle for
    guessing which usernames exist).
    """
    global _dummy_password_hash
    if _dummy_password_hash is None:
        _dummy_password_hash = make_password('ablegod-timing-equalizer')
    hasher_check_password(password, _dummy_password_hash)


def get_portal_profile(user):
    """Return the authoritative portal role and display name for an account (cached)."""
    state = get_portal_state(user)
    return state['role'], state['full_name']


def _find_login_user(identifier: str):
    """Look up by username first, then email. Both columns are indexed."""
    base = User.objects.select_related('profile__role')
    return (
        base.filter(username__iexact=identifier).first()
        or base.filter(email__iexact=identifier).first()
    )


def _session_response(user) -> Response:
    """Issue the access/refresh token pair for a fully authenticated user."""
    state = get_portal_state(user)
    if not state['role']:
        return Response(
            {'detail': 'This account has no portal role assigned. Please contact the school administrator.'},
            status=status.HTTP_403_FORBIDDEN,
        )
    tokens = get_tokens_for_user(user, role=state['role'], full_name=state['full_name'])
    tokens['user'].update(
        role=state['role'],
        full_name=state['full_name'],
        must_change_password=state['must_change_password'],
        mfa_setup_required=state['mfa_setup_required'],
    )
    return Response(tokens)


class LoginView(APIView):
    """
    Step 1 of sign-in: verify the password (Argon2id), then either issue tokens
    or, for accounts with MFA, hand back a short-lived challenge for step 2
    (/auth/mfa/verify/).
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []  # a stale/expired Authorization header must not block signing in
    throttle_classes = [LoginRateThrottle]

    def post(self, request):
        ser = LoginSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        identifier = ser.validated_data['email'].strip()
        password = ser.validated_data['password']

        locked, remaining_seconds = AccountLockoutManager.is_locked(identifier)
        if locked:
            return Response(
                {'detail': _LOCKED_MESSAGE.format(minutes=max(1, remaining_seconds // 60))},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        user = _find_login_user(identifier)

        # Password verification always runs against the stored hash and is never cached.
        # check_password() also upgrades older hashes (e.g. PBKDF2) to Argon2id on success.
        if user is None:
            _burn_password_hash_time(password)
            password_ok = False
        else:
            password_ok = user.check_password(password)

        if not password_ok:
            now_locked, remaining = AccountLockoutManager.record_failure(identifier)
            if now_locked:
                return Response(
                    {'detail': _LOCKED_MESSAGE.format(minutes=max(1, remaining // 60))},
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )
            return Response({'detail': 'Invalid email or password.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active:
            return Response({'detail': 'User account is disabled.'}, status=status.HTTP_403_FORBIDDEN)

        if not get_portal_state(user)['role']:
            return Response(
                {'detail': 'This account has no portal role assigned. Please contact the school administrator.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if is_mfa_enabled_for_user(user):
            # Failure counters are only cleared once the whole login (both steps) succeeds.
            return Response(generate_mfa_challenge(user), status=status.HTTP_200_OK)

        AccountLockoutManager.reset(identifier)
        return _session_response(user)


class MFAVerifyView(APIView):
    """Step 2 of sign-in: exchange the challenge token + code for tokens."""
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    throttle_classes = [MFARateThrottle]

    def post(self, request):
        mfa_token = str(request.data.get('mfa_token', '')).strip()
        code = str(request.data.get('code', '')).strip()

        is_valid, user, error_msg = verify_mfa_challenge(mfa_token, code)
        if not is_valid or not user:
            return Response({'detail': error_msg or 'Invalid verification code.'}, status=status.HTTP_400_BAD_REQUEST)

        AccountLockoutManager.reset(user.username)
        AccountLockoutManager.reset(user.email)
        return _session_response(user)


class MFAResendView(APIView):
    """Send a fresh email code (email method only), at most once a minute per account."""
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    throttle_classes = [MFARateThrottle]

    def post(self, request):
        mfa_token = str(request.data.get('mfa_token', '')).strip()
        if not mfa_token:
            return Response({'detail': 'MFA session token is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.select_related('profile').get(id=parse_mfa_token(mfa_token), is_active=True)
        except Exception:
            return Response({'detail': 'Verification session expired. Please sign in again.'}, status=status.HTTP_400_BAD_REQUEST)

        if get_mfa_method(user) != 'email':
            return Response({'detail': 'Open your authenticator app to get the current code.'}, status=status.HTTP_400_BAD_REQUEST)

        if not cache.add(f'ablegod:mfa:resend:{user.id}', 1, RESEND_COOLDOWN_SECONDS):
            return Response(
                {'detail': f'Please wait {RESEND_COOLDOWN_SECONDS} seconds before requesting another code.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        challenge = generate_mfa_challenge(user)
        return Response({
            'detail': 'A fresh verification code has been dispatched.',
            'mfa_token': challenge['mfa_token'],
            'masked_destination': challenge['masked_destination'],
            'expires_in': challenge['expires_in'],
        })


def role_requires_mfa(user) -> bool:
    return get_portal_state(user)['role'] in getattr(settings, 'MFA_REQUIRED_ROLES', [])


class MFAStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        enabled = is_mfa_enabled_for_user(user)
        return Response({
            'mfa_enabled': enabled,
            'mfa_method': get_mfa_method(user) if enabled else None,
            'mfa_required': role_requires_mfa(user),
            'backup_codes_remaining': backup_codes_remaining(user) if enabled else 0,
            'email': user.email,
            'masked_email': mask_email(user.email),
        })


class MFAToggleView(APIView):
    """Turn MFA on (email codes) or off. Always requires the current password."""
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [MFARateThrottle]

    def post(self, request):
        enabled = bool(request.data.get('enabled', False))
        if not request.user.check_password(str(request.data.get('password', ''))):
            return Response({'detail': 'Password confirmation is required to change MFA settings.'}, status=status.HTTP_400_BAD_REQUEST)

        if enabled:
            if not is_mfa_enabled_for_user(request.user):
                if not request.user.email:
                    return Response(
                        {'detail': 'Add an email address to your account first, or set up an authenticator app instead.'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                enable_email_mfa(request.user)
        else:
            if role_requires_mfa(request.user):
                return Response(
                    {'detail': 'Two-step verification is required for your role and cannot be turned off.'},
                    status=status.HTTP_403_FORBIDDEN,
                )
            disable_mfa(request.user)

        return Response({
            'mfa_enabled': enabled,
            'detail': f'Multi-Factor Authentication {"enabled" if enabled else "disabled"} successfully.',
        })


class TOTPSetupView(APIView):
    """Start authenticator-app enrolment. MFA stays off until /mfa/totp/confirm/ succeeds."""
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [MFARateThrottle]

    def post(self, request):
        if not request.user.check_password(str(request.data.get('password', ''))):
            return Response({'detail': 'Password confirmation is required to set up an authenticator app.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(begin_totp_enrollment(request.user))


class TOTPConfirmView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [MFARateThrottle]

    def post(self, request):
        if not confirm_totp_enrollment(request.user, str(request.data.get('code', ''))):
            return Response({'detail': 'That code is not valid. Check the time on your phone and try again.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response({
            'mfa_enabled': True,
            'mfa_method': 'totp',
            'backup_codes': generate_backup_codes(request.user),  # shown once; only hashes are stored
            'detail': 'Authenticator app verified. Two-step verification is now on.',
        })


class BackupCodesView(APIView):
    """Replace the backup codes with a new set (old ones stop working). Needs the password."""
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [MFARateThrottle]

    def post(self, request):
        if not request.user.check_password(str(request.data.get('password', ''))):
            return Response({'detail': 'Password confirmation is required to create new backup codes.'}, status=status.HTTP_400_BAD_REQUEST)
        if not is_mfa_enabled_for_user(request.user):
            return Response({'detail': 'Turn on two-step verification first.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'backup_codes': generate_backup_codes(request.user)})


class LogoutView(APIView):
    """Revoke the refresh token so a copied token cannot be used after sign-out."""
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        raw = str(request.data.get('refresh', '')).strip()
        if raw:
            try:
                RefreshToken(raw).blacklist()
            except TokenError:
                pass  # already expired/revoked: the goal (token unusable) is met
        return Response(status=status.HTTP_204_NO_CONTENT)


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
        client_preferences = public_preferences(preferences)
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
            'preferences': client_preferences,
            'must_change_password': bool(preferences.get('must_change_password')),
            'mfa_enabled': bool(preferences.get('mfa_enabled')),
            'mfa_setup_required': get_portal_state(user)['mfa_setup_required'],
        })

    @transaction.atomic
    def patch(self, request):
        user = request.user
        for field in ('email', 'username', 'full_name'):
            value = request.data.get(field, '')
            if value is not None and not isinstance(value, str):
                return Response({field: ['Enter a valid text value.']}, status=status.HTTP_400_BAD_REQUEST)
        email = (request.data.get('email', user.email) or '').strip().casefold()
        username = (request.data.get('username', user.username) or '').strip()
        full_name = (request.data.get('full_name', '') or '').strip()
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
            # Only display preferences can be changed here. Security state (two-step
            # verification, backup codes, forced password change, access level...) is
            # never writable through the profile form.
            merged = dict(profile.preferences or {})
            merged.update({k: v for k, v in preferences.items() if k in USER_EDITABLE_PREFERENCES})
            profile.preferences = merged
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


USER_EDITABLE_PREFERENCES = frozenset({'notifications', 'appearance', 'theme', 'language'})
_PRIVATE_PREFERENCE_KEYS = frozenset({'totp_secret', 'totp_pending_secret', 'totp_last_step', 'backup_codes', 'mfa_method', 'email_mfa'})


def public_preferences(preferences):
    """Preferences safe to send to the browser (no secrets, hashes or MFA internals)."""
    return {k: v for k, v in (preferences or {}).items() if k not in _PRIVATE_PREFERENCE_KEYS}


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

        # A password change must end every other session (stolen/forgotten devices).
        # The current device gets a fresh token pair so it is not signed out.
        revoke_user_tokens(request.user)
        session = _session_response(request.user)
        payload = {'detail': 'Password changed.', 'must_change_password': False}
        if session.status_code == status.HTTP_200_OK:
            payload.update(access=session.data['access'], refresh=session.data['refresh'])
        return Response(payload)


class SignUpView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [SignupRateThrottle]

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
            approved_class = None
            if pending.role == 'student':
                info = pending.additional_info or {}
                cls_id = request.data.get('school_class') or info.get('school_class') or info.get('school_class_id')
                cls_name = info.get('class_name')
                if cls_id:
                    approved_class = SchoolClass.objects.filter(pk=cls_id).first()
                if not approved_class and cls_name:
                    approved_class = SchoolClass.objects.filter(name=cls_name).first()
                if not approved_class:
                    # Never guess: a wrong class would expose the student's data to the wrong teacher.
                    return Response(
                        {'school_class': ['Choose a class before approving a student.']},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
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
                Student.objects.create(user=user, name=pending.full_name, school_class=approved_class)

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
