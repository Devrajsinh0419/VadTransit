import { useState, useEffect, useRef, useCallback } from 'react';
import { sendLocationUpdate } from '../services/api';

/**
 * Custom React hook for managing automatic geolocation tracking during driver shifts.
 * Handles GPS position fixes, backend transmission, network error recovery, and status metrics.
 * 
 * @param {Object|null} activeShift - The active driver shift object (contains bus_id).
 * @param {boolean} isTrackingActive - Flag indicating whether automatic tracking should be active.
 * @returns {Object} Tracking state including status, update count, last fix details, and error info.
 */
export function useLocationTracking(activeShift, isTrackingActive) {
  const [trackingStatus, setTrackingStatus] = useState('idle');
  const [updateCount, setUpdateCount] = useState(0);
  const [lastLocation, setLastLocation] = useState(null);
  const [lastError, setLastError] = useState(null);
  
  const watchIdRef = useRef(null);
  const activeShiftRef = useRef(activeShift);
  const isSubmittingRef = useRef(false);

  // Keep reference updated to avoid stale closure in geolocation callbacks
  useEffect(() => {
    activeShiftRef.current = activeShift;
  }, [activeShift]);

  /**
   * Processes a new geolocation position fix and sends it to the backend.
   * @param {GeolocationPosition} position - Position object from Geolocation API.
   */
  const handlePositionUpdate = useCallback(async (position) => {
    const shift = activeShiftRef.current;
    if (!shift || !shift.bus_id || isSubmittingRef.current) {
      return;
    }

    const { latitude, longitude, accuracy, speed, heading } = position.coords;
    const recordedAt = new Date(position.timestamp || Date.now()).toISOString();

    const locationPayload = {
      bus_id: shift.bus_id,
      latitude: Number(latitude.toFixed(6)),
      longitude: Number(longitude.toFixed(6)),
      recorded_at: recordedAt,
      accuracy: accuracy != null ? Number(accuracy.toFixed(2)) : null,
      speed: speed != null && !isNaN(speed) ? Number(speed.toFixed(2)) : 0,
      heading: heading != null && !isNaN(heading) ? Number(heading.toFixed(2)) : 0,
    };

    isSubmittingRef.current = true;
    try {
      await sendLocationUpdate(locationPayload);
      setUpdateCount((count) => count + 1);
      setLastLocation({
        latitude: locationPayload.latitude,
        longitude: locationPayload.longitude,
        accuracy: locationPayload.accuracy,
        recorded_at: locationPayload.recorded_at,
      });
      setTrackingStatus('tracking');
      setLastError(null);
    } catch (err) {
      console.warn('Failed to transmit location update:', err.message);
      setTrackingStatus('reconnecting');
      setLastError(`Network issue sending location: ${err.message}`);
    } finally {
      isSubmittingRef.current = false;
    }
  }, []);

  /**
   * Handles errors reported by the Geolocation API.
   * @param {GeolocationPositionError} error - Geolocation error object.
   */
  const handlePositionError = useCallback((error) => {
    let message = 'Geolocation error occurred.';
    switch (error.code) {
      case error.PERMISSION_DENIED:
        message = 'Location permission denied by user or device.';
        break;
      case error.POSITION_UNAVAILABLE:
        message = 'Location position is currently unavailable.';
        break;
      case error.TIMEOUT:
        message = 'Location request timed out.';
        break;
      default:
        message = error.message || message;
    }
    setTrackingStatus('error');
    setLastError(message);
  }, []);

  // Effect to initiate or terminate location watching based on tracking flag and active shift
  useEffect(() => {
    if (!isTrackingActive || !activeShift || !activeShift.bus_id) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setTrackingStatus('idle');
      return;
    }

    if (!('geolocation' in navigator)) {
      setTrackingStatus('error');
      setLastError('Geolocation API is not supported by this browser.');
      return;
    }

    setTrackingStatus('tracking');
    setLastError(null);

    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 5000,
    };

    // Begin watching position updates
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePositionUpdate,
      handlePositionError,
      geoOptions
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isTrackingActive, activeShift, handlePositionUpdate, handlePositionError]);

  return {
    trackingStatus,
    updateCount,
    lastLocation,
    lastError,
  };
}
