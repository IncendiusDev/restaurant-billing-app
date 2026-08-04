import React, { useState, useEffect } from 'react';
import { Order, Invoice } from '../types';
import { X, CheckCircle, CreditCard, DollarSign, QrCode, Smartphone, AlertCircle, Ticket, Phone } from 'lucide-react';
import { api } from '../api/client';

interface InvoiceModalProps {
  order: Order;
  onClose: () => void;
  onPaymentComplete: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  order,
  onClose,
  onPaymentComplete,
}) => {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'online_desk'>('cash');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrCreateInvoice() {
      setLoading(true);
      setError(null);
      try {
        const inv = await api.post<Invoice>(`/api/orders/${order.id}/invoice`);
        setInvoice(inv);
      } catch (err: any) {
        setError(err.message || 'Could not generate invoice.');
      } finally {
        setLoading(false);
      }
    }
    fetchOrCreateInvoice();
  }, [order.id]);

  const handlePayInvoice = async () => {
    if (!invoice) return;
    setProcessing(true);
    setError(null);

    if (paymentMethod === 'online_desk') {
      try {
        const orderData = await api<{ keyId: string; orderId: string; amount: number; currency: string }>(
          '/api/payments/create-order',
          { invoiceId: invoice.id, amount: invoice.total_amount }
        );

        if (typeof (window as any).Razorpay !== 'undefined') {
          const options = {
            key: orderData.keyId,
            amount: orderData.amount,
            currency: orderData.currency || 'INR',
            name: 'Restaurant POS',
            description: `Payment for Invoice #${invoice.invoice_number}`,
            order_id: orderData.orderId,
            handler: async function (response: any) {
              try {
                await api('/api/payments/verify-payment', {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  invoiceId: invoice.id,
                  paymentMethod: 'online_desk',
                });
                onPaymentComplete();
                onClose();
              } catch (verifyErr: any) {
                setError(verifyErr.message || 'Payment signature verification failed.');
              }
            },
            modal: {
              ondismiss: function () {
                setProcessing(false);
                setError('Payment checkout cancelled by user.');
              },
            },
          };

          const rzp = new (window as any).Razorpay(options);
          rzp.on('payment.failed', function (response: any) {
            setError(response.error?.description || 'Payment failed. Please try again.');
          });
          rzp.open();
          return;
        }
      } catch (err: any) {
        console.warn('Razorpay checkout error, falling back to direct settlement:', err);
      }
    }

    try {
      await api.patch(`/api/invoices/${invoice.id}/pay`, {
        paymentMethod,
      });
      onPaymentComplete();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Payment update failed.');
    } finally {
      setProcessing(false);
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'cash': return 'Cash';
      case 'card': return 'Card / POS';
      case 'online_desk': return 'Online at Desk';
      default: return method;
    }
  };

  return (
    <div className="modal-overlay animate-fade-in" style={{ zIndex: 130 }}>
      <div className="modal-content-sheet animate-slide-up" style={{ maxHeight: '92vh' }}>
        <div className="sheet-handle" />

        <div className="sheet-header">
          <div>
            <h3 className="sheet-title">Bill & Settlement</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {invoice ? `Invoice #${invoice.invoice_number}` : `Order #${order.id}`}
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

        <div className="sheet-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
              Generating receipt snapshot...
            </div>
          ) : error ? (
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
              }}
            >
              <AlertCircle size={18} />
              <div>{error}</div>
            </div>
          ) : (
            <div>
              {/* Receipt Preview Paper Card */}
              <div
                style={{
                  background: '#ffffff',
                  color: '#0f172a',
                  borderRadius: 'var(--radius-md)',
                  padding: '20px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  fontFamily: 'sans-serif',
                }}
              >
                <div style={{ textAlign: 'center', borderBottom: '1px dashed #cbd5e1', paddingBottom: '12px', marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>TAX INVOICE / RECEIPT</h4>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Table T-{order.table_id || 'Takeaway'} • Order #{order.id}</div>
                  {order.waiting_token && (
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6366f1' }}>Waiting Token #{order.waiting_token}</div>
                  )}
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>{new Date().toLocaleString()}</div>
                </div>

                {(order.customer_name || order.customer_mobile) && (
                  <div style={{ fontSize: '0.78rem', color: '#475569', marginBottom: '10px', paddingBottom: '6px', borderBottom: '1px solid #f1f5f9' }}>
                    {order.customer_name && <div><b>Customer:</b> {order.customer_name}</div>}
                    {order.customer_mobile && <div><b>Mobile:</b> {order.customer_mobile}</div>}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.82rem', marginBottom: '12px' }}>
                  {order.items.map((it) => (
                    <div key={it.id || it.menu_item_id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{it.quantity}x {it.name}</span>
                      <span>₹{(Number(it.price) * it.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '10px', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                    <span>Subtotal</span>
                    <span>₹{Number(invoice?.subtotal || 0).toFixed(2)}</span>
                  </div>
                  {Number(invoice?.discount_amount) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                      <span>Discount</span>
                      <span>-₹{Number(invoice?.discount_amount).toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                    <span>Tax</span>
                    <span>+₹{Number(invoice?.tax_amount || 0).toFixed(2)}</span>
                  </div>
                  <div style={{ borderTop: '2px solid #0f172a', paddingTop: '6px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                    <span>TOTAL PAYABLE</span>
                    <span>₹{Number(invoice?.total_amount || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Select Payment Method */}
              <div style={{ marginTop: '20px' }}>
                <label className="form-label" style={{ marginBottom: '8px' }}>Select Payment Option</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    style={{
                      padding: '12px 6px',
                      borderRadius: 'var(--radius-md)',
                      background: paymentMethod === 'cash' ? 'var(--primary)' : 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-color)',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    <DollarSign size={20} /> Cash
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    style={{
                      padding: '12px 6px',
                      borderRadius: 'var(--radius-md)',
                      background: paymentMethod === 'card' ? 'var(--primary)' : 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-color)',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    <CreditCard size={20} /> Card
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('online_desk')}
                    style={{
                      padding: '12px 6px',
                      borderRadius: 'var(--radius-md)',
                      background: paymentMethod === 'online_desk' ? 'var(--primary)' : 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-color)',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    <Smartphone size={20} /> Online at Desk
                  </button>
                </div>
              </div>

              {/* Submit Payment Action */}
              <button
                className="btn btn-success btn-full"
                disabled={processing}
                style={{ marginTop: '20px', fontSize: '0.95rem' }}
                onClick={handlePayInvoice}
              >
                <CheckCircle size={20} />
                {processing ? 'Processing Settlement...' : `Mark Paid & Free Table (${getMethodLabel(paymentMethod)})`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
