"""
Multi-factor authentication.

Two second factors are supported:
  * "totp"  - authenticator app (RFC 6238). Preferred: works offline, no email needed.
  * "email" - one-time code mailed to the account's address.

State lives in UserProfile.preferences (no schema change):
  mfa_enabled, mfa_method, totp_secret (encrypted), totp_pending_secret (encrypted).
"""
import hashlib
import hmac
import logging
import secrets

from django.conf import settings
from django.contrib.auth.models import User
from django.core.cache import cache
from django.core.mail import send_mail
from django.core.signing import BadSignature, SignatureExpired, TimestampSigner
from django.db import transaction

from . import totp
from .models import UserProfile
from .throttling import AccountLockoutManager

logger = logging.getLogger('ablegod.accounts')

MFA_CHALLENGE_TIMEOUT = 300  # 5 minutes
MAX_OTP_ATTEMPTS = 3
RESEND_COOLDOWN_SECONDS = 60
SIGNER_SALT = 'ablegod-mfa-challenge'

BACKUP_CODE_COUNT = 8
BACKUP_CODE_LENGTH = 10  # letters/digits, shown as xxxxx-xxxxx
_BACKUP_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'  # no look-alikes (0/o, 1/l/i)


def mask_email(email: str) -> str:
    """a***n@school.org"""
    if not email or '@' not in email:
        return '***@***.***'
    name, domain = email.split('@', 1)
    masked = (name[0] + '***') if len(name) <= 2 else (name[0] + '***' + name[-1])
    return f"{masked}@{domain}"


# --- account state -----------------------------------------------------------

def _profile(user: User):
    try:
        return user.profile
    except UserProfile.DoesNotExist:
        return None


def _prefs(user: User) -> dict:
    profile = _profile(user)
    return dict(profile.preferences or {}) if profile else {}


def is_mfa_enabled_for_user(user: User) -> bool:
    return bool(_prefs(user).get('mfa_enabled', False))


def get_mfa_method(user: User) -> str:
    prefs = _prefs(user)
    return 'totp' if prefs.get('mfa_method') == 'totp' and prefs.get('totp_secret') else 'email'


def _save_prefs(user: User, prefs: dict) -> None:
    # Write through the same profile instance we read from so the in-memory user
    # never goes stale relative to the database.
    profile = _profile(user) or UserProfile.objects.create(user=user)
    profile.preferences = prefs
    profile.save(update_fields=['preferences'])  # post_save signal clears cached state


def enable_email_mfa(user: User) -> None:
    prefs = _prefs(user)
    prefs.update(mfa_enabled=True, mfa_method='email')
    _save_prefs(user, prefs)


def disable_mfa(user: User) -> None:
    prefs = _prefs(user)
    for key in ('mfa_enabled', 'mfa_method', 'totp_secret', 'totp_pending_secret', 'backup_codes'):
        prefs.pop(key, None)
    _save_prefs(user, prefs)


def begin_totp_enrollment(user: User) -> dict:
    """Create a pending secret. MFA is NOT active until the user proves they can generate a code."""
    secret = totp.generate_secret()
    prefs = _prefs(user)
    prefs['totp_pending_secret'] = totp.encrypt_secret(secret)
    _save_prefs(user, prefs)
    account = user.email or user.username
    return {'secret': secret, 'otpauth_uri': totp.provisioning_uri(secret, account), 'issuer': totp.ISSUER, 'account': account}


def confirm_totp_enrollment(user: User, code: str) -> bool:
    prefs = _prefs(user)
    pending = prefs.get('totp_pending_secret')
    secret = totp.decrypt_secret(pending) if pending else None
    if not secret or not totp.verify_totp(secret, code, user.id):
        return False
    prefs.pop('totp_pending_secret', None)
    prefs.update(totp_secret=pending, mfa_method='totp', mfa_enabled=True)
    _save_prefs(user, prefs)
    return True


# --- backup codes ------------------------------------------------------------
# One-time recovery codes for a lost phone. Only keyed hashes are stored, so a
# database leak does not reveal usable codes; the plain codes are shown once.

def _normalize_backup_code(code: str) -> str:
    return ''.join(ch for ch in str(code or '').lower() if ch.isalnum())


def looks_like_backup_code(code: str) -> bool:
    return len(_normalize_backup_code(code)) == BACKUP_CODE_LENGTH


def _hash_backup_code(user_id: int, normalized: str) -> str:
    return hmac.new(settings.SECRET_KEY.encode('utf-8'), f"backup:{user_id}:{normalized}".encode('utf-8'), hashlib.sha256).hexdigest()


def generate_backup_codes(user: User) -> list[str]:
    """Replace all existing backup codes with a fresh set and return them (display once)."""
    raw = [''.join(secrets.choice(_BACKUP_ALPHABET) for _ in range(BACKUP_CODE_LENGTH)) for _ in range(BACKUP_CODE_COUNT)]
    prefs = _prefs(user)
    prefs['backup_codes'] = [_hash_backup_code(user.id, c) for c in raw]
    _save_prefs(user, prefs)
    return [f"{c[:5]}-{c[5:]}" for c in raw]


def backup_codes_remaining(user: User) -> int:
    return len(_prefs(user).get('backup_codes', []))


