from rest_framework import viewsets, permissions
from .models import AdmissionApplication
from .serializers import AdmissionApplicationSerializer
from core.permissions import IsPortalAdmin
from core.throttling import SignupRateThrottle


class AdmissionApplicationViewSet(viewsets.ModelViewSet):
    queryset = AdmissionApplication.objects.all()
    serializer_class = AdmissionApplicationSerializer

    def get_throttles(self):
        if self.action == 'create':
            return [SignupRateThrottle()]
        return super().get_throttles()

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [IsPortalAdmin()]
