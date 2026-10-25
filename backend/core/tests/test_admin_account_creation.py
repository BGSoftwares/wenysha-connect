from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient

from core.models import Role, UserProfile


class AdminPortalAccountCreationTests(TestCase):
    def setUp(self):
        admin_role, _ = Role.objects.get_or_create(name='Admin')
        self.admin = User.objects.create_user(
            username='portal-admin',
            email='portal-admin@example.com',
            password='admin-password-123',
        )
        UserProfile.objects.create(user=self.admin, role=admin_role, full_name='Portal Administrator')
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)

    def test_portal_admin_can_create_accounts_and_roles(self):
        teacher_role, _ = Role.objects.get_or_create(name='Teacher')
        response = self.client.post('/api/auth/accounts/', {
            'username': 'new-teacher',
            'email': 'new-teacher@example.com',
            'full_name': 'New Teacher',
            'role': teacher_role.pk,
            'password': 'teacher-password-123',
            'is_active': True,
        }, format='json')

        self.assertEqual(response.status_code, 201, response.data)
        account = User.objects.get(username='new-teacher')
        self.assertEqual(account.profile.role, teacher_role)
        self.assertEqual(account.profile.full_name, 'New Teacher')
        self.assertTrue(account.check_password('teacher-password-123'))
        self.assertFalse(account.is_staff)

        role_response = self.client.post('/api/auth/roles/', {
            'name': 'Library Assistant',
            'description': 'Library portal permissions',
            'permissions': [],
        }, format='json')
        self.assertEqual(role_response.status_code, 201, role_response.data)
        self.assertTrue(Role.objects.filter(name='Library Assistant').exists())

    def test_non_admin_cannot_create_accounts(self):
        teacher_role, _ = Role.objects.get_or_create(name='Teacher')
        regular_user = User.objects.create_user(username='regular-user', password='regular-password-123')
        self.client.force_authenticate(user=regular_user)

        response = self.client.post('/api/auth/accounts/', {
            'username': 'blocked-user',
            'email': 'blocked@example.com',
            'full_name': 'Blocked User',
            'role': teacher_role.pk,
            'password': 'teacher-password-123',
        }, format='json')

        self.assertEqual(response.status_code, 403)
        self.assertFalse(User.objects.filter(username='blocked-user').exists())
