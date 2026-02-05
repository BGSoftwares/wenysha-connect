from django.contrib import admin
from .models import Hostel, Room, RoomStudent, HostelRequest


@admin.register(Hostel)
class HostelAdmin(admin.ModelAdmin):
    list_display = ('name', 'hostel_type', 'capacity', 'occupied')


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ('hostel', 'room_code', 'beds', 'occupied')


@admin.register(RoomStudent)
class RoomStudentAdmin(admin.ModelAdmin):
    list_display = ('room', 'student')


@admin.register(HostelRequest)
class HostelRequestAdmin(admin.ModelAdmin):
    list_display = ('student', 'request_type', 'status', 'date')
