import React, { useState } from 'react';
import { Table, Order, MenuItem } from '../types';
import { X, Plus, Trash2, ReceiptText, Clock, Phone, User, Ticket } from 'lucide-react';
import { api } from '../api/client';

interface ActiveOrderDetailsProps {
  order: Order;
  table: Table;
  menuItems: MenuItem[];
  onClose: () => void;
  onOrderUpdated: () => void;
  onRequestInvoice: (order: Order) => void;
}

export const ActiveOrderDetails: React.FC<ActiveOrderDetailsProps> = ({
  order,
  table,
  menuItems,
  onClose,
  onOrderUpdated,
  onRequestInvoice,
}) => {
  const [showAddItemDropdown, setShowAddItemDropdown] = useState(false);
  const [selectedMenuItemId, setSelectedMenuItemId] = useState<number>(menuItems[0]?.id || 0);
  const [loading, setLoading] = useState(false);

  const handleAddItem = async () => {
    if (!selectedMenuItemId) return;
    setLoading(true);
    try {
      await api.patch(`/api/orders/${order.id}/items`, {
        add: { menuItemId: selectedMenuItemId, quantity: 1 },
      });
      onOrderUpdated();
      setShowAddItemDropdown(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (orderItemId: number, newQty: number) => {
    setLoading(true);
    try {
      if (newQty <= 0) {
        await api.patch(`/api/orders/${order.id}/items`, { removeItemId: orderItemId });
      } else {
        await api.patch(`/api/orders/${order.id}/items`, {
          updateQuantity: { orderItemId, quantity: newQty },
        });
      }
      onOrderUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay animate-fade-in">
      <div className="modal-content-sheet animate-slide-up" style={{ maxHeight: '90vh' }}>
        <div className="sheet-handle" />

        {/* Header */}
        <div className="sheet-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 className="sheet-title">Table T-{table.table_number}</h3>
              <span style={{ fontSize: '0.72rem', background: 'var(--status-occupied-bg)', color: 'var(--status-occupied)', border: '1px solid var(--status-occupied-border)', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>
                Order #{order.id}
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={12} /> Placed {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
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

        {/* Customer Info Card */}
        <div style={{ padding: '10px 20px', background: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-color)', display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.78rem' }}>
          {order.customer_name && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-primary)' }}>
              <User size={12} style={{ color: 'var(--primary)' }} /> {order.customer_name}
            </div>
          )}
          {order.customer_mobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
              <Phone size={12} style={{ color: 'var(--status-free)' }} /> {order.customer_mobile}
            </div>
          )}
          {order.waiting_token && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent)', fontWeight: 700 }}>
              <Ticket size={12} /> Token #{order.waiting_token}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="sheet-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Order Items</h4>
            <button
              onClick={() => setShowAddItemDropdown(!showAddItemDropdown)}
              style={{
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-color)',
                color: 'var(--primary)',
                fontSize: '0.78rem',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
              }}
            >
              <Plus size={14} /> Add Item
            </button>
          </div>

          {/* Quick Add Extra Item Bar */}
          {showAddItemDropdown && (
            <div style={{ background: 'var(--bg-surface-elevated)', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '14px', border: '1px solid var(--border-highlight)' }}>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Select Menu Item to Add</label>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <select
                  className="form-input"
                  style={{ flex: 1, fontSize: '0.85rem', padding: '8px' }}
                  value={selectedMenuItemId}
                  onChange={(e) => setSelectedMenuItemId(Number(e.target.value))}
                >
                  {menuItems.filter(m => m.is_available).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (₹{Number(m.price).toFixed(2)})
                    </option>
                  ))}
                </select>
                <button className="btn btn-primary" style={{ padding: '8px 14px', minHeight: '36px', fontSize: '0.8rem' }} onClick={handleAddItem} disabled={loading}>
                  Add
                </button>
              </div>
            </div>
          )}

          {/* Items List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {order.items.map((item) => (
              <div
                key={item.id}
                style={{
                  background: 'var(--bg-surface-elevated)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{item.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    ₹{Number(item.price).toFixed(2)} x {item.quantity} = ₹{(Number(item.price) * item.quantity).toFixed(2)}
                  </div>
                  {item.notes && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--accent)', marginTop: '2px' }}>
                      Note: "{item.notes}"
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => handleUpdateQuantity(item.id!, item.quantity - 1)}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    {item.quantity === 1 ? <Trash2 size={12} style={{ color: 'var(--danger)' }} /> : '-'}
                  </button>
                  <span style={{ fontWeight: 800, minWidth: '16px', textAlign: 'center' }}>{item.quantity}</span>
                  <button
                    onClick={() => handleUpdateQuantity(item.id!, item.quantity + 1)}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'var(--primary)',
                      border: 'none',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Totals Box */}
          <div style={{ background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', padding: '14px', marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              <span>Subtotal</span>
              <span>₹{order.totals?.subtotal.toFixed(2) || '0.00'}</span>
            </div>
            {Number(order.discount) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                <span>Discount</span>
                <span>-₹{Number(order.discount).toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              <span>Tax ({order.tax_pct}%)</span>
              <span>+₹{order.totals?.tax.toFixed(2) || '0.00'}</span>
            </div>
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 800 }}>
              <span>Total Payable</span>
              <span style={{ color: 'var(--accent)' }}>₹{order.totals?.total.toFixed(2) || '0.00'}</span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button
              className="btn btn-success btn-full"
              onClick={() => onRequestInvoice(order)}
            >
              <ReceiptText size={18} /> Request Bill / Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
