from rest_framework import serializers
from .models import TimeBlock


class TimeBlockSerializer(serializers.ModelSerializer):
    task_title = serializers.CharField(source='task.title', read_only=True, default='')

    class Meta:
        model = TimeBlock
        fields = [
            'id', 'task', 'task_title', 'title', 'block_date',
            'start_time', 'end_time', 'block_type', 'is_completed',
            'sort_order', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']
