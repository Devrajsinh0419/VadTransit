"""
Django management command to import route, stop, and route-stop data from CSV file.
Usage: python manage.py import_transport_data <csv_file_path> [--city Vadodara] [--state Gujarat] [--dry-run]
"""

import os
from django.core.management.base import BaseCommand, CommandError
from transport.importer import TransportDataImporter


class Command(BaseCommand):
    """
    Django management command wrapper for importing transport CSV data into PostgreSQL models.
    """
    help = "Import transport routes, stops, and route-stops from CSV data."

    def add_arguments(self, parser):
        """Adds command-line arguments for CSV file path, city, state, and dry-run flag."""
        parser.add_argument(
            'csv_file',
            type=str,
            help="Path to the CSV file containing transport data."
        )
        parser.add_argument(
            '--city',
            type=str,
            default="Vadodara",
            help="Default city name if not specified in CSV rows (default: Vadodara)."
        )
        parser.add_argument(
            '--state',
            type=str,
            default="Gujarat",
            help="Default state name if not specified in CSV rows (default: Gujarat)."
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help="Validate CSV data without committing changes to the database."
        )

    def handle(self, *args, **options):
        """Executes the import process using TransportDataImporter."""
        csv_file_path = options['csv_file']
        city_name = options['city']
        state_name = options['state']
        dry_run = options['dry_run']

        if not os.path.exists(csv_file_path):
            raise CommandError(f"CSV file does not exist at path: '{csv_file_path}'")

        importer = TransportDataImporter(default_city_name=city_name, default_state=state_name)
        result = importer.import_csv(csv_file_path, dry_run=dry_run)

        if not result['success']:
            self.stderr.write(self.style.ERROR("Import failed due to validation errors:"))
            for err in result['errors']:
                self.stderr.write(self.style.ERROR(f"  - {err}"))
            raise CommandError("Import failed. See validation errors above.")

        if dry_run:
            self.stdout.write(self.style.SUCCESS(
                f"Dry run complete! Validated {result['rows_processed']} rows cleanly with no errors."
            ))
        else:
            self.stdout.write(self.style.SUCCESS(
                f"Successfully imported transport data!\n"
                f"  - Rows processed: {result['rows_processed']}\n"
                f"  - Routes created: {result['routes_created']}\n"
                f"  - Stops created: {result['stops_created']}\n"
                f"  - Route-stops configured: {result['route_stops_created']}"
            ))
