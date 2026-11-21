import os
import re
import uuid
from core.roles import portal_role
from decimal import Decimal, InvalidOperation
from django.conf import settings
from django.db import transaction
from parents.models import StudentParent
from rest_framework import permissions, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView
from school.models import Student
from ..gateways import GatewayError, GatewayNotConfigured, online_payment_config, parse_paynow_message, start_ecocash_payment, start_paynow_payment, start_zimswitch_checkout
from ..models import Invoice, OnlinePayment
from ..services import record_verified_online_payment, refresh_intent


def _student_ids_for_user(user):
    student_ids = set(Student.objects.filter(user=user).values_list('id', flat=True))
    student_ids.update(StudentParent.objects.filter(parent__user=user).values_list('student_id', flat=True))
    return student_ids


def _can_access_invoice(user, invoice):
    if portal_role(user) in {'admin', 'accounts'}:
        return True
    return invoice.student_id in _student_ids_for_user(user)


def _online_payment_payload(intent):
    return {
        'id': intent.id,
        'invoice': intent.invoice_id,
        'invoice_no': intent.invoice.invoice_no,
        'student_name': intent.invoice.student.name,
        'provider': intent.provider,
        'status': intent.status,
        'amount': str(intent.amount),
        'currency': intent.currency,
        'client_reference': intent.client_reference,
        'provider_reference': intent.provider_reference,
        'checkout_id': intent.checkout_id,
        'created_at': intent.created_at.isoformat(),
        'updated_at': intent.updated_at.isoformat(),
    }


@transaction.atomic
def _reserve_invoice_payment(invoice_id, provider, amount, reference, phone, user):
    invoice = Invoice.objects.select_for_update().get(pk=invoice_id)
    outstanding = invoice.amount - invoice.paid
    # A parent's bank-transfer note is only a message to Accounts; it must not block a card or wallet payment.
    has_pending = OnlinePayment.objects.filter(invoice=invoice, status='pending').exclude(provider='bank_transfer').exists()
    if has_pending:
        raise ValueError('This invoice already has a payment awaiting confirmation. Check its status before starting another checkout.')
    if amount <= 0 or amount > outstanding:
        raise ValueError('Payment amount must be positive and no greater than the invoice balance.')
    return OnlinePayment.objects.create(
        invoice=invoice,
        provider=provider,
        amount=amount,
        currency=invoice.currency,
        client_reference=reference,
        payer_phone=phone,
        created_by=user,
    )


class OnlinePaymentConfigView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(online_payment_config())


class OnlinePaymentListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        queryset = OnlinePayment.objects.select_related('invoice__student').all()
        role = portal_role(request.user)
        if role not in {'admin', 'accounts'}:
            queryset = queryset.filter(invoice__student_id__in=_student_ids_for_user(request.user))
        invoice_id = request.query_params.get('invoice')
        if invoice_id:
            try:
                invoice_id = int(invoice_id)
            except (TypeError, ValueError):
                return Response({'detail': 'Select a valid school invoice.'}, status=status.HTTP_400_BAD_REQUEST)
            queryset = queryset.filter(invoice_id=invoice_id)
        payment_status = request.query_params.get('status')
        if payment_status:
            queryset = queryset.filter(status=payment_status)
        return Response([_online_payment_payload(item) for item in queryset[:200]])

    def post(self, request):
        try:
            invoice = Invoice.objects.select_related('student').get(pk=request.data.get('invoice'))
        except (Invoice.DoesNotExist, TypeError, ValueError):
            return Response({'detail': 'Select a valid school invoice.'}, status=status.HTTP_400_BAD_REQUEST)
        if not _can_access_invoice(request.user, invoice):
            return Response({'detail': 'You cannot pay this student invoice.'}, status=status.HTTP_403_FORBIDDEN)

        provider = str(request.data.get('provider', '')).strip().lower()
        if provider not in {'ecocash', 'zimswitch', 'paynow', 'bank_transfer'}:
            return Response({'detail': 'Choose EcoCash, Paynow or ZimSwitch Online.'}, status=status.HTTP_400_BAD_REQUEST)
        provider_config = online_payment_config()['providers'][provider]
        if not provider_config['enabled']:
            return Response({'detail': f"{provider.title()} Online Payments is not configured for this school yet."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        if invoice.currency not in provider_config['currencies']:
            return Response({'detail': f"{provider.title()} is not enabled for {invoice.currency} invoices."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            amount = Decimal(str(request.data.get('amount', ''))).quantize(Decimal('0.01'))
        except (InvalidOperation, ValueError):
            return Response({'detail': 'Enter a valid payment amount.'}, status=status.HTTP_400_BAD_REQUEST)
        if not amount.is_finite():
            return Response({'detail': 'Enter a valid payment amount.'}, status=status.HTTP_400_BAD_REQUEST)
        if amount <= 0:
            return Response({'detail': 'Payment amount must be greater than zero.'}, status=status.HTTP_400_BAD_REQUEST)

        paynow_method = str(request.data.get('paynow_method', 'web')).strip().lower() if provider == 'paynow' else ''
        if provider == 'paynow' and paynow_method not in {'web', 'ecocash', 'onemoney'}:
            return Response({'detail': 'Choose how you want to pay with Paynow.'}, status=status.HTTP_400_BAD_REQUEST)

        phone = ''
        if provider == 'ecocash' or (provider == 'paynow' and paynow_method != 'web'):
            raw_phone = re.sub(r'[^0-9]', '', str(request.data.get('phone', '')))
            if raw_phone.startswith('0'):
                raw_phone = f"263{raw_phone[1:]}"
            if raw_phone.startswith('7'):
                raw_phone = f"263{raw_phone}"
            if not re.fullmatch(r'2637\d{8}', raw_phone):
                return Response({'detail': 'Enter a Zimbabwe mobile number such as 077 123 4567.'}, status=status.HTTP_400_BAD_REQUEST)
            phone = raw_phone

        reference = f"NBS-{uuid.uuid4().hex[:16].upper()}" if provider == 'bank_transfer' else f"AGC-{uuid.uuid4().hex[:20].upper()}"
        try:
            intent = _reserve_invoice_payment(invoice.pk, provider, amount, reference, phone, request.user)
        except ValueError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_409_CONFLICT)
        try:
            if provider == 'bank_transfer':
                bank_ref = str(request.data.get('reference', '')).strip()[:64]
                if bank_ref:
                    intent.provider_reference = bank_ref
                    intent.save(update_fields=['provider_reference', 'updated_at'])
                return Response({
                    **_online_payment_payload(intent),
                    'message': 'NBS bank transfer recorded. Once verified by Accounts, your fee ledger and receipts will update automatically.',
                    'bank_account': online_payment_config().get('bank_account'),
                }, status=status.HTTP_201_CREATED)

            if provider == 'ecocash':
                result = start_ecocash_payment(intent, phone)
                if result['status'] == 'paid':
                    intent = record_verified_online_payment(intent, result.get('provider_reference', ''))
                else:
                    intent.status = result['status']
                    intent.provider_reference = result.get('provider_reference', '')[:64]
                    intent.error_code = result.get('error_code', '')[:64]
                    intent.save(update_fields=['status', 'provider_reference', 'error_code', 'updated_at'])
                return Response({**_online_payment_payload(intent), 'message': 'Approve the EcoCash prompt on your phone.'}, status=status.HTTP_201_CREATED)

            origin = request.headers.get('Origin', '').rstrip('/')
            allowed_origins = set(getattr(settings, 'CORS_ALLOWED_ORIGINS', []))
            if not origin or origin not in allowed_origins or (not settings.DEBUG and not origin.startswith('https://')):
                intent.status = 'failed'
                intent.save(update_fields=['status', 'updated_at'])
                return Response({'detail': 'The secure checkout return address is not allowed.'}, status=status.HTTP_400_BAD_REQUEST)

            if provider == 'paynow':
                started = start_paynow_payment(
                    intent,
                    return_url=f"{origin}/payment/return?ref={reference}",
                    result_url=os.environ.get('PAYNOW_RESULT_URL', '').strip() or f"{origin}/api/finance/paynow/result/",
                    method=paynow_method,
                    # Paynow wants the local format, e.g. 0771234567.
                    phone=f"0{phone[-9:]}" if phone else '',
                    auth_email=request.user.email or '',
                )
                intent.checkout_id = started['poll_url'][:128]
                intent.provider_reference = started['provider_reference'][:64]
                intent.save(update_fields=['checkout_id', 'provider_reference', 'updated_at'])
                return Response({
                    **_online_payment_payload(intent),
                    'redirect_url': started['redirect_url'],
                    'message': started['instructions'] or 'Continue on the Paynow page to pay.',
                }, status=status.HTTP_201_CREATED)

            return_url = f"{origin}/payment/return?ref={reference}"
            checkout = start_zimswitch_checkout(intent, return_url)
            intent.checkout_id = checkout['checkout_id'][:128]
            intent.save(update_fields=['checkout_id', 'updated_at'])
            return Response({
                **_online_payment_payload(intent),
                'checkout_id': intent.checkout_id,
                'widget_url': checkout['widget_url'],
                'brands': checkout['brands'],
                'shopper_result_url': checkout['shopper_result_url'],
            }, status=status.HTTP_201_CREATED)
        except GatewayNotConfigured as exc:
            intent.status = 'failed'
            intent.save(update_fields=['status', 'updated_at'])
            return Response({'detail': str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except GatewayError as exc:
            intent.status = 'failed'
            intent.save(update_fields=['status', 'updated_at'])
            return Response({'detail': str(exc), 'client_reference': reference}, status=status.HTTP_502_BAD_GATEWAY)


class PaynowResultView(APIView):
    """Paynow posts the result of a payment here. The signature is checked, then the payment is confirmed
    by asking Paynow directly, so a forged or replayed post can never credit a student."""
    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    throttle_classes = []

    def post(self, request):
        raw = request.body.decode('utf-8', 'replace')
        try:
            fields = parse_paynow_message(raw)
        except GatewayError:
            return Response({'detail': 'Invalid signature.'}, status=status.HTTP_400_BAD_REQUEST)
        intent = OnlinePayment.objects.select_related('invoice__student').filter(
            client_reference=fields.get('reference', ''), provider='paynow',
        ).first()
        if intent is None:
            return Response({'detail': 'Unknown payment.'}, status=status.HTTP_404_NOT_FOUND)
        refresh_intent(intent)
        return Response({'status': 'ok'})


class OnlinePaymentRefreshView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, client_reference):
        try:
            intent = OnlinePayment.objects.select_related('invoice__student').get(client_reference=client_reference)
        except OnlinePayment.DoesNotExist:
            return Response({'detail': 'Online payment not found.'}, status=status.HTTP_404_NOT_FOUND)
        if not _can_access_invoice(request.user, intent.invoice):
            return Response({'detail': 'You cannot view this online payment.'}, status=status.HTTP_403_FORBIDDEN)
        intent, message = refresh_intent(intent)
        return Response({**_online_payment_payload(intent), 'message': message})


class OnlinePaymentConfirmView(APIView):
    """Allows Accounts or Admin to confirm an online payment or bank transfer."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, client_reference):
        if portal_role(request.user) not in {'admin', 'accounts'}:
            raise PermissionDenied('Only Accounts or Admin can confirm payments.')
        try:
            intent = OnlinePayment.objects.select_related('invoice__student').get(client_reference=client_reference)
        except OnlinePayment.DoesNotExist:
            return Response({'detail': 'Payment intent not found.'}, status=status.HTTP_404_NOT_FOUND)
        if intent.status == 'paid':
            return Response({**_online_payment_payload(intent), 'message': 'Payment already confirmed.'})
        ref = request.data.get('provider_reference') or intent.provider_reference or intent.client_reference
        intent = record_verified_online_payment(intent, provider_reference=ref)
        return Response({
            **_online_payment_payload(intent),
            'message': 'Payment confirmed and credited to student fee ledger.',
        })


# --------------------------------------------------------------------------- bank deposits
