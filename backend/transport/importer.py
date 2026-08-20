"""
Transport data CSV importer module.
Parses, validates, and imports City, Route, Stop, and RouteStop records from CSV.
"""

import csv
import io
from decimal import Decimal, InvalidOperation
from django.db import transaction
from .models import City, Route, Stop, RouteStop


class TransportDataImporter:
    """
    Handles parsing, row-level validation, and database ingestion of transport data from CSV files.
    """

    def __init__(self, default_city_name="Vadodara", default_state="Gujarat"):
        """Initializes the importer with default city and state fallback values."""
        self.default_city_name = default_city_name
        self.default_state = default_state

    def validate_row(self, row, row_num):
        """
        Validates a single CSV row dictionary.
        Returns a tuple: (is_valid, cleaned_data_dict, error_message_or_None).
        """
        route_code = row.get('route_code', '').strip()
        route_name = row.get('route_name', '').strip()
        stop_name = row.get('stop_name', '').strip()
        lat_str = row.get('latitude', '').strip()
        lon_str = row.get('longitude', '').strip()
        order_str = row.get('stop_order', '').strip()
        city_name = row.get('city_name', '').strip() or self.default_city_name
        state = row.get('state', '').strip() or self.default_state

        if not route_code:
            return False, None, f"Row {row_num}: 'route_code' is required."
        if not route_name:
            return False, None, f"Row {row_num}: 'route_name' is required."
        if not stop_name:
            return False, None, f"Row {row_num}: 'stop_name' is required."
        if not lat_str:
            return False, None, f"Row {row_num}: 'latitude' is required."
        if not lon_str:
            return False, None, f"Row {row_num}: 'longitude' is required."
        if not order_str:
            return False, None, f"Row {row_num}: 'stop_order' is required."

        try:
            latitude = Decimal(lat_str)
            if latitude < -90 or latitude > 90:
                return False, None, f"Row {row_num}: Latitude {latitude} out of range [-90, 90]."
        except InvalidOperation:
            return False, None, f"Row {row_num}: Invalid latitude '{lat_str}'."

        try:
            longitude = Decimal(lon_str)
            if longitude < -180 or longitude > 180:
                return False, None, f"Row {row_num}: Longitude {longitude} out of range [-180, 180]."
        except InvalidOperation:
            return False, None, f"Row {row_num}: Invalid longitude '{lon_str}'."

        try:
            stop_order = int(order_str)
            if stop_order < 1:
                return False, None, f"Row {row_num}: 'stop_order' must be a positive integer."
        except ValueError:
            return False, None, f"Row {row_num}: Invalid stop_order '{order_str}'."

        distance_val = None
        dist_str = row.get('distance_from_previous_stop', '').strip()
        if dist_str:
            try:
                distance_val = Decimal(dist_str)
                if distance_val < 0:
                    return False, None, f"Row {row_num}: distance_from_previous_stop cannot be negative."
            except InvalidOperation:
                return False, None, f"Row {row_num}: Invalid distance_from_previous_stop '{dist_str}'."

        travel_time_val = None
        time_str = row.get('expected_travel_time', '').strip()
        if time_str:
            try:
                travel_time_val = int(time_str)
                if travel_time_val < 0:
                    return False, None, f"Row {row_num}: expected_travel_time cannot be negative."
            except ValueError:
                return False, None, f"Row {row_num}: Invalid expected_travel_time '{time_str}'."

        cleaned_data = {
            'city_name': city_name,
            'state': state,
            'route_code': route_code,
            'route_name': route_name,
            'stop_name': stop_name,
            'latitude': latitude,
            'longitude': longitude,
            'stop_order': stop_order,
            'distance_from_previous_stop': distance_val,
            'expected_travel_time': travel_time_val,
        }
        return True, cleaned_data, None

    def import_csv(self, file_input, dry_run=False):
        """
        Parses CSV data from a file path, file object, or string content,
        validates all rows, and performs atomic database import.
        """
        if isinstance(file_input, str):
            if '\n' in file_input or ',' in file_input:
                reader = csv.DictReader(io.StringIO(file_input))
            else:
                with open(file_input, mode='r', encoding='utf-8') as f:
                    reader = list(csv.DictReader(f))
        elif hasattr(file_input, 'read'):
            content = file_input.read()
            if isinstance(content, bytes):
                content = content.decode('utf-8')
            reader = csv.DictReader(io.StringIO(content))
        else:
            reader = file_input

        rows = list(reader)
        if not rows:
            return {
                'success': False,
                'rows_processed': 0,
                'routes_created': 0,
                'stops_created': 0,
                'route_stops_created': 0,
                'errors': ['CSV file is empty or missing headers.']
            }

        # Step 1: Validate all rows
        validated_rows = []
        errors = []
        for index, row in enumerate(rows, start=1):
            is_valid, cleaned, error_msg = self.validate_row(row, index)
            if is_valid:
                validated_rows.append(cleaned)
            else:
                errors.append(error_msg)

        if errors:
            return {
                'success': False,
                'rows_processed': len(rows),
                'routes_created': 0,
                'stops_created': 0,
                'route_stops_created': 0,
                'errors': errors
            }

        if dry_run:
            return {
                'success': True,
                'rows_processed': len(validated_rows),
                'routes_created': 0,
                'stops_created': 0,
                'route_stops_created': 0,
                'errors': [],
                'message': 'Dry run successful. No database changes committed.'
            }

        # Step 2: Atomic database import
        routes_created_count = 0
        stops_created_count = 0
        route_stops_created_count = 0

        with transaction.atomic():
            for item in validated_rows:
                city, _ = City.objects.get_or_create(
                    name=item['city_name'],
                    defaults={'state': item['state']}
                )

                route, route_created = Route.objects.get_or_create(
                    route_code=item['route_code'],
                    city=city,
                    defaults={'name': item['route_name'], 'is_active': True}
                )
                if route_created:
                    routes_created_count += 1

                stop, stop_created = Stop.objects.get_or_create(
                    name=item['stop_name'],
                    city=city,
                    defaults={
                        'latitude': item['latitude'],
                        'longitude': item['longitude'],
                        'is_active': True
                    }
                )
                if stop_created:
                    stops_created_count += 1

                _, rs_created = RouteStop.objects.update_or_create(
                    route=route,
                    stop_order=item['stop_order'],
                    defaults={
                        'stop': stop,
                        'distance_from_previous_stop': item['distance_from_previous_stop'],
                        'expected_travel_time': item['expected_travel_time'],
                    }
                )
                if rs_created:
                    route_stops_created_count += 1

        return {
            'success': True,
            'rows_processed': len(validated_rows),
            'routes_created': routes_created_count,
            'stops_created': stops_created_count,
            'route_stops_created': route_stops_created_count,
            'errors': []
        }
