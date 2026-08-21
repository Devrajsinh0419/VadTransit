"""
DRF Views for transport domain: Routes, Stops, Buses, Schedules, and Service Alerts.
Enforces admin-only permissions for write actions while keeping read actions public.
"""

import math
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import City, Route, Stop, RouteStop, Bus, Schedule, ServiceAlert, Favorite
from .permissions import IsAdminOrReadOnly
from .serializers import (
    CitySerializer,
    StopSerializer,
    RouteListSerializer,
    RouteDetailSerializer,
    BusSerializer,
    ScheduleSerializer,
    ServiceAlertSerializer,
    FavoriteSerializer,
)



def calculate_haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculates the great-circle distance between two GPS coordinates in kilometers using Haversine formula.
    """
    R = 6371.0  # Earth's radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


class CityViewSet(viewsets.ModelViewSet):
    """ViewSet for managing City instances."""
    queryset = City.objects.all()
    serializer_class = CitySerializer
    permission_classes = [IsAdminOrReadOnly]


class RouteViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Routes. Supports filtering by city_id and is_active.
    Public GET endpoints, Admin-only POST/PATCH/DELETE endpoints.
    """
    queryset = Route.objects.all()
    permission_classes = [IsAdminOrReadOnly]

    def get_serializer_class(self):
        """Returns RouteDetailSerializer for retrieve action, RouteListSerializer for others."""
        if self.action == 'retrieve':
            return RouteDetailSerializer
        return RouteListSerializer

    def get_queryset(self):
        """Filters routes by optional query parameters: city_id and is_active."""
        queryset = Route.objects.all()
        city_id = self.request.query_params.get('city_id')
        is_active = self.request.query_params.get('is_active')

        if city_id:
            queryset = queryset.filter(city_id=city_id)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')

        return queryset


class StopViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Stops. Supports nearby stop calculations.
    Public GET endpoints, Admin-only POST/PATCH/DELETE endpoints.
    """
    queryset = Stop.objects.all()
    serializer_class = StopSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        """Filters stops by optional query parameters: city_id and is_active."""
        queryset = Stop.objects.all()
        city_id = self.request.query_params.get('city_id')
        is_active = self.request.query_params.get('is_active')

        if city_id:
            queryset = queryset.filter(city_id=city_id)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')

        return queryset

    @action(detail=False, methods=['get'], url_path='nearby')
    def nearby(self, request):
        """
        Returns stops near the specified latitude and longitude within a radius.
        Query parameters: latitude (required), longitude (required), radius (optional, default 5.0 km).
        """
        lat_str = request.query_params.get('latitude')
        lon_str = request.query_params.get('longitude')
        radius_str = request.query_params.get('radius', '5.0')

        if not lat_str or not lon_str:
            return Response(
                {"error": "Both 'latitude' and 'longitude' query parameters are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user_lat = float(lat_str)
            user_lon = float(lon_str)
            radius_km = float(radius_str)
        except ValueError:
            return Response(
                {"error": "'latitude', 'longitude', and 'radius' must be valid numbers."},
                status=status.HTTP_400_BAD_REQUEST
            )

        stops = Stop.objects.filter(is_active=True)
        nearby_stops = []

        for stop in stops:
            distance = calculate_haversine_distance(
                user_lat, user_lon, float(stop.latitude), float(stop.longitude)
            )
            if distance <= radius_km:
                stop_data = StopSerializer(stop).data
                stop_data['distance_km'] = round(distance, 2)
                nearby_stops.append((distance, stop_data))

        # Sort stops by distance from closest to farthest
        nearby_stops.sort(key=lambda item: item[0])
        result_data = [item[1] for item in nearby_stops]

        return Response(result_data, status=status.HTTP_200_OK)


class BusViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Buses.
    Public GET endpoints, Admin-only POST/PATCH/DELETE endpoints.
    """
    queryset = Bus.objects.all()
    serializer_class = BusSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        """Filters buses by optional is_active parameter."""
        queryset = Bus.objects.all()
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        return queryset


class ScheduleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Schedules. Supports filtering by route_id and stop_id.
    Public GET endpoints, Admin-only POST/PATCH/DELETE endpoints.
    """
    queryset = Schedule.objects.all()
    serializer_class = ScheduleSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        """Filters schedules by route_id, stop_id, and is_active query parameters."""
        queryset = Schedule.objects.all()
        route_id = self.request.query_params.get('route_id')
        stop_id = self.request.query_params.get('stop_id')
        is_active = self.request.query_params.get('is_active')

        if route_id:
            queryset = queryset.filter(route_id=route_id)
        if stop_id:
            queryset = queryset.filter(stop_id=stop_id)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')

        return queryset


class ServiceAlertViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Service Alerts.
    Public GET endpoints, Admin-only POST/PATCH/DELETE endpoints.
    """
    queryset = ServiceAlert.objects.all()
    serializer_class = ServiceAlertSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        """Filters service alerts by route_id, bus_id, severity, and is_active query parameters."""
        queryset = ServiceAlert.objects.all()
        route_id = self.request.query_params.get('route_id')
        bus_id = self.request.query_params.get('bus_id')
        severity = self.request.query_params.get('severity')
        is_active = self.request.query_params.get('is_active')

        if route_id:
            queryset = queryset.filter(route_id=route_id)
        if bus_id:
            queryset = queryset.filter(bus_id=bus_id)
        if severity:
            queryset = queryset.filter(severity=severity)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')

        return queryset


class FavoriteViewSet(viewsets.ModelViewSet):
    """
    ViewSet for passenger Favorites.
    Public endpoints (no account required).
    Endpoints:
    - GET /api/favorites/ (supports device_id query param)
    - POST /api/favorites/
    - DELETE /api/favorites/{favorite_id}/
    """
    queryset = Favorite.objects.all()
    serializer_class = FavoriteSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        """Filters favorites by device_id query parameter if provided."""
        queryset = Favorite.objects.all()
        device_id = self.request.query_params.get('device_id')
        if device_id:
            queryset = queryset.filter(device_id=device_id)
        return queryset

