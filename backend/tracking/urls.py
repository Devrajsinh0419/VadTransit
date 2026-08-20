"""
URL routing configuration for driver shifts and bus location tracking.
"""

from django.urls import path
from .views import (
    StartShiftView,
    EndShiftView,
    ActiveShiftsView,
    BusLocationCreateView,
    LatestBusLocationView,
    ActiveBusLocationsView,
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
]
