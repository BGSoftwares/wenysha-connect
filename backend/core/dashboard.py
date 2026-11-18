"""Real numbers for the dashboard charts and events list, limited to what each role may see."""
from collections import defaultdict
from datetime import date

from django.db.models import Avg, Count, ExpressionWrapper, F, FloatField
from django.db.models.functions import TruncMonth
from django.utils import timezone
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from attendance.models import AttendanceRecord, SchoolCalendarDay
from exams.models import Exam, ExamMark
from .permissions import IsPortalAdmin
from .roles import portal_role, teacher_class_ids
from .scopes import teacher_marks_filter

ATTENDED = ('present', 'late')
MONTHS_SHOWN = 7
SUBJECTS_SHOWN = 8
EVENTS_SHOWN = 8


def _month_starts(today: date, count: int):
    year, month = today.year, today.month
    starts = []
    for _ in range(count):
        starts.append(date(year, month, 1))
        month -= 1
        if month == 0:
            month, year = 12, year - 1
    return list(reversed(starts))


def attendance_trend(today: date, records):
    starts = _month_starts(today, MONTHS_SHOWN)
    totals, attended = defaultdict(int), defaultdict(int)
    rows = (
        records.filter(date__gte=starts[0], date__lte=today)
        .annotate(month=TruncMonth('date'))
        .values('month', 'status')
        .annotate(n=Count('id'))
    )
    for row in rows:
        key = row['month'].date() if hasattr(row['month'], 'date') else row['month']
        totals[key] += row['n']
        if row['status'] in ATTENDED:
            attended[key] += row['n']
    return [
        {
            'month': start.strftime('%b'),
            'rate': round(attended[start] * 100 / totals[start], 1) if totals[start] else None,
        }
        for start in starts
    ]


def marks_by_subject(marks):
    rows = (
        marks.filter(total_marks__gt=0, absent=False)
        .values('subject__name')
        .annotate(avg=Avg(ExpressionWrapper(F('scored') * 100.0 / F('total_marks'), output_field=FloatField())))
        .order_by('-avg')[:SUBJECTS_SHOWN]
    )
    return [{'subject': r['subject__name'], 'average': round(r['avg'], 1)} for r in rows]


def upcoming_events(today: date):
    events = []
    for exam in Exam.objects.filter(end_date__gte=today).order_by('start_date')[:EVENTS_SHOWN]:
        events.append({'date': exam.start_date.isoformat(), 'title': exam.name, 'kind': 'exam'})
    for day in SchoolCalendarDay.objects.filter(date__gte=today).exclude(day_type='school_day').order_by('date')[:EVENTS_SHOWN]:
        events.append({'date': day.date.isoformat(), 'title': day.note or day.get_day_type_display(), 'kind': day.day_type})
    events.sort(key=lambda e: e['date'])
    return events[:EVENTS_SHOWN]


def academic_scope(user):
    """Return (attendance records, marks) this user may see, or None for roles with no academic data.

    Students and parents only ever see marks from exams whose results have been published.
    """
    from school.models import Student, Teacher

    role = portal_role(user)
    if role == 'admin':
        return AttendanceRecord.objects.all(), ExamMark.objects.all()
    if role == 'teacher':
        teacher = Teacher.objects.filter(user=user).first()
        class_ids = teacher_class_ids(user)
        marks_filter = teacher_marks_filter(teacher) if teacher else None
        marks = ExamMark.objects.filter(marks_filter) if marks_filter is not None else ExamMark.objects.none()
        return AttendanceRecord.objects.filter(student__school_class_id__in=class_ids), marks
    if role in ('student', 'parent'):
        students = (
            Student.objects.filter(user=user) if role == 'student'
            else Student.objects.filter(parents_link__parent__user=user)
        )
        ids = list(students.values_list('id', flat=True))
        return (
            AttendanceRecord.objects.filter(student_id__in=ids),
            ExamMark.objects.filter(student_id__in=ids, exam__results_published=True),
        )
    return None


def build_summary(user):
    today = timezone.localdate()
    scope = academic_scope(user)
    if scope is None:
        trend, subjects = [], []
    else:
        records, marks = scope
        trend, subjects = attendance_trend(today, records), marks_by_subject(marks)
    return {'attendance_trend': trend, 'marks_by_subject': subjects, 'events': upcoming_events(today)}


class DashboardSummaryView(APIView):
    """School-wide numbers for the admin dashboard."""
    permission_classes = [IsPortalAdmin]

    def get(self, request):
        return Response(build_summary(request.user))


class DashboardMineView(APIView):
    """The same charts for the signed-in user, limited to the records their role may see."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(build_summary(request.user))
