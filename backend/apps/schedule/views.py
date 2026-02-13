from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from datetime import timedelta

from common.permissions import IsOwner
from .models import TimeBlock
from .serializers import TimeBlockSerializer
from apps.tasks.models import Task
from apps.tasks.serializers import TaskListSerializer


class TimeBlockViewSet(viewsets.ModelViewSet):
    """CRUD for time blocks with date filtering."""
    serializer_class = TimeBlockSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['block_date', 'block_type']

    def get_queryset(self):
        return TimeBlock.objects.filter(user=self.request.user).select_related('task')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['patch'])
    def reorder(self, request):
        """Drag-and-drop reorder."""
        items = request.data.get('items', [])
        for item in items:
            TimeBlock.objects.filter(id=item['id'], user=request.user).update(
                sort_order=item['sort_order'],
                start_time=item.get('start_time'),
                end_time=item.get('end_time'),
            )
        return Response({'detail': 'Reordered.'})


class WeeklyScheduleView(APIView):
    """Get aggregated weekly schedule."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        date_str = request.query_params.get('date', str(timezone.now().date()))
        from datetime import date as date_type
        try:
            current_date = date_type.fromisoformat(date_str)
        except ValueError:
            current_date = timezone.now().date()

        start_of_week = current_date - timedelta(days=current_date.weekday())
        end_of_week = start_of_week + timedelta(days=6)

        blocks = TimeBlock.objects.filter(
            user=request.user,
            block_date__range=[start_of_week, end_of_week]
        ).select_related('task').order_by('block_date', 'start_time')

        serializer = TimeBlockSerializer(blocks, many=True)
        return Response({
            'week_start': start_of_week,
            'week_end': end_of_week,
            'blocks': serializer.data,
        })


class RiskDetectionView(APIView):
    """Detect at-risk and overdue tasks."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        now = timezone.now()
        overdue = Task.objects.filter(
            user=request.user,
            status__in=['todo', 'in_progress'],
            due_date__lt=now
        )
        at_risk = Task.objects.filter(
            user=request.user,
            status__in=['todo', 'in_progress'],
            due_date__range=[now, now + timedelta(days=2)]
        )
        return Response({
            'overdue': TaskListSerializer(overdue, many=True).data,
            'at_risk': TaskListSerializer(at_risk, many=True).data,
        })
