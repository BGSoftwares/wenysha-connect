from django.contrib.auth.models import User


def sync_linked_portal_records(user: User, full_name=None, email=None):
    """Keep an account's linked portal record names and contact email aligned."""
    from .models import UserProfile
    from parents.models import Parent
    from school.models import Student, Teacher

    update_fields = []
    if full_name is not None:
        full_name = full_name.strip()
        profile, _ = UserProfile.objects.get_or_create(user=user)
        if profile.full_name != full_name:
            profile.full_name = full_name
            profile.save(update_fields=['full_name'])
        parts = full_name.split(maxsplit=1)
        user.first_name = parts[0] if parts else ''
        user.last_name = parts[1] if len(parts) > 1 else ''
        update_fields.extend(['first_name', 'last_name'])
        Student.objects.filter(user=user).update(name=full_name)
        Teacher.objects.filter(user=user).update(name=full_name)
        Parent.objects.filter(user=user).update(name=full_name)

    if email is not None:
        Parent.objects.filter(user=user).update(email=email)

    if update_fields:
        user.save(update_fields=list(dict.fromkeys(update_fields)))

    # A newly created teacher account must be attached to a teacher record so
    # the teacher portal can resolve its classes and subject allocations.
    role_name = ''
    try:
        role_name = (user.profile.role.name or '').strip().casefold()
    except UserProfile.DoesNotExist:
        pass

    if role_name == 'teacher' and not Teacher.objects.filter(user=user).exists():
        name = full_name or user.get_full_name() or user.username
        teacher = Teacher.objects.filter(user__isnull=True, name__iexact=name).first()
        if teacher:
            teacher.user = user
            teacher.save()
        else:
            Teacher.objects.create(user=user, name=name)

    if role_name in {'parent', 'guardian'} and not Parent.objects.filter(user=user).exists():
        name = full_name or user.get_full_name() or user.username
        parent = Parent.objects.filter(user__isnull=True, email__iexact=email or user.email).first()
        if not parent:
            parent = Parent.objects.filter(user__isnull=True, name__iexact=name).first()
        if parent:
            parent.user = user
            if email:
                parent.email = email
            parent.save(update_fields=['user', 'email'])
        else:
            Parent.objects.create(user=user, name=name, email=email or user.email)
