from datetime import date
from decimal import Decimal

from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient

from core.models import Role, UserProfile
from finance.models import Invoice, Payment
from library.models import Book, Borrowing
from parents.models import Parent, StudentParent
from school.models import (
    AcademicYear, Assessment, Grade, SchoolClass, Student, Subject, Teacher, TeacherSubjectClass, Term,
)

PASSWORD = 'x-Pass-12345'


def make_user(username, role_name):
    user = User.objects.create_user(username=username, email=f'{username}@example.com', password=PASSWORD)
    role, _ = Role.objects.get_or_create(name=role_name)
    UserProfile.objects.create(user=user, role=role, full_name=username)
    return user


def rows(response):
    data = response.data
    return data['results'] if isinstance(data, dict) and 'results' in data else data


class ProfilePreferenceTests(TestCase):
    def setUp(self):
        self.user = make_user('pupil_pref', 'Student')
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_security_state_cannot_be_overwritten_through_profile(self):
        profile = self.user.profile
        profile.preferences = {'mfa_enabled': True, 'backup_codes': ['h1'], 'must_change_password': True}
        profile.save()
        response = self.client.patch('/api/auth/me/', {
            'full_name': 'Pupil', 'username': self.user.username, 'email': self.user.email,
            'preferences': {'mfa_enabled': False, 'must_change_password': False, 'backup_codes': [],
                            'appearance': {'theme': 'dark'}},
        }, format='json')
        self.assertEqual(response.status_code, 200, response.data)
        prefs = UserProfile.objects.get(user=self.user).preferences
        self.assertTrue(prefs['mfa_enabled'])
        self.assertTrue(prefs['must_change_password'])
        self.assertEqual(prefs['backup_codes'], ['h1'])
        self.assertEqual(prefs['appearance'], {'theme': 'dark'})

    def test_me_does_not_return_secrets(self):
        profile = self.user.profile
        profile.preferences = {'totp_secret': 'enc', 'backup_codes': ['h1'], 'notifications': {'email': True}}
        profile.save()
        data = self.client.get('/api/auth/me/').data
        self.assertNotIn('totp_secret', data['preferences'])
        self.assertNotIn('backup_codes', data['preferences'])
        self.assertIn('notifications', data['preferences'])

    def test_null_text_fields_give_400_not_500(self):
        response = self.client.patch('/api/auth/me/', {'full_name': 123, 'username': 'x'}, format='json')
        self.assertEqual(response.status_code, 400)


class GradeScopeTests(TestCase):
    def test_teacher_needs_class_and_subject_together(self):
        year = AcademicYear.objects.create(name='2026', start_date=date(2026, 1, 1), end_date=date(2026, 12, 1))
        term = Term.objects.create(name='T1', academic_year=year, start_date=date(2026, 1, 1), end_date=date(2026, 4, 1))
        maths, english = Subject.objects.create(name='Maths'), Subject.objects.create(name='English')
        form1, form2 = SchoolClass.objects.create(name='F1'), SchoolClass.objects.create(name='F2')
        teacher_user = make_user('teach_scope', 'Teacher')
        teacher = Teacher.objects.create(user=teacher_user, name='T')
        TeacherSubjectClass.objects.create(teacher=teacher, subject=maths, school_class=form1)
        TeacherSubjectClass.objects.create(teacher=teacher, subject=english, school_class=form2)
        allowed = Assessment.objects.create(name='A', subject=maths, school_class=form1, term=term)
        denied = Assessment.objects.create(name='B', subject=maths, school_class=form2, term=term)
        s1 = Student.objects.create(student_id='G1', name='One', school_class=form1)
        s2 = Student.objects.create(student_id='G2', name='Two', school_class=form2)
        Grade.objects.create(student=s1, assessment=allowed, score=50)
        Grade.objects.create(student=s2, assessment=denied, score=60)
        client = APIClient()
        client.force_authenticate(teacher_user)
        ids = {row['assessment'] for row in rows(client.get('/api/school/grades/'))}
        self.assertEqual(ids, {allowed.pk})


class FinanceTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser('fin_boss', 'fb@example.com', PASSWORD)
        cls = SchoolClass.objects.create(name='FC')
        student = Student.objects.create(student_id='F1', name='Pay Student', school_class=cls)
        self.invoice = Invoice.objects.create(invoice_no='INV-1', student=student, term='T1',
                                              amount=Decimal('100'), date=date(2026, 1, 1))
        self.client = APIClient()
        self.client.force_authenticate(self.admin)

    def pay(self, amount):
        return self.client.post('/api/finance/payments/', {
            'invoice': self.invoice.pk, 'amount': amount, 'method': 'Cash', 'date': '2026-01-02',
        }, format='json')

    def test_payment_cannot_exceed_remaining_balance(self):
        self.assertEqual(self.pay('80').status_code, 201)
        self.assertEqual(self.pay('30').status_code, 400)
        self.assertEqual(self.pay('20').status_code, 201)
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, 'paid')

    def test_invoice_paid_cannot_be_set_by_hand(self):
        self.client.patch(f'/api/finance/invoices/{self.invoice.pk}/', {'paid': '100', 'status': 'paid'}, format='json')
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.paid, 0)
        self.assertEqual(self.invoice.status, 'unpaid')


class LibraryLoanTests(TestCase):
    def test_deleting_open_loan_restores_stock_and_return_cannot_be_patched(self):
        admin = User.objects.create_superuser('lib_boss', 'lb@example.com', PASSWORD)
        cls = SchoolClass.objects.create(name='LC')
        student = Student.objects.create(student_id='L1', name='Reader', school_class=cls)
        book = Book.objects.create(title='B', author='A', copies=2, available=1)
        loan = Borrowing.objects.create(book=book, student=student, borrow_date=date.today(), due_date=date.today())
        client = APIClient()
        client.force_authenticate(admin)
        client.patch(f'/api/library/borrowings/{loan.pk}/', {'status': 'Returned'}, format='json')
        loan.refresh_from_db()
        self.assertEqual(loan.status, 'Borrowed')
        self.assertEqual(client.delete(f'/api/library/borrowings/{loan.pk}/').status_code, 204)
        book.refresh_from_db()
        self.assertEqual(book.available, 2)


class GuardianPrivacyTests(TestCase):
    def test_parent_does_not_see_other_guardian_contact_details(self):
        cls = SchoolClass.objects.create(name='PC')
        student = Student.objects.create(student_id='P1', name='Child', school_class=cls)
        mine_user, other_user = make_user('parent_a', 'Parent'), make_user('parent_b', 'Parent')
        mine = Parent.objects.create(user=mine_user, name='Mine', phone='111')
        other = Parent.objects.create(user=other_user, name='Other', phone='222')
        StudentParent.objects.create(student=student, parent=mine, relationship='Mother')
        StudentParent.objects.create(student=student, parent=other, relationship='Father')
        client = APIClient()
        client.force_authenticate(mine_user)
        kin = {k['name']: k for k in rows(client.get('/api/school/students/'))[0]['next_of_kin']}
        self.assertEqual(kin['Mine']['phone'], '111')
        self.assertNotIn('phone', kin['Other'])
        self.assertEqual(kin['Other']['relationship'], 'Father')
