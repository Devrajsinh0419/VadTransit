"""
VMC Transport Data Importer for VadTransit.
Extracts, validates, cleans, and imports Vadodara City Bus Routes (VMC) from PDF sources.
Follows field_names.md for naming conventions and preserves VMC route terminology.
"""

import os
import re
import subprocess
from django.db import transaction
from transport.models import City, Route, Stop, RouteStop


class VMCDataImporter:
    """
    Importer class responsible for extracting, parsing, and persisting VMC route PDF data into Django models.
    """
    def __init__(self, city_name="Vadodara", state="Gujarat"):
        """
        Initializes importer with default city and state attributes.
        """
        self.city_name = city_name
        self.state = state

    def extract_routes_from_pdf(self, pdf_path):
        """
        Extracts structured route records from VMC PDF source file using pdftotext.
        
        @param {string} pdf_path - Path to VMC PDF document.
        @returns {Object} Dictionary containing extracted routes, duplicate list, and invalid records.
        """
        if not os.path.exists(pdf_path):
            raise FileNotFoundError(f"PDF file not found at: '{pdf_path}'")

        try:
            text = subprocess.check_output(['pdftotext', pdf_path, '-']).decode('utf-8')
        except Exception as e:
            raise RuntimeError(f"Failed extracting text from PDF '{pdf_path}': {e}")

        pages = text.split('\x0c')
        extracted_routes = []
        seen_codes = set()
        duplicates = []
        invalid_records = []

        for page in pages:
            lines = [line.strip() for line in page.split('\n') if line.strip()]
            i = 0
            while i < len(lines):
                line = lines[i]
                # Match VMC route number patterns like '1', '2A', '3B', '11B', '15A', '19B', '30'
                if re.match(r'^[0-9]+[A-Z]?$', line) and i + 2 < len(lines):
                    route_no = line
                    origin = lines[i + 1]
                    destination = lines[i + 2]
                    via = ''
                    i += 3
                    if (i < len(lines) and
                        not re.match(r'^[0-9]+[A-Z]?$', lines[i]) and
                        not lines[i].startswith('Page') and
                        not lines[i].startswith('ROUTE') and
                        not lines[i].startswith('Vadodara') and
                        not lines[i].startswith('Comprehensive') and
                        not lines[i].startswith('ORIGIN') and
                        not lines[i].startswith('DESTINATION') and
                        not lines[i].startswith('MAJOR')):
                        via = lines[i]
                        i += 1

                    if not origin or not destination:
                        invalid_records.append({'route_code': route_no, 'reason': 'Missing origin or destination'})
                        continue

                    if route_no in seen_codes:
                        duplicates.append(route_no)
                        continue

                    seen_codes.add(route_no)
                    extracted_routes.append({
                        'route_code': route_no,
                        'origin': origin,
                        'destination': destination,
                        'via': via if via != '-' else '',
                    })
                else:
                    i += 1

        return {
            'routes': extracted_routes,
            'duplicates': duplicates,
            'invalid': invalid_records,
        }

    def import_routes(self, extracted_data, dry_run=False):
        """
        Validates and imports extracted route objects into Django City, Route, Stop, and RouteStop models.
        
        @param {Object} extracted_data - Dictionary with extracted routes list.
        @param {boolean} [dry_run=False] - If true, performs validation without writing to database.
        @returns {Object} Import execution summary stats.
        """
        routes_to_import = extracted_data.get('routes', [])
        
        if dry_run:
            return {
                'success': True,
                'extracted_count': len(routes_to_import),
                'routes_created': len(routes_to_import),
                'routes_updated': 0,
                'stops_created': 0,
                'stops_reused': 0,
                'route_stops_created': 0,
                'dry_run': True,
            }

        city, _ = City.objects.get_or_create(
            name=self.city_name,
            defaults={'state': self.state, 'is_active': True}
        )

        routes_created = 0
        routes_updated = 0
        stops_created = 0
        stops_reused = 0
        route_stops_created = 0

        # Mapping for stop synonyms to preserve existing seed stops
        stop_synonyms = {
            'Station': 'Vadodara Railway Station',
        }

        with transaction.atomic():
            for item in routes_to_import:
                code = item['route_code']
                origin = item['origin']
                dest = item['destination']
                via_str = item['via']

                route_name = f"{origin} to {dest}"
                route, created = Route.objects.get_or_create(
                    route_code=code,
                    city=city,
                    defaults={'name': route_name, 'is_active': True}
                )

                if created:
                    routes_created += 1
                else:
                    route.name = route_name
                    route.is_active = True
                    route.save()
                    routes_updated += 1

                # Assemble ordered stop sequence: [origin, ...via_stops, destination]
                stop_names = [origin]
                if via_str:
                    via_list = [s.strip() for s in via_str.split(',') if s.strip()]
                    stop_names.extend(via_list)
                if dest not in stop_names:
                    stop_names.append(dest)

                # Clear existing RouteStops for re-import idempotency
                RouteStop.objects.filter(route=route).delete()

                # Process stop records in sequence
                for order, sname in enumerate(stop_names, start=1):
                    lookup_name = stop_synonyms.get(sname, sname)
                    stop_obj = Stop.objects.filter(name__iexact=lookup_name, city=city).first()

                    if not stop_obj:
                        stop_obj = Stop.objects.filter(name__iexact=sname, city=city).first()

                    if not stop_obj:
                        stop_obj = Stop.objects.create(
                            name=sname,
                            latitude=0.0,
                            longitude=0.0,
                            city=city,
                            is_active=True
                        )
                        stops_created += 1
                    else:
                        stops_reused += 1

                    RouteStop.objects.create(
                        route=route,
                        stop=stop_obj,
                        stop_order=order,
                        distance_from_previous_stop=0.00 if order == 1 else None,
                        expected_travel_time=0 if order == 1 else None
                    )
                    route_stops_created += 1

        return {
            'success': True,
            'extracted_count': len(routes_to_import),
            'routes_created': routes_created,
            'routes_updated': routes_updated,
            'stops_created': stops_created,
            'stops_reused': stops_reused,
            'route_stops_created': route_stops_created,
            'dry_run': False,
        }
