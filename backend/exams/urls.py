from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ExamViewSet, ExamScheduleViewSet, ExamMarkViewSet

router = DefaultRouter()
router.register(r'exams', ExamViewSet)
router.register(r'exam-schedules', ExamScheduleViewSet)
router.register(r'exam-marks', ExamMarkViewSet)

urlpatterns = [path('', include(router.urls))]
