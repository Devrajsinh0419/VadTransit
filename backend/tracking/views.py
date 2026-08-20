"""
Views for driver shift management and real-time bus location tracking.
"""

from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from transport.models import Bus
from .models import Shift, BusLocation
from .serializers import (
    ShiftSerializer,
    ShiftStartSerializer,
    BusLocationCreateSerializer,
    BusLocationSerializer,
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
        """Validates active shift requirement and records a bus location fix."""
        serializer = BusLocationCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        location = serializer.save()
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
