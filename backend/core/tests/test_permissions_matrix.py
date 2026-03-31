from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from school.models import SchoolClass, Student
from finance.models import Invoice
from datetime import date

class PermissionMatrixTests(TestCase):
    def setUp(self):
        # Users
        self.admin = User.objects.create_superuser(username='adminperm', email='adminperm@local', password='adminpass')
        self.staff = User.objects.create_user(username='staffuser', email='staff@local', password='staffpass', is_staff=True)
        self.user = User.objects.create_user(username='regular', email='user@local', password='userpass')
        # Student and class for endpoints
        cls = SchoolClass.objects.create(name='PermClass')
        self.student = Student.objects.create(student_id='PM001', name='Perm Student', school_class=cls)
        self.client = APIClient()

    def test_pending_approvals_admin_only(self):
        # Unauthenticated -> 401
        r = self.client.get('/api/auth/pending-approvals/')
        self.assertEqual(r.status_code, 401)
        # Regular authenticated -> 403 (IsAdminUser)
        self.client.force_authenticate(user=self.user)
        r2 = self.client.get('/api/auth/pending-approvals/')
        self.assertIn(r2.status_code, (403, 401))
        # Staff (is_staff=True) should be allowed
        self.client.force_authenticate(user=self.staff)
        r3 = self.client.get('/api/auth/pending-approvals/')
        self.assertEqual(r3.status_code, 200)
        # Superuser allowed
        self.client.force_authenticate(user=self.admin)
        r4 = self.client.get('/api/auth/pending-approvals/')
        self.assertEqual(r4.status_code, 200)

    def test_finance_invoice_permissions(self):
        payload = {'invoice_no': 'PMINV1', 'student': self.student.id, 'term': 'T1', 'amount': '120.00', 'date': date.today().isoformat()}
        # Unauthenticated blocked
        r = self.client.post('/api/finance/invoices/', payload, format='json')
        self.assertEqual(r.status_code, 401)
        # Regular authenticated allowed
        self.client.force_authenticate(user=self.user)
        r2 = self.client.post('/api/finance/invoices/', payload, format='json')
        self.assertEqual(r2.status_code, 201)

    def test_grades_and_attendance_auth_required(self):
        grade_payload = {'student': self.student.id, 'assessment': None, 'score': '70.0'}
        attend_payload = {'student': self.student.id, 'date': date.today().isoformat(), 'status': 'present'}
        # Unauthenticated blocked
        gr = self.client.post('/api/school/grades/', grade_payload, format='json')
        at = self.client.post('/api/attendance/attendance/', attend_payload, format='json')
        self.assertEqual(gr.status_code, 401)
        self.assertEqual(at.status_code, 401)
        # Authenticated allowed
        self.client.force_authenticate(user=self.user)
        # For grade, assessment is required by model; skip create but check GET/list access
        grl = self.client.get('/api/school/grades/')
        self.assertIn(grl.status_code, (200, 204))
        atl = self.client.post('/api/attendance/attendance/', attend_payload, format='json')
        # attendance create should be allowed
        self.assertEqual(atl.status_code, 201)
