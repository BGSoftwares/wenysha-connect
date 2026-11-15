from decimal import Decimal
import uuid
from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from rest_framework import serializers
from school.serializers import StudentSerializer
from .models import FeeStructure, Invoice, Payment, Discount


class FeeStructureSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeeStructure
        fields = ['id', 'name', 'amount', 'currency', 'term', 'form', 'category', 'boarding_type', 'active']


class InvoiceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    student_id_display = serializers.CharField(source='student.student_id', read_only=True)
    class_name = serializers.CharField(source='student.school_class.name', read_only=True)

    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_no', 'student', 'student_name', 'student_id_display', 'class_name',
            'term', 'amount', 'currency', 'paid', 'status', 'date'
        ]
        # 'paid' and 'status' are derived from recorded payments; they can never be set by hand.
        read_only_fields = ['paid', 'status']
        extra_kwargs = {'invoice_no': {'required': False}}

    def create(self, validated_data):
        if not validated_data.get('invoice_no'):
            for _ in range(5):
                candidate = f"AGC-{timezone.localdate():%y%m%d}-{uuid.uuid4().hex[:8].upper()}"
                if not Invoice.objects.filter(invoice_no=candidate).exists():
                    validated_data['invoice_no'] = candidate
                    break
        return super().create(validated_data)


class PaymentSerializer(serializers.ModelSerializer):
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal('0.01'))
    student_name = serializers.CharField(source='invoice.student.name', read_only=True)
    student_id_display = serializers.CharField(source='invoice.student.student_id', read_only=True)
    invoice_no = serializers.CharField(source='invoice.invoice_no', read_only=True)
    currency = serializers.CharField(source='invoice.currency', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'receipt_no', 'invoice', 'invoice_no', 'student_name', 'student_id_display',
            'amount', 'currency', 'method', 'reference', 'date', 'recorded_by'
        ]
        extra_kwargs = {
            'receipt_no': {'required': False},
            'recorded_by': {'read_only': True},
        }

    def _check_within_balance(self, invoice, amount, exclude_pk=None):
        recorded = Payment.objects.filter(invoice=invoice)
        if exclude_pk:
            recorded = recorded.exclude(pk=exclude_pk)
        already_paid = recorded.aggregate(total=Sum('amount'))['total'] or Decimal('0')
        remaining = invoice.amount - already_paid
        if amount > remaining:
            raise serializers.ValidationError({'amount': f'This is more than the remaining balance ({remaining}).'})

    def validate(self, attrs):
        invoice = attrs.get('invoice') or getattr(self.instance, 'invoice', None)
        amount = attrs.get('amount', getattr(self.instance, 'amount', None))
        if invoice is not None and amount is not None:
            self._check_within_balance(invoice, amount, getattr(self.instance, 'pk', None))
        return attrs

    @transaction.atomic
    def update(self, instance, validated_data):
        # Lock the invoice so two payments recorded at the same moment cannot both fit.
        invoice = Invoice.objects.select_for_update().get(pk=(validated_data.get('invoice') or instance.invoice).pk)
        amount = validated_data.get('amount', instance.amount)
        self._check_within_balance(invoice, amount, instance.pk)
        return super().update(instance, validated_data)

    @transaction.atomic
    def create(self, validated_data):
        invoice = Invoice.objects.select_for_update().get(pk=validated_data['invoice'].pk)
        self._check_within_balance(invoice, validated_data['amount'])
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['recorded_by'] = request.user
        if not validated_data.get('receipt_no'):
            for _ in range(5):
                candidate = f"AGC-R-{uuid.uuid4().hex[:12].upper()}"
                if not Payment.objects.filter(receipt_no=candidate).exists():
                    validated_data['receipt_no'] = candidate
                    break
        return super().create(validated_data)


class DiscountSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    student_id_display = serializers.CharField(source='student.student_id', read_only=True)

    class Meta:
        model = Discount
        fields = [
            'id', 'student', 'student_name', 'student_id_display', 'discount_type', 'amount', 'currency',
            'percentage', 'reason', 'status', 'approved_by', 'date'
        ]


class StudentBalanceSerializer(serializers.Serializer):
    """Derived balance per student - computed in view."""
    id = serializers.IntegerField()
    student_id = serializers.CharField()
    student = serializers.CharField()
    class_name = serializers.CharField()
    currency = serializers.CharField()
    totalBilled = serializers.DecimalField(max_digits=12, decimal_places=2)
    totalPaid = serializers.DecimalField(max_digits=12, decimal_places=2)
    balance = serializers.DecimalField(max_digits=12, decimal_places=2)
    lastPayment = serializers.CharField()
    status = serializers.CharField()
