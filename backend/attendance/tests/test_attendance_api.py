from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from core.models import Role, UserProfile
from school.models import SchoolClass, Student, Teacher
from attendance.models import AttendanceAuditLog, AttendanceRecord
from datetime import date
from django.utils import timezone
from parents.models import Parent, StudentParent
from attendance.models import AttendanceNotification

class AttendanceAPITests(TestCase):
    def setUp(self):
        role = Role.objects.get(name='Class Teacher')
        self.user = User.objects.create_user(username='att_user', password='pwd')
        UserProfile.objects.create(user=self.user, role=role, full_name='Attendance Teacher')
        teacher = Teacher.objects.create(user=self.user, name='Attendance Teacher')
        cls = SchoolClass.objects.create(name='API Attend Class', class_teacher=teacher)
        self.student = Student.objects.create(student_id='AAPI01', name='Attend API Student', school_class=cls)
        self.client = APIClient()

    def test_attendance_crud_and_permission(self):
        payload = {'student': self.student.id, 'date': date(2026, 10, 27).isoformat(), 'status': 'present'}
        # unauthenticated blocked
        r = self.client.post('/api/attendance/attendance/', payload, format='json')
        self.assertEqual(r.status_code, 401)

        self.client.force_authenticate(user=self.user)
        calendar_read = self.client.get('/api/attendance/calendar/')
        self.assertEqual(calendar_read.status_code, 200)
        calendar_write = self.client.post('/api/attendance/calendar/', {
            'date': '2026-10-27',
            'day_type': 'holiday',
            'note': 'Teacher cannot edit calendar',
        }, format='json')
        self.assertEqual(calendar_write.status_code, 403)
        settings_read = self.client.get('/api/attendance/settings/')
        self.assertEqual(settings_read.status_code, 200)
        settings_write = self.client.post('/api/attendance/settings/', {'at_risk_percentage': 90}, format='json')
        self.assertEqual(settings_write.status_code, 403)
        create = self.client.post('/api/attendance/attendance/', payload, format='json')
        self.assertEqual(create.status_code, 201)
        aid = create.data['id']
        # Re-saving a student/date updates the existing row instead of duplicating it.
        payload['status'] = 'absent'
        updated = self.client.post('/api/attendance/attendance/', payload, format='json')
        self.assertEqual(updated.status_code, 200, updated.data)
        self.assertEqual(updated.data['id'], aid)
        self.assertEqual(updated.data['status'], 'absent')
        self.assertEqual(AttendanceRecord.objects.filter(student=self.student, date=payload['date']).count(), 1)
        afternoon = self.client.post('/api/attendance/attendance/', {
            **payload,
            'session': 'afternoon',
            'status': 'present',
        }, format='json')
        self.assertEqual(afternoon.status_code, 201, afternoon.data)
        self.assertEqual(AttendanceRecord.objects.filter(student=self.student, date=payload['date']).count(), 2)
        self.assertGreaterEqual(AttendanceAuditLog.objects.filter(student=self.student).count(), 2)
        # read
        get_r = self.client.get(f'/api/attendance/attendance/{aid}/')
        self.assertEqual(get_r.status_code, 200)
        self.assertEqual(get_r.data['status'], 'absent')
        next_day_payload = {
            **payload,
            'date': date(2026, 10, 28).isoformat(),
            'status': 'present',
        }
        next_day = self.client.post('/api/attendance/attendance/', next_day_payload, format='json')
        self.assertEqual(next_day.status_code, 201)
        history = self.client.get('/api/attendance/attendance/', {'student': self.student.id})
        self.assertEqual(history.status_code, 200)
        self.assertEqual(len(history.data['results']), 3)
        # update
        patch = self.client.patch(f'/api/attendance/attendance/{aid}/', {'status': 'absent'}, format='json')
        self.assertEqual(patch.status_code, 200)
        # delete
        del_r = self.client.delete(f'/api/attendance/attendance/{aid}/')
        self.assertEqual(del_r.status_code, 400)
        self.assertTrue(AttendanceRecord.objects.filter(pk=aid).exists())

    def test_attendance_rejects_weekends_public_holidays_and_term_breaks(self):
        self.client.force_authenticate(user=self.user)
        dates = (
            ('2026-09-12', 400),  # Saturday
            ('2026-05-25', 400),  # Africa Day
            ('2026-08-07', 400),  # August school break
            ('2026-09-09', 201),  # Term 3 school day
        )
        for date_value, expected_status in dates:
            with self.subTest(date=date_value):
                response = self.client.post('/api/attendance/attendance/', {
                    'student': self.student.id,
                    'date': date_value,
                    'status': 'present',
                }, format='json')
                self.assertEqual(response.status_code, expected_status)

    def test_parent_receives_and_can_read_own_same_day_attendance_notification(self):
        parent_user = User.objects.create_user(username='att_parent', password='pwd')
        parent = Parent.objects.create(user=parent_user, name='Attendance Parent')
        StudentParent.objects.create(student=self.student, parent=parent)
        record = AttendanceRecord.objects.create(
            student=self.student,
            school_class=self.student.school_class,
            date=timezone.localdate(),
            status='absent',
        )
        notification = AttendanceNotification.objects.get(
            recipient=parent_user,
            attendance_record=record,
            kind='absent',
        )
        self.client.force_authenticate(user=parent_user)
        response = self.client.get('/api/attendance/notifications/')
        self.assertEqual(response.status_code, 200)
        result = response.data['results'][0]
        self.assertEqual(result['id'], notification.id)
        marked_read = self.client.post(
            f'/api/attendance/notifications/{notification.id}/mark_read/',
            {},
            format='json',
        )
        self.assertEqual(marked_read.status_code, 200)
        self.assertIsNotNone(marked_read.data['read_at'])
