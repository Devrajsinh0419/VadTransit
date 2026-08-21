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
 * Manages mobile and desktop views, tab navigation, detail overlays, local favorites, and map focus.
 * 
 * @returns {JSX.Element} The rendered VadTransit application layout.
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
   * Initializes stored local favorites and fetches initial routes and active service alert counts.
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
   * Resets active detail overlays when changing primary navigation tabs.
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
          onSelectStop={(stop) => {
            setSelectedStop(stop);
            setSelectedMapItem(stop);
          }}
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
          onSelectBus={(bus) => {
            setSelectedBus(bus);
            setSelectedMapItem(bus);
          }}
          onViewOnMap={handleViewOnMap}
          favoriteStopIds={favoriteStopIds}
          onToggleFavorite={handleToggleFavoriteStop}
        />
      );
    }

    // 4. Primary Navigation Tabs
    switch (activeTab) {
      case 'stops':
        return (
          <StopList
            onSelectStop={(stop) => {
              setSelectedStop(stop);
              setSelectedMapItem(stop);
            }}
            favoriteStopIds={favoriteStopIds}
            onToggleFavorite={handleToggleFavoriteStop}
          />
        );
      case 'map':
        return (
          <MapView
            selectedItem={selectedMapItem}
            onSelectStop={(stop) => {
              setSelectedStop(stop);
              setSelectedMapItem(stop);
            }}
            onSelectBus={(bus) => {
              setSelectedBus(bus);
              setSelectedMapItem(bus);
            }}
          />
        );
      case 'favorites':
        return (
          <FavoritesView
            favoriteRouteIds={favoriteRouteIds}
            favoriteStopIds={favoriteStopIds}
            onToggleFavoriteRoute={handleToggleFavoriteRoute}
            onToggleFavoriteStop={handleToggleFavoriteStop}
            onSelectRoute={(route) => {
              setSelectedRoute(route);
              setSelectedMapItem(route);
            }}
            onSelectStop={(stop) => {
              setSelectedStop(stop);
              setSelectedMapItem(stop);
            }}
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
            onSelectRoute={(route) => {
              setSelectedRoute(route);
              setSelectedMapItem(route);
            }}
            onSelectStop={(stop) => {
              setSelectedStop(stop);
              setSelectedMapItem(stop);
            }}
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
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Desktop Responsive Split Screen & Mobile Single View */}
      <main className="main-content">
        <div className="desktop-layout">
          <div className="desktop-side-panel">
            {renderCurrentView()}
          </div>
          <div className="desktop-map-viewport">
            <MapView
              selectedItem={selectedMapItem}
              onSelectStop={(stop) => {
                setSelectedStop(stop);
                setSelectedMapItem(stop);
              }}
              onSelectBus={(bus) => {
                setSelectedBus(bus);
                setSelectedMapItem(bus);
              }}
            />
          </div>
        </div>
      </main>

      <BottomNav
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        alertCount={alertCount}
      />
    </div>
  );
}
