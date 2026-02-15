"""FlowState URL Configuration"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
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
