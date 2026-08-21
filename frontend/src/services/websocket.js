/**
 * Realtime WebSocket manager for passenger bus tracking.
 * Connects to /ws/buses/{bus_id}/ per endpoints.md specification.
 */

let activeSocket = null;

/**
 * Connects to the bus tracking WebSocket channel for a specific bus.
 * @param {number|string} busId - The bus ID to track.
 * @param {Function} onUpdate - Callback invoked when a location/ETA update arrives.
 * @param {Function} [onError] - Callback invoked when connection error occurs.
 * @returns {Function} Unsubscribe function to close the WebSocket.
 */
export function subscribeBusTracking(busId, onUpdate, onError) {
  if (activeSocket) {
    activeSocket.close();
    activeSocket = null;
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  const wsUrl = `${protocol}//${host}/ws/buses/${busId}/`;

  try {
    const socket = new WebSocket(wsUrl);
    activeSocket = socket;

    socket.onopen = () => {
      console.log(`WebSocket connected for bus #${busId}`);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (onUpdate) onUpdate(data);
      } catch (err) {
        console.error('Error parsing WebSocket message', err);
      }
    };

    socket.onerror = (err) => {
      console.warn(`WebSocket error for bus #${busId}`, err);
      if (onError) onError(err);
    };

    socket.onclose = () => {
      console.log(`WebSocket connection closed for bus #${busId}`);
    };

    return () => {
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
      activeSocket = null;
    };
  } catch (err) {
    console.warn('Failed establishing WebSocket connection', err);
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Closes any active passenger WebSocket connection.
 */
export function closeBusTrackingSocket() {
  if (activeSocket) {
    activeSocket.close();
    activeSocket = null;
  }
}
