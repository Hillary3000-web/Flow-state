from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.utils import timezone
from datetime import timedelta

from apps.tasks.models import Task
from apps.tasks.serializers import TaskListSerializer
from .models import HabitStreak, DailyCheckin
from .serializers import HabitStreakSerializer, DailyCheckinSerializer


class HabitListView(APIView):
    """List all recurring tasks as habits."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        habits = Task.objects.filter(user=request.user, is_recurring=True)
        serializer = TaskListSerializer(habits, many=True)
        return Response(serializer.data)


class HabitCheckinView(APIView):
    """Check in to a habit for today."""
    permission_classes = [IsAuthenticated]

    def post(self, request, task_id):
        today = timezone.now().date()
        task = Task.objects.get(id=task_id, user=request.user, is_recurring=True)

        streak, created = HabitStreak.objects.get_or_create(
            user=request.user, task=task, streak_date=today,
            defaults={'completed_today': True, 'current_streak': 1}
        )

        if not created and not streak.completed_today:
            streak.completed_today = True

            # Check yesterday
            yesterday = HabitStreak.objects.filter(
                user=request.user, task=task,
                streak_date=today - timedelta(days=1),
                completed_today=True
            ).first()

            if yesterday:
                streak.current_streak = yesterday.current_streak + 1
            else:
                streak.current_streak = 1

            streak.longest_streak = max(streak.longest_streak, streak.current_streak)
            streak.save()

        return Response(HabitStreakSerializer(streak).data)


class HabitStreakView(APIView):
    """Get streak history for a habit."""
    permission_classes = [IsAuthenticated]

    def get(self, request, task_id):
        streaks = HabitStreak.objects.filter(
            user=request.user, task_id=task_id
        ).order_by('-streak_date')[:30]
        return Response(HabitStreakSerializer(streaks, many=True).data)


class HabitProgressView(APIView):
    """Overall habit progress data."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        last_30_days = today - timedelta(days=30)

        habits = Task.objects.filter(user=request.user, is_recurring=True)
        progress = []

        for habit in habits:
            streaks = HabitStreak.objects.filter(
                user=request.user, task=habit, streak_date__gte=last_30_days
            )
            completed = streaks.filter(completed_today=True).count()
            latest = streaks.order_by('-streak_date').first()
            progress.append({
                'task_id': str(habit.id),
                'title': habit.title,
                'completed_days': completed,
                'total_days': 30,
                'completion_rate': round(completed / 30 * 100, 1),
                'current_streak': latest.current_streak if latest else 0,
                'longest_streak': latest.longest_streak if latest else 0,
            })

        return Response(progress)


class DailyCheckinViewSet(viewsets.ModelViewSet):
    """Daily check-in management."""
    serializer_class = DailyCheckinSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return DailyCheckin.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
