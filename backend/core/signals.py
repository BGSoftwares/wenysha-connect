from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import UserProfile, Role
from .caching import invalidate_user_cache


@receiver(post_save, sender=UserProfile)
@receiver(post_delete, sender=UserProfile)
def on_user_profile_change(sender, instance, **kwargs):
    if instance and instance.user_id:
        invalidate_user_cache(instance.user_id)


@receiver(post_save, sender=User)
@receiver(post_delete, sender=User)
def on_user_change(sender, instance, **kwargs):
    if instance and instance.id:
        invalidate_user_cache(instance.id)


@receiver(post_save, sender=Role)
@receiver(post_delete, sender=Role)
def on_role_change(sender, instance, **kwargs):
    # When role permissions change, invalidate profiles associated with this role
    if instance and instance.id:
        for profile in UserProfile.objects.filter(role=instance).only('user_id'):
            invalidate_user_cache(profile.user_id)
