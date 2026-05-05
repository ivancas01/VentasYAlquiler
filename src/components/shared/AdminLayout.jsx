import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  History, 
  BarChart3, 
  Users, 
  LogOut, 
  Shield, 
  ChevronRight,
  Settings,
  Landmark,
  Bell,
  Globe,
  Wallet
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useSite } from '../../context/SiteContext'

const AdminLayout = ({ children }) => {
  const { config } = useSite()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, hasPermission } = useAuth()

  const [notifCount, setNotifCount] = React.useState(0)

  React.useEffect(() => {
    fetchNotifCount()
  }, [])

  const fetchNotifCount = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/notifications/', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = Array.isArray(res.data) ? res.data : (res.data.results || [])
      const unread = data.filter(n => !n.is_read).length
      setNotifCount(unread)
    } catch (err) {}
  }

  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={20} /> },
    { name: 'POS / Ventas', path: '/admin/pos', icon: <ShoppingCart size={20} />, permission: 'add_sale' },
    { name: 'Caja', path: '/admin/cash', icon: <Wallet size={20} />, permission: 'view_movement' },
    { name: 'Inventario', path: '/admin/inventory', icon: <Package size={20} />, permission: 'view_product' },
    { name: 'Historial', path: '/admin/transactions', icon: <History size={20} />, permission: 'view_sale' },
    { name: 'Clientes', path: '/admin/customers', icon: <Users size={20} />, permission: 'view_customer' },
    { name: 'Movimientos', path: '/admin/movements', icon: <Landmark size={20} />, permission: 'view_movement' },
    { name: 'Sitio Web', path: '/admin/cms', icon: <Globe size={20} />, permission: 'change_siteconfig' },
    { name: 'Reportes', path: '/admin/reports', icon: <BarChart3 size={20} />, permission: 'view_sale' },
    { name: 'Personal', path: '/admin/staff', icon: <Users size={20} />, permission: 'view_user' },
  ].filter(item => {
    if (item.role === 'admin') return user?.is_superuser || user?.role === 'admin'
    if (item.permission) return hasPermission(item.permission)
    return true
  })

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Sidebar */}
      <aside style={{
        width: '280px',
        background: 'var(--primary)',
        borderRight: '1px solid var(--glass-border)',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        padding: '40px 20px',
        zIndex: 1000
      }}>
        {/* Logo Section */}
        <div style={{ marginBottom: '50px', padding: '0 10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span className="urban-font" style={{ fontSize: '1rem', color: 'white' }}>Admin Hub</span>
            <Link to="/admin/notifications" className={notifCount > 0 ? 'bell-animation' : ''} style={{ 
              position: 'relative', 
              color: notifCount > 0 ? '#fbbf24' : 'var(--text-dim)', 
              transition: 'all 0.3s',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Bell size={20} />
              {notifCount > 0 && (
                <span className="pulse-badge" style={{ 
                  position: 'absolute', 
                  top: '-8px', 
                  right: '-8px', 
                  background: '#ef4444', 
                  color: 'white', 
                  fontSize: '0.65rem', 
                  width: '18px', 
                  height: '18px', 
                  borderRadius: '50% !important', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontWeight: '800',
                  border: '2px solid var(--primary)',
                  boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)'
                }}>
                  {notifCount}
                </span>
              )}
            </Link>
          </div>
          <div style={{ fontSize: '0.65rem', color: 'white', letterSpacing: '2px', fontWeight: 'bold' }}>
            {config?.company_name_white || 'URBAN'} <span style={{ color: 'var(--cta)' }}>{config?.company_name_gold || 'LUXURY'}</span>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, overflowY: 'auto', paddingRight: '5px' }}>
          <ul style={{ listStyle: 'none' }}>
            <li style={{ marginBottom: '20px' }}>
              <Link 
                to="/" 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 18px',
                  color: 'var(--cta)',
                  background: 'rgba(37, 99, 235, 0.1)',
                  fontWeight: 'bold',
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}
              >
                <Globe size={18} />
                <span>Ver Sitio Público</span>
              </Link>
            </li>
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <li key={item.path} style={{ marginBottom: '8px' }}>
                  <Link 
                    to={item.path} 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 18px',
                      color: isActive ? 'white' : 'var(--text-dim)',
                      background: isActive ? 'var(--accent-gradient)' : 'transparent',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      fontWeight: isActive ? 'bold' : 'normal',
                      fontSize: '0.9rem',
                      borderRadius: '0px',
                      marginBottom: '4px'
                    }}
                    onMouseOver={(e) => !isActive && (e.currentTarget.style.color = 'white')}
                    onMouseOut={(e) => !isActive && (e.currentTarget.style.color = 'var(--text-dim)')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {item.icon}
                      <span>{item.name}</span>
                    </div>
                    {isActive && <ChevronRight size={16} />}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer Sidebar */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
          {/* User Profile Info */}
          <div style={{ 
            padding: '15px 18px', 
            background: 'rgba(255,255,255,0.03)', 
            marginBottom: '15px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '15px',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              background: 'var(--accent-gradient)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontWeight: 'bold',
              color: 'white',
              fontSize: '1.2rem'
            }}>
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.username || 'Usuario'}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--cta)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {user?.role === 'admin' ? 'Administrador' : 'Staff'}
              </div>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 18px',
              width: '100%',
              background: 'transparent',
              border: 'none',
              color: '#ef4444',
              cursor: 'pointer',
              fontSize: '0.9rem',
              transition: 'all 0.3s',
              borderRadius: '0px'
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <LogOut size={20} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ 
        flex: 1, 
        marginLeft: '280px', 
        padding: '60px',
        minHeight: '100vh',
        background: 'radial-gradient(circle at top right, var(--secondary) 0%, var(--bg) 100%)',
        overflowX: 'hidden'
      }}>
        {children}
      </main>
    </div>
  )
}

export default AdminLayout
