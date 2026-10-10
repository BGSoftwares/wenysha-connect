from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LoginView, SignUpView, CurrentUserView, RoleViewSet, UserProfileViewSet, PendingApprovalViewSet, AdminAccountViewSet, ChangePasswordView

router = DefaultRouter()
router.register(r'roles', RoleViewSet)
router.register(r'profiles', UserProfileViewSet)
router.register(r'pending-approvals', PendingApprovalViewSet, basename='pending-approval')
router.register(r'accounts', AdminAccountViewSet, basename='account')

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('me/', CurrentUserView.as_view(), name='current_user'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('signup/', SignUpView.as_view(), name='signup'),
    path('', include(router.urls)),
]
