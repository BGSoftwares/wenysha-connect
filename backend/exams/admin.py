from django.contrib import admin
from .models import Exam, ExamSchedule, ExamMark


@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = ('name', 'term', 'year', 'status')


@admin.register(ExamSchedule)
class ExamScheduleAdmin(admin.ModelAdmin):
    list_display = ('exam', 'subject', 'school_class', 'date')


@admin.register(ExamMark)
class ExamMarkAdmin(admin.ModelAdmin):
    list_display = ('exam', 'student', 'subject', 'scored', 'total_marks')
