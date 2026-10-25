from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient

from hostel.models import Hostel, Room, RoomStudent
from school.models import SchoolClass, Student


class RoomOccupancyTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(user=User.objects.create_superuser(
            username='hostel-admin', email='hostel-admin@example.test', password='hostel-password-123',
        ))
        self.hostel = Hostel.objects.create(name='North Hostel', hostel_type='Boys', capacity=1)
        self.room = Room.objects.create(hostel=self.hostel, room_code='N1', beds=1)
        school_class = SchoolClass.objects.create(name='Hostel Form')
        self.student = Student.objects.create(student_id='HOST001', name='Learner One', school_class=school_class)
        self.other_student = Student.objects.create(student_id='HOST002', name='Learner Two', school_class=school_class)

    def test_room_capacity_and_occupancy_totals_stay_consistent(self):
        created = self.client.post('/api/hostel/room-students/', {
            'room': self.room.pk,
            'student': self.student.pk,
        }, format='json')
        self.assertEqual(created.status_code, 201, created.data)

        rejected = self.client.post('/api/hostel/room-students/', {
            'room': self.room.pk,
            'student': self.other_student.pk,
        }, format='json')
        self.assertEqual(rejected.status_code, 400)
        self.assertEqual(RoomStudent.objects.filter(room=self.room).count(), 1)

        self.room.refresh_from_db()
        self.hostel.refresh_from_db()
        self.assertEqual(self.room.occupied, 1)
        self.assertEqual(self.hostel.occupied, 1)

        deleted = self.client.delete(f'/api/hostel/room-students/{created.data["id"]}/')
        self.assertEqual(deleted.status_code, 204)
        self.room.refresh_from_db()
        self.hostel.refresh_from_db()
        self.assertEqual(self.room.occupied, 0)
        self.assertEqual(self.hostel.occupied, 0)
