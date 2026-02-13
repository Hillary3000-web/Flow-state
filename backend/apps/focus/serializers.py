from rest_framework import serializers
from .models import FocusSession


class FocusSessionSerializer(serializers.ModelSerializer):
    task_title = serializers.CharField(source='task.title', read_only=True, default='')

    class Meta:
        model = FocusSession
        fields = [
            'id', 'task', 'task_title', 'started_at', 'ended_at',
            'duration_seconds', 'session_type', 'target_minutes',
            'distraction_log', 'is_completed', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']
