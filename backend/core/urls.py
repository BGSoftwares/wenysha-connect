from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .backups import BackupDetailView, BackupListCreateView, TeacherBackupView
from .signatures import SignatureView
from .dashboard import DashboardMineView, DashboardSummaryView
from .views import (
    LoginView, LogoutView, SignUpView, CurrentUserView, RoleViewSet, UserProfileViewSet,
    PendingApprovalViewSet, AdminAccountViewSet, ChangePasswordView,
    MFAVerifyView, MFAResendView, MFAStatusView, MFAToggleView, TOTPSetupView, TOTPConfirmView, BackupCodesView,
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
    path('mfa/backup-codes/', BackupCodesView.as_view(), name='mfa_backup_codes'),
    path('dashboard/summary/', DashboardSummaryView.as_view(), name='dashboard_summary'),
    path('dashboard/mine/', DashboardMineView.as_view(), name='dashboard_mine'),
    path('backups/', BackupListCreateView.as_view(), name='backup_list'),
    path('backups/my-data/', TeacherBackupView.as_view(), name='backup_teacher_data'),
    path('backups/<str:name>/', BackupDetailView.as_view(), name='backup_detail'),
    path('signature/', SignatureView.as_view(), name='signature'),
    path('me/', CurrentUserView.as_view(), name='current_user'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('signup/', SignUpView.as_view(), name='signup'),
    path('', include(router.urls)),
]
