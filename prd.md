# Product Requirements Document (PRD)

## 1. Product

**Vadodara Transit** --- a simple, reliable real-time public transport
tracking platform for small cities.

## 2. Problem

Passengers often do not have clear, timely information about where a bus
is or when it is expected to arrive. This creates uncertainty and
unnecessary waiting.

The MVP will address this problem in Vadodara first.

## 3. Product Goal

Give passengers a quick and simple way to:

-   Find routes and stops.
-   See buses currently operating.
-   View bus locations when live information is available.
-   Get an estimated arrival time.
-   Continue receiving the best available ETA when live connectivity is
    temporarily unavailable.

## 4. Users

### Passenger

Primary user.

Requirements: - No account required. - Mobile-first experience. - Simple
route and stop discovery. - View nearby buses. - View ETA. - Understand
whether information is live or based on older/scheduled data.

### Driver

Requirements: - Select assigned route when starting a shift. - Start
tracking. - No regular interaction while driving. - End the shift when
the trip is finished.

### Administrator

Requirements: - Secure account access. - Manage routes. - Manage
stops. - Manage buses. - Monitor active buses. - View service status. -
Review basic trip and delay information.

## 5. Core Functional Requirements

### FR-01: Route and Stop Discovery

Passengers must be able to search and browse available routes and stops.

### FR-02: Nearby Stops

Passengers should be able to find relevant nearby stops from their
phone.

### FR-03: Live Bus Tracking

When current location data is available, passengers should see the bus's
latest location and its update status.

### FR-04: ETA

The system must provide an estimated arrival time based on available bus
and route information.

### FR-05: ETA Fallback

The system must use a simple fallback order:

1.  Fresh live information.
2.  Recent known information projected forward.
3.  Scheduled arrival information.

The passenger must be told when the information is not live.

### FR-06: Driver Shift

A driver must be able to select an assigned route and start a shift.
Location tracking then operates without requiring regular driver
interaction.

### FR-07: Service and Delay Information

Passengers should receive useful information about delays or service
interruptions.

### FR-08: Favorites

Passengers should be able to save frequently used routes or stops.

### FR-09: Admin Fleet Monitoring

Administrators must be able to see active buses and their current
service status.

### FR-10: Transport Data Management

Administrators must be able to manage buses, routes and stops.

### FR-11: Basic History

Administrators should be able to review basic trip and delay history.

## 6. Reliability Requirements

-   The system must clearly distinguish live data from stale or
    scheduled data.
-   Temporary network loss must not make the passenger app unusable.
-   The app should continue showing the best available ETA from locally
    available information.
-   Driver interaction must remain minimal.
-   Incorrect or stale location data must not be presented as current.
-   The MVP should work with a limited set of Vadodara routes before
    expansion.

## 7. MVP Scope

The MVP will cover:

-   Selected Vadodara routes.
-   Selected Vadodara stops.
-   A limited number of buses.
-   Passenger experience.
-   Driver shift and location tracking.
-   Basic administrator monitoring and data management.
-   Live ETA and fallback ETA.

The MVP will not attempt to cover every route or every city initially.

## 8. Technology Stack

-   **Frontend:** React
-   **Backend:** Django
-   **Database:** PostgreSQL
-   **Maps:** MapLibre with an OpenStreetMap-based map provider

## 9. Success Criteria

The MVP should allow a passenger to:

1.  Open the app.
2.  Find a route or stop.
3.  See available buses.
4.  Understand the latest bus location/update status.
5.  Get an ETA within a few seconds.
6.  Still receive useful ETA information during a temporary network
    interruption.

The system should allow a driver to start a route with minimal
interaction.

The system should allow an administrator to monitor buses and maintain
basic transport data.

## 10. Future Expansion

After the Vadodara MVP is validated, the system can be expanded with
additional routes, buses, cities and transport authorities without
changing the core product concept.
