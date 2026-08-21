"""
Unit and integration tests for VMCDataImporter and VMC PDF route processing.
Tests extraction, route variant preservation (2A, 3B, 11B, 19B), idempotency, and stop sequencing.
"""

import os
from django.test import TestCase
from transport.models import City, Route, Stop, RouteStop
from transport.vmc_importer import VMCDataImporter


class VMCImporterTests(TestCase):
    """
    Test suite for VMCDataImporter covering PDF route parsing, variant handling, and idempotency.
    """

    def setUp(self):
        """Initializes test importer instance."""
        self.importer = VMCDataImporter(city_name="Vadodara", state="Gujarat")
        self.pdf_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            '../data/raw/Vadodara_City_Bus_Routes_VMC.pdf'
        )

    def test_extracted_routes_count(self):
        """Tests that VMC PDF route extraction returns expected 40 route definitions."""
        if not os.path.exists(self.pdf_path):
            self.skipTest("VMC PDF file not found")

        data = self.importer.extract_routes_from_pdf(self.pdf_path)
        routes = data['routes']

        self.assertEqual(len(routes), 40)
        self.assertEqual(len(data['duplicates']), 0)
        self.assertEqual(len(data['invalid']), 0)

        # Verify specific variant route codes exist
        codes = [r['route_code'] for r in routes]
        self.assertIn('1', codes)
        self.assertIn('2A', codes)
        self.assertIn('3B', codes)
        self.assertIn('11B', codes)
        self.assertIn('15A', codes)
        self.assertIn('19B', codes)
        self.assertIn('31', codes)

    def test_route_import_persistence(self):
        """Tests that import_routes creates Route, Stop, and RouteStop records correctly."""
        extracted_mock = {
            'routes': [
                {
                    'route_code': '2A',
                    'origin': 'Station',
                    'destination': 'Uma Char Rasta',
                    'via': 'Panigate, Ayurvedic College'
                },
                {
                    'route_code': '19B',
                    'origin': 'Station',
                    'destination': 'T.P. 13 (Prayag)',
                    'via': 'Navayard, Sardar Nagar'
                }
            ]
        }

        res = self.importer.import_routes(extracted_mock)

        self.assertTrue(res['success'])
        self.assertEqual(res['routes_created'], 2)
        self.assertEqual(Route.objects.count(), 2)

        # Check route 2A stops sequence: [Station, Panigate, Ayurvedic College, Uma Char Rasta]
        r2a = Route.objects.get(route_code='2A')
        r2a_stops = list(r2a.route_stops.order_by('stop_order'))
        self.assertEqual(len(r2a_stops), 4)
        self.assertEqual(r2a_stops[0].stop.name, 'Station')
        self.assertEqual(r2a_stops[1].stop.name, 'Panigate')
        self.assertEqual(r2a_stops[2].stop.name, 'Ayurvedic College')
        self.assertEqual(r2a_stops[3].stop.name, 'Uma Char Rasta')

    def test_idempotency_and_repeatability(self):
        """Tests that re-importing identical VMC route data updates existing records without creating duplicates."""
        extracted_mock = {
            'routes': [
                {
                    'route_code': '3B',
                    'origin': 'Station',
                    'destination': 'Waghodia',
                    'via': 'Fatehgunj'
                }
            ]
        }

        res1 = self.importer.import_routes(extracted_mock)
        self.assertEqual(res1['routes_created'], 1)
        self.assertEqual(Route.objects.count(), 1)

        res2 = self.importer.import_routes(extracted_mock)
        self.assertEqual(res2['routes_created'], 0)
        self.assertEqual(res2['routes_updated'], 1)
        self.assertEqual(Route.objects.count(), 1)
