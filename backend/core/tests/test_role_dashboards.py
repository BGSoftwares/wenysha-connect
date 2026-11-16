from datetime import date

from django.contrib.auth.models import User
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from attendance.models import AttendanceRecord
from core.models import Role, UserProfile
from exams.models import Exam, ExamMark
from parents.models import Parent, StudentParent
from school.models import SchoolClass, Student, Subject, Teacher, TeacherSubjectClass

URL = '/api/auth/dashboard/mine/'


def make_user(name, role_name):
    user = User.objects.create_user(username=name, email=f'{name}@local', password='Str0ng-Pass-9')
    UserProfile.objects.create(user=user, role=Role.objects.get(name=role_name), full_name=name)
    return user


class RoleDashboardTests(TestCase):
    def setUp(self):
        today = timezone.localdate()
        self.class_a = SchoolClass.objects.create(name='RD A')
        self.class_b = SchoolClass.objects.create(name='RD B')
        self.maths = Subject.objects.create(name='Maths')
        self.science = Subject.objects.create(name='Science')

        self.student_user = make_user('rdstudent', 'Student')
        self.mine = Student.objects.create(student_id='RD1', name='Mine', school_class=self.class_a, user=self.student_user)
        self.sibling = Student.objects.create(student_id='RD2', name='Sibling', school_class=self.class_b)
        self.stranger = Student.objects.create(student_id='RD3', name='Stranger', school_class=self.class_b)

        self.published = Exam.objects.create(name='Published', term='1', year='2026', start_date=today, end_date=today, results_published=True)
        self.draft = Exam.objects.create(name='Draft', term='1', year='2026', start_date=today, end_date=today, results_published=False)

        ExamMark.objects.create(exam=self.published, student=self.mine, subject=self.maths, total_marks=100, scored=80)
        ExamMark.objects.create(exam=self.draft, student=self.mine, subject=self.science, total_marks=100, scored=10)
        ExamMark.objects.create(exam=self.published, student=self.sibling, subject=self.maths, total_marks=100, scored=60)
        ExamMark.objects.create(exam=self.published, student=self.stranger, subject=self.maths, total_marks=100, scored=20)
        AttendanceRecord.objects.create(student=self.mine, date=today, session='morning', status='present')
        AttendanceRecord.objects.create(student=self.sibling, date=today, session='morning', status='absent')
        AttendanceRecord.objects.create(student=self.stranger, date=today, session='morning', status='absent')

        self.client = APIClient()

    def get(self, user):
        self.client.force_authenticate(user)
        response = self.client.get(URL)
        self.assertEqual(response.status_code, 200)
        return response.json()

    def test_requires_sign_in(self):
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get(URL).status_code, 401)

    def test_student_sees_only_own_published_results_and_attendance(self):
        body = self.get(self.student_user)
        self.assertEqual(body['marks_by_subject'], [{'subject': 'Maths', 'average': 80.0}])  # draft Science mark hidden
        self.assertEqual(body['attendance_trend'][-1]['rate'], 100.0)

    def test_parent_sees_only_their_children(self):
        parent_user = make_user('rdparent', 'Parent')
        parent = Parent.objects.create(user=parent_user, name='Parent')
        StudentParent.objects.create(student=self.mine, parent=parent)
        StudentParent.objects.create(student=self.sibling, parent=parent)
        body = self.get(parent_user)
        self.assertEqual(body['marks_by_subject'], [{'subject': 'Maths', 'average': 70.0}])  # (80 + 60) / 2, no stranger
        self.assertEqual(body['attendance_trend'][-1]['rate'], 50.0)

    def test_teacher_sees_only_their_allocation(self):
        teacher_user = make_user('rdteacher', 'Teacher')
        teacher = Teacher.objects.create(user=teacher_user, name='Teacher')
        TeacherSubjectClass.objects.create(teacher=teacher, subject=self.maths, school_class=self.class_a, periods=3)
        body = self.get(teacher_user)
        self.assertEqual(body['marks_by_subject'], [{'subject': 'Maths', 'average': 80.0}])  # draft exams count for teachers; class B not theirs
        # attendance: class A only (mine present)
        self.assertEqual(body['attendance_trend'][-1]['rate'], 100.0)

    def test_roles_without_academic_data_get_empty_charts(self):
        body = self.get(make_user('rdaccounts', 'Accounts'))
        self.assertEqual(body['marks_by_subject'], [])
        self.assertTrue(all(p['rate'] is None for p in body['attendance_trend']) or body['attendance_trend'] == [])
