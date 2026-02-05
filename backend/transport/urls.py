from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BusViewSet, RouteViewSet

router = DefaultRouter()
router.register(r'buses', BusViewSet)
router.register(r'routes', RouteViewSet)

urlpatterns = [path('', include(router.urls))]
