from django.db import models
from django.conf import settings
from common.models import BaseModel


class TimeBlock(BaseModel):
    """A scheduled block of time for a specific date."""
    BLOCK_TYPE_CHOICES = [
        ('deep_work', 'Deep Work'),
        ('meeting', 'Meeting'),
        ('break', 'Break'),
        ('task', 'Task'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='time_blocks')
    task = models.ForeignKey('tasks.Task', on_delete=models.SET_NULL, null=True, blank=True, related_name='time_blocks')
    title = models.CharField(max_length=255, blank=True)
    block_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    block_type = models.CharField(max_length=20, choices=BLOCK_TYPE_CHOICES, default='task')
    is_completed = models.BooleanField(default=False)
    sort_order = models.IntegerField(default=0)

    class Meta:
        db_table = 'time_blocks'
        ordering = ['block_date', 'start_time']
        indexes = [
            models.Index(fields=['user', 'block_date']),
        ]

    def __str__(self):
        return f"{self.block_date} {self.start_time}-{self.end_time}"
