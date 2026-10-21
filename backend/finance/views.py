import re
import uuid
from decimal import Decimal, InvalidOperation
from django.conf import settings
from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from rest_framework import viewsets, status, permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.views import APIView
from rest_framework.response import Response
from school.models import Student
from parents.models import StudentParent
from core.roles import portal_role
from .models import FeeStructure, Invoice, Payment, Discount, OnlinePayment
from .gateways import (
    GatewayError, GatewayNotConfigured, online_payment_config,
    refresh_provider_status, start_ecocash_payment, start_zimswitch_checkout,
)
from .serializers import (
    FeeStructureSerializer,
    InvoiceSerializer,
    PaymentSerializer,
    DiscountSerializer,
    StudentBalanceSerializer,
)


class FinanceStaffWriteMixin:
    """Only Accounts and Admin can create or alter financial records."""

    def _require_finance_staff(self):
        if portal_role(self.request.user) not in {'admin', 'accounts'}:
            raise PermissionDenied('Only Accounts or Admin can change finance records.')

    def perform_create(self, serializer):
        self._require_finance_staff()
        serializer.save()

    def perform_update(self, serializer):
        self._require_finance_staff()
        serializer.save()

    def perform_destroy(self, instance):
        self._require_finance_staff()
        instance.delete()


class FeeStructureViewSet(FinanceStaffWriteMixin, viewsets.ModelViewSet):
    queryset = FeeStructure.objects.all()
    serializer_class = FeeStructureSerializer
    filterset_fields = ['term', 'form', 'active']


class InvoiceViewSet(FinanceStaffWriteMixin, viewsets.ModelViewSet):
    queryset = Invoice.objects.select_related('student', 'student__school_class').all()
    serializer_class = InvoiceSerializer
    filterset_fields = ['student', 'term', 'status']

    def get_queryset(self):
        queryset = super().get_queryset()
        if portal_role(self.request.user) not in {'admin', 'accounts'}:
            queryset = queryset.filter(student_id__in=_student_ids_for_user(self.request.user))
        return queryset


class PaymentViewSet(FinanceStaffWriteMixin, viewsets.ModelViewSet):
    queryset = Payment.objects.select_related('invoice', 'invoice__student').all()
    serializer_class = PaymentSerializer
    filterset_fields = ['invoice', 'method', 'invoice__student']

    def get_queryset(self):
        queryset = super().get_queryset()
        if portal_role(self.request.user) not in {'admin', 'accounts'}:
            queryset = queryset.filter(invoice__student_id__in=_student_ids_for_user(self.request.user))
        return queryset


class DiscountViewSet(FinanceStaffWriteMixin, viewsets.ModelViewSet):
    queryset = Discount.objects.select_related('student').all()
    serializer_class = DiscountSerializer
    filterset_fields = ['student', 'status']

    def get_queryset(self):
        queryset = super().get_queryset()
        if portal_role(self.request.user) not in {'admin', 'accounts'}:
            queryset = queryset.filter(student_id__in=_student_ids_for_user(self.request.user))
        return queryset


class BalancesViewSet(viewsets.ViewSet):
    """List student balances (derived from invoices and payments)."""

    def list(self, request):
        students = Student.objects.select_related('school_class').all()
        if portal_role(request.user) not in {'admin', 'accounts'}:
            students = students.filter(pk__in=_student_ids_for_user(request.user))
        balances = []
        for s in students:
            currencies = Invoice.objects.filter(student=s).values_list('currency', flat=True).distinct()
            for currency in currencies:
                inv_agg = Invoice.objects.filter(student=s, currency=currency).aggregate(
                    total_billed=Sum('amount'), total_paid=Sum('paid')
                )
                total_billed = inv_agg['total_billed'] or Decimal('0')
                total_paid = inv_agg['total_paid'] or Decimal('0')
                balance = total_billed - total_paid
                last_payment = Payment.objects.filter(invoice__student=s, invoice__currency=currency).order_by('-date').first()
                last_payment_str = last_payment.date.isoformat() if last_payment else '-'
                if balance <= 0 and total_billed > 0:
                    status_str = 'cleared' if balance == 0 else 'overpaid'
                else:
                    status_str = 'owing'
                balances.append({
                    'id': s.id,
                    'student_id': s.student_id,
                    'student': s.name,
                    'class_name': s.school_class.name if s.school_class else '',
                    'currency': currency,
                    'totalBilled': total_billed,
                    'totalPaid': total_paid,
                    'balance': balance,
                    'lastPayment': last_payment_str,
                    'status': status_str,
                })
        ser = StudentBalanceSerializer(balances, many=True)
        return Response(ser.data)


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
        'created_at': intent.created_at.isoformat(),
        'updated_at': intent.updated_at.isoformat(),
    }


