from datetime import date

from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient

from exams.models import Exam, ExamMark
from school.models import SchoolClass, Student, Subject


class ExamRankingApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(user=User.objects.create_superuser(
            username='rank_admin', email='rank-admin@example.test', password='rank-password-123'
        ))
        self.exam = Exam.objects.create(
            name='Final Examination',
            term='Term 1',
            year='2026',
            start_date=date(2026, 1, 1),
            end_date=date(2026, 1, 31),
        )
        self.class_a = SchoolClass.objects.create(name='Form 4A')
        self.class_b = SchoolClass.objects.create(name='Form 4B')
        self.other_level = SchoolClass.objects.create(name='Form 3A')
        self.subject = Subject.objects.create(name='Mathematics')

        self.target = self.make_student('RANK001', 'Target Student', self.class_a)
        self.class_peer = self.make_student('RANK002', 'Class Peer', self.class_a)
        self.level_peer = self.make_student('RANK003', 'Level Peer', self.class_b)
        self.other_level_student = self.make_student('RANK004', 'Other Level Student', self.other_level)

        self.add_mark(self.target, 80)
        self.add_mark(self.class_peer, 70)
        self.add_mark(self.level_peer, 90)
        self.add_mark(self.other_level_student, 100)

    def make_student(self, student_id, name, school_class):
        return Student.objects.create(
            student_id=student_id,
            name=name,
            school_class=school_class,
        )

    def add_mark(self, student, score):
        ExamMark.objects.update_or_create(
            exam=self.exam,
            student=student,
            subject=self.subject,
            defaults={'total_marks': 100, 'scored': score},
        )

    def test_calculates_class_and_level_positions_from_same_exam(self):
        response = self.client.get(
            '/api/exams/exam-rankings/',
            {'exam': self.exam.id, 'student': self.target.id},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, {
            'class_position': 1,
            'class_total': 2,
            'level_position': 2,
            'level_total': 3,
            'level_name': 'Form 4',
        })

    def test_equal_averages_share_position(self):
        self.add_mark(self.class_peer, 80)

        response = self.client.get(
            '/api/exams/exam-rankings/',
            {'exam': self.exam.id, 'student': self.target.id},
        )

        self.assertEqual(response.data['class_position'], 1)

    def test_ungraded_active_students_are_included_in_cohort_totals(self):
        new_student = self.make_student('RANK005', 'New Student', self.class_a)

        response = self.client.get(
            '/api/exams/exam-rankings/',
            {'exam': self.exam.id, 'student': new_student.id},
        )

        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.data['class_position'])
        self.assertEqual(response.data['class_total'], 3)
        self.assertIsNone(response.data['level_position'])
        self.assertEqual(response.data['level_total'], 4)

    def test_requires_valid_exam_and_student_ids(self):
        response = self.client.get('/api/exams/exam-rankings/')

        self.assertEqual(response.status_code, 400)
    def test_tie_broken_by_number_of_best_symbols(self):
        sub2 = Subject.objects.create(name='Science')
        self.exam.subjects.add(sub2)
        # target gets 60 (B) in Science -> average 70.0%, 1 A, 1 B
        ExamMark.objects.create(exam=self.exam, student=self.target, subject=sub2, total_marks=100, scored=60)
        # class_peer gets 70 (A) and 70 (A) -> average 70.0%, 2 As, 0 Bs
        self.add_mark(self.class_peer, 70)
        ExamMark.objects.create(exam=self.exam, student=self.class_peer, subject=sub2, total_marks=100, scored=70)

        r_peer = self.client.get('/api/exams/exam-rankings/', {'exam': self.exam.id, 'student': self.class_peer.id})
        r_target = self.client.get('/api/exams/exam-rankings/', {'exam': self.exam.id, 'student': self.target.id})
        self.assertEqual(r_peer.data['class_position'], 1)
        self.assertEqual(r_target.data['class_position'], 2)

