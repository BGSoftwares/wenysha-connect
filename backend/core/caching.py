"""
Account and User Profile Caching layer to eliminate database bottlenecks
on frequently accessed authentication and profile endpoints.
"""
from django.core.cache import cache
import logging

logger = logging.getLogger('ablegod.accounts')

PROFILE_CACHE_TTL = 300  # 5 minutes


def _profile_cache_key(user_id: int) -> str:
    return f"ablegod:profile:{user_id}"


def _user_session_cache_key(user_id: int) -> str:
    return f"ablegod:session:{user_id}"


def get_cached_portal_profile(user_id: int):
    """
    Retrieve cached portal profile (role, full_name, must_change_password)
    to prevent repetitive DB queries on every authenticated request.
    """
    return cache.get(_profile_cache_key(user_id))


def set_cached_portal_profile(user_id: int, role: str, full_name: str, must_change_password: bool = False, ttl: int = PROFILE_CACHE_TTL):
    """
    Store authoritative portal profile in the fast cache.
    """
    data = {
        'role': role,
        'full_name': full_name,
        'must_change_password': must_change_password,
    }
    cache.set(_profile_cache_key(user_id), data, ttl)
    return data


def invalidate_user_cache(user_id: int):
    """
    Invalidate all cached user records when the profile, role, or preferences change.
    """
    cache.delete(_profile_cache_key(user_id))
    cache.delete(_user_session_cache_key(user_id))
    cache.delete(f"ablegod:mfa:status:{user_id}")
