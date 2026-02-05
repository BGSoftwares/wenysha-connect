from django.contrib import admin
from .models import Role, UserProfile, PendingApproval


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'full_name')
    list_filter = ('role',)
    search_fields = ('user__email', 'full_name')


@admin.register(PendingApproval)
class PendingApprovalAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'email', 'role', 'status', 'requested_at')
    list_filter = ('status', 'role')
    search_fields = ('full_name', 'email')
