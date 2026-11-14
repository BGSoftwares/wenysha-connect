"""Access/refresh token issuing and revocation."""
import secrets

from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from rest_framework_simplejwt.tokens import RefreshToken


def get_tokens_for_user(user, role=None, full_name=None):
    """
    Short-lived access token (sent with every request) plus a longer-lived
    refresh token (used only to get new access tokens). Refresh tokens rotate on
    every use and the previous one is blacklisted, so a stolen refresh token
    stops working as soon as the real client refreshes.
    """
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
        },
    }


def revoke_user_tokens(user) -> int:
    """Blacklist every outstanding refresh token for the user (all devices)."""
    pending = list(OutstandingToken.objects.filter(user=user).exclude(blacklistedtoken__isnull=False))
    BlacklistedToken.objects.bulk_create([BlacklistedToken(token=t) for t in pending], ignore_conflicts=True)
    return len(pending)