@transaction.atomic
def _reserve_invoice_payment(invoice_id, provider, amount, reference, phone, user):
    invoice = Invoice.objects.select_for_update().get(pk=invoice_id)
    outstanding = invoice.amount - invoice.paid
    has_pending = OnlinePayment.objects.filter(invoice=invoice, status='pending').exists()
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


@transaction.atomic
def _record_verified_online_payment(intent, provider_reference=''):
    intent = OnlinePayment.objects.select_for_update().select_related('invoice', 'created_by').get(pk=intent.pk)
    if intent.status == 'paid':
        return intent
    invoice = Invoice.objects.select_for_update().get(pk=intent.invoice_id)
    receipt_no = f"ON-{uuid.uuid4().hex[:12].upper()}"
    Payment.objects.create(
        receipt_no=receipt_no,
        invoice=invoice,
        amount=intent.amount,
        method='EcoCash Online' if intent.provider == 'ecocash' else 'ZimSwitch Online',
        reference=(provider_reference or intent.client_reference)[:64],
        date=timezone.localdate(),
        recorded_by=intent.created_by,
    )
    intent.status = 'paid'
    intent.provider_reference = (provider_reference or intent.provider_reference)[:64]
    intent.save(update_fields=['status', 'provider_reference', 'updated_at'])
    return intent


def _refresh_intent(intent):
    if intent.status != 'pending':
        return intent, ''
    try:
        result = refresh_provider_status(intent)
    except (GatewayError, GatewayNotConfigured):
        return intent, 'The payment is still being confirmed. Check again shortly.'
    if result['status'] == 'paid':
        return _record_verified_online_payment(intent, result.get('provider_reference', '')), ''
    if result['status'] == 'failed':
        intent.status = 'failed'
        intent.error_code = result.get('error_code', '')[:64]
    else:
        intent.provider_reference = result.get('provider_reference', intent.provider_reference)[:64]
    intent.save(update_fields=['status', 'provider_reference', 'error_code', 'updated_at'])
    return intent, ''


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
        return Response([_online_payment_payload(item) for item in queryset[:200]])

    def post(self, request):
        try:
            invoice = Invoice.objects.select_related('student').get(pk=request.data.get('invoice'))
        except (Invoice.DoesNotExist, TypeError, ValueError):
            return Response({'detail': 'Select a valid school invoice.'}, status=status.HTTP_400_BAD_REQUEST)
        if not _can_access_invoice(request.user, invoice):
            return Response({'detail': 'You cannot pay this student invoice.'}, status=status.HTTP_403_FORBIDDEN)

        provider = str(request.data.get('provider', '')).strip().lower()
        if provider not in {'ecocash', 'zimswitch'}:
            return Response({'detail': 'Choose EcoCash or ZimSwitch Online.'}, status=status.HTTP_400_BAD_REQUEST)
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

        phone = ''
        if provider == 'ecocash':
            raw_phone = re.sub(r'[^0-9]', '', str(request.data.get('phone', '')))
            if raw_phone.startswith('0'):
                raw_phone = f"263{raw_phone[1:]}"
            if raw_phone.startswith('7'):
                raw_phone = f"263{raw_phone}"
            if not re.fullmatch(r'2637\d{8}', raw_phone):
                return Response({'detail': 'Enter a Zimbabwe mobile number such as 077 123 4567.'}, status=status.HTTP_400_BAD_REQUEST)
            phone = raw_phone

        reference = f"AGC-{uuid.uuid4().hex[:20].upper()}"
        try:
            intent = _reserve_invoice_payment(invoice.pk, provider, amount, reference, phone, request.user)
        except ValueError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_409_CONFLICT)
        try:
            if provider == 'ecocash':
                result = start_ecocash_payment(intent, phone)
                if result['status'] == 'paid':
                    intent = _record_verified_online_payment(intent, result.get('provider_reference', ''))
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


class OnlinePaymentRefreshView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, client_reference):
        try:
            intent = OnlinePayment.objects.select_related('invoice__student').get(client_reference=client_reference)
        except OnlinePayment.DoesNotExist:
            return Response({'detail': 'Online payment not found.'}, status=status.HTTP_404_NOT_FOUND)
        if not _can_access_invoice(request.user, intent.invoice):
            return Response({'detail': 'You cannot view this online payment.'}, status=status.HTTP_403_FORBIDDEN)
        intent, message = _refresh_intent(intent)
        return Response({**_online_payment_payload(intent), 'message': message})
