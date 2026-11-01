from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AttendanceAuditLogViewSet,
    AttendanceExcuseViewSet,
    AttendanceNotificationViewSet,
    AttendanceRecordViewSet,
    AttendanceReportSnapshotViewSet,
    AttendanceSettingsViewSet,
    AttendanceTermSummaryViewSet,
    SchoolCalendarDayViewSet,
)

router = DefaultRouter()
router.register(r'attendance', AttendanceRecordViewSet)
router.register(r'calendar', SchoolCalendarDayViewSet)
router.register(r'settings', AttendanceSettingsViewSet)
router.register(r'excuses', AttendanceExcuseViewSet)
router.register(r'notifications', AttendanceNotificationViewSet)
router.register(r'summaries', AttendanceTermSummaryViewSet)
router.register(r'report-snapshots', AttendanceReportSnapshotViewSet)
router.register(r'audit-log', AttendanceAuditLogViewSet)

urlpatterns = [path('', include(router.urls))]
