from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.authentication import JWTAuthentication

from .caching import get_portal_state


class PasswordChangeRequiredJWTAuthentication(JWTAuthentication):
    """Limit temporary-password accounts to identity lookup and password change."""

    def authenticate(self, request):
        result = super().authenticate(request)
        if result is None:
            return None

        user, token = result
        # Served from cache: no extra profile query on every authenticated request.
        if get_portal_state(user)['must_change_password']:
            path = request.path.rstrip('/')
            is_identity_lookup = request.method == 'GET' and path.endswith('/auth/me')
            is_password_change = request.method == 'POST' and path.endswith('/auth/change-password')
            if not (is_identity_lookup or is_password_change):
                raise PermissionDenied(
                    'Change your temporary password before using the portal.',
                    code='password_change_required',
                )
        return user, token
