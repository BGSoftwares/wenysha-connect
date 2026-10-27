from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient

from core.models import Role, UserProfile
from parents.models import StudentParent
from school.models import SchoolClass, Student, Teacher


class StudentEnrollmentTests(TestCase):
    def setUp(self):
        teacher_role = Role.objects.get(name='Class Teacher')
        self.teacher_user = User.objects.create_user(username='class-teacher', password='teacher-pass-123')
        UserProfile.objects.create(user=self.teacher_user, role=teacher_role, full_name='A Teacher')
        self.teacher = Teacher.objects.create(user=self.teacher_user, name='A Teacher')
        self.school_class = SchoolClass.objects.create(name='Enrollment Form 1', class_teacher=self.teacher)
        self.client = APIClient()
        self.client.force_authenticate(user=self.teacher_user)

    def payload(self, **overrides):
        data = {
            'name': 'Learner One',
            'school_class': self.school_class.pk,
            'stream': 'A',
            'gender': 'Female',
            'status': 'Active',
            'next_of_kin_details': {
                'name': 'Guardian One',
                'relationship': 'Mother',
                'phone': '+263771234567',
                'email': 'guardian@example.com',
                'address': 'Masvingo',
            },
        }
        data.update(overrides)
        return data

    def test_class_teacher_enrollment_creates_student_portal_and_next_of_kin_atomically(self):
        response = self.client.post('/api/school/students/', self.payload(), format='json')

        self.assertEqual(response.status_code, 201, response.data)
        student = Student.objects.get(pk=response.data['id'])
        self.assertEqual(student.student_id, 'AbleGodStudent00001')
        self.assertEqual(student.user.profile.preferences.get('student_stream'), 'A')
        self.assertEqual(response.data['stream'], 'A', response.data)
        self.assertEqual(student.user.username, 'learner')
        self.assertEqual(student.user.profile.role.name, 'Student')
        self.assertTrue(student.user.check_password(response.data['portal_credentials']['temporary_password']))
        credentials = response.data['portal_credentials']
        self.assertEqual(credentials['username'], 'learner')
        self.assertGreaterEqual(len(credentials['temporary_password']), 16)
        self.assertNotEqual(credentials['temporary_password'], 'learner123')
        self.assertNotEqual(student.user.password, credentials['temporary_password'])
        self.assertTrue(student.user.profile.preferences['must_change_password'])

        link = StudentParent.objects.select_related('parent').get(student=student)
        self.assertEqual(link.relationship, 'Mother')
        self.assertEqual(link.parent.name, 'Guardian One')
        self.assertEqual(link.parent.phone, '+263771234567')

        login = self.client.post('/api/auth/login/', {
            'email': 'learner',
            'password': response.data['portal_credentials']['temporary_password'],
        }, format='json')
        self.assertEqual(login.status_code, 200, login.data)
        self.assertEqual(login.data['user']['role'], 'Student')
        self.assertTrue(login.data['user']['must_change_password'])

    def test_student_signal_creates_one_unique_portal_account_for_direct_record_creation(self):
        first = Student.objects.create(name='Tendai Moyo', school_class=self.school_class)
        second = Student.objects.create(name='Tendai Ncube', school_class=self.school_class)

        self.assertEqual(first.user.username, 'tendai')
        self.assertEqual(second.user.username, 'tendai2')
        self.assertTrue(first.user.check_password(first._portal_temporary_password))
        self.assertTrue(second.user.check_password(second._portal_temporary_password))
        self.assertNotEqual(first._portal_temporary_password, 'tendai123')
        self.assertNotEqual(second._portal_temporary_password, 'tendai2123')
        self.assertTrue(first.user.profile.preferences['must_change_password'])
        self.assertEqual(User.objects.filter(username__startswith='tendai').count(), 2)

    def test_teacher_cannot_enroll_without_next_of_kin(self):
        response = self.client.post('/api/school/students/', {
            'name': 'Learner Two',
            'school_class': self.school_class.pk,
        }, format='json')

        self.assertEqual(response.status_code, 400)
        self.assertFalse(Student.objects.filter(name='Learner Two').exists())
        self.assertFalse(User.objects.filter(username__startswith='AbleGodStudent').exists())

    def test_student_profile_preferences_and_password_updates_persist(self):
        response = self.client.post('/api/school/students/', self.payload(), format='json')
        self.assertEqual(response.status_code, 201, response.data)
        student = Student.objects.get(pk=response.data['id'])
        self.client.force_authenticate(user=student.user)

        profile_response = self.client.patch('/api/auth/me/', {
            'username': student.student_id,
            'full_name': 'Learner Updated',
            'email': '',
            'address': 'Updated address',
            'preferences': {
                'notifications': {'announcements': False},
                'appearance': {'dark_mode': True},
            },
        }, format='json')
        self.assertEqual(profile_response.status_code, 200, profile_response.data)
        student.refresh_from_db()
        student.user.profile.refresh_from_db()
        self.assertEqual(student.name, 'Learner Updated')
        self.assertEqual(student.address, 'Updated address')
        self.assertEqual(student.user.profile.preferences['appearance']['dark_mode'], True)

        password_response = self.client.post('/api/auth/change-password/', {
            'current_password': response.data['portal_credentials']['temporary_password'],
            'new_password': 'learner-new-pass-123',
        }, format='json')
        self.assertEqual(password_response.status_code, 200, password_response.data)
        student.user.refresh_from_db()
        self.assertTrue(student.user.check_password('learner-new-pass-123'))

    def test_student_and_staff_ids_use_requested_sequential_formats(self):
        first = self.client.post('/api/school/students/', self.payload(), format='json')
        second = self.client.post('/api/school/students/', self.payload(name='Learner Two'), format='json')

        self.assertEqual(first.status_code, 201, first.data)
        self.assertEqual(second.status_code, 201, second.data)
        self.assertEqual(first.data['student_id'], 'AbleGodStudent00001')
        self.assertEqual(second.data['student_id'], 'AbleGodStudent00002')
        self.assertEqual(self.teacher.employee_id, 'AbleGodStaff001')
