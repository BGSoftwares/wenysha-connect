from rest_framework import serializers, viewsets
from django.db import transaction
from django.db.models import Sum
from .models import Hostel, Room, RoomStudent, HostelRequest
from .serializers import HostelSerializer, RoomSerializer, RoomStudentSerializer, HostelRequestSerializer


def _sync_hostel_occupancy(hostel_ids):
    for hostel_id in sorted(set(hostel_ids)):
        hostel = Hostel.objects.select_for_update().get(pk=hostel_id)
        occupied = Room.objects.filter(hostel_id=hostel_id).aggregate(total=Sum('occupied'))['total'] or 0
        Hostel.objects.filter(pk=hostel_id).update(occupied=occupied)


class HostelViewSet(viewsets.ModelViewSet):
    queryset = Hostel.objects.all()
    serializer_class = HostelSerializer


class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.select_related('hostel').all()
    serializer_class = RoomSerializer
    filterset_fields = ['hostel']

    @transaction.atomic
    def perform_update(self, serializer):
        room = Room.objects.select_for_update().get(pk=serializer.instance.pk)
        occupied = RoomStudent.objects.filter(room_id=room.pk).count()
        beds = serializer.validated_data.get('beds', room.beds)
        if beds < occupied:
            raise serializers.ValidationError({'beds': f'{occupied} learners are assigned; beds cannot be lower.'})
        previous_hostel_id = room.hostel_id
        updated = serializer.save(occupied=occupied)
        _sync_hostel_occupancy([previous_hostel_id, updated.hostel_id])


class RoomStudentViewSet(viewsets.ModelViewSet):
    queryset = RoomStudent.objects.select_related('room', 'student').all()
    serializer_class = RoomStudentSerializer
    filterset_fields = ['room', 'student']

    def _sync_occupancy(self, room_ids):
        hostel_ids = set()
        for room_id in sorted(set(room_ids)):
            if not room_id:
                continue
            hostel_id = Room.objects.values_list('hostel_id', flat=True).get(pk=room_id)
            occupied = RoomStudent.objects.filter(room_id=room_id).count()
            Room.objects.filter(pk=room_id).update(occupied=occupied)
            hostel_ids.add(hostel_id)
        _sync_hostel_occupancy(hostel_ids)

    @transaction.atomic
    def perform_create(self, serializer):
        room_id = serializer.validated_data['room'].pk
        room = Room.objects.select_for_update().get(pk=room_id)
        if RoomStudent.objects.filter(room_id=room_id).count() >= room.beds:
            raise serializers.ValidationError({'room': 'This room has no available beds.'})
        allocation = serializer.save(room=room)
        self._sync_occupancy([allocation.room_id])

    @transaction.atomic
    def perform_update(self, serializer):
        allocation = RoomStudent.objects.select_for_update().get(pk=serializer.instance.pk)
        previous_room_id = allocation.room_id
        target_room_id = serializer.validated_data.get('room', allocation.room).pk
        room_ids = sorted({previous_room_id, target_room_id})
        rooms = {
            room.pk: room
            for room in Room.objects.select_for_update().filter(pk__in=room_ids).order_by('pk')
        }
        room = rooms[target_room_id]
        other_occupants = RoomStudent.objects.filter(room_id=target_room_id).exclude(pk=allocation.pk).count()
        if other_occupants >= room.beds:
            raise serializers.ValidationError({'room': 'This room has no available beds.'})
        allocation = serializer.save(room=room)
        self._sync_occupancy([previous_room_id, allocation.room_id])

    @transaction.atomic
    def perform_destroy(self, instance):
        allocation = RoomStudent.objects.select_for_update().get(pk=instance.pk)
        room_id = allocation.room_id
        Room.objects.select_for_update().get(pk=room_id)
        instance = allocation
        instance.delete()
        self._sync_occupancy([room_id])


class HostelRequestViewSet(viewsets.ModelViewSet):
    queryset = HostelRequest.objects.select_related('student', 'room').all()
    serializer_class = HostelRequestSerializer
    filterset_fields = ['student', 'status']
