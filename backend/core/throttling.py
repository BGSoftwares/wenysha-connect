"""
Rate limiting and brute-force protection for the login and MFA endpoints.

Two independent layers:
  * per-client-IP request throttles (DRF), and
  * per-account lockout after repeated failures.

All counters live in the shared Django cache. Behind a load balancer this MUST be
Redis (see settings.CACHES) - with per-process memory every worker would keep its
own counters and the limits would silently multiply.
"""
import hashlib
import time

from django.core.cache import cache
from rest_framework.throttling import AnonRateThrottle, SimpleRateThrottle

MAX_FAILED_ATTEMPTS = 5
LOCKOUT_DURATION_SECONDS = 900  # 15 minutes
ATTEMPT_WINDOW_SECONDS = 300    # failures only count inside a 5-minute window


class LoginRateThrottle(AnonRateThrottle):
    """Caps login requests per client IP (rate set by DEFAULT_THROTTLE_RATES['login'])."""
    scope = 'login'


class SignupRateThrottle(SimpleRateThrottle):
    """Caps account sign-ups and admission applications per client IP."""
    scope = 'signup'

    def get_cache_key(self, request, view):
        return self.cache_format % {'scope': self.scope, 'ident': self.get_ident(request)}


class MFARateThrottle(SimpleRateThrottle):
    """Caps MFA verify/resend/setup requests per client IP."""
    scope = 'mfa'

    def get_cache_key(self, request, view):
        return self.cache_format % {'scope': self.scope, 'ident': self.get_ident(request)}


class AccountLockoutManager:
    """
    Temporarily locks an identifier (username/email, or "mfa:<user id>") after
    MAX_FAILED_ATTEMPTS failures. Counting uses the cache's atomic increment so
    concurrent requests cannot slip extra guesses past the limit.
    """

    @staticmethod
    def _keys(identifier: str) -> tuple[str, str]:
        clean = (identifier or '').strip().lower()
        digest = hashlib.sha256(clean.encode('utf-8')).hexdigest()[:40]
        return f"ablegod:lockout:attempts:{digest}", f"ablegod:lockout:until:{digest}"

    @classmethod
    def is_locked(cls, identifier: str) -> tuple[bool, int]:
        _, lock_key = cls._keys(identifier)
        until = cache.get(lock_key)
        now = time.time()
        if until and until > now:
            return True, max(1, int(until - now))
        return False, 0

    @classmethod
    def record_failure(cls, identifier: str) -> tuple[bool, int]:
        attempts_key, lock_key = cls._keys(identifier)
        cache.add(attempts_key, 0, ATTEMPT_WINDOW_SECONDS)
        try:
            attempts = cache.incr(attempts_key)
        except ValueError:  # key expired between add() and incr()
            cache.set(attempts_key, 1, ATTEMPT_WINDOW_SECONDS)
            attempts = 1

        if attempts >= MAX_FAILED_ATTEMPTS:
            cache.set(lock_key, time.time() + LOCKOUT_DURATION_SECONDS, LOCKOUT_DURATION_SECONDS)
            cache.delete(attempts_key)
            return True, LOCKOUT_DURATION_SECONDS
        return False, 0

    @classmethod
    def reset(cls, identifier: str):
        attempts_key, lock_key = cls._keys(identifier)
        cache.delete_many([attempts_key, lock_key])
