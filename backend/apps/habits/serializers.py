from rest_framework import serializers
from .models import HabitStreak, DailyCheckin


class HabitStreakSerializer(serializers.ModelSerializer):
    task_title = serializers.CharField(source='task.title', read_only=True)

    class Meta:
        model = HabitStreak
        fields = ['id', 'task', 'task_title', 'streak_date', 'current_streak', 'longest_streak', 'completed_today', 'created_at']
        read_only_fields = ['id', 'created_at']


class DailyCheckinSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyCheckin
        fields = ['id', 'checkin_date', 'energy_level', 'reflection', 'tasks_planned', 'tasks_completed', 'created_at']
        read_only_fields = ['id', 'created_at']
