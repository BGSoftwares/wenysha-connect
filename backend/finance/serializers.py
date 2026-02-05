from rest_framework import serializers
from school.serializers import StudentSerializer
from .models import FeeStructure, Invoice, Payment, Discount


class FeeStructureSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeeStructure
        fields = ['id', 'name', 'amount', 'term', 'form', 'category', 'boarding_type', 'active']


class InvoiceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    student_id_display = serializers.CharField(source='student.student_id', read_only=True)
    class_name = serializers.CharField(source='student.school_class.name', read_only=True)

    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_no', 'student', 'student_name', 'student_id_display', 'class_name',
            'term', 'amount', 'paid', 'status', 'date'
        ]


class PaymentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='invoice.student.name', read_only=True)
    student_id_display = serializers.CharField(source='invoice.student.student_id', read_only=True)
    invoice_no = serializers.CharField(source='invoice.invoice_no', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'receipt_no', 'invoice', 'invoice_no', 'student_name', 'student_id_display',
            'amount', 'method', 'reference', 'date', 'recorded_by'
        ]


class DiscountSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    student_id_display = serializers.CharField(source='student.student_id', read_only=True)

    class Meta:
        model = Discount
        fields = [
            'id', 'student', 'student_name', 'student_id_display', 'discount_type', 'amount',
            'percentage', 'reason', 'status', 'approved_by', 'date'
        ]


class StudentBalanceSerializer(serializers.Serializer):
    """Derived balance per student - computed in view."""
    id = serializers.IntegerField()
    studentId = serializers.CharField(source='student_id')
    student = serializers.CharField()
    class_name = serializers.CharField()
    totalBilled = serializers.DecimalField(max_digits=12, decimal_places=2)
    totalPaid = serializers.DecimalField(max_digits=12, decimal_places=2)
    balance = serializers.DecimalField(max_digits=12, decimal_places=2)
    lastPayment = serializers.CharField()
    status = serializers.CharField()
