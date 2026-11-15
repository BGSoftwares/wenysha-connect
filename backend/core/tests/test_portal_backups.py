import csv
import io
import json
import tempfile
import zipfile
from datetime import timedelta
from pathlib import Path

from django.contrib.auth.models import User
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from attendance.models import AttendanceRecord
from core.models import PendingApproval, Role, UserProfile
from exams.models import Exam, ExamMark
from school.models import SchoolClass, Student, Subject, Teacher, TeacherSubjectClass

LIST = '/api/auth/backups/'
MINE = '/api/auth/backups/my-data/'


class BackupTestBase(TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self._tmp.cleanup)
        self.override = override_settings(BACKUP_ROOT=Path(self._tmp.name), BACKUP_MAX_FILES=30)
        self.override.enable()
        self.addCleanup(self.override.disable)
        self.admin = User.objects.create_superuser(username='bkadmin', email='bkadmin@local', password='Str0ng-Pass-9')
        self.client = APIClient()

    def make_teacher(self, username='bkteacher'):
        user = User.objects.create_user(username=username, email=f'{username}@local', password='Str0ng-Pass-9')
        UserProfile.objects.create(user=user, role=Role.objects.get(name='Class Teacher'), full_name='Mr Teacher')
        return user, Teacher.objects.create(user=user, name='Mr Teacher')

    @staticmethod
    def open_zip(response_or_bytes):
        response = response_or_bytes
        data = b''.join(response.streaming_content) if getattr(response, 'streaming', False) else response.content
        return zipfile.ZipFile(io.BytesIO(data))


class AdminBackupTests(BackupTestBase):
    def test_only_admins_can_use_backups(self):
        self.assertEqual(self.client.get(LIST).status_code, 401)
        teacher, _ = self.make_teacher()
        self.client.force_authenticate(teacher)
        self.assertEqual(self.client.get(LIST).status_code, 403)
        self.assertEqual(self.client.post(LIST, {}, format='json').status_code, 403)

    def test_backup_holds_records_and_never_secrets(self):
        klass = SchoolClass.objects.create(name='BK Class')
        Student.objects.create(student_id='BK001', name='Backed Up Student', school_class=klass)
        PendingApproval.objects.create(full_name='P', email='p@local', password_hash='pbkdf2$LEAKME', role='teacher')
        profile = UserProfile.objects.create(user=self.admin, role=Role.objects.get(name='Admin'),
                                             preferences={'mfa_totp_secret': 'LEAKME-TOTP'})
        self.client.force_authenticate(self.admin)

        response = self.client.post(LIST, {}, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()['created_by'], 'bkadmin')

        archive = zipfile.ZipFile(Path(self._tmp.name) / response.json()['name'])
        names = archive.namelist()
        self.assertIn('manifest.json', names)
        self.assertIn('data/school.student.json', names)
        everything = b''.join(archive.read(n) for n in names).decode()
        self.assertIn('Backed Up Student', everything)
        self.assertNotIn('LEAKME', everything)
        self.assertNotIn(self.admin.password, everything)
        users = json.loads(archive.read('data/auth.user.json'))
        self.assertIn('bkadmin', [u['username'] for u in users])
        self.assertTrue(all('password' not in u for u in users))
        self.assertEqual(json.loads(archive.read('manifest.json'))['record_counts']['school.student'], 1)

    def test_files_are_included_only_when_asked(self):
        media = tempfile.TemporaryDirectory()
        self.addCleanup(media.cleanup)
        (Path(media.name) / 'photo.png').write_bytes(b'\x89PNG\r\n\x1a\nxx')
        self.client.force_authenticate(self.admin)
        with override_settings(MEDIA_ROOT=Path(media.name)):
            plain = self.client.post(LIST, {}, format='json').json()
            Path(self._tmp.name, plain['name']).rename(Path(self._tmp.name, 'backup-20200101-000000-old.zip'))
            with_files = self.client.post(LIST, {'include_files': True}, format='json').json()
        self.assertFalse(plain['includes_files'])
        self.assertTrue(with_files['includes_files'])
        self.assertIn('files/photo.png', zipfile.ZipFile(Path(self._tmp.name) / with_files['name']).namelist())

    def test_list_download_and_delete(self):
        self.client.force_authenticate(self.admin)
        name = self.client.post(LIST, {}, format='json').json()['name']
        listing = self.client.get(LIST).json()
        self.assertEqual([b['name'] for b in listing['results']], [name])

        download = self.client.get(f'{LIST}{name}/')
        self.assertEqual(download.status_code, 200)
        self.assertIn('attachment', download['Content-Disposition'])
        self.assertIn('manifest.json', self.open_zip(download).namelist())

        self.assertEqual(self.client.delete(f'{LIST}{name}/').status_code, 204)
        self.assertEqual(self.client.get(LIST).json()['results'], [])

    def test_only_generated_names_are_reachable(self):
        self.client.force_authenticate(self.admin)
        (Path(self._tmp.name) / 'notes.txt').write_text('private')
        for bad in ('notes.txt', 'passwd', '..%2Fsettings.py', 'backup-1-2-x.zip'):
            self.assertEqual(self.client.get(f'{LIST}{bad}/').status_code, 404, bad)
            self.assertEqual(self.client.delete(f'{LIST}{bad}/').status_code, 404, bad)
        self.assertTrue((Path(self._tmp.name) / 'notes.txt').exists())

    def test_back_to_back_backups_are_refused(self):
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.post(LIST, {}, format='json').status_code, 201)
        self.assertEqual(self.client.post(LIST, {}, format='json').status_code, 429)

    def test_oldest_backups_are_removed_beyond_the_limit(self):
        stamp = timezone.now() - timedelta(days=5)
        for i in range(3):
            moment = stamp + timedelta(days=i)
            (Path(self._tmp.name) / f'backup-{moment:%Y%m%d-%H%M%S}-seed.zip').write_bytes(b'PK')
        self.client.force_authenticate(self.admin)
        with override_settings(BACKUP_MAX_FILES=2):
            self.client.post(LIST, {}, format='json')
        names = [b['name'] for b in self.client.get(LIST).json()['results']]
        self.assertEqual(len(names), 2)
        self.assertTrue(names[0].endswith('-bkadmin.zip'))


