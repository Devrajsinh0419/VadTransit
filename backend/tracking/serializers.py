"""
DRF Serializers for shift tracking, bus GPS location updates, and ETA responses.
Follows field_names.md for exact naming conventions.
"""

from django.utils import timezone
from rest_framework import serializers
from transport.models import Bus, Driver, Route, ServiceAlert
from .models import Shift, BusLocation


class ShiftSerializer(serializers.ModelSerializer):
    """Serializer for reading and listing Shift instances."""

    driver_id = serializers.PrimaryKeyRelatedField(
        queryset=Driver.objects.all(), source='driver'
    )
    bus_id = serializers.PrimaryKeyRelatedField(
        queryset=Bus.objects.all(), source='bus'
    )
    route_id = serializers.PrimaryKeyRelatedField(
        queryset=Route.objects.all(), source='route'
    )

    class Meta:
        model = Shift
        fields = ['id', 'driver_id', 'bus_id', 'route_id', 'started_at', 'ended_at', 'is_active']


class ShiftStartSerializer(serializers.Serializer):
    """Serializer for starting a new driver shift."""

    driver_id = serializers.PrimaryKeyRelatedField(
        queryset=Driver.objects.filter(is_active=True), source='driver'
    )
    bus_id = serializers.PrimaryKeyRelatedField(
        queryset=Bus.objects.filter(is_active=True), source='bus'
    )
    route_id = serializers.PrimaryKeyRelatedField(
        queryset=Route.objects.filter(is_active=True), source='route'
    )

    def validate_driver_id(self, driver):
        """Validates that the selected driver does not already have an active shift."""
        if Shift.objects.filter(driver=driver, is_active=True).exists():
            raise serializers.ValidationError("This driver already has an active shift.")
        return driver

    def validate_bus_id(self, bus):
        """Validates that the selected bus does not already have an active shift."""
        if Shift.objects.filter(bus=bus, is_active=True).exists():
            raise serializers.ValidationError("This bus already has an active shift.")
        return bus

    def create(self, validated_data):
        """Creates a new active shift with timezone-aware start timestamp."""
        return Shift.objects.create(
            driver=validated_data['driver'],
            bus=validated_data['bus'],
            route=validated_data['route'],
            started_at=timezone.now(),
            is_active=True
        )


class BusLocationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating bus location fixes, ensuring active shift check."""

    bus_id = serializers.PrimaryKeyRelatedField(
        queryset=Bus.objects.all(), source='bus'
    )

    class Meta:
        model = BusLocation
        fields = ['id', 'bus_id', 'latitude', 'longitude', 'recorded_at', 'accuracy', 'speed', 'heading']

    def validate_latitude(self, value):
        """Validates latitude within [-90, 90] range."""
        if value < -90 or value > 90:
            raise serializers.ValidationError("Latitude must be between -90 and 90 degrees.")
        return value

    def validate_longitude(self, value):
        """Validates longitude within [-180, 180] range."""
        if value < -180 or value > 180:
            raise serializers.ValidationError("Longitude must be between -180 and 180 degrees.")
        return value

    def validate(self, data):
        """Validates active shift requirement and ensures timezone-aware valid recorded_at timestamp."""
        bus = data.get('bus')
        if not Shift.objects.filter(bus=bus, is_active=True).exists():
            raise serializers.ValidationError({"bus_id": "Location updates are rejected for buses without an active shift."})

        now = timezone.now()
        recorded_at = data.get('recorded_at')
        if not recorded_at:
            data['recorded_at'] = now
        elif recorded_at > now:
            data['recorded_at'] = now

        return data



class BusLocationSerializer(serializers.ModelSerializer):
    """Serializer for returning bus location representations."""

    bus_id = serializers.PrimaryKeyRelatedField(
        queryset=Bus.objects.all(), source='bus'
    )

    class Meta:
        model = BusLocation
        fields = ['id', 'bus_id', 'latitude', 'longitude', 'recorded_at', 'received_at', 'accuracy', 'speed', 'heading']


class ETAResponseSerializer(serializers.Serializer):
    """Serializer for structured ETA responses according to field_names.md."""

    bus_id = serializers.IntegerField()
    route_id = serializers.IntegerField()
    stop_id = serializers.IntegerField()
    eta = serializers.DateTimeField()
    calculated_at = serializers.DateTimeField()
    source = serializers.ChoiceField(choices=['live', 'recent', 'scheduled'])
    last_location_at = serializers.DateTimeField(allow_null=True)


class AdminFleetStatusSerializer(serializers.Serializer):
    """Serializer for representing admin fleet monitoring status of buses."""

    bus_id = serializers.IntegerField()
    registration_number = serializers.CharField()
    fleet_number = serializers.CharField()
    is_active = serializers.BooleanField()
    status = serializers.ChoiceField(choices=['live', 'stale', 'offline'])
    shift_id = serializers.IntegerField(allow_null=True)
    driver_id = serializers.IntegerField(allow_null=True)
    driver_name = serializers.CharField(allow_null=True)
    route_id = serializers.IntegerField(allow_null=True)
    route_name = serializers.CharField(allow_null=True)
    route_code = serializers.CharField(allow_null=True)
    last_location = serializers.DictField(allow_null=True)


class AdminTripHistorySerializer(serializers.ModelSerializer):
    """Serializer for basic admin trip history records."""

    trip_id = serializers.IntegerField(source='id', read_only=True)
    shift_id = serializers.IntegerField(source='id', read_only=True)
    driver_id = serializers.IntegerField(source='driver.id', read_only=True)
    driver_name = serializers.CharField(source='driver.name', read_only=True)
    bus_id = serializers.IntegerField(source='bus.id', read_only=True)
    bus_fleet_number = serializers.CharField(source='bus.fleet_number', read_only=True)
    registration_number = serializers.CharField(source='bus.registration_number', read_only=True)
    route_id = serializers.IntegerField(source='route.id', read_only=True)
    route_name = serializers.CharField(source='route.name', read_only=True)
    route_code = serializers.CharField(source='route.route_code', read_only=True)
    status = serializers.SerializerMethodField()

    class Meta:
        model = Shift
        fields = [
            'id', 'trip_id', 'shift_id', 'driver_id', 'driver_name',
            'bus_id', 'bus_fleet_number', 'registration_number',
            'route_id', 'route_name', 'route_code',
            'started_at', 'ended_at', 'is_active', 'status'
        ]

    def get_status(self, obj):
        """Returns shift/trip status: 'active' or 'completed'."""
        return 'active' if obj.is_active else 'completed'


class AdminDelayHistorySerializer(serializers.ModelSerializer):
    """Serializer for basic admin delay history records."""

    alert_id = serializers.IntegerField(source='id', read_only=True)
    route_id = serializers.IntegerField(source='route.id', read_only=True, allow_null=True)
    route_name = serializers.CharField(source='route.name', read_only=True, allow_null=True)
    route_code = serializers.CharField(source='route.route_code', read_only=True, allow_null=True)
    bus_id = serializers.IntegerField(source='bus.id', read_only=True, allow_null=True)
    bus_fleet_number = serializers.CharField(source='bus.fleet_number', read_only=True, allow_null=True)

    class Meta:
        model = ServiceAlert
        fields = [
            'id', 'alert_id', 'title', 'message',
            'route_id', 'route_name', 'route_code',
            'bus_id', 'bus_fleet_number',
            'severity', 'starts_at', 'ends_at', 'is_active'
        ]

