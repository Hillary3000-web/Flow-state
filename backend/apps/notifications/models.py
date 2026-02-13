from django.db import models
from django.conf import settings
from common.models import BaseModel


class Notification(BaseModel):
    """In-app notification."""
    TYPE_CHOICES = [
        ('reminder', 'Reminder'),
        ('overdue', 'Overdue'),
        ('streak', 'Streak'),
        ('system', 'System'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='system')
    title = models.CharField(max_length=255)
    message = models.TextField(blank=True)
    is_read = models.BooleanField(default=False)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read', 'created_at']),
        ]

    def __str__(self):
        return f"{self.type}: {self.title}"
