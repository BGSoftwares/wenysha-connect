import secrets

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand

from core.models import UserProfile
from core.tokens import revoke_user_tokens

# Passwords shipped in seed_users.py, the docs and the test fixtures. Any account still
# using one of these can be signed into by anyone who has read the repository.
KNOWN_DEFAULTS = (
    'adminpass', 'admin', 'admin123', 'password', 'teacher123', 'student123',
    'parent123', 'accounts123', 'testpass', 'testadmin', 'parent01',
)
ALPHABET = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'


def new_password(length: int = 16) -> str:
    return ''.join(secrets.choice(ALPHABET) for _ in range(length))


class Command(BaseCommand):
    help = (
        "Find accounts that still use a known default password, give each a new random one, "
        "force a password change at next sign-in and sign them out everywhere. "
        "Use --dry-run to only list them."
    )

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true', help='List affected accounts without changing anything.')

    def handle(self, *args, **options):
        dry = options['dry_run']
        affected = []
        for user in User.objects.filter(is_active=True).iterator():
            if not user.has_usable_password():
                continue
            candidates = set(KNOWN_DEFAULTS) | {user.username, f'{user.username}123', f'{user.username}pass'}
            if any(user.check_password(c) for c in candidates):
                affected.append(user)

        if not affected:
            self.stdout.write(self.style.SUCCESS('No account uses a known default password.'))
            return

        for user in affected:
            if dry:
                self.stdout.write(f'WOULD ROTATE  {user.username}')
                continue
            password = new_password()
            user.set_password(password)
            user.save(update_fields=['password'])
            profile = UserProfile.objects.filter(user=user).first()
            if profile is not None:
                profile.preferences = {**(profile.preferences or {}), 'must_change_password': True}
                profile.save(update_fields=['preferences'])
            revoke_user_tokens(user)
            self.stdout.write(f'{user.username}\t{password}')

        if dry:
            self.stdout.write(self.style.WARNING(f'{len(affected)} account(s) use a default password. Re-run without --dry-run to rotate.'))
        else:
            self.stdout.write(self.style.WARNING(
                f'{len(affected)} account(s) rotated. The passwords above are shown once: hand them over privately. '
                'Each person must choose a new password at next sign-in.'
            ))
