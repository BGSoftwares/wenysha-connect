import logging

from django.conf import settings
from django.db import transaction
from django.utils import timezone
from django.utils.module_loading import import_string

from parents.models import StudentParent

from .models import AttendanceNotification, AttendanceSettings


logger = logging.getLogger(__name__)


def _parent_user_ids(student_id):
    return list(
        StudentParent.objects.filter(student_id=student_id, parent__user__isnull=False)
        .values_list('parent__user_id', flat=True)
    )


def _schedule_provider_delivery(notification_id):
    provider_path = getattr(settings, 'ATTENDANCE_NOTIFICATION_PROVIDER', '')
    if not provider_path:
        return

    def deliver():
        try:
            provider = import_string(provider_path)
            notification = AttendanceNotification.objects.select_related('student', 'term').get(pk=notification_id)
            provider({
                'kind': notification.kind,
                'message': notification.message,
                'student_id': notification.student_id,
                'term_id': notification.term_id,
                'created_at': notification.created_at.isoformat(),
            })
        except Exception:
            logger.exception('Attendance notification provider failed for notification %s.', notification_id)

    transaction.on_commit(deliver)


def notify_parents_of_daily_attendance(record):
    if record.date != timezone.localdate() or record.status not in {'absent', 'late'}:
        return
    title = 'absent' if record.status == 'absent' else 'marked late'
    for user_id in _parent_user_ids(record.student_id):
        notification, created = AttendanceNotification.objects.get_or_create(
            recipient_id=user_id,
            student_id=record.student_id,
            attendance_record=record,
            kind=record.status,
            defaults={'term_id': record.term_id, 'message': f'{record.student.name} was {title} on {record.date}.'},
        )
        if created:
            _schedule_provider_delivery(notification.pk)


def notify_parents_of_low_attendance(summary):
    policy = AttendanceSettings.objects.order_by('pk').first()
    threshold = policy.at_risk_percentage if policy else 85
    if summary.attendance_percentage >= threshold:
        return
    message = (
        f'{summary.student.name} has {summary.attendance_percentage}% attendance '
        f'for {summary.term.name} {summary.term.academic_year.name}, below the {threshold}% school threshold.'
    )
    for user_id in _parent_user_ids(summary.student_id):
        notification, created = AttendanceNotification.objects.get_or_create(
            recipient_id=user_id,
            student_id=summary.student_id,
            term_id=summary.term_id,
            kind='low_attendance',
            defaults={'message': message},
        )
        if created:
            _schedule_provider_delivery(notification.pk)
