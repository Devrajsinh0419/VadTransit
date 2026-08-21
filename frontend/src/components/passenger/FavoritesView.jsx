import React, { useState, useEffect } from 'react';
import { Star, Route, MapPin, Trash2, ChevronRight } from 'lucide-react';
import { fetchRoutes, fetchStops } from '../../services/api';

/**
 * FavoritesView component displaying passenger's saved favorite routes and stops.
 * 
 * @param {Object} props - FavoritesView props.
 * @param {Array<number|string>} props.favoriteRouteIds - Saved favorite route IDs.
 * @param {Array<number|string>} props.favoriteStopIds - Saved favorite stop IDs.
 * @param {Function} props.onToggleFavoriteRoute - Callback to remove/toggle favorite route.
 * @param {Function} props.onToggleFavoriteStop - Callback to remove/toggle favorite stop.
 * @param {Function} props.onSelectRoute - Callback when route card is tapped.
 * @param {Function} props.onSelectStop - Callback when stop card is tapped.
 * @returns {JSX.Element} Rendered saved favorites view.
 */
export default function FavoritesView({
  favoriteRouteIds = [],
  favoriteStopIds = [],
  onToggleFavoriteRoute,
  onToggleFavoriteStop,
  onSelectRoute,
  onSelectStop,
}) {
  const [allRoutes, setAllRoutes] = useState([]);
  const [allStops, setAllStops] = useState([]);
  const [loading, setLoading] = useState(true);

  /**
   * Loads reference routes and stops to match against saved favorite IDs.
   */
  const loadData = async () => {
    setLoading(true);
    try {
      const [routesData, stopsData] = await Promise.all([fetchRoutes(), fetchStops()]);
      setAllRoutes(routesData);
      setAllStops(stopsData);
    } catch (err) {
      console.error('Failed loading favorite data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const favRoutes = allRoutes.filter((r) => favoriteRouteIds.includes(r.id));
  const favStops = allStops.filter((s) => favoriteStopIds.includes(s.id));

  const totalFavs = favRoutes.length + favStops.length;

  return (
    <div className="passenger-view favorites-view">
      <div className="view-header">
        <h2 className="view-title">Saved Favorites</h2>
        <p className="view-subtitle">Quick access to your saved Vadodara routes and stops</p>
      </div>

      {loading ? (
        <div className="loading-state">Loading saved favorites...</div>
      ) : totalFavs === 0 ? (
        <div className="empty-state">
          <Star size={36} className="empty-icon" />
          <h3>No Favorites Saved Yet</h3>
          <p style={{ marginTop: '4px' }}>Tap the star icon on any route or stop card to save it here for quick tracking.</p>
        </div>
      ) : (
        <div className="favorites-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {favRoutes.length > 0 && (
            <div className="fav-section">
              <h3 className="section-title" style={{ fontSize: '0.95rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Route size={16} />
                <span>Saved Routes ({favRoutes.length})</span>
              </h3>
              <div className="card-list">
                {favRoutes.map((route) => (
                  <div
                    key={route.id}
                    className="route-card card-hover"
                    onClick={() => onSelectRoute && onSelectRoute(route)}
                  >
                    <div className="route-card-header">
                      <span className="route-code-badge">{route.route_code || `R-${route.id}`}</span>
                      <button
                        type="button"
                        className="fav-btn fav-active"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavoriteRoute && onToggleFavoriteRoute(route.id);
                        }}
                        title="Remove from saved"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="route-card-body">
                      <h4 className="route-name">{route.name}</h4>
                    </div>
                    <div className="route-card-footer">
                      <span>View Route Details</span>
                      <ChevronRight size={17} className="route-arrow" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {favStops.length > 0 && (
            <div className="fav-section">
              <h3 className="section-title" style={{ fontSize: '0.95rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={16} />
                <span>Saved Stops ({favStops.length})</span>
              </h3>
              <div className="card-list">
                {favStops.map((stop) => (
                  <div
                    key={stop.id}
                    className="stop-card card-hover"
                    onClick={() => onSelectStop && onSelectStop(stop)}
                  >
                    <div className="stop-card-main">
                      <div className="stop-icon-wrapper">
                        <MapPin size={18} />
                      </div>
                      <div className="stop-info">
                        <h4 className="stop-name">{stop.name}</h4>
                      </div>
                    </div>
                    <div className="stop-card-actions">
                      <button
                        type="button"
                        className="fav-btn fav-active"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavoriteStop && onToggleFavoriteStop(stop.id);
                        }}
                        title="Remove from saved"
                      >
                        <Trash2 size={16} />
                      </button>
                      <ChevronRight size={17} className="route-arrow" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
