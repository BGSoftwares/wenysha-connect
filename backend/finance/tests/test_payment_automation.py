import hashlib
import hmac
import json
from datetime import date, timedelta
from decimal import Decimal
from unittest import mock

from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from core.models import Role, UserProfile
from finance import services
from finance.models import BankDeposit, Invoice, OnlinePayment, Payment
from finance.views import _reserve_invoice_payment
from parents.models import Parent, StudentParent
from school.models import SchoolClass, Student

SECRET = 'bank-webhook-secret-for-tests'


def make_user(username, role_name):
    user = User.objects.create_user(username=username, email=f'{username}@local', password='pwd-Strong-123')
    role, _ = Role.objects.get_or_create(name=role_name)
    UserProfile.objects.create(user=user, role=role)
    return user


class PaymentFixtureMixin:
    def setUp(self):
        cls = SchoolClass.objects.create(name='Form 1 Pay')
        self.student = Student.objects.create(student_id='STU7001', name='Tendai Moyo', school_class=cls)
        self.invoice = Invoice.objects.create(
            invoice_no='AGC-261101-AAAA1111', student=self.student, term='Term 1', amount=Decimal('300.00'),
            currency='USD', date=date.today(),
        )
        self.accounts = make_user('acc_officer', 'Accounts')
        self.parent_user = make_user('parent_pay', 'Parent')
        parent = Parent.objects.create(user=self.parent_user, name='Parent Pay')
        StudentParent.objects.create(student=self.student, parent=parent)
        self.client = APIClient()

    def online_intent(self, provider='ecocash', amount='100.00', ref='AGC-TEST000000000001'):
        return OnlinePayment.objects.create(
            invoice=self.invoice, provider=provider, amount=Decimal(amount), currency='USD',
            client_reference=ref, payer_phone='263771234567', created_by=self.parent_user,
        )


class OnlinePaymentReconcileTests(PaymentFixtureMixin, TestCase):
    def test_confirmed_payment_is_credited_once(self):
        intent = self.online_intent()
        with mock.patch('finance.services.refresh_provider_status', return_value={'status': 'paid', 'provider_reference': 'EC123'}):
            services.refresh_intent(intent)
            services.refresh_intent(OnlinePayment.objects.get(pk=intent.pk))
            services.record_verified_online_payment(intent, 'EC123')
        self.assertEqual(Payment.objects.filter(invoice=self.invoice).count(), 1)
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.paid, Decimal('100.00'))
        self.assertEqual(self.invoice.status, 'partial')

    def test_background_sweep_credits_a_parent_who_closed_the_browser(self):
        intent = self.online_intent()
        with mock.patch('finance.services.refresh_provider_status', return_value={'status': 'paid', 'provider_reference': 'EC999'}):
            result = services.reconcile_pending_payments()
        self.assertEqual(result['paid'], 1)
        intent.refresh_from_db()
        self.assertEqual(intent.status, 'paid')
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.paid, Decimal('100.00'))

    def test_late_failure_cannot_overwrite_a_paid_payment(self):
        intent = self.online_intent()
        stale = OnlinePayment.objects.get(pk=intent.pk)
        services.record_verified_online_payment(intent, 'EC1')
        result = services._update_if_pending(stale, status='failed', error_code='LATE')
        self.assertEqual(result.status, 'paid')
        intent.refresh_from_db()
        self.assertEqual(intent.status, 'paid')

    def test_stale_pending_payment_expires_and_unblocks_the_invoice(self):
        intent = self.online_intent()
        OnlinePayment.objects.filter(pk=intent.pk).update(created_at=timezone.now() - timedelta(hours=30))
        with mock.patch('finance.services.refresh_provider_status', return_value={'status': 'pending'}):
            result = services.reconcile_pending_payments()
        self.assertEqual(result['expired'], 1)
        intent.refresh_from_db()
        self.assertEqual((intent.status, intent.error_code), ('cancelled', 'EXPIRED'))
        _reserve_invoice_payment(self.invoice.pk, 'ecocash', Decimal('50.00'), 'AGC-TEST000000000002', '263771234567', self.parent_user)

    def test_recent_pending_payment_is_left_alone(self):
        intent = self.online_intent()
        with mock.patch('finance.services.refresh_provider_status', return_value={'status': 'pending'}):
            result = services.reconcile_pending_payments()
        self.assertEqual(result['expired'], 0)
        intent.refresh_from_db()
        self.assertEqual(intent.status, 'pending')

    def test_provider_outage_changes_nothing(self):
        intent = self.online_intent()
        with mock.patch('finance.services.refresh_provider_status', side_effect=services.GatewayError('down')):
            result = services.reconcile_pending_payments()
        self.assertEqual(result['paid'] + result['failed'] + result['expired'], 0)
        intent.refresh_from_db()
        self.assertEqual(intent.status, 'pending')

    def test_bank_transfer_note_does_not_block_a_card_payment(self):
        self.online_intent(provider='bank_transfer', ref='NBS-NOTE000000000001')
        reserved = _reserve_invoice_payment(self.invoice.pk, 'zimswitch', Decimal('40.00'), 'AGC-TEST000000000003', '', self.parent_user)
        self.assertEqual(reserved.status, 'pending')

    def test_two_gateway_payments_cannot_be_pending_together(self):
        self.online_intent()
        with self.assertRaises(ValueError):
            _reserve_invoice_payment(self.invoice.pk, 'zimswitch', Decimal('40.00'), 'AGC-TEST000000000004', '', self.parent_user)


