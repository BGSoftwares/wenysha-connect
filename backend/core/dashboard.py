"""Real numbers for the admin dashboard charts and events list."""
from collections import defaultdict
from datetime import date

from django.db.models import Avg, Count, ExpressionWrapper, F, FloatField
from django.db.models.functions import TruncMonth
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView

from attendance.models import AttendanceRecord, SchoolCalendarDay
from exams.models import Exam, ExamMark
from .permissions import IsPortalAdmin

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


def attendance_trend(today: date):
    starts = _month_starts(today, MONTHS_SHOWN)
    totals, attended = defaultdict(int), defaultdict(int)
    rows = (
        AttendanceRecord.objects.filter(date__gte=starts[0], date__lte=today)
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


def marks_by_subject():
    rows = (
        ExamMark.objects.filter(total_marks__gt=0)
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


class DashboardSummaryView(APIView):
    permission_classes = [IsPortalAdmin]

    def get(self, request):
        today = timezone.localdate()
        return Response({
            'attendance_trend': attendance_trend(today),
            'marks_by_subject': marks_by_subject(),
            'events': upcoming_events(today),
        })
