/**
 * Generates or retrieves the unique anonymous device ID for the passenger.
 * @returns {string} The unique device identifier stored in localStorage.
 */
export function getDeviceId() {
  let deviceId = localStorage.getItem('vadtransit_device_id');
  if (!deviceId) {
    deviceId = 'dev_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    localStorage.setItem('vadtransit_device_id', deviceId);
  }
  return deviceId;
}

/**
 * Retrieves stored favorite route IDs from local storage.
 * @returns {Array<number|string>} Array of saved route IDs.
 */
export function getLocalFavoriteRoutes() {
  try {
    const data = localStorage.getItem('vadtransit_fav_routes');
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error reading favorite routes', e);
    return [];
  }
}

/**
 * Toggles a route ID in local favorite routes.
 * @param {number|string} routeId - The route ID to toggle.
 * @returns {Array<number|string>} Updated list of favorite route IDs.
 */
export function toggleLocalFavoriteRoute(routeId) {
  const current = getLocalFavoriteRoutes();
  const exists = current.includes(routeId);
  const updated = exists ? current.filter((id) => id !== routeId) : [...current, routeId];
  localStorage.setItem('vadtransit_fav_routes', JSON.stringify(updated));
  return updated;
}

/**
 * Retrieves stored favorite stop IDs from local storage.
 * @returns {Array<number|string>} Array of saved stop IDs.
 */
export function getLocalFavoriteStops() {
  try {
    const data = localStorage.getItem('vadtransit_fav_stops');
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error reading favorite stops', e);
    return [];
  }
}

/**
 * Toggles a stop ID in local favorite stops.
 * @param {number|string} stopId - The stop ID to toggle.
 * @returns {Array<number|string>} Updated list of favorite stop IDs.
 */
export function toggleLocalFavoriteStop(stopId) {
  const current = getLocalFavoriteStops();
  const exists = current.includes(stopId);
  const updated = exists ? current.filter((id) => id !== stopId) : [...current, stopId];
  localStorage.setItem('vadtransit_fav_stops', JSON.stringify(updated));
  return updated;
}
