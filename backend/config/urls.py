"""FlowState URL Configuration"""
from django.contrib import admin
from django.urls import path, include

from django.http import JsonResponse

def health_check(request):
    return JsonResponse({'status': 'ok', 'message': 'FlowState API is running'})

urlpatterns = [
    path('', health_check, name='health_check'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.users.urls')),
    path('api/goals/', include('apps.tasks.urls_goals')),
    path('api/projects/', include('apps.tasks.urls_projects')),
    path('api/tasks/', include('apps.tasks.urls_tasks')),
    path('api/subtasks/', include('apps.tasks.urls_subtasks')),
    path('api/schedule/', include('apps.schedule.urls')),
    path('api/focus/', include('apps.focus.urls')),
    path('api/habits/', include('apps.habits.urls')),
    path('api/analytics/', include('apps.analytics.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/chatbot/', include('apps.chatbot.urls')),
]
