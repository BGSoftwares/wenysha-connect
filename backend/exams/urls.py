from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ExamViewSet, ExamScheduleViewSet, ExamMarkViewSet, ExamRankingView,
    ExamMarkSheetView, MarkSubmissionViewSet, ReportCardReviewViewSet,
)

router = DefaultRouter()
router.register(r'exams', ExamViewSet)
router.register(r'exam-schedules', ExamScheduleViewSet)
router.register(r'exam-marks', ExamMarkViewSet)
router.register(r'mark-submissions', MarkSubmissionViewSet)
router.register(r'report-card-reviews', ReportCardReviewViewSet)

urlpatterns = [
    path('exam-rankings/', ExamRankingView.as_view(), name='exam-rankings'),
    path('mark-sheets/', ExamMarkSheetView.as_view(), name='exam-mark-sheets'),
    path('', include(router.urls)),
]
