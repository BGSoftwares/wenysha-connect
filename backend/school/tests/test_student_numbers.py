import importlib
from datetime import date
from io import StringIO

from django.apps import apps
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase
from rest_framework.test import APIClient

from core.models import Role, UserProfile
from finance.models import Invoice
from parents.models import Parent, StudentParent
from school.models import SchoolClass, Student, StudentNumberSequence

issue_missing = importlib.import_module('school.migrations.0008_issue_missing_student_numbers').issue_numbers


class StudentNumberTests(TestCase):
    def setUp(self):
        self.cls = SchoolClass.objects.create(name='Numbers Form 1')

    def make(self, name, **extra):
        return Student.objects.create(name=name, school_class=self.cls, **extra)

    def test_new_students_get_the_next_number_in_order(self):
        numbers = [self.make(f'Learner {i}').student_id for i in range(3)]
        self.assertEqual(numbers, ['AbleGodStudent00001', 'AbleGodStudent00002', 'AbleGodStudent00003'])

    def test_a_deleted_students_number_is_never_given_to_another_child(self):
        first = self.make('First')
        second = self.make('Second')
        retired = second.student_id
        second.delete()
        third = self.make('Third')
        self.assertNotEqual(third.student_id, retired)
        self.assertEqual(third.student_id, 'AbleGodStudent00003')
        self.assertEqual(first.student_id, 'AbleGodStudent00001')

    def test_numbers_already_taken_by_hand_or_by_a_username_are_skipped(self):
        self.make('Typed', student_id='ABLEGODSTUDENT00001')
        User.objects.create_user(username='AbleGodStudent00002', password='pwd-Strong-123')
        self.assertEqual(self.make('Auto').student_id, 'AbleGodStudent00003')

    def test_the_same_number_cannot_be_used_twice_even_in_another_letter_case(self):
        self.make('One', student_id='STU-100')
        with self.assertRaises(ValidationError):
            self.make('Two', student_id='stu-100')
        self.assertEqual(Student.objects.filter(student_id__iexact='stu-100').count(), 1)

    def test_a_student_number_cannot_be_changed_or_blanked(self):
        student = self.make('Fixed')
        original = student.student_id
        student.student_id = 'AbleGodStudent09999'
        with self.assertRaises(ValidationError):
            student.save()
        student.refresh_from_db()
        self.assertEqual(student.student_id, original)
        student.student_id = ''
        student.name = 'Fixed Renamed'
        student.save()
        student.refresh_from_db()
        self.assertEqual((student.student_id, student.name), (original, 'Fixed Renamed'))

    def test_partial_save_keeps_the_number(self):
        student = self.make('Partial')
        student.name = 'Partial Two'
        student.save(update_fields=['name'])
        self.assertEqual(Student.objects.get(pk=student.pk).student_id, 'AbleGodStudent00001')

    def test_whitespace_only_number_is_treated_as_missing(self):
        self.assertEqual(self.make('Spaces', student_id='   ').student_id, 'AbleGodStudent00001')


class ExistingStudentFixTests(TestCase):
    def setUp(self):
        self.cls = SchoolClass.objects.create(name='Legacy Form 2')

    def test_migration_numbers_students_without_one_and_keeps_existing_numbers(self):
        legacy = Student.objects.create(name='Legacy', school_class=self.cls, student_id='STU001')
        recent = Student.objects.create(name='Recent', school_class=self.cls, student_id='AbleGodStudent00007')
        blank = Student.objects.create(name='Blank', school_class=self.cls)
        Student.objects.filter(pk=blank.pk).update(student_id='')
        StudentNumberSequence.objects.filter(pk=1).update(last_number=0)

        issue_missing(apps, None)

        blank.refresh_from_db()
        self.assertEqual(blank.student_id, 'AbleGodStudent00008')
        self.assertEqual(Student.objects.get(pk=legacy.pk).student_id, 'STU001')
        self.assertEqual(Student.objects.get(pk=recent.pk).student_id, 'AbleGodStudent00007')
        self.assertEqual(StudentNumberSequence.objects.get(pk=1).last_number, 8)
        self.assertEqual(Student.objects.create(name='Next', school_class=self.cls).student_id, 'AbleGodStudent00009')

    def test_migration_can_run_twice_without_changing_anything(self):
        Student.objects.create(name='A', school_class=self.cls)
        before = list(Student.objects.values_list('pk', 'student_id'))
        issue_missing(apps, None)
        issue_missing(apps, None)
        self.assertEqual(list(Student.objects.values_list('pk', 'student_id')), before)

    def test_audit_command_reports_and_fixes(self):
        blank = Student.objects.create(name='Blank', school_class=self.cls)
        Student.objects.filter(pk=blank.pk).update(student_id='')
        out = StringIO()
        call_command('audit_student_numbers', '--dry-run', stdout=out)
        self.assertIn('1 without a number', out.getvalue())
        self.assertEqual(Student.objects.get(pk=blank.pk).student_id, '')
        call_command('audit_student_numbers', stdout=out)
        self.assertTrue(Student.objects.get(pk=blank.pk).student_id.startswith('AbleGodStudent'))

    def test_audit_command_refuses_when_numbers_clash(self):
        a = Student.objects.create(name='A', school_class=self.cls)
        b = Student.objects.create(name='B', school_class=self.cls)
        # Simulate a database that allows case-different duplicates, which MySQL's collation would not.
        Student.objects.filter(pk=b.pk).update(student_id=a.student_id.lower())
        with self.assertRaises(CommandError):
            call_command('audit_student_numbers', '--dry-run', stdout=StringIO())


class StudentNumberLinksTests(TestCase):
    def setUp(self):
        self.cls = SchoolClass.objects.create(name='Links Form 3')
        self.student = Student.objects.create(name='Linked Child', school_class=self.cls)
        self.parent_user = User.objects.create_user(username='links_parent', password='pwd-Strong-123')
        role, _ = Role.objects.get_or_create(name='Parent')
        UserProfile.objects.create(user=self.parent_user, role=role)
        parent = Parent.objects.create(user=self.parent_user, name='Links Parent')
        StudentParent.objects.create(student=self.student, parent=parent)
        self.invoice = Invoice.objects.create(
            invoice_no='AGC-LINK-0001', student=self.student, term='Term 1', amount=100, date=date.today(),
        )
        self.client = APIClient()
        self.client.force_authenticate(self.parent_user)

    def rows(self, path):
        data = self.client.get(path).data
        return data['results'] if isinstance(data, dict) else data

    def test_parent_sees_the_same_number_on_the_child_and_on_the_invoice(self):
        children = self.rows('/api/school/students/')
        invoices = self.rows('/api/finance/invoices/')
        self.assertEqual(children[0]['student_id'], self.student.student_id)
        self.assertEqual(invoices[0]['student_id_display'], self.student.student_id)

    def test_the_number_is_read_only_through_the_api(self):
        admin = User.objects.create_user(username='num_admin', password='pwd-Strong-123', is_staff=True)
        self.client.force_authenticate(admin)
        response = self.client.patch(f'/api/school/students/{self.student.pk}/', {'student_id': 'HACKED-1', 'name': 'Renamed'}, format='json')
        self.assertEqual(response.status_code, 200, getattr(response, 'data', None))
        self.student.refresh_from_db()
        self.assertEqual(self.student.name, 'Renamed')
        self.assertNotEqual(self.student.student_id, 'HACKED-1')
