"""
Master URL configuration for VadTransit backend.
Routes /admin/ to Django Admin, /api/auth/ to authentication endpoints, and /api/ to transport domain endpoints.
"""

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/', include('transport.urls')),
]