class BankDepositMatchingTests(PaymentFixtureMixin, TestCase):
    def deposit(self, txn='NBS-TXN-1', amount='300.00', reference='FEES AGC-261101-AAAA1111', **extra):
        row = {'transaction_id': txn, 'amount': amount, 'currency': 'USD', 'date': '2026-11-10', 'reference': reference}
        row.update(extra)
        return row

    def test_deposit_with_invoice_number_is_credited_and_shows_to_student_and_parent(self):
        summary = services.ingest_deposits([self.deposit()], 'webhook')
        self.assertEqual((summary['created'], summary['matched']), (1, 1))
        self.invoice.refresh_from_db()
        self.assertEqual((self.invoice.paid, self.invoice.status), (Decimal('300.00'), 'paid'))
        payment = Payment.objects.get(invoice=self.invoice)
        self.assertEqual((payment.method, payment.reference, payment.date), ('Bank Deposit', 'NBS-TXN-1', date(2026, 11, 10)))

        self.client.force_authenticate(self.parent_user)
        invoices = self.client.get('/api/finance/invoices/').data
        invoices = invoices['results'] if isinstance(invoices, dict) else invoices
        self.assertEqual(invoices[0]['status'], 'paid')
        payments = self.client.get('/api/finance/payments/').data
        payments = payments['results'] if isinstance(payments, dict) else payments
        self.assertEqual(payments[0]['method'], 'Bank Deposit')

        self.client.force_authenticate(self.accounts)
        self.assertEqual(self.client.get('/api/finance/balances/').data[0]['status'], 'cleared')

    def test_resent_deposit_never_credits_twice(self):
        services.ingest_deposits([self.deposit(amount='100.00')], 'webhook')
        again = services.ingest_deposits([self.deposit(amount='100.00')], 'webhook')
        self.assertEqual(again['duplicates'], 1)
        self.assertEqual(Payment.objects.filter(invoice=self.invoice).count(), 1)
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.paid, Decimal('100.00'))

    def test_student_id_in_reference_matches_a_single_open_invoice(self):
        services.ingest_deposits([self.deposit(reference='school fees stu7001 tendai', amount='120.00')], 'webhook')
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.paid, Decimal('120.00'))

    def test_student_with_two_open_invoices_goes_to_review(self):
        Invoice.objects.create(invoice_no='AGC-261101-BBBB2222', student=self.student, term='Term 2', amount=Decimal('300.00'), date=date.today())
        summary = services.ingest_deposits([self.deposit(reference='STU7001', amount='100.00')], 'webhook')
        self.assertEqual(summary['needs_review'], 1)
        self.assertEqual(Payment.objects.count(), 0)
        self.assertIn('several open invoices', BankDeposit.objects.get().note)

    def test_deposit_larger_than_balance_is_not_auto_credited(self):
        summary = services.ingest_deposits([self.deposit(amount='500.00')], 'webhook')
        self.assertEqual(summary['needs_review'], 1)
        self.assertEqual(Payment.objects.count(), 0)

    def test_currency_mismatch_is_not_auto_credited(self):
        services.ingest_deposits([self.deposit(currency='ZWG')], 'webhook')
        self.assertEqual(BankDeposit.objects.get().status, 'unmatched')
        self.assertEqual(Payment.objects.count(), 0)

    def test_reference_without_a_match_waits_for_review(self):
        services.ingest_deposits([self.deposit(reference='thanks')], 'webhook')
        self.assertEqual(BankDeposit.objects.get().status, 'unmatched')

    def test_parents_transfer_note_matches_and_is_closed(self):
        note = self.online_intent(provider='bank_transfer', amount='300.00', ref='NBS-NOTE000000000009')
        note.provider_reference = 'SLIP778899'
        note.save()
        services.ingest_deposits([self.deposit(reference='DEPOSIT SLIP778899')], 'webhook')
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.paid, Decimal('300.00'))
        note.refresh_from_db()
        self.assertEqual(note.status, 'paid')
        self.assertEqual(Payment.objects.filter(invoice=self.invoice).count(), 1)

    def test_transfer_already_credited_by_hand_is_linked_not_doubled(self):
        Payment.objects.create(receipt_no='R-MANUAL', invoice=self.invoice, amount=Decimal('300.00'), method='Bank Transfer',
                               reference='NBS-TXN-1', date=date.today())
        services.ingest_deposits([self.deposit()], 'webhook')
        self.assertEqual(Payment.objects.filter(invoice=self.invoice).count(), 1)
        self.assertEqual(BankDeposit.objects.get().status, 'matched')
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.paid, Decimal('300.00'))

    def test_statement_lines_without_ids_dedupe_on_reimport_but_keep_identical_lines(self):
        rows = [
            {'date': '10/11/2026', 'reference': 'AGC-261101-AAAA1111', 'amount': '50.00'},
            {'date': '10/11/2026', 'reference': 'AGC-261101-AAAA1111', 'amount': '50.00'},
        ]
        first = services.ingest_deposits(rows, 'csv')
        self.assertEqual(first['created'], 2)
        second = services.ingest_deposits(rows, 'csv')
        self.assertEqual((second['created'], second['duplicates']), (0, 2))
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.paid, Decimal('100.00'))

    def test_bad_lines_are_reported_not_fatal(self):
        rows = [self.deposit(txn='A1', amount='abc'), self.deposit(txn='A2', date='soon'), self.deposit(txn='A3', amount='-5'),
                self.deposit(txn='A4', amount='25.00')]
        summary = services.ingest_deposits(rows, 'webhook')
        self.assertEqual((summary['created'], summary['skipped']), (1, 3))
        self.assertEqual(len(summary['errors']), 2)


