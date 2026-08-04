import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../api/client';
import { User } from '../types';
import { UtensilsCrossed, Server, Lock, Mail, ChevronRight, AlertCircle } from 'lucide-react';

export const LoginModal: React.FC = () => {
  const { login, baseUrl, updateBaseUrl } = useAuth();
  const [email, setEmail] = useState('waiter1@restaurant.com');
  const [password, setPassword] = useState('password123');
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [customServerUrl, setCustomServerUrl] = useState(baseUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await api.post<{ token: string; user: User }>('/api/auth/login', {
        email,
        password,
      });

      if (data.user.role !== 'waiter' && data.user.role !== 'restaurant_admin') {
        setError('Only Waiter or Restaurant Admin accounts can access this application.');
        return;
      }

      login(data.token, data.user);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Connection failed. Please check the Server URL in Settings below.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveServerUrl = () => {
    updateBaseUrl(customServerUrl);
    setShowServerConfig(false);
  };

  return (
    <div className="modal-overlay animate-fade-in" style={{ alignItems: 'center', padding: '16px' }}>
      <div
        className="modal-content-sheet animate-slide-up"
        style={{
          borderRadius: 'var(--radius-lg)',
          maxHeight: '95vh',
          background: 'linear-gradient(180deg, #131b2e 0%, #090d16 100%)',
          border: '1px solid var(--border-highlight)',
        }}
      >
        <div style={{ padding: '30px 24px 20px', textAlign: 'center' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #6366f1, #818cf8)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
              marginBottom: '16px',
            }}
          >
            <UtensilsCrossed size={32} />
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Waiter Mobile POS</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Sign in to start taking table orders
          </p>
        </div>

        <div className="sheet-body" style={{ padding: '0 24px 24px' }}>
          {error && (
            <div
              style={{
                background: 'var(--danger-bg)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                color: 'var(--danger)',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '16px',
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
                <input
                  type="email"
                  required
                  className="form-input"
                  style={{ paddingLeft: '42px' }}
                  placeholder="waiter@restaurant.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
                <input
                  type="password"
                  required
                  className="form-input"
                  style={{ paddingLeft: '42px' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: '12px' }}>
              {loading ? 'Authenticating...' : 'Sign In'}
              {!loading && <ChevronRight size={18} />}
            </button>
          </form>

          <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            {!showServerConfig ? (
              <button
                type="button"
                onClick={() => setShowServerConfig(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  margin: '0 auto',
                  cursor: 'pointer',
                }}
              >
                <Server size={14} /> Server: <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{baseUrl}</span>
              </button>
            ) : (
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>
                  Backend Server Base URL
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{ fontSize: '0.85rem', marginTop: '4px' }}
                  value={customServerUrl}
                  onChange={(e) => setCustomServerUrl(e.target.value)}
                  placeholder="http://192.168.1.100:4000"
                />
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button type="button" className="btn btn-primary" style={{ flex: 1, minHeight: '36px', fontSize: '0.8rem' }} onClick={handleSaveServerUrl}>
                    Save URL
                  </button>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1, minHeight: '36px', fontSize: '0.8rem' }} onClick={() => setShowServerConfig(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
