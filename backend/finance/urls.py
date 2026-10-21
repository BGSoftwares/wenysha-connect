from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    FeeStructureViewSet, InvoiceViewSet, PaymentViewSet, DiscountViewSet, BalancesViewSet,
    OnlinePaymentConfigView, OnlinePaymentListCreateView, OnlinePaymentRefreshView,
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
    path('', include(router.urls)),
]
