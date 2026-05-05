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
  const { logout } = useAuth()

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
      const unread = res.data.filter(n => !n.is_read).length
      setNotifCount(unread)
    } catch (err) {}
  }

  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={20} /> },
    { name: 'POS / Ventas', path: '/admin/pos', icon: <ShoppingCart size={20} /> },
    { name: 'Caja', path: '/admin/cash', icon: <Wallet size={20} /> },
    { name: 'Inventario', path: '/admin/inventory', icon: <Package size={20} /> },
    { name: 'Historial', path: '/admin/transactions', icon: <History size={20} /> },
    { name: 'Clientes', path: '/admin/customers', icon: <Users size={20} /> },
    { name: 'Movimientos', path: '/admin/movements', icon: <Landmark size={20} /> },
    { name: 'Sitio Web', path: '/admin/cms', icon: <Globe size={20} /> },
    { name: 'Reportes', path: '/admin/reports', icon: <BarChart3 size={20} /> },
    { name: 'Personal', path: '/admin/staff', icon: <Users size={20} /> },
  ]

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
            <Link to="/admin/notifications" style={{ 
              position: 'relative', 
              color: 'var(--text-dim)', 
              transition: 'all 0.3s',
              display: 'flex',
              alignItems: 'center'
            }} onMouseOver={e => e.currentTarget.style.color = 'var(--cta)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-dim)'}>
              <Bell size={20} />
              {notifCount > 0 && (
                <span style={{ 
                  position: 'absolute', 
                  top: '-8px', 
                  right: '-8px', 
                  background: '#ef4444', 
                  color: 'white', 
                  fontSize: '0.6rem', 
                  width: '16px', 
                  height: '16px', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)'
                }}>{notifCount}</span>
              )}
            </Link>
          </div>
          <div style={{ fontSize: '0.65rem', color: 'white', letterSpacing: '2px', fontWeight: 'bold' }}>
            {config?.company_name_white || 'URBAN'} <span style={{ color: 'var(--cta)' }}>{config?.company_name_gold || 'LUXURY'}</span>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1 }}>
          <ul style={{ listStyle: 'none' }}>
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
                      padding: '12px 15px',
                      borderRadius: '8px',
                      color: isActive ? 'black' : 'var(--text-dim)',
                      background: isActive ? 'var(--accent-gradient)' : 'transparent',
                      transition: 'all 0.3s ease',
                      fontWeight: isActive ? 'bold' : 'normal',
                      fontSize: '0.9rem'
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
          <button 
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 15px',
              width: '100%',
              background: 'transparent',
              border: 'none',
              color: '#ef4444',
              cursor: 'pointer',
              fontSize: '0.9rem',
              transition: 'all 0.3s'
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
        padding: '40px 60px',
        minHeight: '100vh',
        background: 'radial-gradient(circle at top right, #121212 0%, #050505 100%)'
      }}>
        {children}
      </main>
    </div>
  )
}

export default AdminLayout
