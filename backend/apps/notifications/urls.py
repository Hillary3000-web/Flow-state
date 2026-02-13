from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import NotificationViewSet, MarkAllReadView

router = DefaultRouter()
router.register('', NotificationViewSet, basename='notifications')

urlpatterns = router.urls + [
    path('read-all/', MarkAllReadView.as_view(), name='mark-all-read'),
]
