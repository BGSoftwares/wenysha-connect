from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FeeStructureViewSet, InvoiceViewSet, PaymentViewSet, DiscountViewSet, BalancesViewSet

router = DefaultRouter()
router.register(r'fee-structures', FeeStructureViewSet, basename='fee-structure')
router.register(r'invoices', InvoiceViewSet)
router.register(r'payments', PaymentViewSet)
router.register(r'discounts', DiscountViewSet)
router.register(r'balances', BalancesViewSet, basename='balance')

urlpatterns = [
    path('', include(router.urls)),
]
