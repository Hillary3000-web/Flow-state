from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone

from common.permissions import IsOwner
from .models import Goal, Project, Task, Subtask, Tag
from .serializers import (
    GoalSerializer, GoalListSerializer,
    ProjectSerializer,
    TaskSerializer, TaskListSerializer, QuickCaptureSerializer,
    SubtaskSerializer, TagSerializer,
)


class GoalViewSet(viewsets.ModelViewSet):
    """CRUD for Goals."""
    permission_classes = [IsAuthenticated, IsOwner]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status']
    search_fields = ['title', 'description']

    def get_queryset(self):
        return Goal.objects.filter(user=self.request.user).prefetch_related('projects')

    def get_serializer_class(self):
        if self.action == 'list':
            return GoalListSerializer
        return GoalSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ProjectViewSet(viewsets.ModelViewSet):
    """CRUD for Projects."""
    permission_classes = [IsAuthenticated, IsOwner]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['goal', 'status']
    search_fields = ['title']

    def get_queryset(self):
        return Project.objects.filter(user=self.request.user).prefetch_related('tasks')

    def get_serializer_class(self):
        return ProjectSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TaskViewSet(viewsets.ModelViewSet):
    """Full CRUD for Tasks with filtering, search, and custom actions."""
    permission_classes = [IsAuthenticated, IsOwner]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['project', 'status', 'priority', 'energy_level', 'is_recurring']
    search_fields = ['title', 'description']
    ordering_fields = ['due_date', 'priority', 'created_at', 'sort_order']

    def get_queryset(self):
        return Task.objects.filter(user=self.request.user).prefetch_related('subtasks')

    def get_serializer_class(self):
        if self.action == 'list':
            return TaskListSerializer
        if self.action == 'quick_capture':
            return QuickCaptureSerializer
        return TaskSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark task as done."""
        task = self.get_object()
        task.status = 'done'
        task.completed_at = timezone.now()
        task.save()
        return Response(TaskSerializer(task).data)

    @action(detail=False, methods=['post'], url_path='quick-capture')
    def quick_capture(self, request):
        """Fast task creation with minimal data."""
        serializer = QuickCaptureSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['patch'])
    def reorder(self, request):
        """Bulk update sort order for drag-and-drop."""
        items = request.data.get('items', [])
        for item in items:
            Task.objects.filter(id=item['id'], user=request.user).update(
                sort_order=item['sort_order']
            )
        return Response({'detail': 'Reordered successfully.'})

    @action(detail=True, methods=['post'], url_path='ai-breakdown')
    def ai_breakdown(self, request, pk=None):
        """AI-powered task decomposition (placeholder)."""
        task = self.get_object()
        # Placeholder — in production, call OpenAI API
        suggested_subtasks = [
            f"Research {task.title}",
            f"Plan approach for {task.title}",
            f"Execute {task.title}",
            f"Review and finalize {task.title}",
        ]
        created = []
        for i, title in enumerate(suggested_subtasks):
            subtask = Subtask.objects.create(task=task, title=title, sort_order=i)
            created.append(SubtaskSerializer(subtask).data)
        return Response({'subtasks': created}, status=status.HTTP_201_CREATED)


class SubtaskViewSet(viewsets.ModelViewSet):
    """CRUD for Subtasks."""
    serializer_class = SubtaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Subtask.objects.filter(task__user=self.request.user)

    @action(detail=True, methods=['post'])
    def toggle(self, request, pk=None):
        subtask = self.get_object()
        subtask.is_completed = not subtask.is_completed
        subtask.save()
        return Response(SubtaskSerializer(subtask).data)


class TagViewSet(viewsets.ModelViewSet):
    """CRUD for Tags."""
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Tag.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
