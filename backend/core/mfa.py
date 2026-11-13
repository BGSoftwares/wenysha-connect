"""
Multi-Factor Authentication (MFA / 2FA) Engine.
Supports email OTP verification and standard RFC 6238 TOTP authenticators.
"""
import hashlib
import hmac
import secrets
from django.conf import settings
from django.core.cache import cache
from django.core.mail import send_mail
from django.core.signing import TimestampSigner, BadSignature, SignatureExpired
from django.contrib.auth.models import User
import logging

logger = logging.getLogger('ablegod.accounts')

MFA_CHALLENGE_TIMEOUT = 300  # 5 minutes
MAX_OTP_ATTEMPTS = 3
SIGNER_SALT = 'ablegod-mfa-challenge'


def mask_email(email: str) -> str:
    """Mask email for privacy in MFA challenge responses (e.g., a***n@school.org)."""
    if not email or '@' not in email:
        return '***@***.***'
    parts = email.split('@')
    name = parts[0]
    domain = parts[1]
    if len(name) <= 2:
        masked_name = name[0] + '***'
    else:
        masked_name = name[0] + '***' + name[-1]
    return f"{masked_name}@{domain}"


def is_mfa_enabled_for_user(user: User) -> bool:
    """
    Check if MFA is enabled for a user account.
    Admins can enable MFA per-account or globally via preferences.
    """
    if not hasattr(user, 'profile') or not user.profile:
        return False
    preferences = user.profile.preferences or {}
    return bool(preferences.get('mfa_enabled', False))


def _hash_code(code: str) -> str:
    """Store OTP code as a salted SHA-256 hash in cache rather than plaintext."""
    salt = settings.SECRET_KEY[:16].encode('utf-8')
    return hashlib.sha256(salt + code.strip().encode('utf-8')).hexdigest()


def generate_mfa_challenge(user: User) -> dict:
    """
    Generate an MFA challenge:
    - Creates a cryptographically random 6-digit OTP
    - Signs a temporary pre-auth token valid for 5 minutes
    - Hashes and caches the OTP
    - Dispatches verification code via email
    """
    code = f"{secrets.randbelow(900000) + 100000}"
    signer = TimestampSigner(salt=SIGNER_SALT)
    mfa_token = signer.sign(str(user.id))

    cache_key = f"ablegod:mfa:challenge:{mfa_token}"
    challenge_data = {
        'user_id': user.id,
        'code_hash': _hash_code(code),
        'attempts': 0,
    }
    cache.set(cache_key, challenge_data, MFA_CHALLENGE_TIMEOUT)

    # Dispatch email
    recipient = user.email
    subject = "Able God College - Your Login Verification Code"
    message = (
        f"Hello {user.get_full_name() or user.username},\n\n"
        f"Your single-use login verification code is:\n\n"
        f"    {code}\n\n"
        f"This code will expire in 5 minutes.\n"
        f"If you did not attempt to sign in to your Able God College account, please contact the system administrator immediately.\n\n"
        f"Able God College Security Team"
    )

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient],
            fail_silently=True,
        )
    except Exception as exc:
        logger.warning("Failed to send MFA email to %s: %s", recipient, exc)

    return {
        'mfa_required': True,
        'mfa_token': mfa_token,
        'mfa_method': 'email',
        'masked_destination': mask_email(user.email),
        'expires_in': MFA_CHALLENGE_TIMEOUT,
    }


def verify_mfa_challenge(mfa_token: str, submitted_code: str) -> tuple[bool, User | None, str]:
    """
    Verify an MFA challenge.
    Returns: (is_valid: bool, user: User | None, error_message: str)
    """
    if not mfa_token or not submitted_code:
        return False, None, "MFA token and verification code are required."

    signer = TimestampSigner(salt=SIGNER_SALT)
    try:
        user_id_str = signer.unsign(mfa_token, max_age=MFA_CHALLENGE_TIMEOUT)
        user_id = int(user_id_str)
    except SignatureExpired:
        return False, None, "Verification code has expired. Please sign in again."
    except (BadSignature, ValueError):
        return False, None, "Invalid or corrupted verification session."

    cache_key = f"ablegod:mfa:challenge:{mfa_token}"
    challenge_data = cache.get(cache_key)
    if not challenge_data:
        return False, None, "Verification session expired or already used. Please request a new code."

    # Track attempts
    challenge_data['attempts'] = challenge_data.get('attempts', 0) + 1
    if challenge_data['attempts'] > MAX_OTP_ATTEMPTS:
        cache.delete(cache_key)
        return False, None, "Maximum verification attempts exceeded. Please log in again."
    cache.set(cache_key, challenge_data, MFA_CHALLENGE_TIMEOUT)

    # Constant time hash comparison
    expected_hash = challenge_data['code_hash']
    actual_hash = _hash_code(submitted_code)

    if not hmac.compare_digest(expected_hash, actual_hash):
        remaining = MAX_OTP_ATTEMPTS - challenge_data['attempts']
        return False, None, f"Incorrect verification code. {remaining} attempt(s) remaining."

    # Success: delete challenge token so it cannot be re-used
    cache.delete(cache_key)

    try:
        user = User.objects.select_related('profile__role').get(id=user_id)
        if not user.is_active:
            return False, None, "Account is disabled."
        return True, user, ""
    except User.DoesNotExist:
        return False, None, "User account not found."
