from rest_framework import permissions


class IsAdminOrReadOwnOnly(permissions.BasePermission):
    """Allow full access to admin/staff. Non-admins can read their own student resource only."""

    def has_permission(self, request, view):
        # Allow authenticated users to access detail endpoints; list/create restricted to admin
        if request.user and request.user.is_authenticated:
            # If it's a list action or creating, require admin/staff
            if getattr(view, 'action', None) in ('list', 'create', 'destroy'):
                return request.user.is_staff or request.user.is_superuser
            return True
        return False

    def has_object_permission(self, request, view, obj):
        # Admins can do anything
        if request.user.is_staff or request.user.is_superuser:
            return True
        # For non-admins, allow safe methods only if the object's related user matches
        if request.method in permissions.SAFE_METHODS:
            try:
                # obj is a Student model instance with a OneToOne user relation
                return getattr(obj, 'user', None) == request.user
            except Exception:
                return False
        return False
