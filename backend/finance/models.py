from decimal import Decimal
from django.db import models, transaction
from django.db.models import Sum
from django.conf import settings
from school.models import Student


class FeeStructure(models.Model):
    CURRENCY_CHOICES = [('USD', 'US Dollar'), ('ZWG', 'Zimbabwe Gold (ZiG)')]
    name = models.CharField(max_length=128)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default='USD')
    term = models.CharField(max_length=32)  # Term 1, Term 2, Annual
    form = models.CharField(max_length=32)  # Form 1, All Forms
    category = models.CharField(max_length=64, blank=True)
    boarding_type = models.CharField(max_length=32, blank=True)  # Day Scholar, Boarding, All
    active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} - {self.term} - {self.form}"


class Invoice(models.Model):
    STATUS_CHOICES = [('paid', 'Paid'), ('partial', 'Partial'), ('unpaid', 'Unpaid')]
    CURRENCY_CHOICES = FeeStructure.CURRENCY_CHOICES
    invoice_no = models.CharField(max_length=32, unique=True)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='invoices')
    term = models.CharField(max_length=32)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default='USD')
    paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='unpaid')
    date = models.DateField()

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"{self.invoice_no} - {self.student.name}"

    def save(self, *args, **kwargs):
        if self.paid >= self.amount:
            self.status = 'paid'
        elif self.paid > 0:
            self.status = 'partial'
        else:
            self.status = 'unpaid'
        update_fields = kwargs.get('update_fields')
        if update_fields:
            kwargs['update_fields'] = set(update_fields) | {'status'}
        super().save(*args, **kwargs)


class Payment(models.Model):
    receipt_no = models.CharField(max_length=32, unique=True)
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    method = models.CharField(max_length=32)  # Cash, Bank Transfer, Mobile Money, POS
    reference = models.CharField(max_length=64, blank=True)
    date = models.DateField()
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='recorded_payments'
    )

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"{self.receipt_no} - {self.amount}"

    @staticmethod
    def _sync_invoice_paid(invoice_id):
        invoice = Invoice.objects.select_for_update().get(pk=invoice_id)
        total_paid = Payment.objects.filter(invoice_id=invoice_id).aggregate(total=Sum('amount'))['total']
        invoice.paid = total_paid or Decimal('0')
        invoice.save(update_fields=['paid'])

    def save(self, *args, **kwargs):
        with transaction.atomic():
            previous_invoice_id = None
            if self.pk:
                previous_invoice_id = (
                    type(self).objects.select_for_update()
                    .filter(pk=self.pk)
                    .values_list('invoice_id', flat=True)
                    .first()
                )
            invoice_ids = sorted({invoice_id for invoice_id in (previous_invoice_id, self.invoice_id) if invoice_id})
            # Serialize payment changes for each affected invoice so concurrent
            # receipts cannot overwrite one another's totals.
            list(Invoice.objects.select_for_update().filter(pk__in=invoice_ids).order_by('pk'))
            super().save(*args, **kwargs)
            for invoice_id in invoice_ids:
                self._sync_invoice_paid(invoice_id)

    def delete(self, *args, **kwargs):
        invoice_id = self.invoice_id
        with transaction.atomic():
            Invoice.objects.select_for_update().get(pk=invoice_id)
            result = super().delete(*args, **kwargs)
            self._sync_invoice_paid(invoice_id)
            return result


class Discount(models.Model):
    STATUS_CHOICES = [('approved', 'Approved'), ('pending', 'Pending'), ('rejected', 'Rejected')]
    CURRENCY_CHOICES = FeeStructure.CURRENCY_CHOICES
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='discounts')
    discount_type = models.CharField(max_length=64)  # Sibling Discount, Scholarship, etc.
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default='USD')
    percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    reason = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_discounts'
    )
    date = models.DateField()

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"{self.student.name} - {self.discount_type} - {self.amount}"


class OnlinePayment(models.Model):
    PROVIDER_CHOICES = [('ecocash', 'EcoCash'), ('zimswitch', 'ZimSwitch')]
    STATUS_CHOICES = [
        ('pending', 'Pending'), ('paid', 'Paid'), ('failed', 'Failed'), ('cancelled', 'Cancelled')
    ]

    invoice = models.ForeignKey(Invoice, on_delete=models.PROTECT, related_name='online_payments')
    provider = models.CharField(max_length=16, choices=PROVIDER_CHOICES)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='pending')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, choices=FeeStructure.CURRENCY_CHOICES, default='USD')
    client_reference = models.CharField(max_length=64, unique=True)
    payer_phone = models.CharField(max_length=16, blank=True)
    provider_reference = models.CharField(max_length=64, blank=True)
    checkout_id = models.CharField(max_length=128, blank=True)
    error_code = models.CharField(max_length=64, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='online_fee_payments'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.provider} {self.client_reference} - {self.status}"
