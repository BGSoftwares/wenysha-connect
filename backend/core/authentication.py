from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.authentication import JWTAuthentication

from .caching import get_portal_state

# Endpoints an account may still use while it is restricted.
_MFA_SETUP_ALLOWED = (
    ('GET', '/auth/me'),
    ('GET', '/auth/mfa/status'),
    ('POST', '/auth/mfa/toggle'),
    ('POST', '/auth/mfa/totp/setup'),
    ('POST', '/auth/mfa/totp/confirm'),
)


def _allowed(request, allowed) -> bool:
    path = request.path.rstrip('/')
    return any(request.method == method and path.endswith(suffix) for method, suffix in allowed)


class PasswordChangeRequiredJWTAuthentication(JWTAuthentication):
    """
    Restrict accounts that have an unfinished security step:
      * temporary password  -> only identity lookup and password change
      * MFA required by role but not yet set up -> only identity lookup and MFA setup
    """

    def authenticate(self, request):
        result = super().authenticate(request)
        if result is None:
            return None

        user, token = result
        state = get_portal_state(user)  # cached: no extra query per request
        if state['must_change_password']:
            if not _allowed(request, (('GET', '/auth/me'), ('POST', '/auth/change-password'))):
                raise PermissionDenied(
                    'Change your temporary password before using the portal.',
                    code='password_change_required',
                )
        elif state['mfa_setup_required']:
            if not _allowed(request, _MFA_SETUP_ALLOWED):
                raise PermissionDenied(
                    'Set up two-step verification before using the portal.',
                    code='mfa_setup_required',
                )
        return user, token
