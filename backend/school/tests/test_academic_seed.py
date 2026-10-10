from django.test import TestCase

from school.models import SchoolClass, Student, Subject
from school.seed_data import ensure_academic_seed_data


class AcademicSeedDataTests(TestCase):
    def test_seed_creates_required_subjects_and_student_profile(self):
        class_name = '3B2'
        school_class = ensure_academic_seed_data()

        self.assertEqual(school_class.name, class_name)

        required_subjects = [
            'Chemistry', 'Biology', 'Physics', 'Computer Science', 'Combined Science',
            'Mathematics', 'Geography', 'Shona', 'English', 'FRS', 'Heritage', 'BES',
            'Economics'
        ]

        for subject_name in required_subjects:
            self.assertTrue(Subject.objects.filter(name=subject_name).exists())

        student = Student.objects.filter(name='Prince Hanyani').first()
        self.assertIsNotNone(student)
        self.assertEqual(student.school_class.name, class_name)
        self.assertGreater(student.exam_marks.count(), 0)
