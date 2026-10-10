import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django

django.setup()

from school.models import SchoolClass, Teacher

assignments = {
    "3B1": "3B1 Class Teacher",
    "4B1": "4B1 Class Teacher",
    "4B2": "4B2 Class Teacher",
    "2B1": "2B1 Class Teacher",
    "2B2": "2B2 Class Teacher",
    "1B1": "1B1 Class Teacher",
    "1B2": "1B2 Class Teacher",
    "1A2": "1A2 Class Teacher",
    "1A1": "1A1 Class Teacher",
    "2A2": "2A2 Class Teacher",
    "3A1": "3A1 Class Teacher",
    "3A2": "3A2 Class Teacher",
    "4A1": "4A1 Class Teacher",
    "4A2": "4A2 Class Teacher",
    "1C1": "1C1 Class Teacher",
    "1C2": "1C2 Class Teacher",
    "2C2": "2C2 Class Teacher",
    "2C1": "2C1 Class Teacher",
    "3C2": "3C2 Class Teacher",
    "3C1": "3C1 Class Teacher",
    "4C1": "4C1 Class Teacher",
    "4C2": "4C2 Class Teacher",
}

for class_name, teacher_name in assignments.items():
    school_class = SchoolClass.objects.get(name=class_name)
    teacher, _ = Teacher.objects.get_or_create(
        name=teacher_name,
        defaults={"department": "General", "phone": ""},
    )
    school_class.class_teacher = teacher
    school_class.save()
    print(f"{class_name} -> {teacher.name}")
