# API Endpoints

Base path:

`/api/`

## Authentication

### Admin

`POST /api/auth/admin/login/`

Purpose: - Authenticate an administrator. - Return the authentication
information required for protected admin requests.

### Admin Logout

`POST /api/auth/admin/logout/`

Purpose: - End the administrator session.

> Passenger accounts are not required.

## Routes

### List Routes

`GET /api/routes/`

Purpose: - Return available public transport routes.

### Route Details

`GET /api/routes/{route_id}/`

Purpose: - Return route information and its ordered stops.

### Create Route

`POST /api/routes/`

Purpose: - Create a route. - Admin only.

### Update Route

`PATCH /api/routes/{route_id}/`

Purpose: - Update route information. - Admin only.

### Delete Route

`DELETE /api/routes/{route_id}/`

Purpose: - Remove a route. - Admin only.

## Stops

### List Stops

`GET /api/stops/`

Purpose: - Return available bus stops.

### Stop Details

`GET /api/stops/{stop_id}/`

Purpose: - Return information about a stop.

### Nearby Stops

`GET /api/stops/nearby/`

Purpose: - Return stops near the passenger's current location.

### Create Stop

`POST /api/stops/`

Purpose: - Create a bus stop. - Admin only.

### Update Stop

`PATCH /api/stops/{stop_id}/`

Purpose: - Update stop information. - Admin only.

### Delete Stop

`DELETE /api/stops/{stop_id}/`

Purpose: - Remove a stop. - Admin only.

## Buses

### List Buses

`GET /api/buses/`

Purpose: - Return buses available in the system.

### Bus Details

`GET /api/buses/{bus_id}/`

Purpose: - Return information about a bus.

### Create Bus

`POST /api/buses/`

Purpose: - Add a bus. - Admin only.

### Update Bus

`PATCH /api/buses/{bus_id}/`

Purpose: - Update bus information. - Admin only.

### Delete Bus

`DELETE /api/buses/{bus_id}/`

Purpose: - Remove a bus. - Admin only.

## Driver Shifts

### Start Shift

`POST /api/shifts/start/`

Purpose: - Start a driver's shift. - Record the selected route. - Begin
the bus tracking session.

### End Shift

`POST /api/shifts/{shift_id}/end/`

Purpose: - End the active driver shift.

### Active Shift

`GET /api/shifts/active/`

Purpose: - Return the driver's current active shift.

## Location Tracking

### Send Bus Location

`POST /api/locations/`

Purpose: - Receive a location update from the active bus. - Record the
location and its timestamp.

### Latest Bus Location

`GET /api/buses/{bus_id}/location/`

Purpose: - Return the latest known location and update time for a bus.

### Active Bus Locations

`GET /api/buses/active/locations/`

Purpose: - Return the latest locations of currently active buses.

## ETA

### Bus ETA

`GET /api/buses/{bus_id}/eta/`

Purpose: - Return the current best ETA for a selected bus.

### Route ETAs

`GET /api/routes/{route_id}/etas/`

Purpose: - Return ETAs for active buses operating on a route.

### Stop Arrivals

`GET /api/stops/{stop_id}/arrivals/`

Purpose: - Return approaching buses and their ETAs for a stop.

## Service Alerts

### List Alerts

`GET /api/alerts/`

Purpose: - Return active service and delay alerts.

### Create Alert

`POST /api/alerts/`

Purpose: - Create a service or delay alert. - Admin only.

### Update Alert

`PATCH /api/alerts/{alert_id}/`

Purpose: - Update an alert. - Admin only.

### Delete Alert

`DELETE /api/alerts/{alert_id}/`

Purpose: - Remove an alert. - Admin only.

## Favorites

### List Favorites

`GET /api/favorites/`

Purpose: - Return saved routes/stops for the passenger's device.

### Add Favorite

`POST /api/favorites/`

Purpose: - Save a route or stop.

### Remove Favorite

`DELETE /api/favorites/{favorite_id}/`

Purpose: - Remove a saved route or stop.

## Admin Monitoring

### Fleet Status

`GET /api/admin/fleet/`

Purpose: - Return active buses and their current service status. - Admin
only.

### Trip History

`GET /api/admin/trips/`

Purpose: - Return basic trip history. - Admin only.

### Delay History

`GET /api/admin/delays/`

Purpose: - Return basic delay history. - Admin only.

## Realtime

Realtime updates may be provided through a WebSocket connection.

### Bus Tracking Channel

`/ws/buses/{bus_id}/`

Purpose: - Push updated bus location, timestamp and ETA information to
connected passengers.

### Fleet Channel

`/ws/admin/fleet/`

Purpose: - Push active fleet updates to the administrator dashboard.

## API Rules

-   All timestamps must be handled consistently and include enough
    information to determine data freshness.
-   Passenger-facing endpoints must not require passenger accounts.
-   Admin endpoints must require authentication.
-   Driver tracking endpoints must only accept updates from an active
    driver shift.
-   Stale location data must be identifiable.
-   ETA responses must indicate whether the result is live, based on
    recent information, or scheduled.
-   Endpoint names should remain stable once frontend development
    begins.
