"""Shared helpers for the portal's role based access rules."""

from core.models import UserProfile


def portal_role(user):
    if not getattr(user, "is_authenticated", False):
        return ""
    if user.is_superuser or user.is_staff:
        return "admin"
    try:
        role = user.profile.role
    except (AttributeError, UserProfile.DoesNotExist):
        return ""
    normalized = role.name.strip().lower() if role else ""
    if normalized in {"accountant", "accounts officer", "finance", "finance officer"}:
        return "accounts"
    return normalized


def is_admin(user):
    return portal_role(user) == "admin"


def teacher_class_ids(user):
    """Return classes a teacher can communicate with or upload for."""
    from school.models import SchoolClass, Teacher

    teacher = Teacher.objects.filter(user=user).first()
    if not teacher:
        return set()
    allocated_ids = teacher.allocations.values_list("school_class_id", flat=True)
    class_teacher_ids = SchoolClass.objects.filter(class_teacher=teacher).values_list("id", flat=True)
    return set(allocated_ids).union(class_teacher_ids)


def display_name(user):
    try:
        full_name = user.profile.full_name
    except (AttributeError, UserProfile.DoesNotExist):
        full_name = ""
    if full_name:
        return full_name
    return user.get_full_name() or user.get_username()
