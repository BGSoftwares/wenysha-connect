from django.contrib.auth.models import User
from django.core.management.base import BaseCommand, CommandError

from core.mfa import disable_mfa
from core.tokens import revoke_user_tokens


class Command(BaseCommand):
    help = "Turn off two-step verification for an account (lost phone and no backup codes) and sign it out everywhere."

    def add_arguments(self, parser):
        parser.add_argument('username_or_email')

    def handle(self, *args, **options):
        identifier = options['username_or_email'].strip()
        user = (
            User.objects.filter(username__iexact=identifier).first()
            or User.objects.filter(email__iexact=identifier).first()
        )
        if not user:
            raise CommandError(f"No account matches '{identifier}'.")
        disable_mfa(user)
        revoked = revoke_user_tokens(user)
        self.stdout.write(self.style.SUCCESS(
            f"Two-step verification reset for {user.username}; {revoked} session(s) signed out. "
            "If their role requires MFA they must set it up again at next sign-in."
        ))
