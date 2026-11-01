from django.contrib import admin
from .models import (
    AttendanceAuditLog,
    AttendanceExcuse,
    AttendanceNotification,
    AttendanceRecord,
    AttendanceSettings,
    AttendanceTermSummary,
    SchoolCalendarDay,
)


@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display = ('student', 'school_class', 'date', 'session', 'status', 'marked_by')
    list_filter = ('date', 'session', 'status', 'term')
    search_fields = ('student__name', 'student__student_id', 'school_class__name')


@admin.register(SchoolCalendarDay)
class SchoolCalendarDayAdmin(admin.ModelAdmin):
    list_display = ('date', 'day_type', 'term', 'note', 'updated_by')
    list_filter = ('day_type', 'term')
    search_fields = ('note',)


@admin.register(AttendanceSettings)
class AttendanceSettingsAdmin(admin.ModelAdmin):
    list_display = ('edit_cutoff_hours', 'at_risk_percentage', 'consecutive_absence_threshold')


@admin.register(AttendanceExcuse)
class AttendanceExcuseAdmin(admin.ModelAdmin):
    list_display = ('student', 'date', 'reason', 'status', 'submitted_by', 'reviewed_by')
    list_filter = ('status', 'reason', 'date')
    search_fields = ('student__name', 'note', 'review_note')


@admin.register(AttendanceNotification)
class AttendanceNotificationAdmin(admin.ModelAdmin):
    list_display = ('created_at', 'recipient', 'student', 'kind', 'read_at')
    list_filter = ('kind', 'created_at', 'read_at')
    search_fields = ('student__name', 'recipient__username', 'message')
    readonly_fields = ('recipient', 'student', 'attendance_record', 'term', 'kind', 'message', 'created_at')


@admin.register(AttendanceTermSummary)
class AttendanceTermSummaryAdmin(admin.ModelAdmin):
    list_display = ('student', 'term', 'attendance_percentage', 'is_finalized')
    list_filter = ('term', 'is_finalized')
    search_fields = ('student__name', 'student__student_id')


@admin.register(AttendanceAuditLog)
class AttendanceAuditLogAdmin(admin.ModelAdmin):
    list_display = ('created_at', 'student', 'actor', 'action', 'reason')
    list_filter = ('action', 'created_at')
    search_fields = ('student__name', 'actor__username', 'reason')
    readonly_fields = ('attendance_record', 'student', 'actor', 'action', 'old_value', 'new_value', 'reason', 'created_at')
