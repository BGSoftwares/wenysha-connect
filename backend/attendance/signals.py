from django.db.models.signals import post_delete, post_save, pre_save
from django.dispatch import receiver

from .models import AttendanceRecord, AttendanceReportSnapshot
from .notifications import notify_parents_of_daily_attendance
from .services import refresh_student_term_summaries


@receiver(pre_save, sender=AttendanceRecord)
def capture_previous_attendance_term(sender, instance, **kwargs):
    if instance.pk:
        instance._previous_term_id = sender.objects.filter(pk=instance.pk).values_list('term_id', flat=True).first()
        instance._previous_status = sender.objects.filter(pk=instance.pk).values_list('status', flat=True).first()
    else:
        instance._previous_term_id = None
        instance._previous_status = None


@receiver(post_save, sender=AttendanceRecord)
def update_attendance_summary(sender, instance, **kwargs):
    created = kwargs.get('created', False)
    if created or getattr(instance, '_previous_status', None) != instance.status:
        notify_parents_of_daily_attendance(instance)
    refresh_student_term_summaries(
        instance.student_id,
        [getattr(instance, '_previous_term_id', None), instance.term_id],
    )
    AttendanceReportSnapshot.objects.filter(
        student_id=instance.student_id,
        through_date__gte=instance.date,
        exam__results_published=True,
    ).update(is_out_of_date=True)


@receiver(post_delete, sender=AttendanceRecord)
def update_summary_after_attendance_delete(sender, instance, **kwargs):
    refresh_student_term_summaries(instance.student_id, [instance.term_id])
    AttendanceReportSnapshot.objects.filter(
        student_id=instance.student_id,
        through_date__gte=instance.date,
        exam__results_published=True,
    ).update(is_out_of_date=True)
