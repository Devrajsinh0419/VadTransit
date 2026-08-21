import { useState, useEffect } from 'react';
import { fetchActiveShifts } from '../../services/api';
import { DriverLogin } from './DriverLogin';
import { DriverDashboard } from './DriverDashboard';
import '../../styles/driver.css';

const LOCAL_STORAGE_SHIFT_KEY = 'vadtransit_active_driver_shift';

/**
 * Top-level container component for the Driver Portal.
 * Manages active shift lifecycle, persistence, and navigation between shift setup and dashboard.
 */
export function DriverApp() {
  const [activeShift, setActiveShift] = useState(null);
  const [checkingInitialShift, setCheckingInitialShift] = useState(true);

  /**
   * Restores active shift from localStorage or syncs with backend active shifts on initial mount.
   */
  useEffect(() => {
    async function restoreShift() {
      try {
        const savedShiftJson = localStorage.getItem(LOCAL_STORAGE_SHIFT_KEY);
        if (savedShiftJson) {
          const parsedShift = JSON.parse(savedShiftJson);
          setActiveShift(parsedShift);
        }

        // Validate or check with backend for current active shifts
        const serverActiveShifts = await fetchActiveShifts();
        if (serverActiveShifts && Array.isArray(serverActiveShifts)) {
          if (savedShiftJson) {
            const parsed = JSON.parse(savedShiftJson);
            const stillActive = serverActiveShifts.find((s) => s.id === parsed.id && s.is_active);
            if (!stillActive) {
              localStorage.removeItem(LOCAL_STORAGE_SHIFT_KEY);
              setActiveShift(null);
            }
          }
        }
      } catch (err) {
        console.warn('Could not restore driver shift session:', err.message);
      } finally {
        setCheckingInitialShift(false);
      }
    }
    restoreShift();
  }, []);

  /**
   * Callback invoked when a new shift is started.
   * Updates state and persists to localStorage.
   * @param {Object} shiftData - Shift data returned from start shift API.
   */
  const handleShiftStarted = (shiftData) => {
    setActiveShift(shiftData);
    try {
      localStorage.setItem(LOCAL_STORAGE_SHIFT_KEY, JSON.stringify(shiftData));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  };

  /**
   * Callback invoked when an active shift is ended.
   * Clears state and removes stored shift data.
   */
  const handleShiftEnded = () => {
    setActiveShift(null);
    try {
      localStorage.removeItem(LOCAL_STORAGE_SHIFT_KEY);
    } catch (e) {
      console.warn('LocalStorage remove failed:', e);
    }
  };

  if (checkingInitialShift) {
    return (
      <div className="driver-container">
        <div className="driver-card">
          <h2>Checking Driver Session...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="driver-container">
      <header className="driver-header">
        <h1>VadTransit Driver Portal</h1>
      </header>

      <main>
        {activeShift ? (
          <DriverDashboard
            activeShift={activeShift}
            onShiftEnded={handleShiftEnded}
          />
        ) : (
          <DriverLogin onShiftStarted={handleShiftStarted} />
        )}
      </main>
    </div>
  );
}

export default DriverApp;
