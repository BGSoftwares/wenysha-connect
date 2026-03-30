from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from core.models import PendingApproval, UserProfile
from school.models import Student, SchoolClass

class ApprovalFlowTests(TestCase):
    def setUp(self):
        # Create an admin user to approve requests
        self.admin = User.objects.create_superuser(username='admin', email='admin@local', password='adminpass')
        # Ensure at least one SchoolClass exists
        if not SchoolClass.objects.exists():
            SchoolClass.objects.create(name='Form 1A')
        self.client = APIClient()

    def test_signup_pending_then_approve_and_login(self):
        # 1) Signup as a new student (pending)
        signup_payload = {
            'full_name': 'Test Student',
            'email': 'student1@example.com',
            'password': 'strong-password-123',
            'confirm_password': 'strong-password-123',
            'role': 'student',
            'additional_info': {'class_name': 'Form 1A'}
        }
        resp = self.client.post('/api/auth/signup/', signup_payload, format='json')
        self.assertEqual(resp.status_code, 201)
        # PendingApproval should exist
        pa = PendingApproval.objects.filter(email='student1@example.com').first()
        self.assertIsNotNone(pa)
        self.assertEqual(pa.status, 'pending')

        # 2) Admin logs in and approves
        # Authenticate the test client as admin (force_authenticate for DRF)
        self.client.force_authenticate(user=self.admin)
        # get pending list (should be protected to admin)
        list_resp = self.client.get('/api/auth/pending-approvals/')
        self.assertEqual(list_resp.status_code, 200)
        # response may be paginated (with 'results') or a plain list
        resp_list = list_resp.data if isinstance(list_resp.data, list) else list_resp.data.get('results', [])
        self.assertTrue(len(resp_list) > 0, msg=f"Expected at least one pending approval, got: {list_resp.data}")
        pending_id = resp_list[0]['id']
        approve_resp = self.client.post(f'/api/auth/pending-approvals/{pending_id}/approve/')
        self.assertEqual(approve_resp.status_code, 200)
        pa.refresh_from_db()
        self.assertEqual(pa.status, 'approved')

        # 3) The corresponding auth.User should exist and be able to login via API
        login_payload = {'email': 'student1@example.com', 'password': 'strong-password-123'}
        # Use a fresh client (no admin session)
        client2 = APIClient()
        login_resp = client2.post('/api/auth/login/', login_payload, format='json')
        self.assertEqual(login_resp.status_code, 200)
        self.assertIn('access', login_resp.data)
        self.assertIn('user', login_resp.data)
        self.assertEqual(login_resp.data['user']['email'], 'student1@example.com')

        # 4) Ensure a Student record was created and linked to the user
        user_id = login_resp.data['user']['id']
        user = User.objects.get(id=user_id)
        # UserProfile should exist
        self.assertTrue(hasattr(user, 'profile'))
        # Student record linked (user.student_profile via related_name)
        self.assertTrue(hasattr(user, 'student_profile'))
        student = user.student_profile
        self.assertIsInstance(student, Student)
        self.assertEqual(student.name, 'Test Student')
