from django.db import models
from django.conf import settings
from common.models import BaseModel


class Goal(BaseModel):
    """Top-level objective container."""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('archived', 'Archived'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='goals')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    target_date = models.DateField(null=True, blank=True)
    progress_pct = models.IntegerField(default=0)

    class Meta:
        db_table = 'goals'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
        ]

    def __str__(self):
        return self.title


class Project(BaseModel):
    """Groups tasks under a goal."""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('archived', 'Archived'),
    ]

    goal = models.ForeignKey(Goal, on_delete=models.CASCADE, related_name='projects')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='projects')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    color = models.CharField(max_length=7, default='#6366f1')
    sort_order = models.IntegerField(default=0)

    class Meta:
        db_table = 'projects'
        ordering = ['sort_order', '-created_at']
        indexes = [
            models.Index(fields=['goal', 'sort_order']),
        ]

    def __str__(self):
        return self.title


class Task(BaseModel):
    """Core task item with priority, energy, and recurrence."""
    PRIORITY_CHOICES = [
        ('P1', 'Urgent'),
        ('P2', 'High'),
        ('P3', 'Medium'),
        ('P4', 'Low'),
    ]
    ENERGY_CHOICES = [
        ('low', 'Low Focus'),
        ('medium', 'Medium Focus'),
        ('high', 'High Focus'),
    ]
    STATUS_CHOICES = [
        ('todo', 'To Do'),
        ('in_progress', 'In Progress'),
        ('done', 'Done'),
        ('cancelled', 'Cancelled'),
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks', null=True, blank=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=500)
    description = models.TextField(blank=True)
    priority = models.CharField(max_length=2, choices=PRIORITY_CHOICES, default='P3')
    energy_level = models.CharField(max_length=10, choices=ENERGY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='todo')
    due_date = models.DateTimeField(null=True, blank=True)
    estimated_minutes = models.IntegerField(null=True, blank=True)
    actual_minutes = models.IntegerField(null=True, blank=True)
    is_recurring = models.BooleanField(default=False)
    recurrence_rule = models.CharField(max_length=100, blank=True, help_text='e.g. daily, weekly, monthly')
    sort_order = models.IntegerField(default=0)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'tasks'
        ordering = ['sort_order', '-created_at']
        indexes = [
            models.Index(fields=['user', 'status', 'due_date']),
            models.Index(fields=['project', 'sort_order']),
            models.Index(fields=['user', 'is_recurring']),
        ]

    def __str__(self):
        return self.title


class Subtask(BaseModel):
    """Subtask item within a task."""
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='subtasks')
    title = models.CharField(max_length=500)
    is_completed = models.BooleanField(default=False)
    sort_order = models.IntegerField(default=0)

    class Meta:
        db_table = 'subtasks'
        ordering = ['sort_order']

    def __str__(self):
        return self.title


class Tag(BaseModel):
    """Custom labels for tasks."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='tags')
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=7, default='#8b5cf6')

    class Meta:
        db_table = 'tags'
        unique_together = ['user', 'name']

    def __str__(self):
        return self.name


class TaskTag(models.Model):
    """Many-to-many through table for tasks and tags."""
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='task_tags')
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE, related_name='tag_tasks')

    class Meta:
        db_table = 'task_tags'
        unique_together = ['task', 'tag']
