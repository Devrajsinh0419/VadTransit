"""
URL routing configuration for driver shifts, bus location tracking, and ETA endpoints.
"""

from django.urls import path
from .views import (
    StartShiftView,
    EndShiftView,
    ActiveShiftsView,
    BusLocationCreateView,
    LatestBusLocationView,
    ActiveBusLocationsView,
    BusETAView,
    RouteETAsView,
    StopArrivalsView,
    AdminFleetStatusView,
    AdminTripHistoryView,
    AdminDelayHistoryView,
)

urlpatterns = [
    # Shift endpoints
    path('shifts/start/', StartShiftView.as_view(), name='shift-start'),
    path('shifts/<int:shift_id>/end/', EndShiftView.as_view(), name='shift-end'),
    path('shifts/active/', ActiveShiftsView.as_view(), name='shifts-active'),

    # Location tracking endpoints
    path('locations/', BusLocationCreateView.as_view(), name='location-create'),
    path('buses/<int:bus_id>/location/', LatestBusLocationView.as_view(), name='bus-latest-location'),
    path('buses/active/locations/', ActiveBusLocationsView.as_view(), name='buses-active-locations'),

    # ETA endpoints
    path('buses/<int:bus_id>/eta/', BusETAView.as_view(), name='bus-eta'),
    path('routes/<int:route_id>/etas/', RouteETAsView.as_view(), name='route-etas'),
    path('stops/<int:stop_id>/arrivals/', StopArrivalsView.as_view(), name='stop-arrivals'),

    # Admin Monitoring endpoints
    path('admin/fleet/', AdminFleetStatusView.as_view(), name='admin-fleet-status'),
    path('admin/trips/', AdminTripHistoryView.as_view(), name='admin-trip-history'),
    path('admin/delays/', AdminDelayHistoryView.as_view(), name='admin-delay-history'),
]

