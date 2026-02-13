from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import TimeBlockViewSet, WeeklyScheduleView, RiskDetectionView

router = DefaultRouter()
router.register('blocks', TimeBlockViewSet, basename='time-blocks')

urlpatterns = router.urls + [
    path('weekly/', WeeklyScheduleView.as_view(), name='weekly-schedule'),
    path('risks/', RiskDetectionView.as_view(), name='risk-detection'),
]
