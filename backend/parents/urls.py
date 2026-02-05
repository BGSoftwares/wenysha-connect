from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ParentViewSet, StudentParentViewSet

router = DefaultRouter()
router.register(r'parents', ParentViewSet)
router.register(r'student-parents', StudentParentViewSet)

urlpatterns = [path('', include(router.urls))]
