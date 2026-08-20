"""
ETA Service module.
Calculates estimated arrival times (ETA) for buses using live GPS fixes, recent location fallbacks, and scheduled arrival fallbacks.
"""

import math
from datetime import datetime, timedelta
from django.utils import timezone
from transport.models import Stop, Route, RouteStop, Schedule
from tracking.models import Shift, BusLocation

LIVE_THRESHOLD_SECONDS = 180       # Location data <= 3 minutes old is considered live
RECENT_THRESHOLD_SECONDS = 900     # Location data <= 15 minutes old is considered recent
AVERAGE_BUS_SPEED_KMH = 20.0       # Fallback average urban bus speed in km/h


def calculate_haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculates the great-circle distance between two GPS coordinates in kilometers.
    """
    R = 6371.0  # Earth's radius in km
    dlat = math.radians(float(lat2) - float(lat1))
    dlon = math.radians(float(lon2) - float(lon1))
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(float(lat1)))
        * math.cos(math.radians(float(lat2)))
        * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


class ETAService:
    """
    Service class providing deterministic ETA calculations for buses and stops.
    """

    @staticmethod
    def calculate_bus_eta(bus, stop=None, route=None):
        """
        Calculates the current best ETA for a bus to a destination stop.
        Uses live location data if fresh, recent location data if available, or falls back to schedule.
        """
        now = timezone.now()
        active_shift = Shift.objects.filter(bus=bus, is_active=True).first()

        # Determine route from active shift or argument
        target_route = route or (active_shift.route if active_shift else None)
        if not target_route:
            # Fall back to first route associated with bus or schedule
            schedule_entry = Schedule.objects.filter(stop=stop).first() if stop else None
            target_route = schedule_entry.route if schedule_entry else None

        # Determine target stop if not specified
        target_stop = stop
        if not target_stop and target_route:
            first_route_stop = RouteStop.objects.filter(route=target_route).order_by('stop_order').first()
            if first_route_stop:
                target_stop = first_route_stop.stop

        if not target_stop or not target_route:
            return None

        # Retrieve latest location fix for bus
        latest_loc = BusLocation.objects.filter(bus=bus).order_by('-recorded_at').first()

        if latest_loc:
            age_seconds = (now - latest_loc.recorded_at).total_seconds()
            distance_km = calculate_haversine_distance(
                latest_loc.latitude, latest_loc.longitude,
                target_stop.latitude, target_stop.longitude
            )

            # Determine speed (km/h)
            speed = latest_loc.speed if (latest_loc.speed and latest_loc.speed > 5.0) else AVERAGE_BUS_SPEED_KMH
            travel_time_seconds = (distance_km / speed) * 3600.0

            if age_seconds <= LIVE_THRESHOLD_SECONDS:
                # Live ETA based on fresh location data
                eta_time = now + timedelta(seconds=travel_time_seconds)
                return {
                    'bus_id': bus.id,
                    'route_id': target_route.id,
                    'stop_id': target_stop.id,
                    'eta': eta_time,
                    'calculated_at': now,
                    'source': 'live',
                    'last_location_at': latest_loc.recorded_at
                }

            elif age_seconds <= RECENT_THRESHOLD_SECONDS:
                # Recent ETA projected forward from latest known location
                eta_time = max(now, latest_loc.recorded_at + timedelta(seconds=travel_time_seconds))
                return {
                    'bus_id': bus.id,
                    'route_id': target_route.id,
                    'stop_id': target_stop.id,
                    'eta': eta_time,
                    'calculated_at': now,
                    'source': 'recent',
                    'last_location_at': latest_loc.recorded_at
                }

        # Fallback: Scheduled ETA when no usable location data exists
        schedule = Schedule.objects.filter(route=target_route, stop=target_stop, is_active=True).first()
        if schedule:
            scheduled_datetime = datetime.combine(now.date(), schedule.arrival_time)
            scheduled_datetime = timezone.make_aware(scheduled_datetime, timezone.get_current_timezone())
            if scheduled_datetime < now:
                # If scheduled arrival time today has passed, project next scheduled time or add 5 mins
                scheduled_datetime = now + timedelta(minutes=5)

            return {
                'bus_id': bus.id,
                'route_id': target_route.id,
                'stop_id': target_stop.id,
                'eta': scheduled_datetime,
                'calculated_at': now,
                'source': 'scheduled',
                'last_location_at': None
            }

        # Final fallback if no schedule exists: estimate using stop position distance
        fallback_eta = now + timedelta(minutes=10)
        return {
            'bus_id': bus.id,
            'route_id': target_route.id,
            'stop_id': target_stop.id,
            'eta': fallback_eta,
            'calculated_at': now,
            'source': 'scheduled',
            'last_location_at': None
        }
