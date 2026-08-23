import React, { useState, useEffect } from 'react';
import { Search, MapPin, Navigation, Star, ChevronRight } from 'lucide-react';
import { fetchStops, fetchNearbyStops } from '../../services/api';

/**
 * StopList component for bus stop browsing, search, and GPS nearby stop calculation.
 * Enhanced with creative visual design, GPS integration, and improved nearby discovery.
 * 
 * @param {Object} props - StopList props.
 * @param {Function} props.onSelectStop - Callback when a stop card is tapped.
 * @param {Array<number|string>} props.favoriteStopIds - Saved favorite stop IDs.
 * @param {Function} props.onToggleFavorite - Callback to toggle favorite state.
 * @returns {JSX.Element} Rendered stops view.
 */
export default function StopList({ onSelectStop, favoriteStopIds = [], onToggleFavorite }) {
  const [stops, setStops] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [radiusKm, setRadiusKm] = useState(5.0);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [userCoords, setUserCoords] = useState(null);

  /**
   * Loads all public bus stops in Vadodara.
   */
  const loadStops = async () => {
    setLoading(true);
    try {
      const data = await fetchStops();
      setStops(data);
    } catch (err) {
      console.error('Failed loading stops', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStops();
  }, []);

  /**
   * Requests device GPS geolocation to rank closest bus stops within chosen radius.
   * @param {number} [targetRadius] - Search radius in km.
   */
  const handleFindNearby = (targetRadius = radiusKm) => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserCoords({ latitude, longitude });
        try {
          const nearby = await fetchNearbyStops(latitude, longitude, targetRadius);
          setStops(nearby);
        } catch (err) {
          console.error('Nearby stops fetch error', err);
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setIsLocating(false);
        setLocationError('Could not obtain location. Displaying all Vadodara stops.');
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  /**
   * Updates radius chip selection and re-fetches nearby stops if GPS location is active.
   * @param {number} r - Radius in kilometers.
   */
  const handleRadiusChange = (r) => {
    setRadiusKm(r);
    if (userCoords) {
      handleFindNearby(r);
    }
  };

  /**
   * Resets search input and location filters back to full stop list.
   */
  const handleClearSearch = () => {
    setSearchQuery('');
    setUserCoords(null);
    setLocationError(null);
    loadStops();
  };

  /**
   * Filters stops list based on user search query matching stop name.
   * @returns {Array} Filtered stops list.
   */
  const getFilteredStops = () => {
    if (!searchQuery.trim()) return stops;
    const query = searchQuery.toLowerCase();
    return stops.filter((s) => s.name && s.name.toLowerCase().includes(query));
  };

  const filteredStops = getFilteredStops();

  return (
    <div className="passenger-view stop-list-view">
      <div className="view-header">
        <h2 className="view-title">Vadodara Bus Stops</h2>
        <p className="view-subtitle">Search stops or use GPS to locate nearest bus stops</p>
      </div>

      <div className="nearby-banner">
        <div className="nearby-text">
          <Navigation className="nearby-icon" size={18} />
          <div>
            <h4 className="nearby-title">Nearby Bus Stops</h4>
            <p className="nearby-desc">Use GPS location to rank closest stops</p>
          </div>
        </div>
        <button
          type="button"
          className="locate-btn"
          onClick={() => handleFindNearby(radiusKm)}
          disabled={isLocating}
        >
          {isLocating ? 'Locating...' : 'Use GPS'}
        </button>
      </div>

      <div className="radius-selector-bar">
        <span className="radius-label">Radius:</span>
        {[1, 3, 5, 10].map((r) => (
          <button
            key={r}
            type="button"
            className={`chip-btn ${radiusKm === r ? 'chip-active' : ''}`}
            onClick={() => handleRadiusChange(r)}
          >
            {r} km
          </button>
        ))}
      </div>

      {locationError && <div className="notice-banner warning-notice">{locationError}</div>}
      {userCoords && (
        <div className="notice-banner success-notice flex-notice" style={{ justifyContent: 'space-between' }}>
          <span>Stops within {radiusKm} km of your position</span>
          <button type="button" className="text-link-btn" onClick={handleClearSearch}>Reset</button>
        </div>
      )}

      <div className="search-bar">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Search stop name (e.g. Sayaji Baug, Fatehgunj)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            type="button"
            className="clear-search-btn"
            onClick={() => setSearchQuery('')}
          >
            ×
          </button>
        )}
      </div>

      <div className="card-list">
        {loading ? (
          <div className="loading-state">Loading bus stops...</div>
        ) : filteredStops.length === 0 ? (
          <div className="empty-state">
            <p>No stops found matching "{searchQuery}"</p>
            <button type="button" className="action-btn primary-action margin-top-sm" onClick={handleClearSearch}>
              Reset Filters
            </button>
          </div>
        ) : (
          filteredStops.map((stop) => {
            const isFav = favoriteStopIds.includes(stop.id);
            return (
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
                    <h3 className="stop-name">{stop.name}</h3>
                    {stop.distance_km !== undefined && (
                      <span className="distance-badge">{stop.distance_km} km away</span>
                    )}
                  </div>
                </div>

                <div className="stop-card-actions">
                  <button
                    type="button"
                    className={`fav-btn ${isFav ? 'fav-active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onToggleFavorite) onToggleFavorite(stop.id);
                    }}
                    title={isFav ? 'Remove favorite' : 'Save favorite'}
                  >
                    <Star size={18} fill={isFav ? 'currentColor' : 'none'} />
                  </button>
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