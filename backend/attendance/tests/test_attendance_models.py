from django.test import TestCase
from school.models import AcademicYear, SchoolClass, Student, Term
from attendance.models import AttendanceNotification, AttendanceRecord, AttendanceReportSnapshot, SchoolCalendarDay
from attendance.services import (
    recalculate_student_term_summary,
    refresh_report_attendance_snapshot,
    school_days_in_term,
)
from datetime import date
from django.db import IntegrityError, transaction
from exams.models import Exam
from django.contrib.auth.models import User
from parents.models import Parent, StudentParent

class AttendanceModelTests(TestCase):
    def setUp(self):
        cls = SchoolClass.objects.create(name='Form 4C')
        self.student = Student.objects.create(student_id='ATT001', name='Attend Student', school_class=cls)

    def test_attendance_unique_per_day_and_defaults(self):
        today = date.today()
        a = AttendanceRecord.objects.create(student=self.student, date=today, status='present')
        self.assertEqual(a.status, 'present')
        afternoon = AttendanceRecord.objects.create(
            student=self.student,
            date=today,
            session='afternoon',
            status='present',
        )
        self.assertEqual(afternoon.session, 'afternoon')
        # A learner cannot be marked twice in the same session.
        with self.assertRaises(IntegrityError), transaction.atomic():
            AttendanceRecord.objects.create(student=self.student, date=today, status='absent')

    def test_partial_calendar_overrides_weekdays_without_under_counting(self):
        year = AcademicYear.objects.create(
            name='2026',
            start_date=date(2026, 10, 5),
            end_date=date(2026, 10, 9),
        )
        term = Term.objects.create(
            name='Term 3',
            academic_year=year,
            start_date=date(2026, 10, 5),
            end_date=date(2026, 10, 9),
        )
        SchoolCalendarDay.objects.create(date=date(2026, 10, 5), day_type='holiday')
        SchoolCalendarDay.objects.create(date=date(2026, 10, 7), day_type='school_day')

        self.assertEqual(school_days_in_term(term), 4)

    def test_2026_public_holiday_is_excluded_unless_admin_marks_it_school_day(self):
        year = AcademicYear.objects.create(
            name='2026',
            start_date=date(2026, 5, 25),
            end_date=date(2026, 5, 29),
        )
        term = Term.objects.create(
            name='Term 2',
            academic_year=year,
            start_date=date(2026, 5, 25),
            end_date=date(2026, 5, 29),
        )
        self.assertEqual(school_days_in_term(term), 4)

        SchoolCalendarDay.objects.create(date=date(2026, 5, 25), day_type='school_day')
        self.assertEqual(school_days_in_term(term), 5)

    def test_term_summary_counts_daily_status_once_and_excludes_holidays(self):
        year = AcademicYear.objects.create(
            name='2027',
            start_date=date(2027, 3, 1),
            end_date=date(2027, 3, 5),
        )
        term = Term.objects.create(
            name='Term 1',
            academic_year=year,
            start_date=date(2027, 3, 1),
            end_date=date(2027, 3, 5),
        )
        SchoolCalendarDay.objects.create(date=date(2027, 3, 1), day_type='holiday')
        AttendanceRecord.objects.create(student=self.student, term=term, date=date(2027, 3, 2), status='present')
        AttendanceRecord.objects.create(student=self.student, term=term, date=date(2027, 3, 3), status='absent')
        AttendanceRecord.objects.create(student=self.student, term=term, date=date(2027, 3, 4), status='excused')
        AttendanceRecord.objects.create(student=self.student, term=term, date=date(2027, 3, 5), status='late')

        summary = recalculate_student_term_summary(self.student.id, term.id)
        self.assertEqual(summary.total_school_days, 4)
        self.assertEqual(summary.days_present, 1)
        self.assertEqual(summary.days_absent, 1)
        self.assertEqual(summary.days_excused, 1)
        self.assertEqual(summary.days_late, 1)
        self.assertEqual(float(summary.attendance_percentage), 50)

    def test_published_report_attendance_snapshot_is_flagged_and_regenerated(self):
        year = AcademicYear.objects.create(
            name='2028',
            start_date=date(2028, 3, 1),
            end_date=date(2028, 3, 5),
        )
        term = Term.objects.create(
            name='Term 1',
            academic_year=year,
            start_date=date(2028, 3, 1),
            end_date=date(2028, 3, 5),
        )
        exam = Exam.objects.create(
            name='Term exam',
            term='Term 1',
            year='2028',
            start_date=term.start_date,
            end_date=term.end_date,
            status='completed',
            results_published=True,
        )
        exam.classes.add(self.student.school_class)
        record = AttendanceRecord.objects.create(
            student=self.student,
            school_class=self.student.school_class,
            term=term,
            date=date(2028, 3, 2),
            status='present',
        )
        snapshot = AttendanceReportSnapshot.objects.create(
            exam=exam,
            student=self.student,
            term=term,
            through_date=date(2028, 3, 5),
        )
        snapshot = refresh_report_attendance_snapshot(snapshot)
        self.assertEqual(snapshot.summary['days_present'], 1)
        self.assertFalse(snapshot.is_out_of_date)

        record.status = 'absent'
        record.save()
        snapshot.refresh_from_db()
        self.assertTrue(snapshot.is_out_of_date)

        snapshot = refresh_report_attendance_snapshot(snapshot, force_summary=True)
        self.assertFalse(snapshot.is_out_of_date)
        self.assertEqual(snapshot.summary['days_absent'], 1)

    def test_parent_gets_one_low_term_attendance_notification(self):
        year = AcademicYear.objects.create(
            name='2029',
            start_date=date(2029, 3, 5),
            end_date=date(2029, 3, 9),
        )
        term = Term.objects.create(
            name='Term 1',
            academic_year=year,
            start_date=date(2029, 3, 5),
            end_date=date(2029, 3, 9),
        )
        parent_user = User.objects.create_user(username='low-attendance-parent')
        parent = Parent.objects.create(user=parent_user, name='Low Attendance Parent')
        StudentParent.objects.create(student=self.student, parent=parent)
        record = AttendanceRecord.objects.create(
            student=self.student,
            term=term,
            date=term.start_date,
            status='present',
        )
        record.status = 'late'
        record.save()

        self.assertEqual(
            AttendanceNotification.objects.filter(
                recipient=parent_user,
                student=self.student,
                term=term,
                kind='low_attendance',
            ).count(),
            1,
        )
