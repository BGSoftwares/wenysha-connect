from decimal import Decimal

from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient

from core.models import Role, UserProfile
from finance.models import Invoice
from parents.models import Parent, StudentParent
from school.models import SchoolClass, Student, Subject, Teacher, TeacherSubjectClass


class AdminPortalAccountCreationTests(TestCase):
    def setUp(self):
        admin_role, _ = Role.objects.get_or_create(name='Admin')
        self.admin = User.objects.create_user(
            username='portal-admin', email='portal-admin@example.com', password='admin-password-123'
        )
        UserProfile.objects.create(user=self.admin, role=admin_role, full_name='Portal Administrator')
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)
        self.school_class = SchoolClass.objects.create(name='Form 4 Sciences')
        self.subject = Subject.objects.create(name='Mathematics', department='Sciences')

    def create_student_account(self, first_name='Tendai', last_name='Moyo', guardian_email=''):
        student_role, _ = Role.objects.get_or_create(name='Student')
        return self.client.post('/api/auth/accounts/', {
            'first_name': first_name,
            'last_name': last_name,
            'email': '',
            'role': student_role.pk,
            'student_class': self.school_class.pk,
            'stream': 'A',
            'guardian_name': 'Guardian Moyo',
            'guardian_relationship': 'Mother',
            'guardian_phone': '+263771234567',
            'guardian_email': guardian_email,
        }, format='json')

    def test_admin_teacher_and_student_accounts_create_linked_portals(self):
        admin_role, _ = Role.objects.get_or_create(name='Admin')
        admin_response = self.client.post('/api/auth/accounts/', {
            'username': 'new-admin', 'email': 'new-admin@example.com', 'first_name': 'Rudo',
            'last_name': 'Admin', 'role': admin_role.pk, 'password': 'admin-password-123',
            'access_level': 'Full access', 'is_active': True,
        }, format='json')
        self.assertEqual(admin_response.status_code, 201, admin_response.data)
        admin_account = User.objects.get(username='new-admin')
        self.assertEqual(admin_account.profile.role, admin_role)
        self.assertEqual(admin_account.profile.preferences['access_level'], 'Full access')
        admin_login = self.client.post('/api/auth/login/', {
            'email': 'new-admin', 'password': 'admin-password-123',
        }, format='json')
        self.assertEqual(admin_login.status_code, 200, admin_login.data)
        self.assertEqual(admin_login.data['user']['role'], 'Admin')

        teacher_role, _ = Role.objects.get_or_create(name='Teacher')
        existing_teacher = Teacher.objects.create(name='Tariro Teacher')
        TeacherSubjectClass.objects.create(
            teacher=existing_teacher, subject=self.subject, school_class=self.school_class,
        )
        teacher_response = self.client.post('/api/auth/accounts/', {
            'username': 'new-teacher', 'email': 'new-teacher@example.com', 'first_name': 'Tariro',
            'last_name': 'Teacher', 'role': teacher_role.pk, 'password': 'teacher-password-123',
            'department': 'Sciences', 'phone': '+263771234568',
            'teaching_allocations': [{'subject': self.subject.pk, 'school_class': self.school_class.pk}],
        }, format='json')
        self.assertEqual(teacher_response.status_code, 201, teacher_response.data)
        teacher_user = User.objects.get(username='new-teacher')
        teacher = Teacher.objects.get(user=teacher_user)
        self.assertEqual(teacher.pk, existing_teacher.pk)
        self.assertEqual(Teacher.objects.filter(name__iexact='Tariro Teacher').count(), 1)
        self.assertEqual(TeacherSubjectClass.objects.filter(teacher=teacher, subject=self.subject, school_class=self.school_class).count(), 1)
        self.assertTrue(teacher_user.check_password('teacher-password-123'))
        self.assertTrue(TeacherSubjectClass.objects.filter(
            teacher=teacher, subject=self.subject, school_class=self.school_class
        ).exists())
        teacher_login = self.client.post('/api/auth/login/', {
            'email': 'new-teacher', 'password': 'teacher-password-123',
        }, format='json')
        self.assertEqual(teacher_login.status_code, 200, teacher_login.data)
        self.assertEqual(teacher_login.data['user']['role'], 'Teacher')
        self.client.force_authenticate(user=teacher_user)
        self.assertEqual(self.client.get('/api/auth/accounts/').status_code, 403)
        self.client.force_authenticate(user=self.admin)

        student_response = self.create_student_account()
        self.assertEqual(student_response.status_code, 201, student_response.data)
        student = Student.objects.get(user__username='tendai')
        temporary_password = student_response.data['portal_credentials']['temporary_password']
        self.assertGreaterEqual(len(temporary_password), 16)
        self.assertNotEqual(temporary_password, 'tendai123')
        self.assertTrue(student.user.check_password(temporary_password))
        self.assertNotEqual(student.user.password, temporary_password)
        self.assertTrue(student.user.profile.preferences['must_change_password'])
        self.assertEqual(student.user.profile.role.name, 'Student')
        self.assertEqual(student.user.profile.preferences['student_stream'], 'A')
        self.assertTrue(StudentParent.objects.filter(student=student, parent__phone='+263771234567').exists())

        login = self.client.post('/api/auth/login/', {
            'email': 'tendai', 'password': temporary_password,
        }, format='json')
        self.assertEqual(login.status_code, 200, login.data)
        self.assertTrue(login.data['user']['must_change_password'])
        self.client.force_authenticate(user=None)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")
        own_student_read = self.client.get('/api/school/students/')
        self.assertEqual(own_student_read.status_code, 403)
        changed = self.client.post('/api/auth/change-password/', {
            'new_password': 'tendai-new-safe-password',
            'confirm_password': 'tendai-new-safe-password',
        }, format='json')
        self.assertEqual(changed.status_code, 200, changed.data)
        student.user.refresh_from_db()
        student.user.profile.refresh_from_db()
        self.assertFalse(student.user.profile.preferences.get('must_change_password', False))
        own_student_read = self.client.get('/api/school/students/')
        self.assertEqual(own_student_read.status_code, 200, own_student_read.data)
        self.assertEqual(len(own_student_read.data['results']), 1)

    def test_same_first_name_gets_unique_username_and_credentials_only_at_creation(self):
        first = self.create_student_account()
        second = self.create_student_account()
        self.assertEqual(first.status_code, 201, first.data)
        self.assertEqual(second.status_code, 201, second.data)
        first_student = Student.objects.get(user__username='tendai')
        second_student = Student.objects.get(user__username='tendai2')
        first_credentials = first.data['portal_credentials']
        second_credentials = second.data['portal_credentials']
        self.assertEqual(first_credentials['username'], 'tendai')
        self.assertEqual(second_credentials['username'], 'tendai2')
        self.assertNotEqual(first_credentials['temporary_password'], second_credentials['temporary_password'])
        self.assertNotEqual(second_credentials['temporary_password'], 'tendai2123')
        self.assertTrue(second_student.user.check_password(second_credentials['temporary_password']))

        update = self.client.patch(f'/api/auth/accounts/{first_student.user_id}/', {
            'first_name': 'Tendai', 'last_name': 'Updated', 'full_name': 'Tendai Updated',
            'role': first.data['role'], 'is_active': True,
        }, format='json')
        self.assertEqual(update.status_code, 200, update.data)
        self.assertEqual(Student.objects.filter(user__username__startswith='tendai').count(), 2)

    def test_accounts_and_parent_roles_create_working_portals_and_reuse_guardian_record(self):
        parent_role, _ = Role.objects.get_or_create(name='Parent')
        parent_response = self.client.post('/api/auth/accounts/', {
            'username': 'guardian-moyo', 'email': 'guardian@example.com', 'first_name': 'Guardian',
            'last_name': 'Moyo', 'role': parent_role.pk, 'password': 'guardian-safe-password-123',
            'phone': '+263771234567',
        }, format='json')
        self.assertEqual(parent_response.status_code, 201, parent_response.data)
        parent_user = User.objects.get(username='guardian-moyo')
        parent = Parent.objects.get(user=parent_user)
        self.assertEqual(parent.phone, '+263771234567')
        parent_login = self.client.post('/api/auth/login/', {
            'email': 'guardian-moyo', 'password': 'guardian-safe-password-123',
        }, format='json')
        self.assertEqual(parent_login.status_code, 200, parent_login.data)
        self.assertEqual(parent_login.data['user']['role'], 'Parent')

        student_response = self.create_student_account(guardian_email='guardian@example.com')
        self.assertEqual(student_response.status_code, 201, student_response.data)
        student = Student.objects.get(user__username='tendai')
        self.assertTrue(StudentParent.objects.filter(student=student, parent=parent).exists())
        self.assertEqual(Parent.objects.filter(user=parent_user).count(), 1)
        other_student = Student.objects.create(name='Unrelated Student', school_class=self.school_class)
        Invoice.objects.create(
            invoice_no='PARENT-OWN', student=student, term='Term 1', amount=Decimal('100.00'), date='2026-01-01',
        )
        Invoice.objects.create(
            invoice_no='PARENT-OTHER', student=other_student, term='Term 1', amount=Decimal('200.00'), date='2026-01-01',
        )
        self.client.force_authenticate(user=parent_user)
        linked_students = self.client.get('/api/school/students/')
        self.assertEqual(linked_students.status_code, 200, linked_students.data)
        self.assertEqual([row['id'] for row in linked_students.data['results']], [student.pk])
        parent_invoices = self.client.get('/api/finance/invoices/')
        self.assertEqual(parent_invoices.status_code, 200, parent_invoices.data)
        self.assertEqual([row['invoice_no'] for row in parent_invoices.data['results']], ['PARENT-OWN'])

        self.client.force_authenticate(user=self.admin)
        accounts_role, _ = Role.objects.get_or_create(name='Accounts')
        accounts_response = self.client.post('/api/auth/accounts/', {
            'username': 'finance-officer', 'email': 'finance@example.com', 'first_name': 'Finance',
            'last_name': 'Officer', 'role': accounts_role.pk, 'password': 'finance-safe-password-123',
        }, format='json')
        self.assertEqual(accounts_response.status_code, 201, accounts_response.data)
        accounts_login = self.client.post('/api/auth/login/', {
            'email': 'finance-officer', 'password': 'finance-safe-password-123',
        }, format='json')
        self.assertEqual(accounts_login.status_code, 200, accounts_login.data)
        self.assertEqual(accounts_login.data['user']['role'], 'Accounts')
        accounts_user = User.objects.get(username='finance-officer')
        self.client.force_authenticate(user=accounts_user)
        finance_invoices = self.client.get('/api/finance/invoices/')
        self.assertEqual(finance_invoices.status_code, 200, finance_invoices.data)
        self.assertEqual(len(finance_invoices.data['results']), 2)

    def test_role_change_cannot_detach_an_account_from_its_school_record(self):
        student_response = self.create_student_account()
        self.assertEqual(student_response.status_code, 201, student_response.data)
        student = Student.objects.get(user__username='tendai')
        accounts_role, _ = Role.objects.get_or_create(name='Accounts')

        response = self.client.patch(f'/api/auth/accounts/{student.user_id}/', {
            'role': accounts_role.pk,
        }, format='json')

        self.assertEqual(response.status_code, 400, response.data)
        student.user.refresh_from_db()
        self.assertEqual(student.user.profile.role.name, 'Student')

    def test_non_admin_cannot_create_accounts(self):
        role, _ = Role.objects.get_or_create(name='Teacher')
        regular_user = User.objects.create_user(username='regular-user', password='regular-password-123')
        self.client.force_authenticate(user=regular_user)
        response = self.client.post('/api/auth/accounts/', {
            'username': 'blocked-user', 'email': 'blocked@example.com', 'first_name': 'Blocked',
            'last_name': 'User', 'role': role.pk, 'password': 'teacher-password-123',
        }, format='json')
        self.assertEqual(response.status_code, 403)
        self.assertFalse(User.objects.filter(username='blocked-user').exists())

    def test_account_creation_rejects_duplicate_usernames_and_malformed_contact_fields(self):
        admin_role, _ = Role.objects.get_or_create(name='Admin')
        base = {
            'username': 'unique-admin', 'email': 'unique-admin@example.com', 'first_name': 'Rudo',
            'last_name': 'Admin', 'role': admin_role.pk, 'password': 'valid-admin-password-123',
            'access_level': 'Full access',
        }
        created = self.client.post('/api/auth/accounts/', base, format='json')
        self.assertEqual(created.status_code, 201, created.data)

        duplicate = self.client.post('/api/auth/accounts/', {
            **base, 'username': 'UNIQUE-ADMIN', 'email': 'another-admin@example.com',
        }, format='json')
        self.assertEqual(duplicate.status_code, 400, duplicate.data)
        self.assertEqual(User.objects.filter(username__iexact='unique-admin').count(), 1)

        malformed_phone = self.client.post('/api/auth/accounts/', {
            **base, 'username': 'another-admin', 'email': 'another-admin@example.com',
            'phone': 'call me maybe',
        }, format='json')
        self.assertEqual(malformed_phone.status_code, 400, malformed_phone.data)

    def test_account_edit_password_reset_and_deactivation(self):
        teacher_role, _ = Role.objects.get_or_create(name='Teacher')
        teacher_response = self.client.post('/api/auth/accounts/', {
            'username': 'managed-teacher', 'email': 'managed@example.com', 'first_name': 'Tariro',
            'last_name': 'Matsvairo', 'role': teacher_role.pk, 'password': 'teacher-password-123',
            'department': 'Sciences', 'phone': '+263 77 123 4567',
            'teaching_allocations': [{'subject': self.subject.pk, 'school_class': self.school_class.pk}],
        }, format='json')
        self.assertEqual(teacher_response.status_code, 201, teacher_response.data)
        account_id = teacher_response.data['id']

        accounts = self.client.get('/api/auth/accounts/')
        self.assertEqual(accounts.status_code, 200, accounts.data)
        managed = next(item for item in accounts.data['results'] if item['id'] == account_id)
        self.assertEqual(managed['department'], 'Sciences')
        self.assertEqual(managed['allocations'][0]['subject__name'], 'Mathematics')
        self.assertEqual(managed['allocations'][0]['school_class__name'], 'Form 4 Sciences')

        duplicate_pair = self.client.patch(f'/api/auth/accounts/{account_id}/', {
            'teaching_allocations': [
                {'subject': self.subject.pk, 'school_class': self.school_class.pk},
                {'subject': self.subject.pk, 'school_class': self.school_class.pk},
            ],
        }, format='json')
        self.assertEqual(duplicate_pair.status_code, 400, duplicate_pair.data)
        empty_allocations = self.client.patch(f'/api/auth/accounts/{account_id}/', {
            'teaching_allocations': [],
        }, format='json')
        self.assertEqual(empty_allocations.status_code, 400, empty_allocations.data)

        reset = self.client.patch(f'/api/auth/accounts/{account_id}/', {
            'password': 'new-teacher-password-456', 'is_active': True,
        }, format='json')
        self.assertEqual(reset.status_code, 200, reset.data)
        account = User.objects.get(pk=account_id)
        self.assertTrue(account.check_password('new-teacher-password-456'))
        self.assertTrue(account.profile.preferences['must_change_password'])

        self.client.force_authenticate(user=self.admin)
        self.assertEqual(self.client.delete(f'/api/auth/accounts/{account_id}/').status_code, 204)
        account.refresh_from_db()
        self.assertFalse(account.is_active)
        self.assertEqual(self.client.delete(f'/api/auth/accounts/{account_id}/permanent-delete/').status_code, 409)
