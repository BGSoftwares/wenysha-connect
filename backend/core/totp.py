"""
RFC 6238 time-based one-time passwords (Google Authenticator, Microsoft
Authenticator, Authy, 1Password, ...), using only the standard library, plus
encryption-at-rest for the stored shared secret.
"""
import base64
import hashlib
import hmac
import secrets
import struct
import time
from urllib.parse import quote

from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings
from django.core.cache import cache

TOTP_DIGITS = 6
TOTP_PERIOD = 30
TOTP_WINDOW = 1  # accept the previous and next 30s step to tolerate clock drift
ISSUER = 'Able God College'


def generate_secret() -> str:
    """160-bit random secret, base32 encoded without padding."""
    return base64.b32encode(secrets.token_bytes(20)).decode('ascii').rstrip('=')


def _hotp(secret: str, counter: int) -> str:
    key = base64.b32decode(secret + '=' * (-len(secret) % 8), casefold=True)
    digest = hmac.new(key, struct.pack('>Q', counter), hashlib.sha1).digest()
    offset = digest[-1] & 0x0F
    value = struct.unpack('>I', digest[offset:offset + 4])[0] & 0x7FFFFFFF
    return f"{value % (10 ** TOTP_DIGITS):0{TOTP_DIGITS}d}"


def totp_now(secret: str, for_time: float | None = None) -> str:
    counter = int((time.time() if for_time is None else for_time) // TOTP_PERIOD)
    return _hotp(secret, counter)


def verify_totp(secret: str, code: str, user_id: int, for_time: float | None = None) -> bool:
    """
    Check a submitted code. Each accepted 30-second step can be used once per
    user, so a code that was observed (shoulder-surfing, proxy logs) cannot be
    replayed.
    """
    submitted = ''.join(ch for ch in str(code or '') if ch.isdigit())
    if len(submitted) != TOTP_DIGITS:
        return False

    counter = int((time.time() if for_time is None else for_time) // TOTP_PERIOD)
    matched_step = None
    for step in range(counter - TOTP_WINDOW, counter + TOTP_WINDOW + 1):
        if hmac.compare_digest(_hotp(secret, step), submitted):
            matched_step = step
    if matched_step is None:
        return False

    replay_ttl = TOTP_PERIOD * (2 * TOTP_WINDOW + 2)
    return cache.add(f"ablegod:totp:used:{user_id}:{matched_step}", 1, replay_ttl)


def provisioning_uri(secret: str, account: str, issuer: str = ISSUER) -> str:
    label = quote(f"{issuer}:{account}")
    return (
        f"otpauth://totp/{label}?secret={secret}&issuer={quote(issuer)}"
        f"&algorithm=SHA1&digits={TOTP_DIGITS}&period={TOTP_PERIOD}"
    )


def _fernet() -> Fernet:
    material = getattr(settings, 'MFA_ENCRYPTION_KEY', '') or settings.SECRET_KEY
    key = base64.urlsafe_b64encode(hashlib.sha256(f"ablegod-totp:{material}".encode('utf-8')).digest())
    return Fernet(key)


def encrypt_secret(secret: str) -> str:
    """Secrets are stored encrypted so a database leak alone does not expose them."""
    return _fernet().encrypt(secret.encode('utf-8')).decode('ascii')


def decrypt_secret(token: str) -> str | None:
    try:
        return _fernet().decrypt(token.encode('ascii')).decode('utf-8')
    except (InvalidToken, ValueError, AttributeError):
        return None
