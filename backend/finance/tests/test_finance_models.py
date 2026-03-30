from django.test import TestCase
from django.contrib.auth.models import User
from school.models import SchoolClass, Student
from finance.models import Invoice, Payment
from datetime import date

class FinanceModelTests(TestCase):
    def setUp(self):
        cls = SchoolClass.objects.create(name='Form 2B')
        self.student = Student.objects.create(student_id='STU9999', name='Finance Student', school_class=cls)
        self.user = User.objects.create_user(username='teller', email='teller@local', password='pwd')

    def test_payment_updates_invoice_status_and_paid(self):
        inv = Invoice.objects.create(invoice_no='INV100', student=self.student, term='Term 1', amount=100.00, date=date.today())
        self.assertEqual(inv.paid, 0)
        self.assertEqual(inv.status, 'unpaid')

        # Add partial payment
        p1 = Payment.objects.create(receipt_no='R100', invoice=inv, amount=30.00, method='Cash', date=date.today(), recorded_by=self.user)
        inv.refresh_from_db()
        self.assertEqual(float(inv.paid), 30.00)
        self.assertEqual(inv.status, 'partial')

        # Add remaining payment
        p2 = Payment.objects.create(receipt_no='R101', invoice=inv, amount=70.00, method='Bank', date=date.today(), recorded_by=self.user)
        inv.refresh_from_db()
        self.assertEqual(float(inv.paid), 100.00)
        self.assertEqual(inv.status, 'paid')
