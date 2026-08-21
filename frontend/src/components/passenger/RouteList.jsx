import React, { useState } from 'react';
import { Search, ChevronRight, Star } from 'lucide-react';

/**
 * RouteList component for route discovery, searching, and filtering in Vadodara.
 * @param {Object} props - Component properties.
 * @param {Array} props.routes - List of available route objects.
 * @param {Function} props.onSelectRoute - Callback when a route card is tapped.
 * @param {Array<number|string>} props.favoriteRouteIds - Array of favorite route IDs.
 * @param {Function} props.onToggleFavorite - Callback function to toggle favorite status.
 * @returns {JSX.Element} Rendered route list component.
 */
export default function RouteList({
  routes = [],
  onSelectRoute,
  favoriteRouteIds = [],
  onToggleFavorite,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterCode, setSelectedFilterCode] = useState('ALL');

  /**
   * Clears current search input and filter chips.
   */
  const handleClearSearch = () => {
    setSearchQuery('');
    setSelectedFilterCode('ALL');
  };

  /**
   * Filters routes based on search query match against code or name, and optional filter chip.
   * @returns {Array} Filtered list of routes.
   */
  const getFilteredRoutes = () => {
    return routes.filter((route) => {
      // 1. Check chip filter
      if (selectedFilterCode !== 'ALL' && route.route_code !== selectedFilterCode) {
        return false;
      }
      // 2. Check search input query
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      const codeMatch = route.route_code && route.route_code.toLowerCase().includes(query);
      const nameMatch = route.name && route.name.toLowerCase().includes(query);
      return codeMatch || nameMatch;
    });
  };

  const filteredRoutes = getFilteredRoutes();
  const availableCodes = Array.from(new Set(routes.map((r) => r.route_code).filter(Boolean)));

  return (
    <div className="passenger-view route-list-view">
      <div className="view-header">
        <h2 className="view-title">Vadodara Bus Routes</h2>
        <p className="view-subtitle">Browse and search active public transport routes</p>
      </div>

      <div className="search-bar">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Search route by code or name (e.g. R-1, Airport)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {(searchQuery || selectedFilterCode !== 'ALL') && (
          <button
            type="button"
            className="clear-search-btn"
            onClick={handleClearSearch}
            title="Clear filters"
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
            All Routes
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

      <div className="card-list">
        {filteredRoutes.length === 0 ? (
          <div className="empty-state">
            <p>No routes found matching "{searchQuery}"</p>
            <button type="button" className="action-btn primary-action margin-top-sm" onClick={handleClearSearch}>
              Reset Search Filters
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
                    <span className="route-stop-count">{stopCount} Stops</span>
                  </div>
                  <button
                    type="button"
                    className={`fav-btn ${isFav ? 'fav-active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onToggleFavorite) onToggleFavorite(route.id);
                    }}
                    title={isFav ? 'Remove from favorites' : 'Save to favorites'}
                  >
                    <Star size={18} fill={isFav ? 'currentColor' : 'none'} />
                  </button>
                </div>

                <div className="route-card-body">
                  <h3 className="route-name">{route.name}</h3>
                </div>

                <div className="route-card-footer">
                  <span className="route-action-text">View route stops & ETAs</span>
                  <ChevronRight size={18} className="route-arrow" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
