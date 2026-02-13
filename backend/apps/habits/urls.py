from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import HabitListView, HabitCheckinView, HabitStreakView, HabitProgressView, DailyCheckinViewSet

router = DefaultRouter()
router.register('checkins', DailyCheckinViewSet, basename='daily-checkins')

urlpatterns = router.urls + [
    path('', HabitListView.as_view(), name='habit-list'),
    path('<uuid:task_id>/checkin/', HabitCheckinView.as_view(), name='habit-checkin'),
    path('<uuid:task_id>/streaks/', HabitStreakView.as_view(), name='habit-streaks'),
    path('progress/', HabitProgressView.as_view(), name='habit-progress'),
]
