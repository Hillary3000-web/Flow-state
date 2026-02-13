"""Celery tasks for notifications (email reminders, overdue alerts)."""
from celery import shared_task
from django.utils import timezone
from django.core.mail import send_mail
from datetime import timedelta


@shared_task
def send_overdue_alerts():
    """Check for overdue tasks and create notifications."""
    from apps.tasks.models import Task
    from apps.notifications.models import Notification

    now = timezone.now()
    overdue_tasks = Task.objects.filter(
        status__in=['todo', 'in_progress'],
        due_date__lt=now,
    ).select_related('user')

    for task in overdue_tasks:
        Notification.objects.get_or_create(
            user=task.user,
            type='overdue',
            title=f'Overdue: {task.title}',
            defaults={
                'message': f'Your task "{task.title}" was due {task.due_date}.',
                'metadata': {'task_id': str(task.id)},
            }
        )


@shared_task
def send_upcoming_reminders():
    """Send reminders for tasks due in the next 24 hours."""
    from apps.tasks.models import Task
    from apps.notifications.models import Notification

    now = timezone.now()
    upcoming = Task.objects.filter(
        status__in=['todo', 'in_progress'],
        due_date__range=[now, now + timedelta(hours=24)],
    ).select_related('user')

    for task in upcoming:
        Notification.objects.get_or_create(
            user=task.user,
            type='reminder',
            title=f'Due soon: {task.title}',
            defaults={
                'message': f'Your task "{task.title}" is due {task.due_date}.',
                'metadata': {'task_id': str(task.id)},
            }
        )


@shared_task
def send_email_reminder(user_email, task_title, due_date):
    """Send email reminder for a specific task."""
    send_mail(
        subject=f'FlowState Reminder: {task_title}',
        message=f'Your task "{task_title}" is due on {due_date}. Stay on track!',
        from_email='noreply@flowstate.app',
        recipient_list=[user_email],
        fail_silently=True,
    )
