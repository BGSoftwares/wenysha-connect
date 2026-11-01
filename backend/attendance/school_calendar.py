from datetime import date
from django.utils import timezone

from .models import SchoolCalendarDay


ZIMBABWE_2026_TERMS = (
    (date(2026, 1, 13), date(2026, 4, 1)),
    (date(2026, 5, 12), date(2026, 8, 6)),
    (date(2026, 9, 8), date(2026, 12, 3)),
)

ZIMBABWE_2026_PUBLIC_HOLIDAYS = {
    date(2026, 1, 1): "New Year's Day",
    date(2026, 2, 21): "National Youth Day",
    date(2026, 4, 3): "Good Friday",
    date(2026, 4, 4): "Easter Saturday",
    date(2026, 4, 5): "Easter Sunday",
    date(2026, 4, 6): "Easter Monday",
    date(2026, 4, 18): "Independence Day",
    date(2026, 5, 1): "Workers' Day",
    date(2026, 5, 25): "Africa Day",
    date(2026, 8, 10): "Heroes Day",
    date(2026, 8, 11): "Defence Forces National Day",
    date(2026, 12, 22): "National Unity Day",
    date(2026, 12, 25): "Christmas Day",
    date(2026, 12, 26): "Boxing Day",
}


def attendance_date_error(attendance_date):
    """Return a validation message when an attendance date is not a school day."""
    if attendance_date > timezone.localdate():
        return "Attendance cannot be recorded for a future date."

    configured_day = SchoolCalendarDay.objects.filter(date=attendance_date).first()
    if configured_day:
        if configured_day.day_type != 'school_day':
            return configured_day.note or f"This date is marked as {configured_day.get_day_type_display().lower()}."
        return None

    if attendance_date.weekday() >= 5:
        return "Attendance cannot be recorded on weekends."

    if attendance_date.year != 2026:
        return None

    holiday_name = ZIMBABWE_2026_PUBLIC_HOLIDAYS.get(attendance_date)
    if holiday_name:
        return f"{holiday_name} is a public holiday; attendance cannot be recorded."

    if not any(start <= attendance_date <= end for start, end in ZIMBABWE_2026_TERMS):
        return "Attendance can only be recorded during a published Zimbabwe school session in 2026."

    return None
