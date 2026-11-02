from django.contrib import admin
from .models import Exam, ExamSchedule, ExamMark, ReportCardReview


@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = ('name', 'term', 'year', 'status')


@admin.register(ExamSchedule)
class ExamScheduleAdmin(admin.ModelAdmin):
    list_display = ('exam', 'subject', 'school_class', 'date')


@admin.register(ExamMark)
class ExamMarkAdmin(admin.ModelAdmin):
    list_display = ('exam', 'student', 'subject', 'scored', 'total_marks')


@admin.register(ReportCardReview)
class ReportCardReviewAdmin(admin.ModelAdmin):
    list_display = ('exam', 'student', 'class_teacher_submitted_at', 'principal_reviewed_at')
    list_filter = ('exam', 'class_teacher_submitted_at', 'principal_reviewed_at')
    search_fields = ('student__name', 'student__student_id', 'exam__name')
