from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.utils import timezone
from django.db.models import Sum, Count, Q
from datetime import timedelta

from common.permissions import IsOwner
from .models import FocusSession
from .serializers import FocusSessionSerializer


class FocusSessionViewSet(viewsets.ModelViewSet):
    """CRUD for focus sessions."""
    serializer_class = FocusSessionSerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        return FocusSession.objects.filter(user=self.request.user).select_related('task')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class FocusStatsView(APIView):
    """Focus session statistics and streak info."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        now = timezone.now()
        today = now.date()
        week_ago = today - timedelta(days=7)

        sessions = FocusSession.objects.filter(user=request.user, is_completed=True)

        today_sessions = sessions.filter(started_at__date=today)
        week_sessions = sessions.filter(started_at__date__gte=week_ago)
        total_sessions = sessions

        # Calculate streaks
        dates = list(
            sessions.values_list('started_at__date', flat=True)
            .distinct().order_by('-started_at__date')
        )
        current_streak = 0
        for i, d in enumerate(dates):
            if d == today - timedelta(days=i):
                current_streak += 1
            else:
                break

        return Response({
            'today': {
                'sessions': today_sessions.count(),
                'total_minutes': (today_sessions.aggregate(s=Sum('duration_seconds'))['s'] or 0) // 60,
            },
            'this_week': {
                'sessions': week_sessions.count(),
                'total_minutes': (week_sessions.aggregate(s=Sum('duration_seconds'))['s'] or 0) // 60,
            },
            'all_time': {
                'sessions': total_sessions.count(),
                'total_minutes': (total_sessions.aggregate(s=Sum('duration_seconds'))['s'] or 0) // 60,
            },
            'current_streak_days': current_streak,
        })
