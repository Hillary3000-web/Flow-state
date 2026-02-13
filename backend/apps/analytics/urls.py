from django.urls import path
from .views import OverviewView, TrendsView, BurndownView, TimeAllocationView

urlpatterns = [
    path('overview/', OverviewView.as_view(), name='analytics-overview'),
    path('trends/', TrendsView.as_view(), name='analytics-trends'),
    path('burndown/', BurndownView.as_view(), name='analytics-burndown'),
    path('time-allocation/', TimeAllocationView.as_view(), name='analytics-time-allocation'),
]
