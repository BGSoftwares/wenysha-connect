from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
import os

from core.models import Role, UserProfile
from school.models import SchoolClass, Subject, Teacher, Student
from finance.models import FeeStructure, Invoice, Payment


class Command(BaseCommand):
    help = 'Seed the database with default roles, admin user, and sample data.'

    def handle(self, *args, **options):
        # Load from environment
        admin_username = os.environ.get('SEED_ADMIN_USERNAME', 'admin')
        admin_email = os.environ.get('SEED_ADMIN_EMAIL', 'admin@wenyasha.com')
        admin_password = os.environ.get('SEED_ADMIN_PASSWORD', 'adminpass')

        # Roles
        roles = ['Admin', 'Teacher', 'Student', 'Parent', 'Accounts']
        for r in roles:
            Role.objects.get_or_create(name=r, defaults={'description': f'Default role: {r}'})
        self.stdout.write(self.style.SUCCESS('Roles ensured.'))

        # Admin user
        admin_user, created = User.objects.get_or_create(username=admin_username, defaults={'email': admin_email})
        if created:
            admin_user.set_password(admin_password)
            admin_user.is_staff = True
            admin_user.is_superuser = True
            admin_user.save()
            self.stdout.write(self.style.SUCCESS(f'Created admin user: {admin_username}'))
        else:
            self.stdout.write(self.style.WARNING(f'Admin user {admin_username} already exists.'))

        # Ensure admin profile
        admin_role = Role.objects.filter(name__iexact='admin').first()
        if admin_role:
            UserProfile.objects.get_or_create(user=admin_user, defaults={'role': admin_role, 'full_name': 'Administrator'})

        # Sample classes
        cls, _ = SchoolClass.objects.get_or_create(name='Form 1A', defaults={'capacity': 50})

        # Sample subject
        subj, _ = Subject.objects.get_or_create(name='Mathematics', defaults={'code': 'MATH101'})

        # Sample teacher (linked to admin user for simplicity)
        teacher_user, _ = User.objects.get_or_create(username='teacher1', defaults={'email': 'teacher1@wenyasha.com'})
        teacher_user.set_password('teacherpass')
        teacher_user.save()
        teacher, _ = Teacher.objects.get_or_create(user=teacher_user, defaults={'name': 'John Teacher', 'department': 'Mathematics'})

        # Allocate teacher to class/subject
        try:
            from school.models import TeacherSubjectClass
            TeacherSubjectClass.objects.get_or_create(teacher=teacher, subject=subj, school_class=cls, defaults={'periods': 5})
        except Exception:
            pass

        # Sample student
        student_user, _ = User.objects.get_or_create(username='student1', defaults={'email': 'student1@wenyasha.com'})
        student_user.set_password('studentpass')
        student_user.save()
        student, _ = Student.objects.get_or_create(student_id='STU0001', defaults={'name': 'Jane Student', 'school_class': cls})

        # Sample fee structure and invoice/payment
        fee, _ = FeeStructure.objects.get_or_create(name='Tuition Term 1', defaults={'amount': 500.00, 'term': 'Term 1', 'form': 'Form 1', 'category': 'Tuition', 'boarding_type': 'Day', 'active': True})

        invoice, _ = Invoice.objects.get_or_create(invoice_no='INV0001', defaults={
            'student': student,
            'term': 'Term 1',
            'amount': 500.00,
            'paid': 0,
            'date': timezone.now().date(),
        })

        # Create a payment to demonstrate flow
        payment, created = Payment.objects.get_or_create(receipt_no='RCPT0001', defaults={
            'invoice': invoice,
            'amount': 200.00,
            'method': 'Cash',
            'reference': 'InitPayment',
            'date': timezone.now().date(),
            'recorded_by': admin_user,
        })

        self.stdout.write(self.style.SUCCESS('Sample data created.'))
