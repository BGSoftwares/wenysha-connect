from rest_framework import viewsets
from core.permissions import IsAuthenticatedAdminOrReadOnly
from .models import Bus, Route
from .serializers import BusSerializer, RouteSerializer


class BusViewSet(viewsets.ModelViewSet):
    queryset = Bus.objects.all()
    serializer_class = BusSerializer
    filterset_fields = ['status']
    permission_classes = [IsAuthenticatedAdminOrReadOnly]


class RouteViewSet(viewsets.ModelViewSet):
    queryset = Route.objects.select_related('bus').all()
    serializer_class = RouteSerializer
    filterset_fields = ['bus']
    permission_classes = [IsAuthenticatedAdminOrReadOnly]
