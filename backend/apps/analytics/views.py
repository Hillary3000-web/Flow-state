from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Count, Q, Sum, F
from datetime import timedelta

from apps.tasks.models import Task
from apps.focus.models import FocusSession


class OverviewView(APIView):
    """Dashboard overview stats."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        now = timezone.now()
        today = now.date()

        total_tasks = Task.objects.filter(user=user).count()
        completed = Task.objects.filter(user=user, status='done').count()
        in_progress = Task.objects.filter(user=user, status='in_progress').count()
        overdue = Task.objects.filter(
            user=user, status__in=['todo', 'in_progress'], due_date__lt=now
        ).count()

        completion_rate = round(completed / total_tasks * 100, 1) if total_tasks > 0 else 0

        # Today's stats
        today_completed = Task.objects.filter(
            user=user, status='done', completed_at__date=today
        ).count()
        today_focus_minutes = (FocusSession.objects.filter(
            user=user, started_at__date=today, is_completed=True
        ).aggregate(s=Sum('duration_seconds'))['s'] or 0) // 60

        return Response({
            'total_tasks': total_tasks,
            'completed': completed,
            'in_progress': in_progress,
            'overdue': overdue,
            'completion_rate': completion_rate,
            'today_completed': today_completed,
            'today_focus_minutes': today_focus_minutes,
        })


class TrendsView(APIView):
    """Daily/weekly productivity trends."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        days = int(request.query_params.get('days', 14))
        today = timezone.now().date()

        trends = []
        for i in range(days):
            date = today - timedelta(days=i)
            completed = Task.objects.filter(
                user=user, status='done', completed_at__date=date
            ).count()
            created = Task.objects.filter(
                user=user, created_at__date=date
            ).count()
            focus_mins = (FocusSession.objects.filter(
                user=user, started_at__date=date, is_completed=True
            ).aggregate(s=Sum('duration_seconds'))['s'] or 0) // 60

            trends.append({
                'date': str(date),
                'completed': completed,
                'created': created,
                'focus_minutes': focus_mins,
            })

        trends.reverse()
        return Response(trends)


class BurndownView(APIView):
    """Burn-down chart data for a project."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        project_id = request.query_params.get('project')
        days = int(request.query_params.get('days', 30))
        today = timezone.now().date()

        filters = {'user': request.user}
        if project_id:
            filters['project_id'] = project_id

        total = Task.objects.filter(**filters).count()
        burndown = []
        for i in range(days):
            date = today - timedelta(days=(days - 1 - i))
            completed_by_date = Task.objects.filter(
                **filters, status='done', completed_at__date__lte=date
            ).count()
            burndown.append({
                'date': str(date),
                'remaining': total - completed_by_date,
                'completed': completed_by_date,
            })

        return Response(burndown)


class TimeAllocationView(APIView):
    """Time allocation breakdown by project and energy level."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # By project
        by_project = (
            Task.objects.filter(user=user, status='done', actual_minutes__isnull=False)
            .values('project__title')
            .annotate(total_minutes=Sum('actual_minutes'))
            .order_by('-total_minutes')
        )

        # By energy level
        by_energy = (
            Task.objects.filter(user=user, status='done')
            .values('energy_level')
            .annotate(count=Count('id'))
            .order_by('energy_level')
        )

        # By priority
        by_priority = (
            Task.objects.filter(user=user, status='done')
            .values('priority')
            .annotate(count=Count('id'))
            .order_by('priority')
        )

        return Response({
            'by_project': list(by_project),
            'by_energy': list(by_energy),
            'by_priority': list(by_priority),
        })
