from django.db import models
from django.conf import settings
from common.models import BaseModel


class HabitStreak(BaseModel):
    """Tracks daily habit completion streaks."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='habit_streaks')
    task = models.ForeignKey('tasks.Task', on_delete=models.CASCADE, related_name='habit_streaks')
    streak_date = models.DateField()
    current_streak = models.IntegerField(default=0)
    longest_streak = models.IntegerField(default=0)
    completed_today = models.BooleanField(default=False)

    class Meta:
        db_table = 'habit_streaks'
        ordering = ['-streak_date']
        unique_together = ['user', 'task', 'streak_date']
        indexes = [
            models.Index(fields=['user', 'task', 'streak_date']),
        ]

    def __str__(self):
        return f"{self.task.title} - {self.streak_date}"


class DailyCheckin(BaseModel):
    """Daily reflection and energy tracking."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='daily_checkins')
    checkin_date = models.DateField()
    energy_level = models.IntegerField(choices=[(i, str(i)) for i in range(1, 6)], default=3)
    reflection = models.TextField(blank=True)
    tasks_planned = models.IntegerField(default=0)
    tasks_completed = models.IntegerField(default=0)

    class Meta:
        db_table = 'daily_checkins'
        unique_together = ['user', 'checkin_date']
        ordering = ['-checkin_date']

    def __str__(self):
        return f"{self.user.email} - {self.checkin_date}"
