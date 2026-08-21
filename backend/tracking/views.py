"""
Views for driver shift management, real-time bus location tracking, and ETA calculation endpoints.
"""

from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAdminUser
from transport.models import Bus, Route, Stop, RouteStop, ServiceAlert
from .models import Shift, BusLocation
from .eta_service import ETAService
from .serializers import (
    ShiftSerializer,
    ShiftStartSerializer,
    BusLocationCreateSerializer,
    BusLocationSerializer,
    ETAResponseSerializer,
    AdminFleetStatusSerializer,
    AdminTripHistorySerializer,
    AdminDelayHistorySerializer,
)


class StartShiftView(APIView):
    """
    API view for starting a new driver shift.
    Endpoint: POST /api/shifts/start/
    """
    permission_classes = [AllowAny]

    def post(self, request):
        """Starts a new driver shift for a bus and route if no active shift exists for the bus."""
        serializer = ShiftStartSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        shift = serializer.save()
        return Response(ShiftSerializer(shift).data, status=status.HTTP_201_CREATED)


class EndShiftView(APIView):
    """
    API view for ending an active driver shift.
    Endpoint: POST /api/shifts/{shift_id}/end/
    """
    permission_classes = [AllowAny]

    def post(self, request, shift_id):
        """Ends an active shift by setting ended_at timestamp and marking is_active to False."""
        try:
            shift = Shift.objects.get(id=shift_id)
        except Shift.DoesNotExist:
            return Response({"error": "Shift not found."}, status=status.HTTP_404_NOT_FOUND)

        if not shift.is_active:
            return Response({"error": "Shift is already ended."}, status=status.HTTP_400_BAD_REQUEST)

        shift.is_active = False
        shift.ended_at = timezone.now()
        shift.save()

        return Response(ShiftSerializer(shift).data, status=status.HTTP_200_OK)


