from rest_framework import viewsets
from .models import Hostel, Room, RoomStudent, HostelRequest
from .serializers import HostelSerializer, RoomSerializer, RoomStudentSerializer, HostelRequestSerializer


class HostelViewSet(viewsets.ModelViewSet):
    queryset = Hostel.objects.all()
    serializer_class = HostelSerializer


class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.select_related('hostel').all()
    serializer_class = RoomSerializer
    filterset_fields = ['hostel']


class RoomStudentViewSet(viewsets.ModelViewSet):
    queryset = RoomStudent.objects.select_related('room', 'student').all()
    serializer_class = RoomStudentSerializer
    filterset_fields = ['room', 'student']


class HostelRequestViewSet(viewsets.ModelViewSet):
    queryset = HostelRequest.objects.select_related('student', 'room').all()
    serializer_class = HostelRequestSerializer
    filterset_fields = ['student', 'status']
