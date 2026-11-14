import shutil
import tempfile

from django.contrib.auth.models import User
from django.core.files.base import ContentFile
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from attendance.models import AttendanceExcuse
from core.models import Role, UserProfile
from library.models import Book
from school.models import SchoolClass, Student, Teacher

MEDIA = tempfile.mkdtemp()


@override_settings(MEDIA_ROOT=MEDIA)
class PrivateFileAndPiiTests(TestCase):
    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(MEDIA, ignore_errors=True)

    def make_user(self, username, role_name, **profile):
        user = User.objects.create_user(username=username, email=f'{username}@example.com', password='x-Pass-12345')
        role, _ = Role.objects.get_or_create(name=role_name)
        UserProfile.objects.create(user=user, role=role, full_name=username, **profile)
        return user

    def setUp(self):
        self.admin = User.objects.create_superuser('boss', 'boss@example.com', 'x-Pass-12345')
        t_user = self.make_user('teacher1', 'Teacher')
        self.teacher = Teacher.objects.create(user=t_user, name='Mr Moyo', phone='0771234567')
        cls = SchoolClass.objects.create(name='4A', class_teacher=self.teacher)
        self.student = Student.objects.create(student_id='S1', name='Kid One', school_class=cls)
        self.student_user = self.make_user('kid', 'Student')
        self.stranger = self.make_user('stranger', 'Student')

    def test_teacher_phone_hidden_from_students_but_visible_to_admin(self):
        client = APIClient()
        client.force_authenticate(self.student_user)
        rows = client.get('/api/school/teachers/').data
        rows = rows['results'] if isinstance(rows, dict) else rows
        self.assertTrue(rows)
        for row in rows:
            for key in ('phone', 'employee_id', 'user'):
                self.assertNotIn(key, row)
        client.force_authenticate(self.admin)
        rows = client.get('/api/school/teachers/').data
        rows = rows['results'] if isinstance(rows, dict) else rows
        self.assertEqual(rows[0]['phone'], '0771234567')

    def test_book_file_requires_login_and_hides_media_path(self):
        book = Book.objects.create(title='Maths', author='A')
        book.digital_file.save('maths.pdf', ContentFile(b'%PDF-1.4 x'))
        client = APIClient()
        self.assertEqual(client.get(f'/api/library/books/{book.pk}/file/').status_code, 401)
        client.force_authenticate(self.student_user)
        self.assertEqual(client.get(f'/api/library/books/{book.pk}/file/').status_code, 200)
        listing = client.get('/api/library/books/').data
        listing = listing['results'] if isinstance(listing, dict) else listing
        self.assertEqual(listing[0]['digital_file_url'], f'/library/books/{book.pk}/file/')
        self.assertNotIn('/media/', listing[0]['digital_file_url'])

    def test_excuse_attachment_only_for_authorised_users(self):
        excuse = AttendanceExcuse.objects.create(student=self.student, date='2026-10-01', reason='sick')
        excuse.attachment.save('note.pdf', ContentFile(b'%PDF-1.4 x'))
        url = f'/api/attendance/excuses/{excuse.pk}/attachment/'
        client = APIClient()
        self.assertEqual(client.get(url).status_code, 401)
        client.force_authenticate(self.stranger)  # unrelated student
        self.assertEqual(client.get(url).status_code, 404)
        client.force_authenticate(self.student_user)
        self.student.user = self.student_user
        self.student.save()
        self.assertEqual(client.get(url).status_code, 200)
        client.force_authenticate(self.admin)
        self.assertEqual(client.get(url).status_code, 200)
