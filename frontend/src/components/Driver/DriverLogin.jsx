import { useState, useEffect } from 'react';
import { fetchRoutes, fetchBuses, startShift } from '../../services/api';

/**
 * Component for Driver Access and Shift Setup.
 * Allows the driver to select an assigned driver ID, bus, and route to start a tracking shift.
 * 
 * @param {Object} props
 * @param {Function} props.onShiftStarted - Callback invoked when a shift is successfully started.
 */
export function DriverLogin({ onShiftStarted }) {
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [driverId, setDriverId] = useState('');
  const [selectedBusId, setSelectedBusId] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetches initial selection data (buses and routes) on component mount.
   */
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const [routeList, busList] = await Promise.all([
          fetchRoutes(),
          fetchBuses(),
        ]);
        setRoutes(routeList || []);
        setBuses(busList || []);
      } catch (err) {
        setError(`Failed to load shift options: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  /**
   * Handles the form submission to start a driver shift.
   * @param {Event} e - Submit event.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!driverId || !selectedBusId || !selectedRouteId) {
      setError('Please select Driver ID, Bus, and Route before starting.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        driver_id: parseInt(driverId, 10),
        bus_id: parseInt(selectedBusId, 10),
        route_id: parseInt(selectedRouteId, 10),
      };

      const shiftData = await startShift(payload);
      
      // Pass the route and bus objects along with shift metadata for UI display
      const selectedRoute = routes.find((r) => r.id === payload.route_id);
      const selectedBus = buses.find((b) => b.id === payload.bus_id);

      onShiftStarted({
        ...shiftData,
        route: selectedRoute,
        bus: selectedBus,
      });
    } catch (err) {
      setError(err.message || 'Failed to start shift.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="driver-card">
        <h2>Loading Shift Setup...</h2>
      </div>
    );
  }

  return (
    <div className="driver-card">
      <h2>Start Driver Shift</h2>
      
      {error && (
        <div className="driver-alert driver-alert-error">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="driver-form-group">
          <label htmlFor="driver-id-input">Driver ID</label>
          <input
            id="driver-id-input"
            type="number"
            className="driver-input"
            placeholder="Enter Driver ID (e.g. 1)"
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
            required
            min="1"
          />
        </div>

        <div className="driver-form-group">
          <label htmlFor="bus-select">Select Bus</label>
          <select
            id="bus-select"
            className="driver-select"
            value={selectedBusId}
            onChange={(e) => setSelectedBusId(e.target.value)}
            required
          >
            <option value="">-- Choose Bus --</option>
            {buses.map((bus) => (
              <option key={bus.id} value={bus.id}>
                Bus #{bus.fleet_number} ({bus.registration_number})
              </option>
            ))}
          </select>
        </div>

        <div className="driver-form-group">
          <label htmlFor="route-select">Select Route</label>
          <select
            id="route-select"
            className="driver-select"
            value={selectedRouteId}
            onChange={(e) => setSelectedRouteId(e.target.value)}
            required
          >
            <option value="">-- Choose Route --</option>
            {routes.map((route) => (
              <option key={route.id} value={route.id}>
                Route {route.route_code} - {route.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="driver-btn driver-btn-primary"
          disabled={submitting}
        >
          {submitting ? 'Starting Shift...' : 'START SHIFT'}
        </button>
      </form>
    </div>
  );
}
