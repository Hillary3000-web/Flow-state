from django.db import models
from django.conf import settings
from common.models import BaseModel


class FocusSession(BaseModel):
    """Tracks a focus/pomodoro session."""
    SESSION_TYPE_CHOICES = [
        ('pomodoro', 'Pomodoro'),
        ('custom', 'Custom'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='focus_sessions')
    task = models.ForeignKey('tasks.Task', on_delete=models.SET_NULL, null=True, blank=True, related_name='focus_sessions')
    started_at = models.DateTimeField()
    ended_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.IntegerField(default=0)
    session_type = models.CharField(max_length=10, choices=SESSION_TYPE_CHOICES, default='pomodoro')
    target_minutes = models.IntegerField(default=25)
    distraction_log = models.JSONField(default=list, blank=True)
    is_completed = models.BooleanField(default=False)

    class Meta:
        db_table = 'focus_sessions'
        ordering = ['-started_at']
        indexes = [
            models.Index(fields=['user', 'started_at']),
        ]

    def __str__(self):
        return f"Focus: {self.started_at} ({self.duration_seconds}s)"
