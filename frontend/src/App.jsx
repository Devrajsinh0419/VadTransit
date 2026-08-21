<<<<<<< HEAD
import { useState } from 'react';
import { DriverApp } from './components/Driver/DriverApp';
import './App.css';

/**
 * Root Application Component for VadTransit Frontend.
 * Provides view switching between Driver Portal and future Admin Portal.
 */
function App() {
  const [currentPortal, setCurrentPortal] = useState('driver');

  /**
   * Switches the active portal view.
   * @param {string} portal - Selected portal ('driver' or 'admin').
   */
  const handlePortalSwitch = (portal) => {
    setCurrentPortal(portal);
  };

  return (
    <div className="app-root">
      <nav className="portal-selector" style={styles.navBar}>
        <span style={styles.brand}>VadTransit</span>
        <div style={styles.navButtons}>
          <button
            type="button"
            style={{
              ...styles.navBtn,
              ...(currentPortal === 'driver' ? styles.activeNavBtn : {}),
            }}
            onClick={() => handlePortalSwitch('driver')}
          >
            Driver Portal
          </button>
          <button
            type="button"
            style={{
              ...styles.navBtn,
              ...(currentPortal === 'admin' ? styles.activeNavBtn : {}),
            }}
            onClick={() => handlePortalSwitch('admin')}
          >
            Admin Portal
          </button>
        </div>
      </nav>

      {currentPortal === 'driver' && <DriverApp />}

      {currentPortal === 'admin' && (
        <div style={styles.adminPlaceholder}>
          <div className="driver-card" style={{ maxWidth: '600px', margin: '40px auto' }}>
            <h2>Admin Portal</h2>
            <p style={{ color: '#94a3b8' }}>
              Admin dashboard foundation ready for implementation.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  navBar: {
    display: 'flex',
    justify: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderBottom: '1px solid #334155',
    padding: '12px 20px',
    color: '#ffffff',
  },
  brand: {
    fontWeight: 'bold',
    fontSize: '1.2rem',
    color: '#38bdf8',
  },
  navButtons: {
    display: 'flex',
    gap: '10px',
  },
  navBtn: {
    backgroundColor: 'transparent',
    color: '#94a3b8',
    border: '1px solid #334155',
    borderRadius: '6px',
    padding: '8px 16px',
    fontSize: '0.9rem',
    cursor: 'pointer',
    fontWeight: '500',
  },
  activeNavBtn: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    borderColor: '#2563eb',
  },
  adminPlaceholder: {
    backgroundColor: '#0f172a',
    minHeight: 'calc(100vh - 60px)',
    padding: '20px',
  },
};

export default App;
=======
import React, { useState, useEffect } from 'react';
import Header from './components/common/Header';
import BottomNav from './components/common/BottomNav';

import RouteList from './components/passenger/RouteList';
import RouteDetail from './components/passenger/RouteDetail';
import StopList from './components/passenger/StopList';
import StopDetail from './components/passenger/StopDetail';
import BusTracker from './components/passenger/BusTracker';
import MapView from './components/passenger/MapView';
import FavoritesView from './components/passenger/FavoritesView';
import AlertsView from './components/passenger/AlertsView';

import { fetchRoutes, fetchAlerts } from './services/api';
import {
  getLocalFavoriteRoutes,
  toggleLocalFavoriteRoute,
  getLocalFavoriteStops,
  toggleLocalFavoriteStop,
} from './services/storage';

/**
 * Root Application Component for VadTransit Passenger Frontend.
 * Manages mobile view tab switching, route/stop/bus detail navigation, local favorites state, and service alert counters.
 * @returns {JSX.Element} The rendered React app layout.
 */
export default function App() {
  const [activeTab, setActiveTab] = useState('routes');

  const [routes, setRoutes] = useState([]);
  const [alertCount, setAlertCount] = useState(0);

  // Detail view state overlays
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [selectedStop, setSelectedStop] = useState(null);
  const [selectedBus, setSelectedBus] = useState(null);
  const [selectedMapItem, setSelectedMapItem] = useState(null);

  // Favorites state
  const [favoriteRouteIds, setFavoriteRouteIds] = useState([]);
  const [favoriteStopIds, setFavoriteStopIds] = useState([]);

  /**
   * Initializes stored favorites and fetches initial routes and active alert count.
   */
  const loadInitialData = async () => {
    setFavoriteRouteIds(getLocalFavoriteRoutes());
    setFavoriteStopIds(getLocalFavoriteStops());

    try {
      const [rData, aData] = await Promise.all([fetchRoutes(), fetchAlerts()]);
      setRoutes(rData);
      const activeAlerts = aData.filter((a) => a.is_active);
      setAlertCount(activeAlerts.length);
    } catch (err) {
      console.error('Error initializing passenger app data', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  /**
   * Resets active detail overlays when changing primary bottom nav tabs.
   * @param {string} tabKey - Target tab identifier.
   */
  const handleTabChange = (tabKey) => {
    setSelectedRoute(null);
    setSelectedStop(null);
    setSelectedBus(null);
    setActiveTab(tabKey);
  };

  /**
   * Toggles a route ID in passenger favorite list.
   * @param {number|string} routeId - Target route ID.
   */
  const handleToggleFavoriteRoute = (routeId) => {
    const updated = toggleLocalFavoriteRoute(routeId);
    setFavoriteRouteIds(updated);
  };

  /**
   * Toggles a stop ID in passenger favorite list.
   * @param {number|string} stopId - Target stop ID.
   */
  const handleToggleFavoriteStop = (stopId) => {
    const updated = toggleLocalFavoriteStop(stopId);
    setFavoriteStopIds(updated);
  };

  /**
   * Handles focusing an item (route, stop, or bus) on the interactive map view.
   * @param {Object} item - Item object to locate on map.
   */
  const handleViewOnMap = (item) => {
    setSelectedMapItem(item);
    setActiveTab('map');
  };

  /**
   * Triggers a manual refresh of current view data.
   */
  const handleRefresh = () => {
    loadInitialData();
  };

  /**
   * Renders the current passenger screen based on detail selection and active tab.
   * @returns {JSX.Element} The active view component.
   */
  const renderCurrentView = () => {
    // 1. Bus Tracker View Overlay
    if (selectedBus) {
      return (
        <BusTracker
          bus={selectedBus}
          onBack={() => setSelectedBus(null)}
          onViewOnMap={handleViewOnMap}
        />
      );
    }

    // 2. Route Detail View Overlay
    if (selectedRoute) {
      return (
        <RouteDetail
          route={selectedRoute}
          onBack={() => setSelectedRoute(null)}
          onSelectStop={(stop) => setSelectedStop(stop)}
          onViewOnMap={handleViewOnMap}
          favoriteRouteIds={favoriteRouteIds}
          onToggleFavorite={handleToggleFavoriteRoute}
        />
      );
    }

    // 3. Stop Detail View Overlay
    if (selectedStop) {
      return (
        <StopDetail
          stop={selectedStop}
          onBack={() => setSelectedStop(null)}
          onSelectBus={(bus) => setSelectedBus(bus)}
          onViewOnMap={handleViewOnMap}
          favoriteStopIds={favoriteStopIds}
          onToggleFavorite={handleToggleFavoriteStop}
        />
      );
    }

    // 4. Primary Bottom Navigation Tabs
    switch (activeTab) {
      case 'stops':
        return (
          <StopList
            onSelectStop={(stop) => setSelectedStop(stop)}
            favoriteStopIds={favoriteStopIds}
            onToggleFavorite={handleToggleFavoriteStop}
          />
        );
      case 'map':
        return (
          <MapView
            selectedItem={selectedMapItem}
            onSelectStop={(stop) => setSelectedStop(stop)}
            onSelectBus={(bus) => setSelectedBus(bus)}
          />
        );
      case 'favorites':
        return (
          <FavoritesView
            favoriteRouteIds={favoriteRouteIds}
            favoriteStopIds={favoriteStopIds}
            onToggleFavoriteRoute={handleToggleFavoriteRoute}
            onToggleFavoriteStop={handleToggleFavoriteStop}
            onSelectRoute={(route) => setSelectedRoute(route)}
            onSelectStop={(stop) => setSelectedStop(stop)}
          />
        );
      case 'alerts':
        return (
          <AlertsView
            onAlertCountChange={(count) => setAlertCount(count)}
          />
        );
      case 'routes':
      default:
        return (
          <RouteList
            routes={routes}
            onSelectRoute={(route) => setSelectedRoute(route)}
            favoriteRouteIds={favoriteRouteIds}
            onToggleFavorite={handleToggleFavoriteRoute}
          />
        );
    }
  };

  return (
    <div className="app-container">
      <Header
        onRefresh={handleRefresh}
        activeAlertCount={alertCount}
        onOpenAlerts={() => handleTabChange('alerts')}
      />

      <main className="main-content">{renderCurrentView()}</main>

      <BottomNav
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        alertCount={alertCount}
      />
    </div>
  );
}
>>>>>>> 60abaa8dc356b8a2d988ef0551205afb695151ff
