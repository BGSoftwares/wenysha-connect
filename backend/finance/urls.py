from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    FeeStructureViewSet, InvoiceViewSet, PaymentViewSet, DiscountViewSet, BalancesViewSet,
    OnlinePaymentConfigView, OnlinePaymentListCreateView, OnlinePaymentRefreshView, OnlinePaymentConfirmView, PaynowResultView,
    BankDepositListView, BankDepositImportView, BankDepositAssignView, BankDepositIgnoreView, BankWebhookView,
)

router = DefaultRouter()
router.register(r'fee-structures', FeeStructureViewSet, basename='fee-structure')
router.register(r'invoices', InvoiceViewSet)
router.register(r'payments', PaymentViewSet)
router.register(r'discounts', DiscountViewSet)
router.register(r'balances', BalancesViewSet, basename='balance')

urlpatterns = [
    path('online-payments/config/', OnlinePaymentConfigView.as_view(), name='online-payment-config'),
    path('online-payments/', OnlinePaymentListCreateView.as_view(), name='online-payment-list-create'),
    path('online-payments/by-reference/<str:client_reference>/', OnlinePaymentRefreshView.as_view(), name='online-payment-refresh'),
    path('online-payments/by-reference/<str:client_reference>/confirm/', OnlinePaymentConfirmView.as_view(), name='online-payment-confirm'),
    path('paynow/result/', PaynowResultView.as_view(), name='paynow-result'),
    path('bank-deposits/', BankDepositListView.as_view(), name='bank-deposit-list'),
    path('bank-deposits/import/', BankDepositImportView.as_view(), name='bank-deposit-import'),
    path('bank-deposits/webhook/', BankWebhookView.as_view(), name='bank-deposit-webhook'),
    path('bank-deposits/<int:pk>/assign/', BankDepositAssignView.as_view(), name='bank-deposit-assign'),
    path('bank-deposits/<int:pk>/ignore/', BankDepositIgnoreView.as_view(), name='bank-deposit-ignore'),
    path('', include(router.urls)),
]
