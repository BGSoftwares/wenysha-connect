from datetime import date
from decimal import Decimal

from django.db import IntegrityError
from django.test import TestCase

from school.models import AcademicYear, FeeStructure, Payment, SchoolClass, Student, StudentFee, Term


class SchoolFeePaymentTests(TestCase):
    def setUp(self):
        today = date.today()
        school_class = SchoolClass.objects.create(name='Payment Form')
        student = Student.objects.create(student_id='PAY001', name='Payment Student', school_class=school_class)
        year = AcademicYear.objects.create(name='Payment Year', start_date=today, end_date=today)
        term = Term.objects.create(name='Term 1', academic_year=year, start_date=today, end_date=today)
        structure = FeeStructure.objects.create(name='Tuition', term=term, amount=Decimal('100.00'))
        self.fee = StudentFee.objects.create(student=student, fee_structure=structure, amount_due=Decimal('100.00'))

    def test_create_update_delete_and_failed_payment_keep_fee_total_consistent(self):
        first = Payment.objects.create(student_fee=self.fee, amount=Decimal('30.00'))
        second = Payment.objects.create(student_fee=self.fee, amount=Decimal('40.00'))
        self.fee.refresh_from_db()
        self.assertEqual(self.fee.amount_paid, Decimal('70.00'))

        first.amount = Decimal('20.00')
        first.save()
        self.fee.refresh_from_db()
        self.assertEqual(self.fee.amount_paid, Decimal('60.00'))

        second.delete()
        self.fee.refresh_from_db()
        self.assertEqual(self.fee.amount_paid, Decimal('20.00'))
        self.assertEqual(self.fee.status, 'Partial')

        first.amount = Decimal('0.00')
        with self.assertRaises(IntegrityError):
            first.save()

        first.refresh_from_db()
        self.fee.refresh_from_db()
        self.assertEqual(first.amount, Decimal('20.00'))
        self.assertEqual(self.fee.amount_paid, Decimal('20.00'))
