"""
DRF Serializers for transport domain models.
Follows field_names.md for exact naming conventions.
"""

from rest_framework import serializers
from .models import City, Route, Stop, RouteStop, Bus, Schedule, ServiceAlert


class CitySerializer(serializers.ModelSerializer):
    """Serializer for City model."""

    class Meta:
        model = City
        fields = ['id', 'name', 'state', 'is_active']


class StopSerializer(serializers.ModelSerializer):
    """Serializer for Stop model with city_id field and coordinate validation."""

    city_id = serializers.PrimaryKeyRelatedField(
        queryset=City.objects.all(), source='city'
    )

    class Meta:
        model = Stop
        fields = ['id', 'name', 'latitude', 'longitude', 'city_id', 'is_active']

    def validate_latitude(self, value):
        """Validates that latitude is within valid range [-90, 90]."""
        if value < -90 or value > 90:
            raise serializers.ValidationError("Latitude must be between -90 and 90 degrees.")
        return value

    def validate_longitude(self, value):
        """Validates that longitude is within valid range [-180, 180]."""
        if value < -180 or value > 180:
            raise serializers.ValidationError("Longitude must be between -180 and 180 degrees.")
        return value


class RouteStopSerializer(serializers.ModelSerializer):
    """Serializer for RouteStop model representing stops assigned to a route."""

    route_id = serializers.PrimaryKeyRelatedField(
        queryset=Route.objects.all(), source='route'
    )
    stop_id = serializers.PrimaryKeyRelatedField(
        queryset=Stop.objects.all(), source='stop'
    )
    stop = StopSerializer(read_only=True)

    class Meta:
        model = RouteStop
        fields = [
            'id', 'route_id', 'stop_id', 'stop', 'stop_order',
            'distance_from_previous_stop', 'expected_travel_time'
        ]


class RouteListSerializer(serializers.ModelSerializer):
    """Serializer for listing routes."""

    city_id = serializers.PrimaryKeyRelatedField(
        queryset=City.objects.all(), source='city'
    )

    class Meta:
        model = Route
        fields = ['id', 'name', 'route_code', 'city_id', 'is_active']


class RouteDetailSerializer(serializers.ModelSerializer):
    """Serializer for detailed route view, including ordered stops."""

    city_id = serializers.PrimaryKeyRelatedField(
        queryset=City.objects.all(), source='city'
    )
    stops = RouteStopSerializer(source='route_stops', many=True, read_only=True)

    class Meta:
        model = Route
        fields = ['id', 'name', 'route_code', 'city_id', 'is_active', 'stops']


class BusSerializer(serializers.ModelSerializer):
    """Serializer for Bus model."""

    class Meta:
        model = Bus
        fields = ['id', 'registration_number', 'fleet_number', 'is_active']

    def validate_registration_number(self, value):
        """Validates that registration number is not empty."""
        cleaned_value = value.strip()
        if not cleaned_value:
            raise serializers.ValidationError("Registration number cannot be empty.")
        return cleaned_value


class ScheduleSerializer(serializers.ModelSerializer):
    """Serializer for Schedule model."""

    route_id = serializers.PrimaryKeyRelatedField(
        queryset=Route.objects.all(), source='route'
    )
    stop_id = serializers.PrimaryKeyRelatedField(
        queryset=Stop.objects.all(), source='stop'
    )

    class Meta:
        model = Schedule
        fields = ['id', 'route_id', 'stop_id', 'arrival_time', 'departure_time', 'is_active']


class ServiceAlertSerializer(serializers.ModelSerializer):
    """Serializer for ServiceAlert model with date range validation."""

    route_id = serializers.PrimaryKeyRelatedField(
        queryset=Route.objects.all(), source='route', allow_null=True, required=False
    )
    bus_id = serializers.PrimaryKeyRelatedField(
        queryset=Bus.objects.all(), source='bus', allow_null=True, required=False
    )

    class Meta:
        model = ServiceAlert
        fields = [
            'id', 'title', 'message', 'route_id', 'bus_id',
            'severity', 'starts_at', 'ends_at', 'is_active'
        ]

    def validate(self, data):
        """Validates that ends_at is after starts_at if ends_at is provided."""
        starts_at = data.get('starts_at')
        ends_at = data.get('ends_at')
        if starts_at and ends_at and ends_at < starts_at:
            raise serializers.ValidationError({"ends_at": "End time must be after start time."})
        return data
