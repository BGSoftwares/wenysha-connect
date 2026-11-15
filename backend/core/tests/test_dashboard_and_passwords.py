from datetime import timedelta
from io import StringIO

from django.contrib.auth.models import User
from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from attendance.models import AttendanceRecord, SchoolCalendarDay
from core.models import Role, UserProfile
from exams.models import Exam, ExamMark
from school.models import SchoolClass, Student, Subject

URL = '/api/auth/dashboard/summary/'


class DashboardSummaryTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(username='dashadmin', email='dashadmin@local', password='Str0ng-Pass-9')
        self.teacher = User.objects.create_user(username='dashteacher', email='dt@local', password='Str0ng-Pass-9')
        UserProfile.objects.create(user=self.teacher, role=Role.objects.get(name='Class Teacher'))
        klass = SchoolClass.objects.create(name='Dash Class')
        self.student = Student.objects.create(student_id='DS001', name='Dash Student', school_class=klass)
        self.client = APIClient()

    def test_requires_admin(self):
        self.assertEqual(self.client.get(URL).status_code, 401)
        self.client.force_authenticate(self.teacher)
        self.assertEqual(self.client.get(URL).status_code, 403)

    def test_empty_school_returns_empty_but_valid_data(self):
        self.client.force_authenticate(self.admin)
        body = self.client.get(URL).json()
        self.assertEqual(len(body['attendance_trend']), 7)
        self.assertTrue(all(point['rate'] is None for point in body['attendance_trend']))
        self.assertEqual(body['marks_by_subject'], [])
        self.assertEqual(body['events'], [])

    def test_attendance_rate_counts_present_and_late_as_attended(self):
        today = timezone.localdate()
        for status in ('present', 'late', 'absent', 'excused'):
            AttendanceRecord.objects.create(student=self.student, date=today, session=status[:3], status=status)
        self.client.force_authenticate(self.admin)
        current = self.client.get(URL).json()['attendance_trend'][-1]
        self.assertEqual(current['month'], today.strftime('%b'))
        self.assertEqual(current['rate'], 50.0)

    def test_marks_are_averaged_as_percentages_per_subject(self):
        today = timezone.localdate()
        exam = Exam.objects.create(name='Test', term='1', year='2026', start_date=today, end_date=today)
        maths, english = Subject.objects.create(name='Maths'), Subject.objects.create(name='English')
        ExamMark.objects.create(exam=exam, student=self.student, subject=maths, total_marks=50, scored=40)
        ExamMark.objects.create(exam=exam, student=self.student, subject=english, total_marks=100, scored=60)
        self.client.force_authenticate(self.admin)
        rows = self.client.get(URL).json()['marks_by_subject']
        self.assertEqual([(r['subject'], r['average']) for r in rows], [('Maths', 80.0), ('English', 60.0)])

    def test_events_list_future_exams_and_closures_only(self):
        today = timezone.localdate()
        Exam.objects.create(name='Old exam', term='1', year='2026', start_date=today - timedelta(days=9), end_date=today - timedelta(days=8))
        Exam.objects.create(name='Mid-term', term='2', year='2026', start_date=today + timedelta(days=3), end_date=today + timedelta(days=5))
        SchoolCalendarDay.objects.create(date=today + timedelta(days=1), day_type='holiday', note='Heroes Day')
        SchoolCalendarDay.objects.create(date=today + timedelta(days=2), day_type='school_day')
        self.client.force_authenticate(self.admin)
        events = self.client.get(URL).json()['events']
        self.assertEqual([e['title'] for e in events], ['Heroes Day', 'Mid-term'])


class RotateDefaultPasswordsTests(TestCase):
    def run_command(self, *args):
        out = StringIO()
        call_command('rotate_default_passwords', *args, stdout=out)
        return out.getvalue()

    def test_rotates_only_accounts_with_known_default_passwords(self):
        weak = User.objects.create_user(username='parent01', email='p@local', password='parent123')
        UserProfile.objects.create(user=weak, role=Role.objects.get(name='Class Teacher'))
        strong = User.objects.create_user(username='careful', email='c@local', password='Zq7-unusual-Passphrase')
        output = self.run_command()
        weak.refresh_from_db(); strong.refresh_from_db()
        new_password = [line.split('\t')[1] for line in output.splitlines() if line.startswith('parent01\t')][0]
        self.assertTrue(weak.check_password(new_password))
        self.assertFalse(weak.check_password('parent123'))
        self.assertTrue(strong.check_password('Zq7-unusual-Passphrase'))
        self.assertTrue(weak.profile.preferences['must_change_password'])

    def test_dry_run_changes_nothing(self):
        user = User.objects.create_user(username='admin', email='a@local', password='adminpass')
        output = self.run_command('--dry-run')
        user.refresh_from_db()
        self.assertIn('WOULD ROTATE  admin', output)
        self.assertTrue(user.check_password('adminpass'))

    def test_password_equal_to_username_is_treated_as_default(self):
        user = User.objects.create_user(username='sipho', email='s@local', password='sipho123')
        self.run_command()
        user.refresh_from_db()
        self.assertFalse(user.check_password('sipho123'))
