from django.db.models.signals import post_delete, post_save, pre_save
from django.dispatch import receiver

from .models import AttendanceRecord, AttendanceReportSnapshot
from .notifications import notify_parents_of_daily_attendance
from .services import refresh_student_term_summaries


@receiver(pre_save, sender=AttendanceRecord)
def capture_previous_attendance_term(sender, instance, **kwargs):
    if instance.pk:
        previous = sender.objects.filter(pk=instance.pk).values(
            'student_id',
            'term_id',
            'date',
            'status',
        ).first()
        instance._previous_attendance = previous
    else:
        instance._previous_attendance = None


def refresh_affected_report_snapshots(student_dates):
    from .services import refresh_report_attendance_snapshot

    snapshot_ids = set()
    for student_id, attendance_date in student_dates:
        if student_id is None or attendance_date is None:
            continue
        snapshot_ids.update(
            AttendanceReportSnapshot.objects.filter(
                student_id=student_id,
                through_date__gte=attendance_date,
                exam__results_published=True,
            ).values_list('pk', flat=True)
        )
    for snapshot in AttendanceReportSnapshot.objects.filter(pk__in=snapshot_ids).select_related(
        'exam',
        'student',
    ):
        refresh_report_attendance_snapshot(snapshot, force_summary=True)


@receiver(post_save, sender=AttendanceRecord)
def update_attendance_summary(sender, instance, **kwargs):
    created = kwargs.get('created', False)
    previous = getattr(instance, '_previous_attendance', None)
    if created or not previous or previous['status'] != instance.status:
        notify_parents_of_daily_attendance(instance)
    affected_summaries = [(instance.student_id, instance.term_id)]
    if previous:
        affected_summaries.append((previous['student_id'], previous['term_id']))
    for student_id in {student_id for student_id, _ in affected_summaries}:
        refresh_student_term_summaries(
            student_id,
            [term_id for summary_student_id, term_id in affected_summaries if summary_student_id == student_id],
        )
    previous_date = previous['date'] if previous else None
    previous_student_id = previous['student_id'] if previous else None
    refresh_affected_report_snapshots([
        (previous_student_id, previous_date),
        (instance.student_id, instance.date),
    ])


@receiver(post_delete, sender=AttendanceRecord)
def update_summary_after_attendance_delete(sender, instance, **kwargs):
    refresh_student_term_summaries(instance.student_id, [instance.term_id])
    refresh_affected_report_snapshots([(instance.student_id, instance.date)])
