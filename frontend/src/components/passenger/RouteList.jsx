import React, { useState, useEffect } from 'react';
import { Search, ChevronRight, Star, MapPin } from 'lucide-react';
import { fetchStops } from '../../services/api';

/**
 * RouteList component providing unified search across bus routes and stops, filter chips, and route details.
 * Enhanced with creative visual design and improved interactivity.
 * 
 * @param {Object} props - Component properties.
 * @param {Array} props.routes - List of available route objects.
 * @param {Function} props.onSelectRoute - Callback when a route is selected.
 * @param {Function} [props.onSelectStop] - Callback when a stop search result is selected.
 * @param {Array<number|string>} props.favoriteRouteIds - Saved favorite route IDs.
 * @param {Function} props.onToggleFavorite - Callback to toggle favorite state.
 * @returns {JSX.Element} Rendered route list component.
 */
export default function RouteList({
  routes = [],
  onSelectRoute,
  onSelectStop,
  favoriteRouteIds = [],
  onToggleFavorite,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterCode, setSelectedFilterCode] = useState('ALL');
  const [allStops, setAllStops] = useState([]);

  /**
   * Fetches bus stops for unified instant search results.
   */
  useEffect(() => {
    async function loadAllStops() {
      try {
        const data = await fetchStops();
        setAllStops(data || []);
      } catch (err) {
        console.error('Failed loading stops for search', err);
      }
    }
    loadAllStops();
  }, []);

  /**
   * Clears search input and resets route filter chip.
   */
  const handleClearSearch = () => {
    setSearchQuery('');
    setSelectedFilterCode('ALL');
  };

  /**
   * Filters routes based on query string matching route code or name, and active chip filter.
   * @returns {Array} Filtered routes list.
   */
  const getFilteredRoutes = () => {
    return routes.filter((route) => {
      if (selectedFilterCode !== 'ALL' && route.route_code !== selectedFilterCode) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      const codeMatch = route.route_code && route.route_code.toLowerCase().includes(query);
      const nameMatch = route.name && route.name.toLowerCase().includes(query);
      return codeMatch || nameMatch;
    });
  };

  /**
   * Filters stops matching current search query for unified search results.
   * @returns {Array} Filtered stops list.
   */
  const getFilteredStops = () => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return allStops.filter((s) => s.name && s.name.toLowerCase().includes(query));
  };

  const filteredRoutes = getFilteredRoutes();
  const filteredStops = getFilteredStops();
  const availableCodes = Array.from(new Set(routes.map((r) => r.route_code).filter(Boolean)));

  return (
    <div className="passenger-view route-list-view">
      <div className="view-header">
        <h2 className="view-title">Vadodara Bus Routes</h2>
        <p className="view-subtitle">Search routes and stops or view live bus arrivals</p>
      </div>

      <div className="search-bar">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Unified search routes & stops (e.g. R-1, Airport, Sayaji Baug)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {(searchQuery || selectedFilterCode !== 'ALL') && (
          <button
            type="button"
            className="clear-search-btn"
            onClick={handleClearSearch}
            title="Clear search"
          >
            ×
          </button>
        )}
      </div>

      {availableCodes.length > 0 && (
        <div className="filter-chips-row">
          <button
            type="button"
            className={`chip-btn ${selectedFilterCode === 'ALL' ? 'chip-active' : ''}`}
            onClick={() => setSelectedFilterCode('ALL')}
          >
            All Routes ({routes.length})
          </button>
          {availableCodes.map((code) => (
            <button
              key={code}
              type="button"
              className={`chip-btn ${selectedFilterCode === code ? 'chip-active' : ''}`}
              onClick={() => setSelectedFilterCode(code)}
            >
              {code}
            </button>
          ))}
        </div>
      )}

      {/* Unified Search Section: Matching Bus Stops */}
      {searchQuery.trim() !== '' && filteredStops.length > 0 && (
        <div className="search-stops-section">
          <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={15} /> Matching Bus Stops ({filteredStops.length})
          </h3>
          <div className="card-list" style={{ marginBottom: '16px' }}>
            {filteredStops.map((stop) => (
              <div
                key={stop.id}
                className="stop-card card-hover"
                onClick={() => onSelectStop && onSelectStop(stop)}
              >
                <div className="stop-card-main">
                  <div className="stop-icon-wrapper">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <span className="type-badge type-badge-stop">STOP</span>
                    <h4 className="stop-name" style={{ marginTop: '2px' }}>{stop.name}</h4>
                  </div>
                </div>
                <ChevronRight size={17} className="route-arrow" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Primary Route Cards List */}
      <div className="card-list">
        {filteredRoutes.length === 0 && filteredStops.length === 0 ? (
          <div className="empty-state">
            <p>No routes or stops found matching "{searchQuery}"</p>
            <button type="button" className="action-btn primary-action margin-top-sm" onClick={handleClearSearch}>
              Reset Filters
            </button>
          </div>
        ) : (
          filteredRoutes.map((route) => {
            const isFav = favoriteRouteIds.includes(route.id);
            const stopCount = route.stops ? route.stops.length : 0;

            return (
              <div
                key={route.id}
                className="route-card card-hover"
                onClick={() => onSelectRoute && onSelectRoute(route)}
              >
                <div className="route-card-header">
                  <div className="route-badge-container">
                    <span className="route-code-badge">{route.route_code || `R-${route.id}`}</span>
                    <span className="type-badge type-badge-route">ROUTE</span>
                    <span className="route-stop-count">{stopCount} Stops</span>
                  </div>
                  <button
                    type="button"
                    className={`fav-btn ${isFav ? 'fav-active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onToggleFavorite) onToggleFavorite(route.id);
                    }}
                    title={isFav ? 'Remove from saved' : 'Save route'}
                  >
                    <Star size={18} fill={isFav ? 'currentColor' : 'none'} />
                  </button>
                </div>

                <div className="route-card-body">
                  <h3 className="route-name">{route.name}</h3>
                </div>

                <div className="route-card-footer">
                  <span>View Stops Sequence & Live Arrivals</span>
                  <ChevronRight size={17} className="route-arrow" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}