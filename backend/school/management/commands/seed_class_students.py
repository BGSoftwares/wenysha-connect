from django.core.management.base import BaseCommand
from django.db import transaction

from school.models import SchoolClass, Student, Teacher


CLASS_NAMES = [
    "3B1", "4B1", "4B2", "2B1", "2B2", "1B1", "1B2",
    "1A2", "1A1", "2A2", "3A1", "3A2", "4A1", "4A2",
    "1C1", "1C2", "2C2", "2C1", "3C2", "3C1", "4C1", "4C2",
]

BASE_SHONA_NAMES = [
    "Tariro",
    "Munashe",
    "Ruvimbo",
    "Tanaka",
    "Kudakwashe",
    "Anesu",
    "Nyaradzo",
    "Chiedza",
    "Makanaka",
    "Tafadzwa",
]


@transaction.atomic
def ensure_class_records():
    class_count = 0
    student_count = 0

    for class_name in CLASS_NAMES:
        school_class, class_created = SchoolClass.objects.get_or_create(
            name=class_name,
            defaults={"capacity": 45, "enrolled": 0},
        )
        if class_created:
            class_count += 1

        teacher_name = f"{class_name} Class Teacher"
        teacher, _ = Teacher.objects.get_or_create(
            name=teacher_name,
            defaults={"department": "General", "phone": ""},
        )
        school_class.class_teacher = teacher
        school_class.capacity = 45
        school_class.save()

        for index, name in enumerate(BASE_SHONA_NAMES, start=1):
            student_id = f"{class_name}-{index:02d}"
            student, created = Student.objects.get_or_create(
                student_id=student_id,
                defaults={
                    "name": name,
                    "school_class": school_class,
                    "gender": "Female" if index % 2 == 0 else "Male",
                    "status": "Active",
                    "address": f"{class_name} class student",
                },
            )
            if created:
                student_count += 1
            elif student.school_class != school_class:
                student.school_class = school_class
                student.save()

        school_class.enrolled = Student.objects.filter(school_class=school_class).count()
        school_class.save()

    return class_count, student_count


class Command(BaseCommand):
    help = "Create the requested class list and seed 10 Shona-named students in each class."

    def handle(self, *args, **options):
        class_count, student_count = ensure_class_records()
        self.stdout.write(
            self.style.SUCCESS(
                f"Created {class_count} new classes and seeded {student_count} new students. "
                f"Total classes: {SchoolClass.objects.count()}, total students: {Student.objects.count()}"
            )
        )
