import type { Invoice, Order, OrderItem } from '../types'
import { money } from '../utils/money'

interface Props {
  invoice: Invoice
  onClose: () => void
  onMarkPaid?: () => void
  onPrint?: () => void
}

export function InvoiceView({ invoice, onClose, onMarkPaid, onPrint }: Props) {
  const items = invoice.order?.items ?? []
  const restaurant = invoice.restaurant

  return (
    <div className="modal-overlay show" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">Invoice</div>
          <button type="button" className="close-x" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="invoice invoice-print">
          <div className="invoice-head">
            <div>
              <div className="invoice-brand">{restaurant?.name ?? 'Restaurant'}</div>
              {restaurant?.address && (
                <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{restaurant.address}</div>
              )}
            </div>
            <div className="invoice-meta">
              <div>
                <b>Invoice #</b> {invoice.invoice_number}
              </div>
              <div>
                <b>Date</b> {new Date(invoice.issued_at).toLocaleDateString()}
              </div>
              {invoice.order?.tableId && (
                <div>
                  <b>Table</b> T-{String(invoice.order.tableId).padStart(2, '0')}
                </div>
              )}
            </div>
          </div>
          <div className="invoice-info">
            <div>
              <b>Customer:</b> {invoice.order?.customerName || 'Walk-in'}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it: OrderItem, i: number) => (
                <tr key={it.id ?? i}>
                  <td>{it.name}</td>
                  <td>{it.quantity}</td>
                  <td>{money(it.price)}</td>
                  <td style={{ textAlign: 'right' }}>{money(Number(it.price) * it.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="invoice-totals">
            <div>
              <span>Subtotal</span>
              <span>{money(invoice.subtotal)}</span>
            </div>
            {Number(invoice.discount) > 0 && (
              <div>
                <span>Discount</span>
                <span>-{money(invoice.discount)}</span>
              </div>
            )}
            <div>
              <span>Tax</span>
              <span>{money(invoice.tax)}</span>
            </div>
            <div className="grand">
              <span>Total</span>
              <span>{money(invoice.total)}</span>
            </div>
          </div>
          <div className="invoice-footer">Thank you for dining with us — please visit again.</div>
        </div>
        <div className="form-row" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
          <button type="button" className="btn ghost" onClick={onClose}>
            Close
          </button>
          <button type="button" className="btn ghost" onClick={onPrint ?? (() => window.print())}>
            Print
          </button>
          {invoice.payment_status !== 'paid' && onMarkPaid && (
            <button type="button" className="btn leaf" onClick={onMarkPaid}>
              Mark as paid
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function orderStatusPill(status: Order['status']) {
  if (status === 'paid') return <span className="pill on">Paid</span>
  if (status === 'open') return <span className="pill wait">Open</span>
  if (status === 'billed') return <span className="pill brass">Billed</span>
  return <span className="pill off">{status}</span>
}
