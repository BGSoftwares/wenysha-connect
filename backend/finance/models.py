from django.db import models
from django.conf import settings
from school.models import Student


class FeeStructure(models.Model):
    name = models.CharField(max_length=128)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    term = models.CharField(max_length=32)  # Term 1, Term 2, Annual
    form = models.CharField(max_length=32)  # Form 1, All Forms
    category = models.CharField(max_length=64, blank=True)
    boarding_type = models.CharField(max_length=32, blank=True)  # Day Scholar, Boarding, All
    active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} - {self.term} - {self.form}"


class Invoice(models.Model):
    STATUS_CHOICES = [('paid', 'Paid'), ('partial', 'Partial'), ('unpaid', 'Unpaid')]
    invoice_no = models.CharField(max_length=32, unique=True)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='invoices')
    term = models.CharField(max_length=32)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
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

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new:
            # Update the invoice paid amount and recalculate status
            from decimal import Decimal
            add_amount = Decimal(str(self.amount)) if not isinstance(self.amount, Decimal) else self.amount
            self.invoice.paid = (self.invoice.paid or Decimal('0')) + add_amount
            # Call save without restricting update_fields so invoice.status is recalculated
            self.invoice.save()


class Discount(models.Model):
    STATUS_CHOICES = [('approved', 'Approved'), ('pending', 'Pending'), ('rejected', 'Rejected')]
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='discounts')
    discount_type = models.CharField(max_length=64)  # Sibling Discount, Scholarship, etc.
    amount = models.DecimalField(max_digits=12, decimal_places=2)
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
