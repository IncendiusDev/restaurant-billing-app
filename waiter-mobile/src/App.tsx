import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { useSocket } from './context/SocketContext';
import { Table, MenuItem, Order } from './types';
import { api } from './api/client';
import { LoginModal } from './components/LoginModal';
import { TableGrid } from './components/TableGrid';
import { OrderPOSModal } from './components/OrderPOSModal';
import { ActiveOrderDetails } from './components/ActiveOrderDetails';
import { InvoiceModal } from './components/InvoiceModal';
import { SettingsModal } from './components/SettingsModal';
import {
  UtensilsCrossed,
  LayoutGrid,
  ClipboardList,
  BookOpen,
  Settings,
  PlusCircle,
  Clock,
  ChevronRight,
  User,
  Phone,
  Ticket,
  LogIn,
  LogOut,
} from 'lucide-react';

export const App: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { isConnected, socket } = useSocket();

  const [activeTab, setActiveTab] = useState<'tables' | 'orders' | 'menu' | 'settings'>('tables');
  const [tables, setTables] = useState<Table[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [openOrders, setOpenOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  // Waiter Punch State
  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [punching, setPunching] = useState(false);

  // Modals state
  const [selectedTableForOrder, setSelectedTableForOrder] = useState<Table | null>(null);
  const [showOrderPOS, setShowOrderPOS] = useState(false);
  const [activeOrderView, setActiveOrderView] = useState<{ order: Order; table: Table } | null>(null);
  const [invoiceOrderView, setInvoiceOrderView] = useState<Order | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const fetchInitialData = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [tablesData, menuData, ordersData] = await Promise.all([
        api.get<Table[]>('/api/tables'),
        api.get<MenuItem[]>('/api/menu'),
        api.get<Order[]>('/api/orders?status=open'),
      ]);
      setTables(tablesData || []);
      setMenuItems(menuData || []);
      setOpenOrders(ordersData || []);
    } catch (err) {
      console.error('Failed to fetch waiter dashboard data:', err);
    }
  }, [isAuthenticated]);

  // Attendance Ping & Activity Heartbeat
  useEffect(() => {
    if (!isAuthenticated) return;
    const pingInterval = setInterval(async () => {
      try {
        if (isPunchedIn) {
          await api.post('/api/waiters/ping', {});
        }
      } catch (e) {}
    }, 60000);
    return () => clearInterval(pingInterval);
  }, [isAuthenticated, isPunchedIn]);

  useEffect(() => {
    fetchInitialData();
    const interval = setInterval(() => {
      fetchInitialData();
    }, 4000);
    return () => clearInterval(interval);
  }, [fetchInitialData]);

  // Socket listener
  useEffect(() => {
    if (!socket) return;
    const handleOrderNew = () => fetchInitialData();
    socket.on('order:new', handleOrderNew);
    return () => {
      socket.off('order:new', handleOrderNew);
    };
  }, [socket, fetchInitialData]);

  const handlePunchToggle = async () => {
    setPunching(true);
    try {
      if (isPunchedIn) {
        await api.post('/api/waiters/punch-out', {});
        setIsPunchedIn(false);
      } else {
        await api.post('/api/waiters/punch-in', {});
        setIsPunchedIn(true);
      }
    } catch (err: any) {
      console.warn('Punch notice:', err.message);
      setIsPunchedIn(!isPunchedIn);
    } finally {
      setPunching(false);
    }
  };

  const handleCreateOrder = async (orderPayload: {
    tableId: number | null;
    customerName: string;
    customerMobile?: string;
    waitingToken?: string;
    orderType: 'dine_in' | 'takeaway';
    taxPct: number;
    discount: number;
    items: Array<{ menuItemId: number; quantity: number; notes?: string }>;
  }) => {
    await api.post('/api/orders', orderPayload);
    await fetchInitialData();
  };

  if (!isAuthenticated) {
    return <LoginModal />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top Header */}
      <header className="mobile-header">
        <div className="brand-badge">
          <div className="brand-icon">
            <UtensilsCrossed size={20} />
          </div>
          <div>
            <div className="brand-title">Waiter Mobile</div>
            <div className="brand-subtitle">{user?.name || 'Staff'}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Punch In / Out Button */}
          <button
            onClick={handlePunchToggle}
            disabled={punching}
            style={{
              background: isPunchedIn ? 'rgba(239, 68, 68, 0.18)' : 'rgba(34, 197, 94, 0.18)',
              border: `1px solid ${isPunchedIn ? 'var(--danger)' : 'var(--status-free)'}`,
              color: isPunchedIn ? 'var(--danger)' : 'var(--status-free)',
              padding: '6px 10px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.72rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
            }}
          >
            {isPunchedIn ? <LogOut size={12} /> : <LogIn size={12} />}
            {isPunchedIn ? 'Punch Out' : 'Punch In'}
          </button>

          <div className="connection-pill">
            <div className={`dot ${isConnected ? 'online' : 'offline'}`} />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              {isConnected ? 'Live' : 'Sync'}
            </span>
          </div>

          <button
            onClick={() => setShowSettings(true)}
            style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              width: '34px',
              height: '34px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Settings size={16} />
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main style={{ flex: 1 }}>
        {activeTab === 'tables' && (
          <div>
            <TableGrid
              tables={tables}
              openOrders={openOrders}
              loading={loading}
              onRefresh={fetchInitialData}
              onSelectTableForNewOrder={(table) => {
                setSelectedTableForOrder(table);
                setShowOrderPOS(true);
              }}
              onViewOrderDetails={(order, table) => {
                setActiveOrderView({ order, table });
              }}
            />
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="animate-fade-in" style={{ padding: '16px 16px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Active Open Orders</h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', background: 'var(--bg-surface-elevated)', padding: '4px 10px', borderRadius: 'var(--radius-full)' }}>
                {openOrders.length} Open
              </span>
            </div>

            {openOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                <ClipboardList size={40} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No active orders right now.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {openOrders.map((order) => {
                  const matchingTable = tables.find((t) => Number(t.id) === Number(order.table_id));
                  return (
                    <div
                      key={order.id}
                      onClick={() => {
                        if (matchingTable) {
                          setActiveOrderView({ order, table: matchingTable });
                        }
                      }}
                      style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        padding: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {matchingTable ? `Table T-${matchingTable.table_number}` : 'Takeaway'}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'var(--bg-surface-elevated)', padding: '2px 6px', borderRadius: '4px' }}>
                            #{order.id}
                          </span>
                          {order.waiting_token && (
                            <span style={{ fontSize: '0.68rem', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                              <Ticket size={10} /> Token #{order.waiting_token}
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={12} />
                          <span>{order.items.length} items</span>
                          {order.customer_name && (
                            <>
                              <span>•</span>
                              <span style={{ color: 'var(--text-primary)' }}>{order.customer_name}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent)' }}>
                            ₹{Number(order.totals?.total || 0).toFixed(2)}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--status-occupied)', textTransform: 'uppercase', fontWeight: 700 }}>
                            {order.status}
                          </div>
                        </div>
                        <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'menu' && (
          <div className="animate-fade-in" style={{ padding: '16px 16px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Restaurant Menu Catalog</h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {menuItems.length} Available Dishes
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
              {menuItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.name}</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', lineClamp: 2 }}>
                      {item.description || item.category_name}
                    </p>
                  </div>
                  <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--primary)' }}>
                      ₹{Number(item.price).toFixed(2)}
                    </span>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: item.is_available ? 'var(--status-free-bg)' : 'var(--danger-bg)',
                        color: item.is_available ? 'var(--status-free)' : 'var(--danger)',
                        fontWeight: 700,
                      }}
                    >
                      {item.is_available ? 'Available' : 'Sold Out'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <SettingsModal onClose={() => setActiveTab('tables')} />
        )}
      </main>

      {/* Floating Takeaway Button */}
      <button
        onClick={() => {
          setSelectedTableForOrder(null);
          setShowOrderPOS(true);
        }}
        style={{
          position: 'fixed',
          bottom: '84px',
          right: '16px',
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary), #818cf8)',
          border: 'none',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 6px 20px var(--primary-glow)',
          cursor: 'pointer',
          zIndex: 45,
        }}
      >
        <PlusCircle size={26} />
      </button>

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        <button
          className={`nav-item ${activeTab === 'tables' ? 'active' : ''}`}
          onClick={() => setActiveTab('tables')}
        >
          <LayoutGrid size={20} />
          <span>Tables</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
          style={{ position: 'relative' }}
        >
          <ClipboardList size={20} />
          <span>Orders</span>
          {openOrders.length > 0 && <span className="nav-badge">{openOrders.length}</span>}
        </button>

        <button
          className={`nav-item ${activeTab === 'menu' ? 'active' : ''}`}
          onClick={() => setActiveTab('menu')}
        >
          <BookOpen size={20} />
          <span>Menu</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings size={20} />
          <span>Settings</span>
        </button>
      </nav>

      {/* Modals */}
      {showOrderPOS && (
        <OrderPOSModal
          table={selectedTableForOrder}
          menuItems={menuItems}
          onClose={() => {
            setShowOrderPOS(false);
            setSelectedTableForOrder(null);
          }}
          onSubmitOrder={handleCreateOrder}
        />
      )}

      {activeOrderView && (
        <ActiveOrderDetails
          order={activeOrderView.order}
          table={activeOrderView.table}
          menuItems={menuItems}
          onClose={() => setActiveOrderView(null)}
          onOrderUpdated={() => {
            fetchInitialData();
            setActiveOrderView(null);
          }}
          onRequestInvoice={(order) => {
            setActiveOrderView(null);
            setInvoiceOrderView(order);
          }}
        />
      )}

      {invoiceOrderView && (
        <InvoiceModal
          order={invoiceOrderView}
          onClose={() => setInvoiceOrderView(null)}
          onPaymentComplete={() => {
            fetchInitialData();
            setInvoiceOrderView(null);
          }}
        />
      )}

      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
};
