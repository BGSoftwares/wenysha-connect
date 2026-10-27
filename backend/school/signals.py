from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Student


@receiver(post_save, sender=Student)
def create_portal_for_new_student(sender, instance, created, **kwargs):
    """Ensure every newly-created student without a linked login gets one."""
    if not created or instance.user_id:
        return

    from .student_accounts import create_student_portal_user

    parts = instance.name.strip().split(maxsplit=1)
    first_name = parts[0] if parts else 'Student'
    last_name = parts[1] if len(parts) > 1 else ''
    user, temporary_password = create_student_portal_user(
        first_name=first_name,
        last_name=last_name,
        full_name=instance.name,
    )
    instance.user = user
    instance._portal_temporary_password = temporary_password
    instance.save(update_fields=['user'])
