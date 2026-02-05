from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SchoolClassViewSet, TeacherViewSet, SubjectViewSet, StudentViewSet, TeacherSubjectClassViewSet,
    AcademicYearViewSet, TermViewSet, AssessmentViewSet, GradeViewSet,
    FeeStructureViewSet, StudentFeeViewSet, PaymentViewSet,
    AttendanceViewSet, TimetableViewSet
)

router = DefaultRouter()
router.register(r'classes', SchoolClassViewSet, basename='class')
router.register(r'teachers', TeacherViewSet)
router.register(r'subjects', SubjectViewSet)
router.register(r'students', StudentViewSet)
router.register(r'allocations', TeacherSubjectClassViewSet, basename='allocation')

# Academic
router.register(r'academic-years', AcademicYearViewSet)
router.register(r'terms', TermViewSet)
router.register(r'assessments', AssessmentViewSet)
router.register(r'grades', GradeViewSet)

# Finance
router.register(r'fee-structures', FeeStructureViewSet)
router.register(r'student-fees', StudentFeeViewSet)
router.register(r'payments', PaymentViewSet)

# Operations
router.register(r'attendance', AttendanceViewSet)
router.register(r'timetable', TimetableViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
