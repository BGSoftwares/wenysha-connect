from django.contrib import admin
from .models import FeeStructure, Invoice, Payment, Discount


@admin.register(FeeStructure)
class FeeStructureAdmin(admin.ModelAdmin):
    list_display = ('name', 'amount', 'term', 'form', 'category', 'active')


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('invoice_no', 'student', 'term', 'amount', 'paid', 'status', 'date')
    list_filter = ('status', 'term')


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('receipt_no', 'invoice', 'amount', 'method', 'date')


@admin.register(Discount)
class DiscountAdmin(admin.ModelAdmin):
    list_display = ('student', 'discount_type', 'amount', 'status', 'date')
