import React, { useState, useMemo } from 'react';
import { Table, MenuItem } from '../types';
import { X, Search, Plus, Minus, MessageSquare, ArrowRight, Phone, User, Ticket } from 'lucide-react';

interface OrderPOSModalProps {
  table: Table | null;
  menuItems: MenuItem[];
  onClose: () => void;
  onSubmitOrder: (orderData: {
    tableId: number | null;
    customerName: string;
    customerMobile?: string;
    waitingToken?: string;
    orderType: 'dine_in' | 'takeaway';
    taxPct: number;
    discount: number;
    items: Array<{ menuItemId: number; quantity: number; notes?: string }>;
  }) => Promise<void>;
}

export const OrderPOSModal: React.FC<OrderPOSModalProps> = ({
  table,
  menuItems,
  onClose,
  onSubmitOrder,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [waitingToken, setWaitingToken] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [taxPct, setTaxPct] = useState<number>(5);
  const [discount, setDiscount] = useState<number>(0);
  const [cartItems, setCartItems] = useState<Map<number, { menuItem: MenuItem; quantity: number; notes: string }>>(new Map());
  const [showTray, setShowTray] = useState(false);
  const [activeNoteItemId, setActiveNoteItemId] = useState<number | null>(null);
  const [tempNote, setTempNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    set.add('All');
    menuItems.forEach((item) => {
      if (item.category_name) set.add(item.category_name);
    });
    return Array.from(set);
  }, [menuItems]);

  // Filtered Menu Items
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (!item.is_available) return false;
      const matchesCat = selectedCategory === 'All' || item.category_name === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCat && matchesSearch;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  const updateQuantity = (item: MenuItem, delta: number) => {
    setCartItems((prev) => {
      const next = new Map(prev);
      const existing = next.get(item.id);
      if (existing) {
        const newQty = existing.quantity + delta;
        if (newQty <= 0) {
          next.delete(item.id);
        } else {
          next.set(item.id, { ...existing, quantity: newQty });
        }
      } else if (delta > 0) {
        next.set(item.id, { menuItem: item, quantity: 1, notes: '' });
      }
      return next;
    });
  };

  const handleSaveNote = (menuItemId: number) => {
    setCartItems((prev) => {
      const next = new Map(prev);
      const existing = next.get(menuItemId);
      if (existing) {
        next.set(menuItemId, { ...existing, notes: tempNote });
      }
      return next;
    });
    setActiveNoteItemId(null);
    setTempNote('');
  };

  // Cart Calculations
  const cartList = Array.from(cartItems.values());
  const subtotal = cartList.reduce((sum, ci) => sum + Number(ci.menuItem.price) * ci.quantity, 0);
  const taxable = Math.max(subtotal - discount, 0);
  const taxAmount = taxable * (taxPct / 100);
  const grandTotal = taxable + taxAmount;
  const totalItemCount = cartList.reduce((sum, ci) => sum + ci.quantity, 0);

  const estimatedPrepMins = useMemo(() => {
    if (cartList.length === 0) return 10;
    let base = 5;
    cartList.forEach((ci) => {
      const name = ci.menuItem.name.toLowerCase();
      const qty = ci.quantity;
      if (name.includes('drink') || name.includes('soda') || name.includes('juice') || name.includes('tea') || name.includes('coffee')) {
        base += qty * 2;
      } else if (name.includes('tikka') || name.includes('starter') || name.includes('soup') || name.includes('roll')) {
        base += 6 + (qty * 1);
      } else {
        base += 10 + (qty * 2);
      }
    });
    return Math.max(10, Math.min(60, Math.round(base)));
  }, [cartList]);

  const handleFinalSubmit = async () => {
    if (cartList.length === 0) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmitOrder({
        tableId: table ? table.id : null,
        customerName: customerName.trim() || `Guest (Table T-${table?.table_number || 'Takeaway'})`,
        customerMobile: customerMobile.trim() || undefined,
        waitingToken: waitingToken.trim() || undefined,
        orderType: table ? 'dine_in' : 'takeaway',
        taxPct,
        discount,
        items: cartList.map((ci) => ({
          menuItemId: ci.menuItem.id,
          quantity: ci.quantity,
          notes: ci.notes || undefined,
        })),
      });
      onClose();
    } catch (err: any) {
      console.error('Order submission error:', err);
      setSubmitError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay animate-fade-in" style={{ padding: 0 }}>
      <div className="modal-content-sheet animate-slide-up" style={{ height: '95vh', maxHeight: '95vh' }}>
        <div className="sheet-handle" />

        {/* Modal Header */}
        <div className="sheet-header">
          <div>
            <h3 className="sheet-title">
              {table ? `Order for Table T-${table.table_number}` : 'Takeaway Order'}
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {table ? `Capacity: ${table.capacity} seats` : 'Direct Mobile Billing'}
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
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Customer Details & Waiting Token Bar */}
        <div style={{ padding: '12px 16px', background: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            <div style={{ position: 'relative' }}>
              <User size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-input"
                style={{ fontSize: '0.8rem', padding: '6px 8px 6px 30px' }}
                placeholder="Customer Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div style={{ position: 'relative' }}>
              <Phone size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="tel"
                className="form-input"
                style={{ fontSize: '0.8rem', padding: '6px 8px 6px 30px' }}
                placeholder="Mobile No."
                value={customerMobile}
                onChange={(e) => setCustomerMobile(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px', marginBottom: '10px' }}>
            <div style={{ position: 'relative' }}>
              <Ticket size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
              <input
                type="text"
                className="form-input"
                style={{ fontSize: '0.8rem', padding: '6px 8px 6px 30px' }}
                placeholder="Token #"
                value={waitingToken}
                onChange={(e) => setWaitingToken(e.target.value)}
              />
            </div>

            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '30px', fontSize: '0.8rem', padding: '6px 8px 6px 30px' }}
                placeholder="Search dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Categories Tab Bar */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  border: 'none',
                  cursor: 'pointer',
                  background: selectedCategory === cat ? 'var(--primary)' : 'var(--bg-surface)',
                  color: selectedCategory === cat ? 'white' : 'var(--text-secondary)',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items List */}
        <div className="sheet-body" style={{ padding: '14px 16px 100px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredMenuItems.map((item) => {
              const inCart = cartItems.get(item.id);
              const qty = inCart ? inCart.quantity : 0;

              return (
                <div
                  key={item.id}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4 style={{ fontSize: '0.92rem', fontWeight: 700 }}>{item.name}</h4>
                      {item.category_name && (
                        <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-muted)' }}>
                          {item.category_name}
                        </span>
                      )}
                    </div>

                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {item.description || 'Delicious freshly prepared dish'}
                    </p>

                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>
                      ₹{Number(item.price).toFixed(2)}
                    </div>

                    {inCart?.notes && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--accent)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MessageSquare size={10} /> Note: "{inCart.notes}"
                      </div>
                    )}
                  </div>

                  {/* Quantity Controls */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                    {qty === 0 ? (
                      <button
                        onClick={() => updateQuantity(item, 1)}
                        className="btn btn-primary"
                        style={{ padding: '6px 14px', minHeight: '36px', fontSize: '0.8rem', borderRadius: 'var(--radius-full)' }}
                      >
                        <Plus size={14} /> Add
                      </button>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-full)', padding: '3px' }}>
                        <button
                          onClick={() => updateQuantity(item, -1)}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: 'var(--bg-surface)',
                            border: 'none',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          <Minus size={14} />
                        </button>
                        <span style={{ fontSize: '0.9rem', fontWeight: 800, minWidth: '18px', textAlign: 'center' }}>{qty}</span>
                        <button
                          onClick={() => updateQuantity(item, 1)}
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
                          <Plus size={14} />
                        </button>
                      </div>
                    )}

                    {qty > 0 && (
                      <button
                        onClick={() => {
                          setActiveNoteItemId(item.id);
                          setTempNote(inCart?.notes || '');
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          fontSize: '0.7rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          cursor: 'pointer',
                        }}
                      >
                        <MessageSquare size={12} /> {inCart?.notes ? 'Edit Note' : 'Add Note'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Item Note Modal Popup */}
        {activeNoteItemId !== null && (
          <div className="modal-overlay animate-fade-in" style={{ zIndex: 110 }}>
            <div className="modal-content-sheet animate-slide-up" style={{ padding: '20px' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '8px' }}>Add Kitchen Instructions</h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Specify item instructions e.g. "Extra spicy", "No onions", "Less oil"
              </p>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Enter notes..."
                value={tempNote}
                onChange={(e) => setTempNote(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => handleSaveNote(activeNoteItemId)}>
                  Save Note
                </button>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setActiveNoteItemId(null)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Cart Bottom Bar */}
        {totalItemCount > 0 && !showTray && (
          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              left: '16px',
              right: '16px',
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              borderRadius: 'var(--radius-lg)',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 8px 30px var(--primary-glow)',
              cursor: 'pointer',
            }}
            onClick={() => setShowTray(true)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                }}
              >
                {totalItemCount}
              </div>
              <div>
                <div style={{ fontSize: '0.92rem', fontWeight: 800 }}>View Order Tray</div>
                <div style={{ fontSize: '0.72rem', opacity: 0.9 }}>
                  {waitingToken ? `Token #${waitingToken} • ` : ''}⏱️ ~{estimatedPrepMins} mins est. prep
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', fontWeight: 800 }}>
              ₹{grandTotal.toFixed(2)}
              <ArrowRight size={18} />
            </div>
          </div>
        )}

        {/* Full Cart / Tray Modal */}
        {showTray && (
          <div className="modal-overlay animate-fade-in" style={{ zIndex: 120 }}>
            <div className="modal-content-sheet animate-slide-up" style={{ maxHeight: '88vh' }}>
              <div className="sheet-header">
                <h3 className="sheet-title">Order Summary ({totalItemCount} items)</h3>
                <button
                  onClick={() => setShowTray(false)}
                  style={{
                    background: 'var(--bg-surface-elevated)',
                    border: 'none',
                    color: 'white',
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              <div className="sheet-body">
                {cartList.map((ci) => (
                  <div
                    key={ci.menuItem.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 0',
                      borderBottom: '1px solid var(--border-color)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{ci.menuItem.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        ₹{Number(ci.menuItem.price).toFixed(2)} x {ci.quantity}
                      </div>
                      {ci.notes && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--accent)' }}>Note: {ci.notes}</div>
                      )}
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      ₹{(Number(ci.menuItem.price) * ci.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}

                {/* Tax & Discount Inputs */}
                <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Tax (%)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={taxPct}
                      onChange={(e) => setTaxPct(Number(e.target.value))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Discount (₹)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                    />
                  </div>
                </div>

                {/* Breakdown */}
                <div style={{ background: 'var(--bg-surface-elevated)', padding: '14px', borderRadius: 'var(--radius-md)', marginTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    <span>Discount</span>
                    <span>-₹{discount.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                    <span>Tax ({taxPct}%)</span>
                    <span>+₹{taxAmount.toFixed(2)}</span>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 800 }}>
                    <span>Total</span>
                    <span style={{ color: 'var(--primary)' }}>₹{grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                {submitError && (
                  <div
                    style={{
                      background: 'var(--danger-bg)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--danger)',
                      fontSize: '0.82rem',
                      marginTop: '12px',
                    }}
                  >
                    {submitError}
                  </div>
                )}

                <button
                  className="btn btn-primary btn-full"
                  disabled={submitting}
                  style={{ marginTop: '20px' }}
                  onClick={handleFinalSubmit}
                >
                  {submitting ? 'Sending Order...' : 'Send Order to Kitchen'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
