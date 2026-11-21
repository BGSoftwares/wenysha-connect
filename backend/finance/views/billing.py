from core.roles import portal_role
from decimal import Decimal
from django.db.models import Max, Sum
from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from school.models import Student
from ..models import Discount, FeeStructure, Invoice, Payment
from ..serializers import DiscountSerializer, FeeStructureSerializer, InvoiceSerializer, PaymentSerializer, StudentBalanceSerializer
from .online import _student_ids_for_user


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
        students = Student.objects.all()
        if portal_role(request.user) not in {'admin', 'accounts'}:
            students = students.filter(pk__in=_student_ids_for_user(request.user))
        student_ids = list(students.values_list('pk', flat=True))
        invoice_totals = Invoice.objects.filter(student_id__in=student_ids).values(
            'student_id', 'student__student_id', 'student__name',
            'student__school_class__name', 'currency',
        ).annotate(total_billed=Sum('amount'), total_paid=Sum('paid'))
        payment_dates = {
            (row['invoice__student_id'], row['invoice__currency']): row['last_payment']
            for row in Payment.objects.filter(invoice__student_id__in=student_ids)
            .values('invoice__student_id', 'invoice__currency')
            .annotate(last_payment=Max('date'))
        }
        balances = []
        for row in invoice_totals:
            total_billed = row['total_billed'] or Decimal('0')
            total_paid = row['total_paid'] or Decimal('0')
            balance = total_billed - total_paid
            last_payment = payment_dates.get((row['student_id'], row['currency']))
            if balance <= 0 and total_billed > 0:
                status_str = 'cleared' if balance == 0 else 'overpaid'
            else:
                status_str = 'owing'
            balances.append({
                'id': row['student_id'],
                'student_id': row['student__student_id'],
                'student': row['student__name'],
                'class_name': row['student__school_class__name'] or '',
                'currency': row['currency'],
                'totalBilled': total_billed,
                'totalPaid': total_paid,
                'balance': balance,
                'lastPayment': last_payment.isoformat() if last_payment else '-',
                'status': status_str,
            })
        ser = StudentBalanceSerializer(balances, many=True)
        return Response(ser.data)