class ActiveShiftsView(APIView):
    """
    API view for listing all currently active driver shifts.
    Endpoint: GET /api/shifts/active/
    """
    permission_classes = [AllowAny]

    def get(self, request):
        """Returns all currently active driver shifts."""
        active_shifts = Shift.objects.filter(is_active=True)
        serializer = ShiftSerializer(active_shifts, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class BusLocationCreateView(APIView):
    """
    API view for recording GPS location fixes sent by active driver shifts.
    Endpoint: POST /api/locations/
    """
    permission_classes = [AllowAny]

    def post(self, request):
        """Validates active shift requirement, records a bus location fix, and broadcasts real-time updates."""
        serializer = BusLocationCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        location = serializer.save()

        # Broadcast real-time location and ETA update to connected WebSocket clients
        try:
            from asgiref.sync import async_to_sync
            from channels.layers import get_channel_layer
            channel_layer = get_channel_layer()
            if channel_layer:
                eta_data = ETAService.calculate_bus_eta(location.bus)
                update_payload = {
                    "bus_id": location.bus.id,
                    "latitude": float(location.latitude),
                    "longitude": float(location.longitude),
                    "recorded_at": location.recorded_at.isoformat(),
                    "speed": location.speed,
                    "heading": location.heading,
                    "eta": ETAResponseSerializer(eta_data).data if eta_data else None
                }
                async_to_sync(channel_layer.group_send)(
                    f"bus_{location.bus.id}",
                    {
                        "type": "bus_update",
                        "data": update_payload
                    }
                )

                # Broadcast update to admin fleet dashboard channel
                active_shift = Shift.objects.filter(bus=location.bus, is_active=True).first()
                fleet_payload = {
                    "bus_id": location.bus.id,
                    "registration_number": location.bus.registration_number,
                    "fleet_number": location.bus.fleet_number,
                    "is_active": location.bus.is_active,
                    "status": "live",
                    "shift_id": active_shift.id if active_shift else None,
                    "driver_id": active_shift.driver.id if active_shift else None,
                    "driver_name": active_shift.driver.name if active_shift else None,
                    "route_id": active_shift.route.id if active_shift else None,
                    "route_name": active_shift.route.name if active_shift else None,
                    "route_code": active_shift.route.route_code if active_shift else None,
                    "last_location": {
                        "latitude": float(location.latitude),
                        "longitude": float(location.longitude),
                        "recorded_at": location.recorded_at.isoformat(),
                        "speed": location.speed,
                        "heading": location.heading,
                    }
                }
                async_to_sync(channel_layer.group_send)(
                    "admin_fleet",
                    {
                        "type": "fleet_update",
                        "data": fleet_payload
                    }
                )
        except Exception:
            # Prevent WebSocket broadcast failure from breaking HTTP location ingestion
            pass

        return Response(BusLocationSerializer(location).data, status=status.HTTP_201_CREATED)


class LatestBusLocationView(APIView):
    """
    API view for retrieving the latest known location fix for a specific bus.
    Endpoint: GET /api/buses/{bus_id}/location/
    """
    permission_classes = [AllowAny]

    def get(self, request, bus_id):
        """Returns the most recent recorded location fix for the specified bus."""
        try:
            bus = Bus.objects.get(id=bus_id)
        except Bus.DoesNotExist:
            return Response({"error": "Bus not found."}, status=status.HTTP_404_NOT_FOUND)

        latest_location = BusLocation.objects.filter(bus=bus).order_by('-recorded_at').first()
        if not latest_location:
            return Response({"error": "No location records found for this bus."}, status=status.HTTP_404_NOT_FOUND)

        return Response(BusLocationSerializer(latest_location).data, status=status.HTTP_200_OK)


class ActiveBusLocationsView(APIView):
    """
    API view for retrieving the latest locations of all currently active buses.
    Endpoint: GET /api/buses/active/locations/
    """
    permission_classes = [AllowAny]

    def get(self, request):
        """Returns the latest location record for each bus that has an active shift."""
        active_bus_ids = Shift.objects.filter(is_active=True).values_list('bus_id', flat=True).distinct()

        latest_locations = []
        for bus_id in active_bus_ids:
            loc = BusLocation.objects.filter(bus_id=bus_id).order_by('-recorded_at').first()
            if loc:
                latest_locations.append(loc)

        serializer = BusLocationSerializer(latest_locations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class BusETAView(APIView):
    """
    API view for calculating the current best ETA for a selected bus.
    Endpoint: GET /api/buses/{bus_id}/eta/
    Optional Query Parameters: stop_id
    """
    permission_classes = [AllowAny]

    def get(self, request, bus_id):
        """Calculates and returns the best ETA for the specified bus."""
        try:
            bus = Bus.objects.get(id=bus_id)
        except Bus.DoesNotExist:
            return Response({"error": "Bus not found."}, status=status.HTTP_404_NOT_FOUND)

        stop_id = request.query_params.get('stop_id')
        stop = None
        if stop_id:
            try:
                stop = Stop.objects.get(id=stop_id)
            except Stop.DoesNotExist:
                return Response({"error": "Stop not found."}, status=status.HTTP_404_NOT_FOUND)

        eta_data = ETAService.calculate_bus_eta(bus, stop=stop)
        if not eta_data:
            return Response({"error": "Could not calculate ETA for the specified bus and stop."}, status=status.HTTP_400_BAD_REQUEST)

        return Response(ETAResponseSerializer(eta_data).data, status=status.HTTP_200_OK)


class RouteETAsView(APIView):
    """
    API view for retrieving ETAs of active buses operating on a specific route.
    Endpoint: GET /api/routes/{route_id}/etas/
    Optional Query Parameters: stop_id
    """
    permission_classes = [AllowAny]

    def get(self, request, route_id):
        """Calculates and returns ETAs for active buses on the route, filtered by optional stop_id."""
        try:
            route = Route.objects.get(id=route_id)
        except Route.DoesNotExist:
            return Response({"error": "Route not found."}, status=status.HTTP_404_NOT_FOUND)

        active_shifts = Shift.objects.filter(route=route, is_active=True)
        route_stops = RouteStop.objects.filter(route=route).order_by('stop_order')

        stop_id = request.query_params.get('stop_id')
        if stop_id:
            route_stops = route_stops.filter(stop_id=stop_id)

        etas = []
        for shift in active_shifts:
            for rs in route_stops:
                eta_data = ETAService.calculate_bus_eta(shift.bus, stop=rs.stop, route=route)
                if eta_data:
                    etas.append(eta_data)

        return Response(ETAResponseSerializer(etas, many=True).data, status=status.HTTP_200_OK)



class StopArrivalsView(APIView):
    """
    API view for retrieving approaching buses and their ETAs for a specific bus stop.
    Endpoint: GET /api/stops/{stop_id}/arrivals/
    """
    permission_classes = [AllowAny]

    def get(self, request, stop_id):
        """Calculates and returns approaching active buses and ETAs for the specified stop."""
        try:
            stop = Stop.objects.get(id=stop_id)
        except Stop.DoesNotExist:
            return Response({"error": "Stop not found."}, status=status.HTTP_404_NOT_FOUND)

        # Find routes passing through this stop
        route_ids = RouteStop.objects.filter(stop=stop).values_list('route_id', flat=True)
        active_shifts = Shift.objects.filter(route_id__in=route_ids, is_active=True)

        arrivals = []
        for shift in active_shifts:
            eta_data = ETAService.calculate_bus_eta(shift.bus, stop=stop, route=shift.route)
            if eta_data:
                arrivals.append(eta_data)

        # Sort arrivals by ETA timestamp
        arrivals.sort(key=lambda item: item['eta'])
        return Response(ETAResponseSerializer(arrivals, many=True).data, status=status.HTTP_200_OK)


class AdminFleetStatusView(APIView):
    """
    API view for returning active fleet buses and their real-time service status.
    Endpoint: GET /api/admin/fleet/
    Permission: Admin only.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        """Returns active buses and their current service/tracking status for admin monitoring."""
        now = timezone.now()
        buses = Bus.objects.all().order_by('fleet_number')

        is_active_param = request.query_params.get('is_active')
        if is_active_param is not None:
            buses = buses.filter(is_active=is_active_param.lower() == 'true')

        fleet_data = []
        for bus in buses:
            active_shift = Shift.objects.filter(bus=bus, is_active=True).first()
            latest_loc = BusLocation.objects.filter(bus=bus).order_by('-recorded_at').first()

            if active_shift and latest_loc:
                age_seconds = (now - latest_loc.recorded_at).total_seconds()
                if age_seconds <= 180:
                    bus_status = 'live'
                elif age_seconds <= 900:
                    bus_status = 'stale'
                else:
                    bus_status = 'offline'
            else:
                bus_status = 'offline'

            last_loc_data = None
            if latest_loc:
                last_loc_data = {
                    'latitude': float(latest_loc.latitude),
                    'longitude': float(latest_loc.longitude),
                    'recorded_at': latest_loc.recorded_at.isoformat(),
                    'speed': latest_loc.speed,
                    'heading': latest_loc.heading,
                }

            item = {
                'bus_id': bus.id,
                'registration_number': bus.registration_number,
                'fleet_number': bus.fleet_number,
                'is_active': bus.is_active,
                'status': bus_status,
                'shift_id': active_shift.id if active_shift else None,
                'driver_id': active_shift.driver.id if active_shift else None,
                'driver_name': active_shift.driver.name if active_shift else None,
                'route_id': active_shift.route.id if active_shift else None,
                'route_name': active_shift.route.name if active_shift else None,
                'route_code': active_shift.route.route_code if active_shift else None,
                'last_location': last_loc_data,
            }
            fleet_data.append(item)

        serializer = AdminFleetStatusSerializer(fleet_data, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminTripHistoryView(APIView):
    """
    API view for retrieving basic trip history for administrators.
    Endpoint: GET /api/admin/trips/
    Permission: Admin only.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        """Returns historical trip and shift records filtered by optional parameters."""
        queryset = Shift.objects.select_related('driver', 'bus', 'route').all().order_by('-started_at')

        bus_id = request.query_params.get('bus_id')
        route_id = request.query_params.get('route_id')
        driver_id = request.query_params.get('driver_id')
        is_active = request.query_params.get('is_active')

        if bus_id:
            queryset = queryset.filter(bus_id=bus_id)
        if route_id:
            queryset = queryset.filter(route_id=route_id)
        if driver_id:
            queryset = queryset.filter(driver_id=driver_id)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')

        serializer = AdminTripHistorySerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminDelayHistoryView(APIView):
    """
    API view for retrieving basic delay and service alert history for administrators.
    Endpoint: GET /api/admin/delays/
    Permission: Admin only.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        """Returns delay and service disruption alert history filtered by optional parameters."""
        queryset = ServiceAlert.objects.select_related('route', 'bus').all().order_by('-starts_at')

        route_id = request.query_params.get('route_id')
        bus_id = request.query_params.get('bus_id')
        severity = request.query_params.get('severity')
        is_active = request.query_params.get('is_active')

        if route_id:
            queryset = queryset.filter(route_id=route_id)
        if bus_id:
            queryset = queryset.filter(bus_id=bus_id)
        if severity:
            queryset = queryset.filter(severity=severity)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')

        serializer = AdminDelayHistorySerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

