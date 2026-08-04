import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const adminLinks = [
  { to: '/admin', end: true, num: '01', label: 'Dashboard' },
  { to: '/admin/menu', num: '02', label: 'Menu Items' },
  { to: '/admin/tables', num: '03', label: 'Tables' },
  { to: '/admin/waiters', num: '04', label: 'Waiters' },
  { to: '/admin/orders', num: '05', label: 'Orders' },
  { to: '/admin/reports', num: '06', label: 'Reports' },
]

const waiterLinks = [
  { to: '/waiter', end: true, num: '01', label: 'Floor' },
  { to: '/waiter/orders', num: '02', label: 'Orders' },
]

export function AdminLayout() {
  const { user, logout } = useAuth()
  const links = user?.role === 'waiter' ? waiterLinks : adminLinks
  const subtitle = user?.role === 'waiter' ? 'Waiter App' : 'Restaurant Admin'

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">Chit</div>
          <div className="brand-sub">{subtitle}</div>
        </div>
        <nav>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => `nav-btn${isActive ? ' active' : ''}`}
            >
              <span className="nav-num">{link.num}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div style={{ marginTop: 'auto', padding: '16px 20px 0' }}>
          <div style={{ fontSize: 12, color: 'var(--paper-dim)', marginBottom: 8 }}>{user?.name}</div>
          <button type="button" className="btn ghost small" onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
