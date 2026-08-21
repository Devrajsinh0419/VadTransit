"""
WebSocket URL routing patterns for tracking domain.
"""

from django.urls import re_path
from .consumers import BusTrackingConsumer, AdminFleetConsumer

websocket_urlpatterns = [
    re_path(r'^ws/buses/(?P<bus_id>\d+)/$', BusTrackingConsumer.as_asgi()),
    re_path(r'^ws/admin/fleet/$', AdminFleetConsumer.as_asgi()),
]

