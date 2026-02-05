from django.db import models
from school.models import Student


class Hostel(models.Model):
    name = models.CharField(max_length=128)
    hostel_type = models.CharField(max_length=32)  # Boys, Girls
    capacity = models.PositiveIntegerField(default=0)
    occupied = models.PositiveIntegerField(default=0)
    warden = models.CharField(max_length=128, blank=True)
    phone = models.CharField(max_length=32, blank=True)

    def __str__(self):
        return self.name


class Room(models.Model):
    hostel = models.ForeignKey(Hostel, on_delete=models.CASCADE, related_name='rooms')
    room_code = models.CharField(max_length=32)  # A101, G101
    beds = models.PositiveIntegerField(default=4)
    occupied = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = [['hostel', 'room_code']]

    def __str__(self):
        return f"{self.hostel.name} - {self.room_code}"


class RoomStudent(models.Model):
    """M:M room ↔ student."""
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='room_students')
    student = models.OneToOneField(Student, on_delete=models.CASCADE, related_name='hostel_room')

    class Meta:
        unique_together = [['room', 'student']]


class HostelRequest(models.Model):
    STATUS_CHOICES = [('Pending', 'Pending'), ('Under Review', 'Under Review'), ('Resolved', 'Resolved')]
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='hostel_requests')
    request_type = models.CharField(max_length=32)  # Maintenance, Transfer
    issue = models.TextField()
    room = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True, blank=True, related_name='requests')
    date = models.DateField()
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='Pending')

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"{self.student.name} - {self.request_type}"
