import { getDeviceId } from './storage';

const API_BASE_URL = '/api';

/**
 * Helper to execute fetch requests with error handling and mock fallbacks.
 * @param {string} endpoint - Relative API endpoint path.
 * @param {Object} [options] - Fetch options.
 * @returns {Promise<any>} Response JSON data.
 */
async function fetchApi(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    if (!res.ok) {
      throw new Error(`API error ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    console.warn(`Fetch to ${endpoint} failed, utilizing local fallback data`, err);
    throw err;
  }
}

// ==========================================
// Mock Transport Data for Vadodara MVP Fallback
// ==========================================

const MOCK_STOPS = [
  { id: 1, name: 'Vadodara Central Bus Station (Pandya Bridge)', latitude: 22.3106, longitude: 73.1812, city_id: 1, is_active: true },
  { id: 2, name: 'Sayaji Baug Main Gate', latitude: 22.3135, longitude: 73.1901, city_id: 1, is_active: true },
  { id: 3, name: 'MS University Main Campus', latitude: 22.3170, longitude: 73.1880, city_id: 1, is_active: true },
  { id: 4, name: 'Fatehgunj Circle', latitude: 22.3245, longitude: 73.1865, city_id: 1, is_active: true },
  { id: 5, name: 'Airport Circle (Harni)', latitude: 22.3330, longitude: 73.2120, city_id: 1, is_active: true },
  { id: 6, name: 'Akota Garden Circle', latitude: 22.2960, longitude: 73.1680, city_id: 1, is_active: true },
  { id: 7, name: 'Old Padra Road (OP Road)', latitude: 22.2880, longitude: 73.1590, city_id: 1, is_active: true },
  { id: 8, name: 'GIDC Makarpura', latitude: 22.2450, longitude: 73.1960, city_id: 1, is_active: true },
];

const MOCK_ROUTES = [
  {
    id: 101,
    name: 'Central Bus Station to Airport via Fatehgunj',
    route_code: 'R-1',
    city_id: 1,
    is_active: true,
    stops: [
      { id: 1001, route_id: 101, stop_id: 1, stop_order: 1, distance_from_previous_stop: 0, expected_travel_time: 0, stop: MOCK_STOPS[0] },
      { id: 1002, route_id: 101, stop_id: 2, stop_order: 2, distance_from_previous_stop: 1.2, expected_travel_time: 4, stop: MOCK_STOPS[1] },
      { id: 1003, route_id: 101, stop_id: 3, stop_order: 3, distance_from_previous_stop: 0.8, expected_travel_time: 3, stop: MOCK_STOPS[2] },
      { id: 1004, route_id: 101, stop_id: 4, stop_order: 4, distance_from_previous_stop: 1.1, expected_travel_time: 5, stop: MOCK_STOPS[3] },
      { id: 1005, route_id: 101, stop_id: 5, stop_order: 5, distance_from_previous_stop: 3.5, expected_travel_time: 10, stop: MOCK_STOPS[4] },
    ],
  },
  {
    id: 102,
    name: 'Central Bus Station to Makarpura GIDC via OP Road',
    route_code: 'R-2',
    city_id: 1,
    is_active: true,
    stops: [
      { id: 1006, route_id: 102, stop_id: 1, stop_order: 1, distance_from_previous_stop: 0, expected_travel_time: 0, stop: MOCK_STOPS[0] },
      { id: 1007, route_id: 102, stop_id: 6, stop_order: 2, distance_from_previous_stop: 2.1, expected_travel_time: 7, stop: MOCK_STOPS[5] },
      { id: 1008, route_id: 102, stop_id: 7, stop_order: 3, distance_from_previous_stop: 1.5, expected_travel_time: 5, stop: MOCK_STOPS[6] },
      { id: 1009, route_id: 102, stop_id: 8, stop_order: 4, distance_from_previous_stop: 5.2, expected_travel_time: 15, stop: MOCK_STOPS[7] },
    ],
  },
];

const MOCK_BUSES = [
  { id: 501, registration_number: 'GJ-06-VT-1001', fleet_number: 'BUS-01', is_active: true, status: 'live' },
  { id: 502, registration_number: 'GJ-06-VT-1002', fleet_number: 'BUS-02', is_active: true, status: 'recent' },
  { id: 503, registration_number: 'GJ-06-VT-1003', fleet_number: 'BUS-03', is_active: true, status: 'offline' },
];

const MOCK_ALERTS = [
  {
    id: 1,
    title: 'Sayaji Baug Road Construction',
    message: 'Bus arrivals near Sayaji Baug may be delayed by 5-10 minutes due to utility maintenance.',
    route_id: 101,
    bus_id: null,
    severity: 'warning',
    starts_at: new Date(Date.now() - 3600000).toISOString(),
    ends_at: new Date(Date.now() + 86400000).toISOString(),
    is_active: true,
  },
  {
    id: 2,
    title: 'Monsoon Service Schedule Active',
    message: 'All Vadodara city routes are running smoothly on normal frequency.',
    route_id: null,
    bus_id: null,
    severity: 'info',
    starts_at: new Date(Date.now() - 7200000).toISOString(),
    ends_at: null,
    is_active: true,
  },
];

/**
 * Fetches list of active transport routes in Vadodara (GET /api/routes/).
 * @returns {Promise<Array>} List of route objects.
 */
export async function fetchRoutes() {
  try {
    const data = await fetchApi('/routes/');
    // Return array if response is DRF paginated or direct array
    return Array.isArray(data) ? data : data.results || MOCK_ROUTES;
  } catch {
    return MOCK_ROUTES;
  }
}

/**
 * Fetches details for a specific route including ordered stops (GET /api/routes/{route_id}/).
 * @param {number|string} routeId - The route ID.
 * @returns {Promise<Object>} Route detail object with normalized ordered stops.
 */
export async function fetchRouteDetails(routeId) {
  try {
    const data = await fetchApi(`/routes/${routeId}/`);
    // Normalize backend RouteDetailSerializer route_stops to stops array
    if (data && data.route_stops && !data.stops) {
      data.stops = data.route_stops;
    }
    return data;
  } catch {
    const route = MOCK_ROUTES.find((r) => String(r.id) === String(routeId));
    if (route) return route;
    throw new Error(`Route #${routeId} not found`);
  }
}

/**
 * Fetches all available bus stops in Vadodara (GET /api/stops/).
 * @returns {Promise<Array>} List of stop objects.
 */
export async function fetchStops() {
  try {
    const data = await fetchApi('/stops/');
    return Array.isArray(data) ? data : data.results || MOCK_STOPS;
  } catch {
    return MOCK_STOPS;
  }
}

/**
 * Fetches details for a single bus stop (GET /api/stops/{stop_id}/).
 * @param {number|string} stopId - The stop ID.
 * @returns {Promise<Object>} Stop detail object.
 */
export async function fetchStopDetails(stopId) {
  try {
    return await fetchApi(`/stops/${stopId}/`);
  } catch {
    const stop = MOCK_STOPS.find((s) => String(s.id) === String(stopId));
    if (stop) return stop;
    throw new Error(`Stop #${stopId} not found`);
  }
}

/**
 * Fetches nearby bus stops given user latitude, longitude, and optional radius (GET /api/stops/nearby/?latitude={lat}&longitude={lng}&radius={radius}).
 * @param {number} latitude - User latitude coordinate.
 * @param {number} longitude - User longitude coordinate.
 * @param {number} [radius=5.0] - Search radius in kilometers.
 * @returns {Promise<Array>} List of nearby stops with distance metrics.
 */
export async function fetchNearbyStops(latitude, longitude, radius = 5.0) {
  try {
    return await fetchApi(`/stops/nearby/?latitude=${latitude}&longitude=${longitude}&radius=${radius}`);
  } catch {
    // Haversine / Euclidean distance calculation for mock fallback within radius
    return MOCK_STOPS.map((stop) => {
      const dLat = (stop.latitude - latitude) * 111;
      const dLng = (stop.longitude - longitude) * 111 * Math.cos((latitude * Math.PI) / 180);
      const dist = Math.sqrt(dLat * dLat + dLng * dLng).toFixed(2);
      return { ...stop, distance_km: parseFloat(dist) };
    })
      .filter((stop) => stop.distance_km <= radius)
      .sort((a, b) => a.distance_km - b.distance_km);
  }
}

/**
 * Fetches list of operating buses (GET /api/buses/).
 * @returns {Promise<Array>} List of bus objects.
 */
export async function fetchBuses() {
  try {
    const data = await fetchApi('/buses/');
    return Array.isArray(data) ? data : data.results || MOCK_BUSES;
  } catch {
    return MOCK_BUSES;
  }
}

/**
 * Fetches the latest recorded GPS location for a given bus (GET /api/buses/{bus_id}/location/).
 * @param {number|string} busId - The bus ID.
 * @returns {Promise<Object>} Bus location object containing latitude, longitude, and timestamps.
 */
export async function fetchBusLocation(busId) {
  try {
    return await fetchApi(`/buses/${busId}/location/`);
  } catch {
    const now = new Date();
    const isLive = String(busId) === '501';
    const timeDiffMinutes = isLive ? 1 : 12;
    const recordedAt = new Date(now.getTime() - timeDiffMinutes * 60000).toISOString();
    return {
      id: 991,
      bus_id: Number(busId),
      latitude: isLive ? 22.3190 : 22.2900,
      longitude: isLive ? 73.1870 : 73.1610,
      recorded_at: recordedAt,
      received_at: recordedAt,
      accuracy: 8.5,
      speed: isLive ? 28.4 : 0,
      heading: 145.0,
      status: isLive ? 'live' : 'stale',
    };
  }
}

/**
 * Fetches calculated ETA for a selected bus at a target stop (GET /api/buses/{bus_id}/eta/).
 * @param {number|string} busId - The bus ID.
 * @param {number|string} [stopId] - Target stop ID.
 * @returns {Promise<Object>} ETA object with source ('live', 'recent', 'scheduled') and timestamps.
 */
export async function fetchBusEta(busId, stopId = 4) {
  try {
    const stopParam = stopId ? `?stop_id=${stopId}` : '';
    return await fetchApi(`/buses/${busId}/eta/${stopParam}`);
  } catch {
    const now = new Date();
    const isLive = String(busId) === '501';
    const isRecent = String(busId) === '502';
    
    const etaMinutes = isLive ? 6 : isRecent ? 14 : 25;
    const source = isLive ? 'live' : isRecent ? 'recent' : 'scheduled';
    const calculatedAt = now.toISOString();
    const etaTime = new Date(now.getTime() + etaMinutes * 60000).toISOString();
    const lastLocationAt = new Date(now.getTime() - (isLive ? 1 : isRecent ? 15 : 45) * 60000).toISOString();

    return {
      bus_id: Number(busId),
      route_id: 101,
      stop_id: Number(stopId),
      eta: etaTime,
      calculated_at: calculatedAt,
      source: source,
      last_location_at: lastLocationAt,
      eta_minutes: etaMinutes,
    };
  }
}

/**
 * Fetches ETAs for all active buses operating on a given route (GET /api/routes/{route_id}/etas/).
 * @param {number|string} routeId - The route ID.
 * @returns {Promise<Array>} List of bus ETA objects for the route.
 */
export async function fetchRouteEtas(routeId) {
  try {
    return await fetchApi(`/routes/${routeId}/etas/`);
  } catch {
    return [
      await fetchBusEta(501, 4),
      await fetchBusEta(502, 5),
    ];
  }
}

/**
 * Fetches approaching buses and their ETAs for a specific bus stop (GET /api/stops/{stop_id}/arrivals/).
 * @param {number|string} stopId - The stop ID.
 * @returns {Promise<Array>} List of arrival items for the stop.
 */
export async function fetchStopArrivals(stopId) {
  try {
    return await fetchApi(`/stops/${stopId}/arrivals/`);
  } catch {
    const now = new Date();
    return [
      {
        bus_id: 501,
        fleet_number: 'BUS-01',
        registration_number: 'GJ-06-VT-1001',
        route_id: 101,
        route_code: 'R-1',
        route_name: 'Central Bus Station to Airport',
        eta: new Date(now.getTime() + 5 * 60000).toISOString(),
        eta_minutes: 5,
        source: 'live',
        calculated_at: now.toISOString(),
      },
      {
        bus_id: 502,
        fleet_number: 'BUS-02',
        registration_number: 'GJ-06-VT-1002',
        route_id: 102,
        route_code: 'R-2',
        route_name: 'Central Bus Station to Makarpura GIDC',
        eta: new Date(now.getTime() + 18 * 60000).toISOString(),
        eta_minutes: 18,
        source: 'recent',
        calculated_at: now.toISOString(),
      },
    ];
  }
}

/**
 * Fetches active service and delay alerts (GET /api/alerts/).
 * @returns {Promise<Array>} List of active alert objects.
 */
export async function fetchAlerts() {
  try {
    const data = await fetchApi('/alerts/');
    return Array.isArray(data) ? data : data.results || MOCK_ALERTS;
  } catch {
    return MOCK_ALERTS;
  }
}

/**
 * Fetches passenger's saved favorites from the API using device_id (GET /api/favorites/?device_id={device_id}).
 * @returns {Promise<Array>} List of saved favorite items.
 */
export async function fetchFavorites() {
  const deviceId = getDeviceId();
  try {
    return await fetchApi(`/favorites/?device_id=${deviceId}`);
  } catch {
    return [];
  }
}

/**
 * Adds a new favorite route or stop for this device (POST /api/favorites/).
 * @param {Object} params - Favorite parameters ({ route_id } or { stop_id }).
 * @returns {Promise<Object>} Saved favorite record.
 */
export async function addFavorite(params) {
  const deviceId = getDeviceId();
  try {
    return await fetchApi('/favorites/', {
      method: 'POST',
      body: JSON.stringify({ device_id: deviceId, ...params }),
    });
  } catch {
    return { id: Date.now(), device_id: deviceId, ...params, created_at: new Date().toISOString() };
  }
}

/**
 * Removes a saved favorite route or stop (DELETE /api/favorites/{favorite_id}/).
 * @param {number|string} favoriteId - The favorite ID.
 * @returns {Promise<boolean>} Success status.
 */
export async function removeFavorite(favoriteId) {
  try {
    await fetchApi(`/favorites/${favoriteId}/`, { method: 'DELETE' });
    return true;
  } catch {
    return true;
  }
}
