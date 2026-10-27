from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from school.models import (
    AcademicYear, FeeStructure as SchoolFeeStructure, SchoolClass, Student,
    StudentFee, Term, Teacher, Payment as SchoolPayment,
)
from finance.models import Invoice
from core.models import Role, UserProfile
from datetime import date
from decimal import Decimal
from admissions.models import AdmissionApplication
from library.models import Book

class PermissionMatrixTests(TestCase):
    def setUp(self):
        # Users
        self.admin = User.objects.create_superuser(username='adminperm', email='adminperm@local', password='adminpass')
        self.staff = User.objects.create_user(username='staffuser', email='staff@local', password='staffpass', is_staff=True)
        self.user = User.objects.create_user(username='regular', email='user@local', password='userpass')
        self.accounts = User.objects.create_user(username='accounts', email='accounts@local', password='accountspass')
        accounts_role, _ = Role.objects.get_or_create(name='Accounts')
        UserProfile.objects.create(user=self.accounts, role=accounts_role)
        teacher_role = Role.objects.get(name='Class Teacher')
        self.teacher_user = User.objects.create_user(username='teacherperm', email='teacher@local', password='teacherpass')
        UserProfile.objects.create(user=self.teacher_user, role=teacher_role, full_name='Assigned Teacher')
        teacher = Teacher.objects.create(user=self.teacher_user, name='Assigned Teacher')
        # Student and class for endpoints
        cls = SchoolClass.objects.create(name='PermClass', class_teacher=teacher)
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
        # Regular authenticated accounts cannot alter financial records.
        self.client.force_authenticate(user=self.user)
        r2 = self.client.post('/api/finance/invoices/', payload, format='json')
        self.assertEqual(r2.status_code, 403)
        # Accounts staff can create the invoice.
        self.client.force_authenticate(user=self.accounts)
        r3 = self.client.post('/api/finance/invoices/', payload, format='json')
        self.assertEqual(r3.status_code, 201, r3.data)

    def test_grades_and_attendance_auth_required(self):
        grade_payload = {'student': self.student.id, 'assessment': None, 'score': '70.0'}
        attend_payload = {'student': self.student.id, 'date': date.today().isoformat(), 'status': 'present'}
        # Unauthenticated blocked
        gr = self.client.post('/api/school/grades/', grade_payload, format='json')
        at = self.client.post('/api/attendance/attendance/', attend_payload, format='json')
        self.assertEqual(gr.status_code, 401)
        self.assertEqual(at.status_code, 401)
        # Authenticated allowed
        self.client.force_authenticate(user=self.teacher_user)
        # For grade, assessment is required by model; skip create but check GET/list access
        grl = self.client.get('/api/school/grades/')
        self.assertIn(grl.status_code, (200, 204))
        atl = self.client.post('/api/attendance/attendance/', attend_payload, format='json')
        self.assertEqual(atl.status_code, 201, atl.data)

    def test_management_writes_are_limited_to_the_right_roles(self):
        self.client.force_authenticate(user=self.user)
        responses = [
            self.client.post('/api/school/classes/', {'name': 'Unauthorized Class'}, format='json'),
            self.client.post('/api/school/subjects/', {'name': 'Unauthorized Subject', 'code': 'UNAUTH'}, format='json'),
            self.client.post('/api/hostel/hostels/', {'name': 'Unauthorized Hostel', 'hostel_type': 'Boys', 'capacity': 10}, format='json'),
            self.client.post('/api/transport/buses/', {'number': 'UNAUTH-1', 'route_name': 'Test Route', 'driver': 'Test Driver'}, format='json'),
        ]
        self.assertEqual([response.status_code for response in responses], [403, 403, 403, 403])

    def test_school_payment_data_is_hidden_from_teachers(self):
        academic_year = AcademicYear.objects.create(
            name='2026', start_date=date(2026, 1, 1), end_date=date(2026, 12, 31)
        )
        term = Term.objects.create(
            name='Term 1', academic_year=academic_year,
            start_date=date(2026, 1, 1), end_date=date(2026, 4, 30),
        )
        fee = SchoolFeeStructure.objects.create(name='Tuition', term=term, amount=Decimal('100.00'))
        student_fee = StudentFee.objects.create(
            student=self.student, fee_structure=fee, amount_due=Decimal('100.00')
        )
        SchoolPayment.objects.create(
            student_fee=student_fee, amount=Decimal('20.00'), date=date.today(), method='Cash'
        )

        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.get('/api/school/payments/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 0)

        fees_response = self.client.get('/api/school/student-fees/')
        self.assertEqual(fees_response.status_code, 200)
        self.assertEqual(fees_response.data['count'], 0)
        write_response = self.client.post('/api/school/student-fees/', {
            'student': self.student.id,
            'fee_structure': fee.id,
            'amount_due': '100.00',
        }, format='json')
        self.assertEqual(write_response.status_code, 403)

    def test_admission_records_are_private_and_public_submission_remains_open(self):
        AdmissionApplication.objects.create(full_name='Applicant', email='applicant@example.test')
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/admissions/admissions/')
        self.assertEqual(response.status_code, 403)

        self.client.force_authenticate(user=None)
        response = self.client.post('/api/admissions/admissions/', {
            'full_name': 'New Applicant', 'email': 'new-applicant@example.test', 'status': 'pending'
        }, format='json')
        self.assertEqual(response.status_code, 201, response.data)

    def test_public_school_content_can_be_read_without_login(self):
        for path in ('/api/content/gallery/', '/api/content/announcements/', '/api/content/staff/'):
            with self.subTest(path=path):
                response = self.client.get(path)
                self.assertEqual(response.status_code, 200, response.data)

    def test_class_teacher_role_alias_can_manage_library_books(self):
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.post('/api/library/books/', {
            'title': 'Teaching Notes', 'author': 'School Staff', 'copies': 3,
        }, format='json')
        self.assertEqual(response.status_code, 201, response.data)
        book = Book.objects.get(title='Teaching Notes')
        self.assertEqual(book.available, 3)

        self.client.force_authenticate(user=self.user)
        denied = self.client.post('/api/library/books/', {
            'title': 'Unauthorised Notes', 'author': 'Unknown', 'copies': 1,
        }, format='json')
        self.assertEqual(denied.status_code, 403)
