import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingBag, Info, Phone, LayoutDashboard, User, LogOut, Bell, Shield } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import axios from 'axios'

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [showNotifs, setShowNotifs] = useState(false)
  const [config, setConfig] = useState(null)

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/config/')
      .then(res => setConfig(res.data))
      .catch(err => console.error(err))
    
    if (user) {
      fetchNotifications()
      const interval = setInterval(fetchNotifications, 60000)
      return () => clearInterval(interval)
    }
  }, [user])

  const fetchNotifications = async () => {
    const token = localStorage.getItem('token')
    try {
      await axios.post('http://127.0.0.1:8000/api/notifications/refresh/', {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const res = await axios.get('http://127.0.0.1:8000/api/notifications/', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setNotifications(res.data.filter(n => !n.is_read))
    } catch (err) {
      if (err.response?.status === 401) {
        console.warn("Sesión expirada")
      }
    }
  }

  const markAsRead = async (id) => {
    const token = localStorage.getItem('token')
    try {
      await axios.patch(`http://127.0.0.1:8000/api/notifications/${id}/`, { is_read: true }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setNotifications(notifications.filter(n => n.id !== id))
    } catch (err) {}
  }

  return (
    <nav style={{
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      zIndex: 10000,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '20px 50px',
      background: 'rgba(5, 5, 5, 0.9)',
      borderBottom: '1px solid var(--glass-border)',
      backdropFilter: 'blur(10px)'
    }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
        <span className="urban-font" style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }}>
          {config?.company_name_white || 'URBAN'} <span className="gold-text">{config?.company_name_gold || 'LUXURY'}</span>
        </span>
      </Link>
      
      <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
        <Link to="/catalog" className="nav-link" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Catálogo</Link>
        <Link to="/#nosotros" className="nav-link" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Nosotros</Link>
        <Link to="/#contacto" className="nav-link" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Contacto</Link>
        
        <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)' }}></div>

        {user ? (
          <>
            <div style={{ position: 'relative' }}>
              <Bell 
                size={20} 
                style={{ cursor: 'pointer', color: notifications.length > 0 ? 'var(--cta)' : 'white' }} 
                onClick={() => setShowNotifs(!showNotifs)} 
              />
              {notifications.length > 0 && (
                <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--cta)', color: 'black', borderRadius: '50%', width: '15px', height: '15px', fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {notifications.length}
                </span>
              )}

              {showNotifs && (
                <div className="glass-card" style={{ position: 'absolute', top: '40px', right: '0', width: '320px', maxHeight: '400px', overflowY: 'auto', padding: '20px', background: 'var(--secondary)', zIndex: 11000, borderColor: 'var(--cta)' }}>
                  <h4 className="urban-font" style={{ fontSize: '0.8rem', marginBottom: '20px', color: 'var(--cta)' }}>Notificaciones</h4>
                  {notifications.length === 0 ? (
                    <p style={{ fontSize: '0.8rem', color: '#999', textAlign: 'center' }}>Sin avisos</p>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} style={{ padding: '12px', marginBottom: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', borderLeft: `3px solid ${n.notification_type === 'alert' ? '#ef4444' : 'var(--cta)'}` }}>
                        <p style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{n.title}</p>
                        <p style={{ fontSize: '0.7rem', color: '#ccc', margin: '5px 0' }}>{n.message}</p>
                        <button onClick={() => markAsRead(n.id)} style={{ fontSize: '0.65rem', color: 'var(--cta)', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 'bold', textTransform: 'uppercase' }}>Leído</button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <Link to="/admin" className="btn-outline" style={{ padding: '8px 15px', fontSize: '0.7rem' }}>Admin</Link>
            <button onClick={() => { logout(); navigate('/'); }} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'white' }}>
              <LogOut size={18} />
            </button>
          </>
        ) : (
          <Link to="/login" className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.75rem' }}>Acceder</Link>
        )}
      </div>
    </nav>
  )
}

export default Navbar
