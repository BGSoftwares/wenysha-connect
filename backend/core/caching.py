"""
Account/profile caching so authenticated requests do not hit the database for
role, display name and "must change password" on every call.

Only non-credential data is cached (role, name, flags). Password hashes and
password verification never touch the cache.
"""
import logging

from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger('ablegod.accounts')

PROFILE_CACHE_TTL = 300  # 5 minutes; also invalidated explicitly by signals

_PORTAL_ROLE_LABELS = {
    'admin': 'Admin',
    'teacher': 'Teacher',
    'student': 'Student',
    'parent': 'Parent',
    'accounts': 'Accounts',
}


def _profile_cache_key(user_id: int) -> str:
    return f"ablegod:profile:{user_id}"


def get_cached_portal_profile(user_id: int):
    return cache.get(_profile_cache_key(user_id))


def set_cached_portal_profile(user_id: int, role, full_name: str, must_change_password: bool = False, mfa_enabled: bool = False, mfa_setup_required: bool = False, ttl: int = PROFILE_CACHE_TTL):
    data = {
        'role': role,
        'full_name': full_name,
        'must_change_password': must_change_password,
        'mfa_enabled': mfa_enabled,
        'mfa_setup_required': mfa_setup_required,
    }
    cache.set(_profile_cache_key(user_id), data, ttl)
    return data


def invalidate_user_cache(user_id: int):
    """Drop cached state when the user, profile or role changes."""
    cache.delete(_profile_cache_key(user_id))


def get_portal_state(user) -> dict:
    """
    Authoritative portal role, display name and must-change-password flag.

    Served from cache when possible; otherwise loaded once and cached (including
    "no role" so such accounts do not cause a query per request either).
    """
    cached = get_cached_portal_profile(user.id)
    if cached is not None:
        return cached

    # Imported here to avoid import cycles at app-loading time.
    from .models import UserProfile
    from .roles import normalize_role_name

    full_name = user.get_full_name() or user.username
    role = None
    must_change = False
    mfa_enabled = False
    try:
        profile = user.profile
        role = profile.role.name if profile.role else None
        full_name = profile.full_name or full_name
        prefs = profile.preferences or {}
        must_change = bool(prefs.get('must_change_password'))
        mfa_enabled = bool(prefs.get('mfa_enabled'))
    except (UserProfile.DoesNotExist, AttributeError):
        pass

    # Django staff and superuser accounts always belong to the admin portal,
    # including legacy accounts created before role profiles were introduced.
    if user.is_superuser or user.is_staff:
        role = 'Admin'
    elif role:
        role = _PORTAL_ROLE_LABELS.get(normalize_role_name(role), role)

    mfa_setup_required = bool(role in getattr(settings, 'MFA_REQUIRED_ROLES', []) and not mfa_enabled)
    return set_cached_portal_profile(user.id, role, full_name, must_change, mfa_enabled, mfa_setup_required)
