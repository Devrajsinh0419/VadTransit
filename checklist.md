# Implementation Checklist

## Project Foundation

-   [ ] Create project repository and base structure
-   [x] Set up Django backend
-   [x] Set up React frontend
-   [x] Set up PostgreSQL database
-   [x] Configure development environment
-   [x] Define project settings and environment variables

## Transport Data

-   [x] Add Vadodara city
-   [x] Add initial bus routes
-   [x] Add route stops in the correct order
-   [x] Add stop coordinates
-   [x] Add initial buses
-   [x] Add drivers
-   [x] Add schedules
-   [x] Add sample/test transport data

## Passenger Experience

-   [x] Create mobile-first passenger interface
-   [x] Show available routes
-   [x] Show bus stops
-   [x] Add route search
-   [x] Add stop search
-   [x] Show nearby stops
-   [x] Show buses operating on a route
-   [x] Show live bus location
-   [x] Show ETA
-   [x] Show last-updated time
-   [x] Show live/offline/scheduled ETA status
-   [x] Add favorite routes/stops
-   [x] Add service and delay alerts
-   [ ] Test passenger flow on a phone


## Driver Experience

-   [x] Create simple driver interface
-   [x] Add driver login/access
-   [x] Add route selection
-   [x] Add start shift
-   [x] Start automatic location updates after shift begins
-   [x] Add end shift
-   [x] Prevent unnecessary interaction while driving
-   [x] Handle temporary network loss
-   [ ] Test location tracking on a real phone

## ETA and Reliability

-   [x] Define ETA calculation rules
-   [x] Use fresh location data for live ETA
-   [x] Store the latest known location and timestamp
-   [x] Add recent-data ETA fallback
-   [x] Add scheduled ETA fallback
-   [x] Show when information is not live
-   [x] Handle stale location data
-   [ ] Handle delayed location updates
-   [ ] Test ETA behaviour during network loss
-   [x] Verify time and timestamps across the system

## Real-Time Tracking

-   [x] Receive driver location updates
-   [x] Store required location information
-   [x] Send current bus information to passengers
-   [x] Update bus position on the map
-   [x] Update ETA when new location data arrives
-   [x] Detect unavailable/offline buses
-   [ ] Test frequent location updates
-   [ ] Test reconnect behaviour


## Admin

-   [x] Create admin authentication
-   [ ] Create admin dashboard
-   [x] View active buses
-   [x] View bus status
-   [x] Manage buses
-   [x] Manage routes
-   [x] Manage stops
-   [x] Manage schedules
-   [x] View basic trip history
-   [x] View basic delay history


## Maps

-   [x] Add MapLibre
-   [x] Connect selected OpenStreetMap-based map provider
-   [x] Display Vadodara map
-   [x] Display stops
-   [x] Display routes
-   [x] Display bus locations
-   [ ] Test map performance on mobile
-   [ ] Confirm map provider usage limits for MVP

## Testing

-   [ ] Test passenger flow from start to ETA
-   [ ] Test driver flow from shift start to tracking
-   [ ] Test admin flow
-   [ ] Test with multiple buses
-   [ ] Test with multiple routes
-   [ ] Test poor network conditions
-   [ ] Test complete network loss
-   [ ] Test stale location data
-   [ ] Test incorrect route selection
-   [ ] Test app on different phone sizes
-   [ ] Test real-world Vadodara route
-   [ ] Fix issues found during field testing

## MVP Validation

-   [ ] Track at least one real bus successfully
-   [ ] Display its location to a passenger
-   [ ] Calculate a useful ETA
-   [ ] Break the internet and verify fallback ETA
-   [ ] Restore the connection and verify fresh data
-   [ ] Validate the full passenger journey
-   [ ] Validate the full driver journey
-   [ ] Validate basic admin monitoring

## Future / Not Required for Initial MVP

-   [ ] Expand to more Vadodara routes
-   [ ] Add more buses
-   [ ] Add additional cities
-   [ ] Consider dedicated GPS hardware
-   [ ] Consider production-grade map infrastructure
-   [ ] Add advanced analytics if actually needed