def consume_backup_code(user: User, submitted: str) -> bool:
    """Use up one backup code. The row lock stops two simultaneous logins spending the same code."""
    normalized = _normalize_backup_code(submitted)
    if len(normalized) != BACKUP_CODE_LENGTH:
        return False
    candidate = _hash_backup_code(user.id, normalized)
    with transaction.atomic():
        try:
            profile = UserProfile.objects.select_for_update().get(user=user)
        except UserProfile.DoesNotExist:
            return False
        prefs = dict(profile.preferences or {})
        remaining = list(prefs.get('backup_codes', []))
        matched = None
        for stored in remaining:  # compare against every code, no early exit
            if hmac.compare_digest(stored, candidate):
                matched = stored
        if matched is None:
            return False
        remaining.remove(matched)
        prefs['backup_codes'] = remaining
        profile.preferences = prefs
        profile.save(update_fields=['preferences'])
    logger.warning("Backup code used to sign in for user id %s (%d left)", user.id, len(remaining))
    return True


# --- login challenges --------------------------------------------------------

def _hash_code(user_id: int, code: str) -> str:
    return hmac.new(settings.SECRET_KEY.encode('utf-8'), f"{user_id}:{code.strip()}".encode('utf-8'), hashlib.sha256).hexdigest()


def _challenge_key(mfa_token: str) -> str:
    return f"ablegod:mfa:challenge:{hashlib.sha256(mfa_token.encode('utf-8')).hexdigest()}"


def parse_mfa_token(mfa_token: str) -> int:
    """Return the user id inside a signed MFA token; raises BadSignature/SignatureExpired/ValueError."""
    raw = TimestampSigner(salt=SIGNER_SALT).unsign(mfa_token, max_age=MFA_CHALLENGE_TIMEOUT)
    return int(raw.split(':', 1)[0])


def generate_mfa_challenge(user: User) -> dict:
    """
    Start the second step of login. Returns a short-lived signed token the client
    must send back together with the code. The password has already been verified.
    """
    method = get_mfa_method(user)
    mfa_token = TimestampSigner(salt=SIGNER_SALT).sign(f"{user.id}:{secrets.token_urlsafe(8)}")
    data = {'user_id': user.id, 'method': method, 'attempts': 0}

    if method == 'email':
        code = f"{secrets.randbelow(900000) + 100000}"
        data['code_hash'] = _hash_code(user.id, code)
        try:
            send_mail(
                subject="Able God College - Your Login Verification Code",
                message=(
                    f"Hello {user.get_full_name() or user.username},\n\n"
                    f"Your single-use login verification code is:\n\n    {code}\n\n"
                    "This code expires in 5 minutes.\n"
                    "If you did not try to sign in, contact the system administrator immediately.\n\n"
                    "Able God College Security Team"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
        except Exception:
            logger.exception("Could not send MFA email for user id %s", user.id)

    cache.set(_challenge_key(mfa_token), data, MFA_CHALLENGE_TIMEOUT)
    return {
        'mfa_required': True,
        'mfa_token': mfa_token,
        'mfa_method': method,
        'masked_destination': mask_email(user.email) if method == 'email' else None,
        'expires_in': MFA_CHALLENGE_TIMEOUT,
    }


def verify_mfa_challenge(mfa_token: str, submitted_code: str) -> tuple[bool, User | None, str]:
    """Returns (is_valid, user, error_message)."""
    if not mfa_token or not submitted_code:
        return False, None, "MFA token and verification code are required."

    try:
        user_id = parse_mfa_token(mfa_token)
    except SignatureExpired:
        return False, None, "Verification code has expired. Please sign in again."
    except (BadSignature, ValueError):
        return False, None, "Invalid or corrupted verification session."

    # Account-level guard: bounds guessing even if an attacker keeps restarting
    # the login with a stolen password to get fresh challenges.
    mfa_identity = f"mfa:{user_id}"
    locked, _ = AccountLockoutManager.is_locked(mfa_identity)
    if locked:
        return False, None, "Too many failed verification attempts. Please try again later."

    key = _challenge_key(mfa_token)
    challenge = cache.get(key)
    if not challenge:
        return False, None, "Verification session expired or already used. Please sign in again."

    challenge['attempts'] = challenge.get('attempts', 0) + 1
    if challenge['attempts'] > MAX_OTP_ATTEMPTS:
        cache.delete(key)
        return False, None, "Maximum verification attempts exceeded. Please sign in again."
    cache.set(key, challenge, MFA_CHALLENGE_TIMEOUT)

    try:
        user = User.objects.select_related('profile__role').get(id=user_id)
    except User.DoesNotExist:
        return False, None, "User account not found."
    if not user.is_active:
        return False, None, "Account is disabled."

    if looks_like_backup_code(submitted_code):
        ok = consume_backup_code(user, submitted_code)
    elif challenge.get('method') == 'totp':
        encrypted = _prefs(user).get('totp_secret')
        secret = totp.decrypt_secret(encrypted) if encrypted else None
        ok = bool(secret) and totp.verify_totp(secret, submitted_code, user.id)
    else:
        ok = hmac.compare_digest(challenge.get('code_hash', ''), _hash_code(user.id, submitted_code))

    if not ok:
        AccountLockoutManager.record_failure(mfa_identity)
        remaining = max(0, MAX_OTP_ATTEMPTS - challenge['attempts'])
        return False, None, f"Incorrect verification code. {remaining} attempt(s) remaining."

    # Single use. delete() reports whether *this* request removed the challenge, so two
    # simultaneous submissions of the same code cannot both succeed.
    if not cache.delete(key):
        return False, None, "Verification session expired or already used. Please sign in again."
    AccountLockoutManager.reset(mfa_identity)
    return True, user, ""
