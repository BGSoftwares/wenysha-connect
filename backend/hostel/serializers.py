from rest_framework import serializers
from school.serializers import StudentSerializer
from .models import Hostel, Room, RoomStudent, HostelRequest


class HostelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hostel
        fields = ['id', 'name', 'hostel_type', 'capacity', 'occupied', 'warden', 'phone']


class RoomSerializer(serializers.ModelSerializer):
    hostel_name = serializers.CharField(source='hostel.name', read_only=True)

    class Meta:
        model = Room
        fields = ['id', 'hostel', 'hostel_name', 'room_code', 'beds', 'occupied']


class RoomStudentSerializer(serializers.ModelSerializer):
    room_code = serializers.CharField(source='room.room_code', read_only=True)
    hostel_name = serializers.CharField(source='room.hostel.name', read_only=True)
    student_name = serializers.CharField(source='student.name', read_only=True)

    class Meta:
        model = RoomStudent
        fields = ['id', 'room', 'room_code', 'hostel_name', 'student', 'student_name']


class HostelRequestSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    room_code = serializers.CharField(source='room.room_code', read_only=True)

    class Meta:
        model = HostelRequest
        fields = [
            'id', 'student', 'student_name', 'request_type', 'issue', 'room', 'room_code', 'date', 'status'
        ]
