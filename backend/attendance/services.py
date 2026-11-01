from collections import defaultdict
from datetime import timedelta

from django.utils import timezone

from school.models import Student, Term
from .models import (
    AttendanceRecord,
    AttendanceReportSnapshot,
    AttendanceTermSummary,
    SchoolCalendarDay,
)
from .school_calendar import ZIMBABWE_2026_PUBLIC_HOLIDAYS


def school_days_between(start_date, end_date):
    configured = {
        entry.date: entry.day_type
        for entry in SchoolCalendarDay.objects.filter(
            date__gte=start_date,
            date__lte=end_date,
        )
    }
    count = 0
    current = start_date
    while current <= end_date:
        day_type = configured.get(current)
        is_public_holiday = current.year == 2026 and current in ZIMBABWE_2026_PUBLIC_HOLIDAYS
        if day_type == 'school_day' or (
            day_type is None and current.weekday() < 5 and not is_public_holiday
        ):
            count += 1
        current += timedelta(days=1)
    return count


def school_days_in_term(term):
    return school_days_between(term.start_date, term.end_date)


def recalculate_student_term_summary(student_id, term_id, force=False):
    term = Term.objects.get(pk=term_id)
    records = AttendanceRecord.objects.filter(
        student_id=student_id,
        term_id=term_id,
        date__gte=term.start_date,
        date__lte=term.end_date,
    ).values('date', 'status')
    by_day = defaultdict(set)
    for record in records:
        by_day[record['date']].add(record['status'])

    counts = {
        'days_present': 0,
        'days_absent': 0,
        'days_late': 0,
        'days_excused': 0,
        'days_sick_bay': 0,
        'days_suspended': 0,
    }
    for statuses in by_day.values():
        if 'present' in statuses:
            counts['days_present'] += 1
        elif 'late' in statuses:
            counts['days_late'] += 1
        elif 'excused' in statuses:
            counts['days_excused'] += 1
        elif 'sick_bay' in statuses:
            counts['days_sick_bay'] += 1
        elif 'suspended' in statuses:
            counts['days_suspended'] += 1
        else:
            counts['days_absent'] += 1

    total_school_days = school_days_in_term(term)
    attended = counts['days_present'] + counts['days_late']
    percentage = (attended / total_school_days * 100) if total_school_days else 0
    summary, _ = AttendanceTermSummary.objects.get_or_create(student_id=student_id, term_id=term_id)
    if summary.is_finalized and not force:
        if not summary.is_out_of_date:
            summary.is_out_of_date = True
            summary.save(update_fields=['is_out_of_date', 'calculated_at'])
        return summary
    for field, value in counts.items():
        setattr(summary, field, value)
    summary.total_school_days = total_school_days
    summary.attendance_percentage = round(percentage, 2)
    summary.is_out_of_date = False
    summary.save()
    from .notifications import notify_parents_of_low_attendance
    notify_parents_of_low_attendance(summary)
    return summary


def refresh_student_term_summaries(student_id, term_ids):
    for term_id in set(filter(None, term_ids)):
        recalculate_student_term_summary(student_id, term_id)


def attendance_counts_for_term(term, student_id):
    summary = AttendanceTermSummary.objects.filter(student_id=student_id, term=term).first()
    if summary:
        return summary
    return recalculate_student_term_summary(student_id, term.pk)


def term_for_exam(exam):
    term = Term.objects.filter(
        name__iexact=exam.term,
        academic_year__name=exam.year,
    ).first()
    if term:
        return term
    return Term.objects.filter(
        start_date__lte=exam.end_date,
        end_date__gte=exam.start_date,
    ).first()


def build_report_attendance(exam, student, through_date, force_summary=False):
    term = term_for_exam(exam)
    if term:
        summary = recalculate_student_term_summary(student.pk, term.pk, force=force_summary)
        start_date, end_date = term.start_date, min(term.end_date, through_date)
    else:
        summary = None
        start_date, end_date = exam.start_date, min(exam.end_date, through_date)

    daily_statuses = defaultdict(set)
    rows = AttendanceRecord.objects.filter(
        student=student,
        date__gte=start_date,
        date__lte=end_date,
    ).values_list('date', 'status')
    for attendance_date, status_value in rows:
        daily_statuses[attendance_date].add(status_value)

    counts = {
        'days_present': 0,
        'days_absent': 0,
        'days_late': 0,
        'days_excused': 0,
        'days_sick_bay': 0,
        'days_suspended': 0,
    }
    absent_dates = []
    for attendance_date, statuses in daily_statuses.items():
        if 'present' in statuses:
            counts['days_present'] += 1
        elif 'late' in statuses:
            counts['days_late'] += 1
        elif 'excused' in statuses:
            counts['days_excused'] += 1
        elif 'sick_bay' in statuses:
            counts['days_sick_bay'] += 1
        elif 'suspended' in statuses:
            counts['days_suspended'] += 1
        else:
            counts['days_absent'] += 1
            absent_dates.append(attendance_date.isoformat())

    planned_days = school_days_in_term(term) if term else 0
    if term and end_date < term.end_date:
        planned_days = school_days_between(term.start_date, end_date)
    marked_days = len(daily_statuses)
    attended_days = counts['days_present'] + counts['days_late']
    percentage = round(attended_days / planned_days * 100, 2) if planned_days else 0
    return {
        'term_summary_id': summary.pk if summary else None,
        'total_school_days': planned_days,
        'marked_days': marked_days,
        **counts,
        'attendance_percentage': percentage,
        'absent_dates': sorted(absent_dates),
        'through_date': end_date.isoformat(),
        'is_finalized': bool(summary and summary.is_finalized),
        'is_out_of_date': bool(summary and summary.is_out_of_date),
    }, term


def refresh_report_attendance_snapshot(snapshot, force_summary=False):
    summary, term = build_report_attendance(
        snapshot.exam,
        snapshot.student,
        snapshot.through_date,
        force_summary=force_summary,
    )
    snapshot.summary = summary
    snapshot.term = term
    snapshot.is_out_of_date = False
    snapshot.save(update_fields=['summary', 'term', 'is_out_of_date', 'generated_at'])
    return snapshot


def create_report_attendance_snapshots(exam, through_date=None):
    through_date = through_date or timezone.localdate()
    if through_date > exam.end_date:
        through_date = exam.end_date
    students = Student.objects.filter(school_class__exams=exam).distinct()
    for student in students.iterator():
        snapshot, _ = AttendanceReportSnapshot.objects.get_or_create(
            exam=exam,
            student=student,
            defaults={'through_date': through_date},
        )
        snapshot.through_date = through_date
        refresh_report_attendance_snapshot(snapshot)
