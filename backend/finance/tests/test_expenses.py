from datetime import date
from decimal import Decimal

from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient

from core.models import Role, UserProfile
from finance.models import Expense, Invoice, Payment
from school.models import SchoolClass, Student


def make_user(name, role_name):
    user = User.objects.create_user(username=name, password='pwd-Strong-123')
    role, _ = Role.objects.get_or_create(name=role_name)
    UserProfile.objects.create(user=user, role=role)
    return user


class ExpenseTests(TestCase):
    def setUp(self):
        self.accounts = make_user('acc_exp', 'Accounts')
        self.teacher = make_user('teach_exp', 'Teacher')
        self.client_api = APIClient()
        self.client_api.force_authenticate(self.accounts)
        self.payload = {'date': '2026-03-10', 'category': 'utilities', 'description': 'Electricity', 'amount': '120.50', 'currency': 'USD'}

    def test_accounts_can_record_and_list_and_delete(self):
        created = self.client_api.post('/api/finance/expenses/', self.payload, format='json')
        self.assertEqual(created.status_code, 201)
        self.assertEqual(created.data['recorded_by'], 'acc_exp')
        self.assertEqual(len(self.client_api.get('/api/finance/expenses/').data), 1)
        self.assertEqual(self.client_api.delete(f"/api/finance/expenses/{created.data['id']}/").status_code, 204)
        self.assertEqual(Expense.objects.count(), 0)

    def test_other_roles_are_refused(self):
        self.client_api.force_authenticate(self.teacher)
        self.assertEqual(self.client_api.get('/api/finance/expenses/').status_code, 403)
        self.assertEqual(self.client_api.post('/api/finance/expenses/', self.payload, format='json').status_code, 403)
        self.assertEqual(self.client_api.get('/api/finance/expenses/summary/').status_code, 403)

    def test_bad_input_is_rejected(self):
        for change in ({'amount': '0'}, {'amount': '-5'}, {'amount': 'abc'}, {'amount': '1.234'}, {'description': ' '},
                       {'currency': 'EUR'}, {'category': 'nope'}, {'date': 'yesterday'}):
            response = self.client_api.post('/api/finance/expenses/', {**self.payload, **change}, format='json')
            self.assertEqual(response.status_code, 400, change)
        self.assertEqual(Expense.objects.count(), 0)

    def test_summary_nets_income_against_expenses_per_currency(self):
        student = Student.objects.create(name='Sum Child', school_class=SchoolClass.objects.create(name='Sum 1'))
        invoice = Invoice.objects.create(invoice_no='AGC-EX-1', student=student, term='Term 1', amount=Decimal('500'), date=date(2026, 3, 1))
        Payment.objects.create(receipt_no='R-EX-1', invoice=invoice, amount=Decimal('300'), method='Cash', date=date(2026, 3, 5))
        Expense.objects.create(date=date(2026, 3, 10), category='utilities', description='Power', amount=Decimal('100'))
        Expense.objects.create(date=date(2026, 4, 2), category='supplies', description='Chalk', amount=Decimal('40'))
        data = self.client_api.get('/api/finance/expenses/summary/?year=2026').data
        self.assertEqual(data['totals']['USD'], {'income': '300.00', 'expenses': '140.00', 'net': '160.00'})
        self.assertEqual([m['month'] for m in data['months']], ['2026-03', '2026-04'])
        self.assertEqual({c['category'] for c in data['categories']}, {'utilities', 'supplies'})
