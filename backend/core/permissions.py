from rest_framework import permissions

from .roles import is_admin, portal_role


class IsPortalAdmin(permissions.BasePermission):
    """Allow Django staff and users assigned the Admin portal role."""

    message = 'Administrator access is required.'

    def has_permission(self, request, view):
        return is_admin(request.user)


class IsAdminOrReadOnly(permissions.BasePermission):
    """Allow public reads while reserving changes for administrators."""

    def has_permission(self, request, view):
        return request.method in permissions.SAFE_METHODS or is_admin(request.user)


class IsAuthenticatedAdminOrReadOnly(permissions.BasePermission):
    """Allow signed-in users to read and administrators to change records."""

    def has_permission(self, request, view):
        return bool(
            request.user.is_authenticated
            and (request.method in permissions.SAFE_METHODS or is_admin(request.user))
        )


class IsFinanceStaffOrReadOnly(permissions.BasePermission):
    """Allow signed-in users to read and Accounts/Admin roles to write."""

    message = 'Only Accounts or Admin can change finance records.'

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user.is_authenticated
            and (
                request.method in permissions.SAFE_METHODS
                or portal_role(user) in {'admin', 'accounts'}
            )
        )