@override_settings(SECURE_SSL_REDIRECT=False)
class BankDepositApiTests(PaymentFixtureMixin, TestCase):
    def sign(self, body, secret=SECRET):
        return hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()

    def post_webhook(self, payload, signature=None, secret=SECRET):
        body = json.dumps(payload).encode()
        headers = {'HTTP_X_BANK_SIGNATURE': signature if signature is not None else self.sign(body, secret)}
        with mock.patch.dict('os.environ', {'BANK_WEBHOOK_SECRET': SECRET}):
            return self.client.post('/api/finance/bank-deposits/webhook/', data=body, content_type='application/json', **headers)

    def test_signed_webhook_credits_the_invoice(self):
        response = self.post_webhook({'transactions': [{
            'transaction_id': 'WH-1', 'amount': '75.50', 'currency': 'USD', 'date': '2026-11-12', 'reference': 'AGC-261101-AAAA1111',
        }]})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['matched'], 1)
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.paid, Decimal('75.50'))

    def test_webhook_retry_is_idempotent(self):
        payload = {'transaction_id': 'WH-2', 'amount': '10.00', 'date': '2026-11-12', 'reference': 'AGC-261101-AAAA1111'}
        self.post_webhook(payload)
        again = self.post_webhook(payload)
        self.assertEqual(again.status_code, 200)
        self.assertEqual(again.json()['duplicates'], 1)
        self.assertEqual(Payment.objects.count(), 1)

    def test_webhook_rejects_bad_or_missing_signature(self):
        payload = {'transaction_id': 'WH-3', 'amount': '10.00', 'date': '2026-11-12', 'reference': 'AGC-261101-AAAA1111'}
        self.assertEqual(self.post_webhook(payload, signature='deadbeef').status_code, 401)
        self.assertEqual(self.post_webhook(payload, signature='').status_code, 401)
        self.assertEqual(self.post_webhook(payload, secret='some-other-secret-value').status_code, 401)
        self.assertEqual(Payment.objects.count(), 0)
        self.assertEqual(BankDeposit.objects.count(), 0)

    def test_webhook_is_off_until_a_secret_is_configured(self):
        with mock.patch.dict('os.environ', {'BANK_WEBHOOK_SECRET': ''}):
            response = self.client.post('/api/finance/bank-deposits/webhook/', data=b'{}', content_type='application/json')
        self.assertEqual(response.status_code, 503)

    def test_webhook_requires_a_transaction_id(self):
        response = self.post_webhook({'amount': '10.00', 'date': '2026-11-12', 'reference': 'AGC-261101-AAAA1111'})
        self.assertEqual(response.json()['created'], 0)
        self.assertEqual(Payment.objects.count(), 0)

    def test_csv_import_matches_and_reports(self):
        self.client.force_authenticate(self.accounts)
        csv_text = (
            'Date,Description,Debit,Credit\n'
            '10/11/2026,TRF AGC-261101-AAAA1111 T MOYO,,120.00\n'
            '11/11/2026,BANK CHARGES,5.00,\n'
            '12/11/2026,UNKNOWN DEPOSIT,,40.00\n'
        )
        response = self.client.post(
            '/api/finance/bank-deposits/import/',
            {'file': SimpleUploadedFile('statement.csv', csv_text.encode()), 'currency': 'USD'}, format='multipart',
        )
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual((response.data['created'], response.data['matched'], response.data['needs_review']), (2, 1, 1))
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.paid, Decimal('120.00'))

    def test_csv_without_required_columns_is_rejected(self):
        self.client.force_authenticate(self.accounts)
        response = self.client.post('/api/finance/bank-deposits/import/', {'file': SimpleUploadedFile('s.csv', b'a,b\n1,2\n')}, format='multipart')
        self.assertEqual(response.status_code, 400)

    def test_accounts_can_assign_a_deposit_from_the_review_queue(self):
        services.ingest_deposits([{'transaction_id': 'Q1', 'amount': '60.00', 'date': '2026-11-12', 'reference': 'cash at bank'}], 'webhook')
        deposit = BankDeposit.objects.get()
        self.client.force_authenticate(self.accounts)
        response = self.client.post(f'/api/finance/bank-deposits/{deposit.pk}/assign/', {'invoice': self.invoice.pk}, format='json')
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.data['status'], 'matched')
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.paid, Decimal('60.00'))
        # assigning again is harmless
        self.client.post(f'/api/finance/bank-deposits/{deposit.pk}/assign/', {'invoice': self.invoice.pk}, format='json')
        self.assertEqual(Payment.objects.count(), 1)

    def test_assigning_more_than_the_balance_is_refused(self):
        services.ingest_deposits([{'transaction_id': 'Q2', 'amount': '400.00', 'date': '2026-11-12', 'reference': 'x'}], 'webhook')
        deposit = BankDeposit.objects.get()
        self.client.force_authenticate(self.accounts)
        response = self.client.post(f'/api/finance/bank-deposits/{deposit.pk}/assign/', {'invoice': self.invoice.pk}, format='json')
        self.assertEqual(response.status_code, 409)
        self.assertEqual(Payment.objects.count(), 0)

    def test_ignored_deposit_cannot_be_posted(self):
        services.ingest_deposits([{'transaction_id': 'Q3', 'amount': '20.00', 'date': '2026-11-12', 'reference': 'x'}], 'webhook')
        deposit = BankDeposit.objects.get()
        self.client.force_authenticate(self.accounts)
        self.assertEqual(self.client.post(f'/api/finance/bank-deposits/{deposit.pk}/ignore/').status_code, 200)
        response = self.client.post(f'/api/finance/bank-deposits/{deposit.pk}/assign/', {'invoice': self.invoice.pk}, format='json')
        self.assertEqual(response.status_code, 409)

    def test_only_finance_staff_can_see_or_change_deposits(self):
        services.ingest_deposits([{'transaction_id': 'Q4', 'amount': '20.00', 'date': '2026-11-12', 'reference': 'x'}], 'webhook')
        deposit = BankDeposit.objects.get()
        self.client.force_authenticate(self.parent_user)
        self.assertEqual(self.client.get('/api/finance/bank-deposits/').status_code, 403)
        self.assertEqual(self.client.post('/api/finance/bank-deposits/import/', {}).status_code, 403)
        self.assertEqual(self.client.post(f'/api/finance/bank-deposits/{deposit.pk}/assign/', {'invoice': self.invoice.pk}, format='json').status_code, 403)
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get('/api/finance/bank-deposits/').status_code, 401)

    def test_accounts_see_the_queue_filtered_by_status(self):
        services.ingest_deposits([
            {'transaction_id': 'L1', 'amount': '20.00', 'date': '2026-11-12', 'reference': 'AGC-261101-AAAA1111'},
            {'transaction_id': 'L2', 'amount': '20.00', 'date': '2026-11-12', 'reference': 'nothing useful'},
        ], 'webhook')
        self.client.force_authenticate(self.accounts)
        review = self.client.get('/api/finance/bank-deposits/?status=unmatched').data
        self.assertEqual([item['bank_txn_id'] for item in review], ['L2'])
        matched = self.client.get('/api/finance/bank-deposits/?status=matched').data
        self.assertEqual(matched[0]['student_name'], 'Tendai Moyo')
        self.assertTrue(matched[0]['receipt_no'].startswith('BK-'))
