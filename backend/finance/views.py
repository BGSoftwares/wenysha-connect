from decimal import Decimal
from django.db.models import Sum
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from school.models import Student
from .models import FeeStructure, Invoice, Payment, Discount
from .serializers import (
    FeeStructureSerializer,
    InvoiceSerializer,
    PaymentSerializer,
    DiscountSerializer,
    StudentBalanceSerializer,
)


class FeeStructureViewSet(viewsets.ModelViewSet):
    queryset = FeeStructure.objects.all()
    serializer_class = FeeStructureSerializer
    filterset_fields = ['term', 'form', 'active']


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.select_related('student', 'student__school_class').all()
    serializer_class = InvoiceSerializer
    filterset_fields = ['student', 'term', 'status']


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related('invoice', 'invoice__student').all()
    serializer_class = PaymentSerializer
    filterset_fields = ['invoice', 'method']


class DiscountViewSet(viewsets.ModelViewSet):
    queryset = Discount.objects.select_related('student').all()
    serializer_class = DiscountSerializer
    filterset_fields = ['student', 'status']


class BalancesViewSet(viewsets.ViewSet):
    """List student balances (derived from invoices and payments)."""

    def list(self, request):
        students = Student.objects.select_related('school_class').all()
        balances = []
        for s in students:
            inv_agg = Invoice.objects.filter(student=s).aggregate(
                total_billed=Sum('amount'), total_paid=Sum('paid')
            )
            total_billed = inv_agg['total_billed'] or Decimal('0')
            total_paid = inv_agg['total_paid'] or Decimal('0')
            balance = total_billed - total_paid
            last_payment = Payment.objects.filter(invoice__student=s).order_by('-date').first()
            last_payment_str = last_payment.date.isoformat() if last_payment else '-'
            if balance <= 0 and total_billed > 0:
                status_str = 'cleared' if balance == 0 else 'overpaid'
            else:
                status_str = 'owing'
            balances.append({
                'id': s.id,
                'student_id': s.student_id,
                'student': s.name,
                'class_name': s.school_class.name,
                'totalBilled': total_billed,
                'totalPaid': total_paid,
                'balance': balance,
                'lastPayment': last_payment_str,
                'status': status_str,
            })
        ser = StudentBalanceSerializer(balances, many=True)
        return Response(ser.data)
