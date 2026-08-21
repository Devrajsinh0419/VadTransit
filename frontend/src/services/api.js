/**
 * API service for interacting with VadTransit backend REST endpoints.
 * Handles routes, buses, driver shifts, and location updates.
 */

const API_BASE_URL = '/api';

/**
 * Helper function to handle API response and HTTP error statuses.
 * @param {Response} response - Fetch API response object.
 * @returns {Promise<any>} Parsed JSON response.
 */
async function handleResponse(response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error || errorData.detail || `Request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }
  if (response.status === 204) {
    return null;
  }
  return response.json();
}

/**
 * Fetches all active routes from the backend.
 * Endpoint: GET /api/routes/?is_active=true
 * @returns {Promise<Array>} List of active routes.
 */
export async function fetchRoutes() {
  const response = await fetch(`${API_BASE_URL}/routes/?is_active=true`);
  return handleResponse(response);
}

/**
 * Fetches all active buses from the backend.
 * Endpoint: GET /api/buses/?is_active=true
 * @returns {Promise<Array>} List of active buses.
 */
export async function fetchBuses() {
  const response = await fetch(`${API_BASE_URL}/buses/?is_active=true`);
  return handleResponse(response);
}

/**
 * Fetches currently active driver shifts from the backend.
 * Endpoint: GET /api/shifts/active/
 * @returns {Promise<Array>} List of active driver shifts.
 */
export async function fetchActiveShifts() {
  const response = await fetch(`${API_BASE_URL}/shifts/active/`);
  return handleResponse(response);
}

/**
 * Starts a new driver shift.
 * Endpoint: POST /api/shifts/start/
 * @param {Object} shiftData - Contains driver_id, bus_id, and route_id.
 * @returns {Promise<Object>} Created shift data.
 */
export async function startShift(shiftData) {
  const response = await fetch(`${API_BASE_URL}/shifts/start/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(shiftData),
  });
  return handleResponse(response);
}

/**
 * Ends an active driver shift.
 * Endpoint: POST /api/shifts/{shift_id}/end/
 * @param {number|string} shiftId - ID of the active shift to end.
 * @returns {Promise<Object>} Updated shift data.
 */
export async function endShift(shiftId) {
  const response = await fetch(`${API_BASE_URL}/shifts/${shiftId}/end/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return handleResponse(response);
}

/**
 * Sends a bus location update fix to the backend during an active shift.
 * Endpoint: POST /api/locations/
 * @param {Object} locationData - Contains bus_id, latitude, longitude, recorded_at, accuracy, speed, heading.
 * @returns {Promise<Object>} Created location record response.
 */
export async function sendLocationUpdate(locationData) {
  const response = await fetch(`${API_BASE_URL}/locations/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(locationData),
  });
  return handleResponse(response);
}
