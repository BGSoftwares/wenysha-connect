import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django

django.setup()

from school.models import SchoolClass, Teacher

assignments = {
    "1A1": "Mr Mhangami",
    "1A2": "Mr Gurumani",
    "1B1": "Mr Pasi",
    "1B2": "Mr Mutingwende",
    "1C1": "Mr Ndabuda",
    "1C2": "Miss Mhlanga",
    "2A2": "Miss Chihwiza",
    "2B1": "Miss Marija K",
    "2B2": "Miss Mariga R",
    "2C1": "Mr Zuze",
    "2C2": "Mr Majaraunga",
    "3A1": "Mr Mhangami",
    "3A2": "Mr Gurumani",
    "3B1": "Mr Pasi",
    "3B2": "Mr Mutingwende",
    "3C1": "Mr Ndabuda",
    "3C2": "Miss Mhlanga",
    "4A1": "Miss Chihwiza",
    "4A2": "Miss Marija K",
    "4B1": "Miss Mariga R",
    "4B2": "Mr Zuze",
    "4C1": "Mr Majaraunga",
    "4C2": "Mr Mhangami",
    "1Arts1": "Miss Mhlanga",
    "1Commercials1": "Miss Chihwiza",
    "1B1 Sciences": "Mr Pasi",
    "AutoClass1": "Mr Zuze",
    "Form 4A": "Mr Majaraunga",
}

for class_name, teacher_name in assignments.items():
    school_class, created = SchoolClass.objects.get_or_create(name=class_name)
    teacher, _ = Teacher.objects.get_or_create(
        name=teacher_name,
        defaults={"department": "General", "phone": ""},
    )
    school_class.class_teacher = teacher
    school_class.save()
    print(f"{class_name} -> {teacher.name}")
