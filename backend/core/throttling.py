"""
Rate limiting and brute force protection for authentication and MFA endpoints.
"""
import time
from rest_framework.throttling import AnonRateThrottle, SimpleRateThrottle
from django.core.cache import cache

MAX_FAILED_ATTEMPTS = 5
LOCKOUT_DURATION_SECONDS = 900  # 15 minutes lockout
ATTEMPT_WINDOW_SECONDS = 300   # 5-minute window


class LoginRateThrottle(AnonRateThrottle):
    """
    Limits total login attempts per IP address to prevent brute-force attacks.
    Rate: 5 requests per minute.
    """
    scope = 'login'


class MFARateThrottle(SimpleRateThrottle):
    """
    Limits MFA code verification attempts to prevent OTP brute-forcing.
    Rate: 10 requests per minute.
    """
    scope = 'mfa'

    def get_cache_key(self, request, view):
        ident = self.get_ident(request)
        return f"throttle_mfa_{ident}"


class AccountLockoutManager:
    """
    Manages consecutive failed authentication attempts per account identifier (email/username).
    Temporarily locks the account after 5 consecutive failed attempts for 15 minutes.
    """

    @classmethod
    def _key(cls, identifier: str) -> str:
        clean = (identifier or '').strip().lower()
        return f"ablegod:lockout:{clean}"

    @classmethod
    def is_locked(cls, identifier: str) -> tuple[bool, int]:
        """
        Check if an account identifier is currently locked.
        Returns: (is_locked: bool, remaining_seconds: int)
        """
        key = cls._key(identifier)
        data = cache.get(key)
        if not data:
            return False, 0
        attempts = data.get('attempts', 0)
        lock_until = data.get('lock_until', 0)
        now = time.time()
        if attempts >= MAX_FAILED_ATTEMPTS and lock_until > now:
            return True, int(lock_until - now)
        return False, 0

    @classmethod
    def record_failure(cls, identifier: str) -> tuple[bool, int]:
        """
        Record a failed authentication attempt.
        Returns: (is_locked: bool, remaining_seconds: int)
        """
        key = cls._key(identifier)
        now = time.time()
        data = cache.get(key) or {'attempts': 0, 'first_attempt': now, 'lock_until': 0}
        
        # If previous window expired, reset attempts
        if now - data.get('first_attempt', now) > ATTEMPT_WINDOW_SECONDS and data.get('attempts', 0) < MAX_FAILED_ATTEMPTS:
            data = {'attempts': 0, 'first_attempt': now, 'lock_until': 0}

        data['attempts'] = data.get('attempts', 0) + 1
        
        if data['attempts'] >= MAX_FAILED_ATTEMPTS:
            data['lock_until'] = now + LOCKOUT_DURATION_SECONDS
            cache.set(key, data, LOCKOUT_DURATION_SECONDS)
            return True, LOCKOUT_DURATION_SECONDS
        
        cache.set(key, data, ATTEMPT_WINDOW_SECONDS)
        return False, 0

    @classmethod
    def reset(cls, identifier: str):
        """
        Reset failed attempt counters upon successful authentication.
        """
        key = cls._key(identifier)
        cache.delete(key)
