"""
Django admin configuration for tracking app models.
"""

from django.contrib import admin
from .models import Shift, BusLocation


@admin.register(Shift)
class ShiftAdmin(admin.ModelAdmin):
    """Admin configuration for Shift model."""
    list_display = ('id', 'driver', 'bus', 'route', 'started_at', 'ended_at', 'is_active')
    list_filter = ('is_active', 'route')
    search_fields = ('driver__name', 'bus__registration_number', 'bus__fleet_number')


@admin.register(BusLocation)
class BusLocationAdmin(admin.ModelAdmin):
    """Admin configuration for BusLocation model."""
    list_display = ('id', 'bus', 'latitude', 'longitude', 'recorded_at', 'received_at', 'speed', 'accuracy')
    list_filter = ('bus',)
    search_fields = ('bus__registration_number', 'bus__fleet_number')
