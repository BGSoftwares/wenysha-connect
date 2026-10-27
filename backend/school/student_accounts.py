import re

from django.contrib.auth.models import User
from django.db import IntegrityError, transaction
from django.utils.crypto import get_random_string


def _username_base(first_name):
    base = re.sub(r'[^a-z0-9@.+_-]', '', (first_name or '').strip().casefold())
    return base or 'student'


@transaction.atomic
def create_student_portal_user(first_name, last_name='', full_name='', preferences=None):
    """Create one hashed, first-login-only student credential pair."""
    from core.models import Role, UserProfile

    base = _username_base(first_name)
    role, _ = Role.objects.get_or_create(
        name='Student', defaults={'description': 'Student portal access'}
    )
    # Serialize student account reservations so concurrent enrollments get
    # deterministic name suffixes instead of racing on the same base username.
    Role.objects.select_for_update().get(pk=role.pk)
    for suffix in range(1, 10000):
        username = base if suffix == 1 else f'{base}{suffix}'
        if User.objects.filter(username__iexact=username).exists():
            continue
        temporary_password = get_random_string(16)
        try:
            with transaction.atomic():
                user = User.objects.create_user(
                    username=username,
                    first_name=first_name.strip(),
                    last_name=last_name.strip(),
                    password=temporary_password,
                )
                profile_preferences = dict(preferences or {})
                profile_preferences['must_change_password'] = True
                UserProfile.objects.create(
                    user=user,
                    role=role,
                    full_name=(full_name or f'{first_name} {last_name}').strip(),
                    preferences=profile_preferences,
                )
            return user, temporary_password
        except IntegrityError:
            # Another enrollment may have reserved the same username between
            # the availability check and insert. Retry with the next suffix.
            continue
    raise ValueError('Could not reserve a unique student username.')
