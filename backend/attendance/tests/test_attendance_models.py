from django.test import TestCase
from school.models import SchoolClass, Student
from attendance.models import AttendanceRecord
from datetime import date
from django.db import IntegrityError

class AttendanceModelTests(TestCase):
    def setUp(self):
        cls = SchoolClass.objects.create(name='Form 4C')
        self.student = Student.objects.create(student_id='ATT001', name='Attend Student', school_class=cls)

    def test_attendance_unique_per_day_and_defaults(self):
        today = date.today()
        a = AttendanceRecord.objects.create(student=self.student, date=today, status='present')
        self.assertEqual(a.status, 'present')
        # Attempt duplicate
        with self.assertRaises(Exception):
            AttendanceRecord.objects.create(student=self.student, date=today, status='absent')
