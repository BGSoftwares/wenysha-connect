from rest_framework import serializers, viewsets
from django.db import transaction
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

    def _sync_occupancy(self, room_ids):
        for room_id in set(room_ids):
            if not room_id:
                continue
            room = Room.objects.select_related('hostel').get(pk=room_id)
            room.occupied = RoomStudent.objects.filter(room=room).count()
            room.save(update_fields=['occupied'])
            room.hostel.occupied = sum(Room.objects.filter(hostel=room.hostel).values_list('occupied', flat=True))
            room.hostel.save(update_fields=['occupied'])

    @transaction.atomic
    def perform_create(self, serializer):
        room = serializer.validated_data['room']
        if RoomStudent.objects.filter(room=room).count() >= room.beds:
            raise serializers.ValidationError({'room': 'This room has no available beds.'})
        allocation = serializer.save()
        self._sync_occupancy([allocation.room_id])

    @transaction.atomic
    def perform_update(self, serializer):
        previous_room_id = self.get_object().room_id
        room = serializer.validated_data.get('room', self.get_object().room)
        if room.id != previous_room_id and RoomStudent.objects.filter(room=room).count() >= room.beds:
            raise serializers.ValidationError({'room': 'This room has no available beds.'})
        allocation = serializer.save()
        self._sync_occupancy([previous_room_id, allocation.room_id])

    @transaction.atomic
    def perform_destroy(self, instance):
        room_id = instance.room_id
        instance.delete()
        self._sync_occupancy([room_id])


class HostelRequestViewSet(viewsets.ModelViewSet):
    queryset = HostelRequest.objects.select_related('student', 'room').all()
    serializer_class = HostelRequestSerializer
    filterset_fields = ['student', 'status']
