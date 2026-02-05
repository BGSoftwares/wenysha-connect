from rest_framework import viewsets
from .models import Parent, StudentParent
from .serializers import ParentSerializer, StudentParentSerializer


class ParentViewSet(viewsets.ModelViewSet):
    queryset = Parent.objects.all()
    serializer_class = ParentSerializer
    filterset_fields = ['status']


class StudentParentViewSet(viewsets.ModelViewSet):
    queryset = StudentParent.objects.select_related('student', 'parent').all()
    serializer_class = StudentParentSerializer
    filterset_fields = ['student', 'parent']
