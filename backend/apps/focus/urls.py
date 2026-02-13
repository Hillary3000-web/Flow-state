from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import FocusSessionViewSet, FocusStatsView

router = DefaultRouter()
router.register('sessions', FocusSessionViewSet, basename='focus-sessions')

urlpatterns = router.urls + [
    path('stats/', FocusStatsView.as_view(), name='focus-stats'),
]
