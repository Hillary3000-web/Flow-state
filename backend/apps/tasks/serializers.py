from rest_framework import serializers
from .models import Goal, Project, Task, Subtask, Tag


class SubtaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subtask
        fields = ['id', 'title', 'is_completed', 'sort_order', 'created_at']
        read_only_fields = ['id', 'created_at']


class TaskSerializer(serializers.ModelSerializer):
    subtasks = SubtaskSerializer(many=True, read_only=True)
    subtask_count = serializers.SerializerMethodField()
    completed_subtasks = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            'id', 'project', 'title', 'description', 'priority',
            'energy_level', 'status', 'due_date', 'estimated_minutes',
            'actual_minutes', 'is_recurring', 'recurrence_rule',
            'sort_order', 'completed_at', 'created_at', 'updated_at',
            'subtasks', 'subtask_count', 'completed_subtasks',
        ]
        read_only_fields = ['id', 'completed_at', 'created_at', 'updated_at']

    def get_subtask_count(self, obj):
        return obj.subtasks.count()

    def get_completed_subtasks(self, obj):
        return obj.subtasks.filter(is_completed=True).count()


class TaskListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views — no nested subtasks."""
    subtask_count = serializers.SerializerMethodField()
    completed_subtasks = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            'id', 'project', 'title', 'priority', 'energy_level',
            'status', 'due_date', 'estimated_minutes', 'is_recurring',
            'sort_order', 'completed_at', 'created_at',
            'subtask_count', 'completed_subtasks',
        ]

    def get_subtask_count(self, obj):
        return obj.subtasks.count()

    def get_completed_subtasks(self, obj):
        return obj.subtasks.filter(is_completed=True).count()


class QuickCaptureSerializer(serializers.ModelSerializer):
    """Minimal serializer for fast task creation — title only required."""
    class Meta:
        model = Task
        fields = ['id', 'title', 'priority', 'energy_level', 'due_date', 'project']
        read_only_fields = ['id']


class ProjectSerializer(serializers.ModelSerializer):
    task_count = serializers.SerializerMethodField()
    completed_tasks = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id', 'goal', 'title', 'description', 'status',
            'color', 'sort_order', 'created_at', 'updated_at',
            'task_count', 'completed_tasks',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_task_count(self, obj):
        return obj.tasks.count()

    def get_completed_tasks(self, obj):
        return obj.tasks.filter(status='done').count()


class GoalSerializer(serializers.ModelSerializer):
    projects = ProjectSerializer(many=True, read_only=True)
    project_count = serializers.SerializerMethodField()

    class Meta:
        model = Goal
        fields = [
            'id', 'title', 'description', 'status', 'target_date',
            'progress_pct', 'created_at', 'updated_at',
            'projects', 'project_count',
        ]
        read_only_fields = ['id', 'progress_pct', 'created_at', 'updated_at']

    def get_project_count(self, obj):
        return obj.projects.count()


class GoalListSerializer(serializers.ModelSerializer):
    """Lightweight for list views."""
    project_count = serializers.SerializerMethodField()

    class Meta:
        model = Goal
        fields = ['id', 'title', 'status', 'target_date', 'progress_pct', 'created_at', 'project_count']

    def get_project_count(self, obj):
        return obj.projects.count()


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'color']
        read_only_fields = ['id']
