from django.test import TestCase
from school.models import SchoolClass, AcademicYear, Term, Assessment, Student, Grade
from django.db import IntegrityError
from datetime import date

class GradesModelTests(TestCase):
    def setUp(self):
        self.cls = SchoolClass.objects.create(name='Form 3A')
        self.year = AcademicYear.objects.create(name='2026', start_date=date(2026,1,1), end_date=date(2026,12,31))
        self.term = Term.objects.create(name='Term 1', academic_year=self.year, start_date=date(2026,1,1), end_date=date(2026,4,30))
        # Create a Subject for the assessment
        from school.models import Subject
        subj = Subject.objects.create(name='Mathematics', code='MATH')
        self.assessment = Assessment.objects.create(name='Midterm', assessment_type='Exam', subject=subj, school_class=self.cls, term=self.term, total_marks=100)
        self.student = Student.objects.create(student_id='GRD001', name='Grade Student', school_class=self.cls)

    def test_grade_creation_and_unique_constraint(self):
        g = Grade.objects.create(student=self.student, assessment=self.assessment, score=75.5)
        self.assertEqual(float(g.score), 75.5)
        # Creating another grade for same student+assessment should violate unique_together
        with self.assertRaises(Exception):
            Grade.objects.create(student=self.student, assessment=self.assessment, score=88.0)
