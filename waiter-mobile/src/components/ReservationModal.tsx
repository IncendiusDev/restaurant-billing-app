import React, { useState } from 'react';
import { Table } from '../types';
import { X, Calendar, User, Phone, Users, Clock, CheckCircle } from 'lucide-react';
import { api } from '../api/client';

interface ReservationModalProps {
  tables: Table[];
  onClose: () => void;
  onReservationCreated: () => void;
}

export const ReservationModal: React.FC<ReservationModalProps> = ({
  tables,
  onClose,
  onReservationCreated,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [tableId, setTableId] = useState<number | ''>('');
  const [partySize, setPartySize] = useState<number>(2);
  const [reservationTime, setReservationTime] = useState<string>(
    new Date(Date.now() + 30 * 60000).toISOString().slice(0, 16)
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setError('Please enter customer name.');
      return;
    }
    if (!customerPhone.trim()) {
      setError('Please enter phone number.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.post('/api/tables/reservations', {
        tableId: tableId ? Number(tableId) : null,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        partySize: Number(partySize) || 2,
        reservationTime: new Date(reservationTime).toISOString(),
      });
      alert(`Table reserved successfully for ${customerName}!`);
      onReservationCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to book reservation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay animate-fade-in" style={{ zIndex: 120 }}>
      <div className="modal-content-sheet animate-slide-up" style={{ maxHeight: '90vh' }}>
        <div className="sheet-handle" />

        <div className="sheet-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={20} style={{ color: 'var(--accent)' }} />
            <h3 className="sheet-title">Book Table Reservation</h3>
          </div>
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

        <form onSubmit={handleSubmit} className="sheet-body">
          {error && (
            <div style={{ background: 'var(--danger-bg)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', marginBottom: '14px' }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Guest / Customer Name *</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Rajesh Sahu"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number *</label>
            <input
              type="tel"
              className="form-input"
              placeholder="e.g. 9583203368"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Select Table (Optional)</label>
            <select
              className="form-input"
              value={tableId}
              onChange={(e) => setTableId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">Any Available Table</option>
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  Table T-{t.table_number} ({t.capacity} Seats) - {t.status}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Guests Count</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={partySize}
                onChange={(e) => setPartySize(Number(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Date & Time</label>
              <input
                type="datetime-local"
                className="form-input"
                value={reservationTime}
                onChange={(e) => setReservationTime(e.target.value)}
                style={{ fontSize: '0.8rem' }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
            style={{ marginTop: '16px', background: 'linear-gradient(135deg, var(--accent), #d97706)' }}
          >
            <CheckCircle size={18} />
            {loading ? 'Booking Table...' : 'Confirm Table Reservation'}
          </button>
        </form>
      </div>
    </div>
  );
};
