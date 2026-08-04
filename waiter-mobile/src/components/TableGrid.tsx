import React, { useState } from 'react';
import { Table, Order } from '../types';
import { Users, PlusCircle, Clock, RefreshCw, Layers, Ticket } from 'lucide-react';

interface TableGridProps {
  tables: Table[];
  openOrders: Order[];
  onSelectTableForNewOrder: (table: Table) => void;
  onViewOrderDetails: (order: Order, table: Table) => void;
  onRefresh: () => void;
  loading: boolean;
}

export const TableGrid: React.FC<TableGridProps> = ({
  tables,
  openOrders,
  onSelectTableForNewOrder,
  onViewOrderDetails,
  onRefresh,
  loading,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'free' | 'occupied' | 'reserved'>('all');

  const filteredTables = tables.filter((t) => (filterStatus === 'all' ? true : t.status === filterStatus));

  const countByStatus = {
    all: tables.length,
    free: tables.filter((t) => t.status === 'free').length,
    occupied: tables.filter((t) => t.status === 'occupied').length,
    reserved: tables.filter((t) => t.status === 'reserved').length,
  };

  return (
    <div className="animate-fade-in" style={{ padding: '16px 16px 24px' }}>
      {/* Top Bar with Filter Pills & Auto Refresh Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
          {(['all', 'free', 'occupied', 'reserved'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.78rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                textTransform: 'capitalize',
                background: filterStatus === st ? 'var(--primary)' : 'var(--bg-surface-elevated)',
                color: filterStatus === st ? 'white' : 'var(--text-secondary)',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {st}
              <span
                style={{
                  background: filterStatus === st ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontSize: '0.7rem',
                }}
              >
                {countByStatus[st]}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          title="Auto refreshing live status"
          style={{
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
        </button>
      </div>

      {/* Grid of Tables */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: '12px',
        }}
      >
        {filteredTables.length === 0 ? (
          <div
            style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '40px 20px',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
            }}
          >
            <Layers size={36} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No tables found matching "{filterStatus}"</p>
          </div>
        ) : (
          filteredTables.map((table) => {
            const activeOrder = openOrders.find((o) => Number(o.table_id) === Number(table.id));
            const isOccupied = table.status === 'occupied';
            const isFree = table.status === 'free';

            let statusBg = 'var(--status-free-bg)';
            let statusBorder = 'var(--status-free-border)';
            let statusColor = 'var(--status-free)';

            if (isOccupied) {
              statusBg = 'var(--status-occupied-bg)';
              statusBorder = 'var(--status-occupied-border)';
              statusColor = 'var(--status-occupied)';
            } else if (table.status === 'reserved') {
              statusBg = 'var(--status-reserved-bg)';
              statusBorder = 'var(--status-reserved-border)';
              statusColor = 'var(--status-reserved)';
            }

            return (
              <div
                key={table.id}
                onClick={() => {
                  if (isOccupied && activeOrder) {
                    onViewOrderDetails(activeOrder, table);
                  } else {
                    onSelectTableForNewOrder(table);
                  }
                }}
                style={{
                  background: 'var(--bg-surface)',
                  border: `1px solid ${statusBorder}`,
                  borderRadius: 'var(--radius-lg)',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  position: 'relative',
                  minHeight: '135px',
                  boxShadow: isOccupied ? '0 4px 16px rgba(245, 158, 11, 0.1)' : 'none',
                  transition: 'transform 0.15s ease, border-color 0.2s ease',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      T-{table.table_number}
                    </div>
                    <span
                      style={{
                        background: statusBg,
                        color: statusColor,
                        border: `1px solid ${statusBorder}`,
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {table.status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    <Users size={14} />
                    <span>Cap: {table.capacity} seats</span>
                  </div>

                  {activeOrder?.waiting_token && (
                    <div style={{ marginTop: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 700 }}>
                      <Ticket size={10} /> Token #{activeOrder.waiting_token}
                    </div>
                  )}
                </div>

                {isOccupied && activeOrder ? (
                  <div style={{ marginTop: '12px', borderTop: '1px dashed var(--border-color)', paddingTop: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} /> #{activeOrder.id}
                      </span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--accent)' }}>
                        ₹{Number(activeOrder.totals?.total || 0).toFixed(2)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 700, marginTop: '4px' }}>
                      <PlusCircle size={13} /> + Add Dishes / View Order
                    </div>
                  </div>
                ) : (
                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontSize: '0.78rem', fontWeight: 600 }}>
                    <PlusCircle size={14} /> Take Order
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
