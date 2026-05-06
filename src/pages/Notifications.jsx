import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Bell, Calendar, Clock, CheckCircle, Trash2, RefreshCw, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'

const Notifications = () => {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    setLoading(true)
    const token = localStorage.getItem('token')
    try {
      // First refresh notifications on backend
      await axios.post('http://192.168.1.17:8000/api/notifications/refresh/', {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      // Mark all as read so the sidebar icon clears
      await axios.post('http://192.168.1.17:8000/api/notifications/read_all/', {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      // Then fetch them
      const res = await axios.get('http://192.168.1.17:8000/api/notifications/', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = Array.isArray(res.data) ? res.data : (res.data.results || [])
      setNotifications(data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)))
    } catch (err) {
      console.error("Error fetching notifications", err)
    }
    setLoading(false)
  }

  const markAsRead = async (id) => {
    const token = localStorage.getItem('token')
    try {
      await axios.patch(`http://192.168.1.17:8000/api/notifications/${id}/`, { is_read: true }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n))
    } catch (err) {}
  }

  const deleteNotification = async (id) => {
    const token = localStorage.getItem('token')
    try {
      await axios.delete(`http://192.168.1.17:8000/api/notifications/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setNotifications(notifications.filter(n => n.id !== id))
    } catch (err) {}
  }

  return (
    <div className="fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="notifications-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', gap: '20px' }}>
        <h2 className="urban-font gold-text notifications-title" style={{ fontSize: '2.2rem', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Bell size={35} /> Centro de Alertas
        </h2>
        <button onClick={fetchNotifications} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <RefreshCw size={18} className={loading ? 'spin' : ''} /> ACTUALIZAR
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px', color: 'var(--cta)' }}>SINCRONIZANDO ALERTAS...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {notifications.map(n => (
            <div 
              key={n.id} 
              className="glass-card notification-item" 
              style={{ 
                padding: '25px', 
                borderLeft: `5px solid ${n.notification_type === 'alert' ? '#ef4444' : 'var(--cta)'}`,
                opacity: n.is_read ? 0.6 : 1,
                transition: 'all 0.3s ease',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '20px',
                background: n.is_read ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
                  <span style={{ 
                    fontSize: '0.65rem', 
                    padding: '4px 10px', 
                    borderRadius: '20px', 
                    background: n.notification_type === 'alert' ? '#ef4444' : 'var(--cta)', 
                    color: 'white',
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }}>
                    {n.notification_type}
                  </span>
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Clock size={14} /> {new Date(n.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="notif-title" style={{ fontSize: '1.2rem', color: 'white', marginBottom: '5px' }}>{n.title}</h4>
                <p className="notif-message" style={{ color: 'var(--text-dim)', fontSize: '0.95rem' }}>{n.message}</p>
              </div>
              
              <div style={{ display: 'flex', gap: '15px' }}>
                {n.related_rental && (
                  <Link 
                    to={`/admin/transactions?id=${n.related_rental}`}
                    style={{ border: 'none', background: 'transparent', color: 'var(--cta)', cursor: 'pointer', padding: '10px', display: 'flex', alignItems: 'center' }}
                    title="Ver Alquiler"
                  >
                    <ExternalLink size={22} />
                  </Link>
                )}
                {!n.is_read && (
                  <button 
                    onClick={() => markAsRead(n.id)} 
                    style={{ border: 'none', background: 'transparent', color: '#10b981', cursor: 'pointer', padding: '10px' }}
                    title="Marcar como leída"
                  >
                    <CheckCircle size={22} />
                  </button>
                )}
                <button 
                  onClick={() => deleteNotification(n.id)} 
                  style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', padding: '10px' }}
                  title="Eliminar"
                >
                  <Trash2 size={22} />
                </button>
              </div>
            </div>
          ))}

          {notifications.length === 0 && (
            <div className="glass-card" style={{ padding: '80px', textAlign: 'center', color: 'var(--text-dim)' }}>
              <CheckCircle size={50} style={{ marginBottom: '20px', opacity: 0.2 }} />
              <p>No tienes alertas pendientes en este momento.</p>
            </div>
          )}
        </div>
      )}
      <style>{`
        @media (max-width: 768px) {
          .notifications-header {
            flex-direction: column;
            text-align: center;
            gap: 15px !important;
            margin-bottom: 25px !important;
          }
          .notifications-title {
            font-size: 1.4rem !important;
            justify-content: center;
            gap: 10px !important;
          }
          .notifications-title svg {
            width: 25px !important;
            height: 25px !important;
          }
          .notification-item {
            flex-direction: column;
            align-items: flex-start !important;
            gap: 20px;
            padding: 15px !important;
          }
          .notif-title {
            font-size: 0.95rem !important;
          }
          .notif-message {
            font-size: 0.8rem !important;
          }
          .notification-item > div:last-child {
            width: 100%;
            justify-content: flex-end;
            border-top: 1px solid rgba(255,255,255,0.05);
            padding-top: 15px;
          }
        }
      `}</style>
    </div>
  )
}

export default Notifications
