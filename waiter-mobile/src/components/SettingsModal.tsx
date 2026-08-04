import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { UserCheck, Server, LogOut, Shield, Wifi, RefreshCw, X } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { user, logout, baseUrl, updateBaseUrl } = useAuth();
  const [inputUrl, setInputUrl] = useState(baseUrl);
  const [pingStatus, setPingStatus] = useState<string | null>(null);
  const [pinging, setPinging] = useState(false);

  const handleTestConnection = async () => {
    setPinging(true);
    setPingStatus(null);
    try {
      updateBaseUrl(inputUrl);
      const res = await api.get<{ status: string }>('/health');
      if (res.status === 'ok') {
        setPingStatus('Connected successfully! Server is healthy.');
      } else {
        setPingStatus('Server responded but status was unexpected.');
      }
    } catch (err: any) {
      setPingStatus(`Failed to connect: ${err.message}`);
    } finally {
      setPinging(false);
    }
  };

  return (
    <div className="modal-overlay animate-fade-in">
      <div className="modal-content-sheet animate-slide-up" style={{ maxHeight: '85vh' }}>
        <div className="sheet-handle" />

        <div className="sheet-header">
          <h3 className="sheet-title">Waiter Settings & Server</h3>
          <button
            onClick={onClose}
            style={{
              background: 'var(--bg-surface-elevated)',
              border: 'none',
              color: 'var(--text-secondary)',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="sheet-body">
          {/* Waiter Profile Box */}
          <div style={{ background: 'var(--bg-surface-elevated)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 800,
                  fontSize: '1.2rem',
                }}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : 'W'}
              </div>
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{user?.name}</h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{user?.email}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                  <span style={{ fontSize: '0.68rem', background: 'rgba(99, 102, 241, 0.2)', color: 'var(--primary)', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>
                    Role: {user?.role}
                  </span>
                  <span style={{ fontSize: '0.68rem', background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                    RestID: #{user?.restaurantId}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Server Config */}
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Server size={16} /> Backend Server API URL
            </label>
            <input
              type="text"
              className="form-input"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="http://192.168.1.100:4000"
            />
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              For local Android testing: use your PC's Wi-Fi IP address (e.g., http://192.168.1.X:4000).
            </p>

            <button
              className="btn btn-secondary"
              style={{ marginTop: '10px', fontSize: '0.82rem' }}
              onClick={handleTestConnection}
              disabled={pinging}
            >
              <Wifi size={14} /> {pinging ? 'Testing Connection...' : 'Test Server Connection'}
            </button>

            {pingStatus && (
              <div
                style={{
                  marginTop: '8px',
                  fontSize: '0.78rem',
                  color: pingStatus.includes('successfully') ? 'var(--status-free)' : 'var(--danger)',
                }}
              >
                {pingStatus}
              </div>
            )}
          </div>

          {/* Sign Out */}
          <button
            className="btn btn-danger btn-full"
            style={{ marginTop: '20px' }}
            onClick={() => {
              logout();
              onClose();
            }}
          >
            <LogOut size={18} /> Sign Out Waiter Session
          </button>
        </div>
      </div>
    </div>
  );
};
