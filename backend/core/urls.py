from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LoginView, LogoutView, SignUpView, CurrentUserView, RoleViewSet, UserProfileViewSet,
    PendingApprovalViewSet, AdminAccountViewSet, ChangePasswordView,
    MFAVerifyView, MFAResendView, MFAStatusView, MFAToggleView, TOTPSetupView, TOTPConfirmView,
)

router = DefaultRouter()
router.register(r'roles', RoleViewSet)
router.register(r'profiles', UserProfileViewSet)
router.register(r'pending-approvals', PendingApprovalViewSet, basename='pending-approval')
router.register(r'accounts', AdminAccountViewSet, basename='account')

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('mfa/verify/', MFAVerifyView.as_view(), name='mfa_verify'),
    path('mfa/resend/', MFAResendView.as_view(), name='mfa_resend'),
    path('mfa/status/', MFAStatusView.as_view(), name='mfa_status'),
    path('mfa/toggle/', MFAToggleView.as_view(), name='mfa_toggle'),
    path('mfa/totp/setup/', TOTPSetupView.as_view(), name='mfa_totp_setup'),
    path('mfa/totp/confirm/', TOTPConfirmView.as_view(), name='mfa_totp_confirm'),
    path('me/', CurrentUserView.as_view(), name='current_user'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('signup/', SignUpView.as_view(), name='signup'),
    path('', include(router.urls)),
]
