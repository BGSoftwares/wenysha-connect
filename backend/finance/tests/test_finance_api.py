from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from school.models import SchoolClass, Student
from finance.models import Invoice, Payment
from datetime import date

class FinanceAPITests(TestCase):
    def setUp(self):
        cls = SchoolClass.objects.create(name='API Form')
        self.student = Student.objects.create(student_id='API001', name='API Student', school_class=cls)
        self.user = User.objects.create_user(username='finance_user', email='fin@local', password='pwd')
        self.client = APIClient()

    def test_invoice_create_requires_auth(self):
        payload = {'invoice_no': 'IAPI1', 'student': self.student.id, 'term': 'Term 1', 'amount': '150.00', 'date': date.today().isoformat()}
        resp = self.client.post('/api/finance/invoices/', payload, format='json')
        self.assertEqual(resp.status_code, 401)

    def test_create_invoice_and_post_payment_updates_invoice(self):
        # authenticate
        self.client.force_authenticate(user=self.user)
        payload = {'invoice_no': 'IAPI2', 'student': self.student.id, 'term': 'Term 1', 'amount': '200.00', 'date': date.today().isoformat()}
        resp = self.client.post('/api/finance/invoices/', payload, format='json')
        self.assertEqual(resp.status_code, 201)
        invoice_id = resp.data['id']
        # create payment
        pay_payload = {'receipt_no': 'RAPI1', 'invoice': invoice_id, 'amount': '50.00', 'method': 'Cash', 'date': date.today().isoformat(), 'recorded_by': self.user.id}
        p = self.client.post('/api/finance/payments/', pay_payload, format='json')
        self.assertEqual(p.status_code, 201)
        # refresh invoice
        inv_resp = self.client.get(f'/api/finance/invoices/{invoice_id}/')
        self.assertEqual(inv_resp.status_code, 200)
        self.assertEqual(str(inv_resp.data['paid']), '50.00')
        self.assertEqual(inv_resp.data['status'], 'partial')
