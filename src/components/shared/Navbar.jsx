import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingBag, Info, Phone, LayoutDashboard, User, LogOut, Bell, Shield, Menu, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import LoginModal from './LoginModal'

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [showNotifs, setShowNotifs] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [config, setConfig] = useState(null)

  useEffect(() => {
    api.get('/config/')
      .then(res => {
        const data = Array.isArray(res.data) ? res.data[0] : res.data
        if (data) setConfig(data)
      })
    
    if (user) {
      fetchNotifications()
      const interval = setInterval(fetchNotifications, 60000)
      return () => clearInterval(interval)
    }
  }, [user])

  const [activeSection, setActiveSection] = useState('inicio')

  const fetchNotifications = async () => {
    try {
      await api.post('/notifications/refresh/', {})
      const res = await api.get('/notifications/')
      setNotifications(res.data.filter(n => !n.is_read))
    } catch (err) {
      if (err.response?.status === 401) {
        console.warn("Sesión expirada")
      }
    }
  }

  useEffect(() => {
    const handleScroll = () => {
      if (window.location.pathname !== '/') return
      
      const sections = ['inicio', 'nosotros', 'contacto']
      const scrollPos = window.scrollY + 200

      for (const section of sections) {
        const element = document.getElementById(section)
        if (element) {
          const { offsetTop, offsetHeight } = element
          if (scrollPos >= offsetTop && scrollPos < offsetTop + offsetHeight) {
            setActiveSection(section)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Check initial position
    return () => window.removeEventListener('scroll', handleScroll)
  }, [window.location.pathname])

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/`, { is_read: true })
      setNotifications(notifications.filter(n => n.id !== id))
    } catch (err) {}
  }

  const [isMenuOpen, setIsMenuOpen] = useState(false)

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
      background: 'var(--bg)',
      borderBottom: '1px solid var(--glass-border)',
      backdropFilter: 'blur(10px)',
      boxSizing: 'border-box'
    }} className="navbar">
      <Link to="/" style={{ display: 'flex', alignItems: 'center' }} onClick={() => setIsMenuOpen(false)}>
        <span className="urban-font logo-text" style={{ fontSize: 'clamp(1rem, 5vw, 1.2rem)', fontWeight: 'bold', color: 'white', letterSpacing: '2px' }}>
          {config?.company_name_white || 'URBAN'} <span className="gold-text">{config?.company_name_gold || 'LUXURY'}</span>
        </span>
      </Link>
      
      {/* Desktop Menu */}
      <div className="desktop-menu" style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
        {/* Anchor Links Group (Smooth scroll section) */}
        <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
          <Link to="/#inicio" className="nav-link" style={{ 
            fontSize: '0.75rem', 
            textTransform: 'uppercase', 
            letterSpacing: '1px',
            color: (window.location.pathname === '/' && activeSection === 'inicio') ? 'var(--cta)' : 'white',
            borderBottom: (window.location.pathname === '/' && activeSection === 'inicio') ? '2px solid var(--cta)' : '2px solid transparent',
            paddingBottom: '5px',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            fontWeight: (window.location.pathname === '/' && activeSection === 'inicio') ? 'bold' : 'normal'
          }}>Inicio</Link>
          <Link to="/#nosotros" className="nav-link" style={{ 
            fontSize: '0.75rem', 
            textTransform: 'uppercase', 
            letterSpacing: '1px',
            color: (window.location.pathname === '/' && activeSection === 'nosotros') ? 'var(--cta)' : 'white',
            borderBottom: (window.location.pathname === '/' && activeSection === 'nosotros') ? '2px solid var(--cta)' : '2px solid transparent',
            paddingBottom: '5px',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            fontWeight: (window.location.pathname === '/' && activeSection === 'nosotros') ? 'bold' : 'normal'
          }}>Nosotros</Link>
          <Link to="/#contacto" className="nav-link" style={{ 
            fontSize: '0.75rem', 
            textTransform: 'uppercase', 
            letterSpacing: '1px',
            color: (window.location.pathname === '/' && activeSection === 'contacto') ? 'var(--cta)' : 'white',
            borderBottom: (window.location.pathname === '/' && activeSection === 'contacto') ? '2px solid var(--cta)' : '2px solid transparent',
            paddingBottom: '5px',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            fontWeight: (window.location.pathname === '/' && activeSection === 'contacto') ? 'bold' : 'normal'
          }}>Contacto</Link>
        </div>

        {/* Visual Separator */}
        <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)', margin: '0 10px' }}></div>

        {/* Global Navigation */}
        <Link to="/catalog" className="nav-link" style={{ 
          fontSize: '0.75rem', 
          textTransform: 'uppercase', 
          letterSpacing: '1px',
          color: window.location.pathname === '/catalog' ? 'var(--cta)' : 'white',
          borderBottom: window.location.pathname === '/catalog' ? '2px solid var(--cta)' : '2px solid transparent',
          paddingBottom: '5px',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          fontWeight: window.location.pathname === '/catalog' ? 'bold' : 'normal'
        }}>Catálogo</Link>
        
        {!user ? (
          <button 
            onClick={() => setShowLoginModal(true)} 
            className="btn-primary" 
            style={{ padding: '8px 25px', fontSize: '0.7rem', height: '40px' }}
          >
            ACCEDER
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowNotifs(!showNotifs)}
                className={notifications.length > 0 ? 'bell-animation' : ''} 
                style={{ background: 'transparent', border: 'none', color: notifications.length > 0 ? '#fbbf24' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <Bell size={20} />
                {notifications.length > 0 && (
                  <span className="pulse-badge" style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', color: 'white', fontSize: '0.6rem', width: '15px', height: '15px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    {notifications.length}
                  </span>
                )}
              </button>

              {showNotifs && (
                <div className="glass-card" style={{ position: 'absolute', top: '40px', right: '0', width: '320px', maxHeight: '400px', overflowY: 'auto', padding: '20px', background: 'var(--secondary)', zIndex: 11000, borderColor: 'var(--cta)' }}>
                  <h4 className="urban-font" style={{ fontSize: '0.8rem', marginBottom: '20px', color: 'var(--cta)' }}>Notificaciones</h4>
                  {notifications.length === 0 ? (
                    <p style={{ fontSize: '0.8rem', color: '#999', textAlign: 'center' }}>Sin avisos</p>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} style={{ padding: '12px', marginBottom: '12px', background: 'rgba(255,255,255,0.05)', borderLeft: `3px solid ${n.notification_type === 'alert' ? '#ef4444' : 'var(--cta)'}` }}>
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
          </div>
        )}
      </div>

      {/* Mobile Hamburger Toggle */}
      <button 
        className="mobile-toggle"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'none' }}
      >
        {isMenuOpen ? <X size={30} /> : <Menu size={30} />}
      </button>

      {/* Mobile Menu Drawer */}
      <div className={`mobile-drawer ${isMenuOpen ? 'open' : ''}`} style={{
        position: 'fixed',
        top: '0',
        right: isMenuOpen ? '0' : '-100%',
        width: '100%',
        height: '100vh',
        background: 'var(--bg)',
        zIndex: 10001,
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '30px',
        padding: '40px'
      }}>
        <button 
          onClick={() => setIsMenuOpen(false)}
          style={{ position: 'absolute', top: '30px', right: '30px', background: 'transparent', border: 'none', color: 'var(--cta)' }}
        >
          <X size={35} />
        </button>

        <Link to="/#inicio" onClick={() => setIsMenuOpen(false)} className="mobile-nav-link">Inicio</Link>
        <Link to="/#nosotros" onClick={() => setIsMenuOpen(false)} className="mobile-nav-link">Nosotros</Link>
        <Link to="/#contacto" onClick={() => setIsMenuOpen(false)} className="mobile-nav-link">Contacto</Link>
        <Link to="/catalog" onClick={() => setIsMenuOpen(false)} className="mobile-nav-link">Catálogo</Link>
        
        <div style={{ width: '50px', height: '1px', background: 'var(--cta)' }}></div>

        {!user ? (
          <button 
            onClick={() => { setShowLoginModal(true); setIsMenuOpen(false); }} 
            className="btn-primary" 
            style={{ width: '100%', maxWidth: '300px', padding: '20px' }}
          >
            ACCEDER
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '300px' }}>
            <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="btn-outline" style={{ textAlign: 'center', padding: '15px' }}>PANEL ADMIN</Link>
            <button 
              onClick={() => { logout(); navigate('/'); setIsMenuOpen(false); }} 
              className="btn-primary" 
              style={{ padding: '15px', background: '#ef4444' }}
            >
              CERRAR SESIÓN
            </button>
          </div>
        )}
      </div>

      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />

      <style>{`
        @media (max-width: 1024px) {
          .navbar {
            padding: 12px 15px !important;
          }
          .desktop-menu {
            display: none !important;
          }
          .mobile-toggle {
            display: block !important;
          }
          .navbar .urban-font {
            font-size: clamp(0.9rem, 5vw, 1.1rem) !important;
          }
        }
        .mobile-nav-link {
          font-family: var(--urban-font);
          font-size: clamp(1.5rem, 8vw, 2.5rem);
          color: white;
          text-transform: uppercase;
          text-decoration: none;
          letter-spacing: 4px;
          text-align: center;
        }
        .mobile-nav-link:hover {
          color: var(--cta);
        }
        .mobile-drawer.open {
          right: 0 !important;
        }
      `}</style>
    </nav>
  )
}

export default Navbar
