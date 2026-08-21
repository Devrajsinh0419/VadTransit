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
