from datetime import date
from decimal import Decimal
from unittest import mock
from urllib.parse import urlencode

from django.contrib.auth.models import User
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from core.models import Role, UserProfile
from finance import gateways
from finance.models import Invoice, OnlinePayment, Payment
from parents.models import Parent, StudentParent
from school.models import SchoolClass, Student

KEY = 'test-integration-key'
ENV = {'PAYNOW_INTEGRATION_ID': '1234', 'PAYNOW_INTEGRATION_KEY': KEY, 'PAYNOW_AUTH_EMAIL': 'merchant@example.com'}


def signed(fields):
    """Build a Paynow message the way Paynow does: values in order, then the key, SHA512."""
    values = [v for _, v in fields]
    return urlencode(fields + [('hash', gateways.paynow_hash(values))])


class PaynowTests(TestCase):
    def setUp(self):
        patcher = mock.patch.dict('os.environ', ENV)
        patcher.start()
        self.addCleanup(patcher.stop)
        self.cls = SchoolClass.objects.create(name='Paynow Form 1')
        self.student = Student.objects.create(name='Paynow Child', school_class=self.cls)
        self.user = User.objects.create_user(username='paynow_parent', password='pwd-Strong-123', email='p@example.com')
        role, _ = Role.objects.get_or_create(name='Parent')
        UserProfile.objects.create(user=self.user, role=role)
        parent = Parent.objects.create(user=self.user, name='Paynow Parent')
        StudentParent.objects.create(student=self.student, parent=parent)
        self.invoice = Invoice.objects.create(
            invoice_no='AGC-PN-0001', student=self.student, term='Term 1', amount=Decimal('100.00'), date=date.today(),
        )
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def start(self, **extra):
        poll = 'https://www.paynow.co.zw/Interface/CheckPayment/?guid=abc'
        reply = signed([('status', 'Ok'), ('browserurl', 'https://www.paynow.co.zw/Payment/ConfirmPayment/abc'),
                        ('pollurl', poll), ('paynowreference', 'PN-1')])
        with mock.patch.object(gateways, '_paynow_post', return_value=reply) as post, override_settings(
            CORS_ALLOWED_ORIGINS=['http://localhost:5173'], DEBUG=True,
        ):
            response = self.client.post(
                '/api/finance/online-payments/',
                {'invoice': self.invoice.pk, 'amount': '40.00', 'provider': 'paynow', **extra},
                format='json', headers={'Origin': 'http://localhost:5173'},
            )
        return response, post

    def result_for(self, intent, status='Paid', amount='40.00', key=KEY):
        fields = [('reference', intent.client_reference), ('paynowreference', 'PN-1'), ('amount', amount),
                  ('status', status), ('pollurl', intent.checkout_id)]
        message = signed(fields)
        if key != KEY:
            message = urlencode(fields + [('hash', 'BAD')])
        return message

    def test_it_is_switched_on_only_when_credentials_are_set(self):
        self.assertTrue(gateways.online_payment_config()['providers']['paynow']['enabled'])
        with mock.patch.dict('os.environ', {'PAYNOW_INTEGRATION_KEY': ''}):
            self.assertFalse(gateways.online_payment_config()['providers']['paynow']['enabled'])

    def test_web_checkout_returns_the_paynow_page_and_stores_the_status_address(self):
        response, post = self.start()
        self.assertEqual(response.status_code, 201, response.data)
        self.assertIn('paynow.co.zw/Payment/ConfirmPayment', response.data['redirect_url'])
        intent = OnlinePayment.objects.get()
        self.assertEqual((intent.provider, intent.status), ('paynow', 'pending'))
        self.assertIn('CheckPayment', intent.checkout_id)
        sent = post.call_args.args[1]
        self.assertEqual(post.call_args.args[0].rsplit('/', 1)[-1], 'initiatetransaction')
        # The request we sign must verify with the same rule Paynow uses.
        ordered = ['id', 'reference', 'amount', 'additionalinfo', 'returnurl', 'resulturl', 'authemail', 'status']
        self.assertEqual(sent['hash'], gateways.paynow_hash([sent[name] for name in ordered]))

    def test_mobile_payment_uses_the_remote_endpoint_with_a_local_phone_number(self):
        response, post = self.start(paynow_method='ecocash', phone='0771234567')
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(post.call_args.args[0].rsplit('/', 1)[-1], 'remotetransaction')
        self.assertEqual(post.call_args.args[1]['phone'], '0771234567')
        self.assertEqual(post.call_args.args[1]['method'], 'ecocash')

    def test_a_reply_with_a_wrong_signature_is_rejected(self):
        bad = urlencode([('status', 'Ok'), ('browserurl', 'x'), ('pollurl', 'https://www.paynow.co.zw/a'), ('hash', 'NOPE')])
        with mock.patch.object(gateways, '_paynow_post', return_value=bad), override_settings(
            CORS_ALLOWED_ORIGINS=['http://localhost:5173'], DEBUG=True,
        ):
            response = self.client.post('/api/finance/online-payments/', {'invoice': self.invoice.pk, 'amount': '40', 'provider': 'paynow'},
                                        format='json', headers={'Origin': 'http://localhost:5173'})
        self.assertEqual(response.status_code, 502)
        self.assertEqual(OnlinePayment.objects.get().status, 'failed')

    def test_a_status_address_outside_paynow_is_refused(self):
        reply = signed([('status', 'Ok'), ('browserurl', 'https://www.paynow.co.zw/x'), ('pollurl', 'https://evil.example.com/poll')])
        with mock.patch.object(gateways, '_paynow_post', return_value=reply), override_settings(
            CORS_ALLOWED_ORIGINS=['http://localhost:5173'], DEBUG=True,
        ):
            response = self.client.post('/api/finance/online-payments/', {'invoice': self.invoice.pk, 'amount': '40', 'provider': 'paynow'},
                                        format='json', headers={'Origin': 'http://localhost:5173'})
        self.assertEqual(response.status_code, 502)

    def test_a_confirmed_result_credits_the_invoice_once(self):
        self.start()
        intent = OnlinePayment.objects.get()
        anon = APIClient()
        confirm = self.result_for(intent)
        with mock.patch.object(gateways, '_paynow_post', return_value=confirm):
            first = anon.post('/api/finance/paynow/result/', confirm, content_type='application/x-www-form-urlencoded')
            second = anon.post('/api/finance/paynow/result/', confirm, content_type='application/x-www-form-urlencoded')
        self.assertEqual((first.status_code, second.status_code), (200, 200))
        intent.refresh_from_db()
        self.invoice.refresh_from_db()
        self.assertEqual(intent.status, 'paid')
        self.assertEqual(Payment.objects.count(), 1)
        self.assertEqual(self.invoice.paid, Decimal('40.00'))

    def test_a_forged_result_post_is_rejected_and_credits_nothing(self):
        self.start()
        intent = OnlinePayment.objects.get()
        response = APIClient().post('/api/finance/paynow/result/', self.result_for(intent, key='wrong'),
                                    content_type='application/x-www-form-urlencoded')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Payment.objects.count(), 0)

    def test_a_signed_post_is_not_trusted_without_paynow_confirming_it(self):
        self.start()
        intent = OnlinePayment.objects.get()
        posted = self.result_for(intent)  # says Paid
        pending = signed([('reference', intent.client_reference), ('paynowreference', 'PN-1'), ('amount', '40.00'),
                          ('status', 'Sent'), ('pollurl', intent.checkout_id)])
        with mock.patch.object(gateways, '_paynow_post', return_value=pending):
            APIClient().post('/api/finance/paynow/result/', posted, content_type='application/x-www-form-urlencoded')
        self.assertEqual(Payment.objects.count(), 0)
        self.assertEqual(OnlinePayment.objects.get().status, 'pending')

    def test_a_different_amount_from_paynow_is_never_credited(self):
        self.start()
        intent = OnlinePayment.objects.get()
        wrong = self.result_for(intent, amount='1.00')
        with mock.patch.object(gateways, '_paynow_post', return_value=wrong):
            APIClient().post('/api/finance/paynow/result/', wrong, content_type='application/x-www-form-urlencoded')
        self.assertEqual(Payment.objects.count(), 0)

    def test_a_failed_result_marks_the_payment_failed(self):
        self.start()
        intent = OnlinePayment.objects.get()
        failed = self.result_for(intent, status='Cancelled')
        with mock.patch.object(gateways, '_paynow_post', return_value=failed):
            APIClient().post('/api/finance/paynow/result/', failed, content_type='application/x-www-form-urlencoded')
        self.assertEqual(OnlinePayment.objects.get().status, 'failed')
