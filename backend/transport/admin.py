"""
Django admin configuration for transport app models.
"""

from django.contrib import admin
from .models import City, Route, Stop, RouteStop, Bus, Driver, Schedule, ServiceAlert


@admin.register(City)
class CityAdmin(admin.ModelAdmin):
    """Admin configuration for City model."""
    list_display = ('id', 'name', 'state', 'is_active')
    list_filter = ('is_active', 'state')
    search_fields = ('name', 'state')


@admin.register(Route)
class RouteAdmin(admin.ModelAdmin):
    """Admin configuration for Route model."""
    list_display = ('id', 'route_code', 'name', 'city', 'is_active')
    list_filter = ('is_active', 'city')
    search_fields = ('route_code', 'name')


@admin.register(Stop)
class StopAdmin(admin.ModelAdmin):
    """Admin configuration for Stop model."""
    list_display = ('id', 'name', 'city', 'latitude', 'longitude', 'is_active')
    list_filter = ('is_active', 'city')
    search_fields = ('name',)


@admin.register(RouteStop)
class RouteStopAdmin(admin.ModelAdmin):
    """Admin configuration for RouteStop model."""
    list_display = ('id', 'route', 'stop', 'stop_order', 'distance_from_previous_stop', 'expected_travel_time')
    list_filter = ('route',)
    search_fields = ('route__name', 'route__route_code', 'stop__name')


@admin.register(Bus)
class BusAdmin(admin.ModelAdmin):
    """Admin configuration for Bus model."""
    list_display = ('id', 'registration_number', 'fleet_number', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('registration_number', 'fleet_number')


@admin.register(Driver)
class DriverAdmin(admin.ModelAdmin):
    """Admin configuration for Driver model."""
    list_display = ('id', 'name', 'phone_number', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name', 'phone_number')


@admin.register(Schedule)
class ScheduleAdmin(admin.ModelAdmin):
    """Admin configuration for Schedule model."""
    list_display = ('id', 'route', 'stop', 'arrival_time', 'departure_time', 'is_active')
    list_filter = ('is_active', 'route')
    search_fields = ('route__name', 'route__route_code', 'stop__name')


@admin.register(ServiceAlert)
class ServiceAlertAdmin(admin.ModelAdmin):
    """Admin configuration for ServiceAlert model."""
    list_display = ('id', 'title', 'severity', 'route', 'bus', 'starts_at', 'ends_at', 'is_active')
    list_filter = ('severity', 'is_active')
    search_fields = ('title', 'message')
