from django.contrib import admin
from .models import SchoolClass, Teacher, Subject, Student, TeacherSubjectClass


@admin.register(SchoolClass)
class SchoolClassAdmin(admin.ModelAdmin):
    list_display = ('name', 'capacity', 'enrolled', 'class_teacher')


@admin.register(Teacher)
class TeacherAdmin(admin.ModelAdmin):
    list_display = ('name', 'department')


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'department')


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('student_id', 'name', 'school_class', 'gender', 'status')
    list_filter = ('school_class', 'status')
    search_fields = ('student_id', 'name')


@admin.register(TeacherSubjectClass)
class TeacherSubjectClassAdmin(admin.ModelAdmin):
    list_display = ('teacher', 'subject', 'school_class', 'periods')
