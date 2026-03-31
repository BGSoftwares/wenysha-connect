from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from core.models import PendingApproval
from school.models import Student, SchoolClass

class EdgeCaseApprovalTests(TestCase):
    def setUp(self):
        # Admin for approve/reject actions
        self.admin = User.objects.create_superuser(username='admin2', email='admin2@local', password='adminpass')
        if not SchoolClass.objects.exists():
            SchoolClass.objects.create(name='Form 1A')
        self.client = APIClient()

    def test_signup_password_mismatch_and_duplicate_email(self):
        # Mismatched passwords
        payload = {
            'full_name': 'Mismatch User',
            'email': 'mismatch@example.com',
            'password': 'abc123456',
            'confirm_password': 'different',
            'role': 'student'
        }
        resp = self.client.post('/api/auth/signup/', payload, format='json')
        self.assertEqual(resp.status_code, 400)
        self.assertIn('confirm_password', resp.data)

        # Create a real user and attempt signup with same email
        User.objects.create_user(username='existing', email='exists@example.com', password='pass12345')
        payload2 = {
            'full_name': 'Dup User',
            'email': 'exists@example.com',
            'password': 'abc123456',
            'confirm_password': 'abc123456',
            'role': 'parent'
        }
        resp2 = self.client.post('/api/auth/signup/', payload2, format='json')
        self.assertEqual(resp2.status_code, 400)
        self.assertIn('email', resp2.data)

    def test_login_before_approval_and_reject_flow(self):
        # Signup -> pending
        payload = {
            'full_name': 'Pending User',
            'email': 'pending@example.com',
            'password': 'strong-pass-1',
            'confirm_password': 'strong-pass-1',
            'role': 'student',
            'additional_info': {'class_name': 'Form 1A'}
        }
        s = self.client.post('/api/auth/signup/', payload, format='json')
        self.assertEqual(s.status_code, 201)

        # Attempt to login before approval
        login_resp = self.client.post('/api/auth/login/', {'email': 'pending@example.com', 'password': 'strong-pass-1'}, format='json')
        self.assertIn(login_resp.status_code, (400, 401, 403))

        # Admin rejects
        self.client.force_authenticate(user=self.admin)
        list_resp = self.client.get('/api/auth/pending-approvals/')
        resp_list = list_resp.data if isinstance(list_resp.data, list) else list_resp.data.get('results', [])
        pending_id = [p for p in resp_list if p['email'] == 'pending@example.com'][0]['id']
        rej = self.client.post(f'/api/auth/pending-approvals/{pending_id}/reject/')
        self.assertEqual(rej.status_code, 200)
        pa = PendingApproval.objects.get(id=pending_id)
        self.assertEqual(pa.status, 'rejected')

        # Login still fails
        client2 = APIClient()
        post_reject_login = client2.post('/api/auth/login/', {'email': 'pending@example.com', 'password': 'strong-pass-1'}, format='json')
        self.assertIn(post_reject_login.status_code, (400, 401, 403))

    def test_approve_already_processed_and_role_profiles(self):
        # Create two signups: parent and teacher
        for role in ('parent', 'teacher'):
            payload = {
                'full_name': f'{role.title()} User',
                'email': f'{role}1@example.com',
                'password': 'role-pass',
                'confirm_password': 'role-pass',
                'role': role
            }
            r = self.client.post('/api/auth/signup/', payload, format='json')
            self.assertEqual(r.status_code, 201)

        # Admin approves parent
        self.client.force_authenticate(user=self.admin)
        list_resp = self.client.get('/api/auth/pending-approvals/')
        resp_list = list_resp.data if isinstance(list_resp.data, list) else list_resp.data.get('results', [])
        parent_pa = next(p for p in resp_list if p['email'] == 'parent1@example.com')
        approve_resp = self.client.post(f"/api/auth/pending-approvals/{parent_pa['id']}/approve/")
        self.assertEqual(approve_resp.status_code, 200)
        # Approve again may return 400 (already processed) or 404 (no longer in pending queryset)
        approve_again = self.client.post(f"/api/auth/pending-approvals/{parent_pa['id']}/approve/")
        self.assertIn(approve_again.status_code, (400, 404))

        # Ensure parent has profile but no Student
        user_id = approve_resp.data.get('user_id')
        user = User.objects.get(id=user_id)
        self.assertTrue(hasattr(user, 'profile'))
        self.assertFalse(hasattr(user, 'student_profile'))

    def test_multiple_student_approvals_generate_unique_ids(self):
        emails = ['s1@example.com', 's2@example.com', 's3@example.com']
        for e in emails:
            payload = {
                'full_name': f'Student {e.split("@")[0] }',
                'email': e,
                'password': 'stu-pass-1',
                'confirm_password': 'stu-pass-1',
                'role': 'student',
                'additional_info': {'class_name': 'Form 1A'}
            }
            resp = self.client.post('/api/auth/signup/', payload, format='json')
            self.assertEqual(resp.status_code, 201)

        self.client.force_authenticate(user=self.admin)
        list_resp = self.client.get('/api/auth/pending-approvals/')
        resp_list = list_resp.data if isinstance(list_resp.data, list) else list_resp.data.get('results', [])
        pending_ids = [p['id'] for p in resp_list if p['email'] in emails]
        created_student_ids = []
        for pid in pending_ids:
            ar = self.client.post(f'/api/auth/pending-approvals/{pid}/approve/')
            self.assertEqual(ar.status_code, 200)
            uid = ar.data.get('user_id')
            user = User.objects.get(id=uid)
            if hasattr(user, 'student_profile'):
                created_student_ids.append(user.student_profile.student_id)
        # Ensure uniqueness
        self.assertEqual(len(created_student_ids), len(set(created_student_ids)))