class TeacherBackupTests(BackupTestBase):
    def setUp(self):
        super().setUp()
        self.user, self.teacher = self.make_teacher()
        self.mine = SchoolClass.objects.create(name='Form 1 Mine')
        self.other = SchoolClass.objects.create(name='Form 2 Other')
        self.maths = Subject.objects.create(name='Maths')
        self.science = Subject.objects.create(name='Science')
        TeacherSubjectClass.objects.create(teacher=self.teacher, subject=self.maths, school_class=self.mine, periods=4)
        self.my_student = Student.objects.create(student_id='T001', name='=HYPERLINK("x")', school_class=self.mine,
                                                 gender='F', address='12 Secret Street')
        self.other_student = Student.objects.create(student_id='T002', name='Someone Else', school_class=self.other)
        today = timezone.localdate()
        exam = Exam.objects.create(name='Test 1', term='1', year='2026', start_date=today, end_date=today)
        ExamMark.objects.create(exam=exam, student=self.my_student, subject=self.maths, total_marks=50, scored=40)
        ExamMark.objects.create(exam=exam, student=self.my_student, subject=self.science, total_marks=50, scored=10)
        ExamMark.objects.create(exam=exam, student=self.other_student, subject=self.maths, total_marks=50, scored=30)
        AttendanceRecord.objects.create(student=self.my_student, date=today, session='morning', status='present')
        AttendanceRecord.objects.create(student=self.other_student, date=today, session='morning', status='absent')

    def rows(self, archive, name):
        return list(csv.reader(io.StringIO(archive.read(name).decode())))

    def test_export_is_limited_to_the_teachers_own_classes_and_subjects(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(MINE)
        self.assertEqual(response.status_code, 200)
        self.assertIn('attachment', response['Content-Disposition'])
        archive = self.open_zip(response)

        students = self.rows(archive, 'students.csv')
        self.assertEqual([r[0] for r in students[1:]], ['T001'])
        marks = self.rows(archive, 'marks.csv')
        self.assertEqual([(r[3], r[6]) for r in marks[1:]], [('T001', 'Maths')])
        attendance = self.rows(archive, 'attendance.csv')
        self.assertEqual([r[2] for r in attendance[1:]], ['T001'])

    def test_export_leaves_out_private_details_and_defuses_formulas(self):
        self.client.force_authenticate(self.user)
        archive = self.open_zip(self.client.get(MINE))
        everything = ''.join(archive.read(n).decode() for n in archive.namelist())
        self.assertNotIn('Secret Street', everything)
        self.assertIn("'=HYPERLINK", everything)
        self.assertNotIn(',=HYPERLINK', everything)

    def test_class_teacher_sees_every_subject_in_their_class(self):
        self.mine.class_teacher = self.teacher
        self.mine.save()
        self.client.force_authenticate(self.user)
        marks = self.rows(self.open_zip(self.client.get(MINE)), 'marks.csv')
        self.assertEqual(sorted(r[6] for r in marks[1:]), ['Maths', 'Science'])

    def test_only_teachers_with_a_teacher_record_can_download(self):
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.get(MINE).status_code, 403)
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get(MINE).status_code, 401)
        orphan = User.objects.create_user(username='orphan', email='o@local', password='Str0ng-Pass-9')
        UserProfile.objects.create(user=orphan, role=Role.objects.get(name='Class Teacher'))
        self.client.force_authenticate(orphan)
        self.assertEqual(self.client.get(MINE).status_code, 400)
