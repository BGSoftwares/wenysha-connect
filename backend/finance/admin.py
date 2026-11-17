from django.contrib import admin
from .models import BankDeposit, FeeStructure, Invoice, Payment, Discount, OnlinePayment


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


@admin.register(OnlinePayment)
class OnlinePaymentAdmin(admin.ModelAdmin):
    list_display = ('client_reference', 'provider', 'invoice', 'amount', 'currency', 'status', 'created_at')
    list_filter = ('provider', 'status')
    search_fields = ('client_reference', 'provider_reference')


@admin.register(BankDeposit)
class BankDepositAdmin(admin.ModelAdmin):
    list_display = ('bank_txn_id', 'amount', 'currency', 'value_date', 'status', 'invoice', 'source')
    list_filter = ('status', 'source', 'currency')
    search_fields = ('bank_txn_id', 'reference', 'payer_name')
