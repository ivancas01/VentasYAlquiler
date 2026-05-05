import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Lock, User, X, ShieldAlert } from 'lucide-react'

const LoginModal = ({ isOpen, onClose }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const success = await login(username, password)
    if (success) {
      onClose()
      navigate('/admin')
    } else {
      setError("Credenciales incorrectas. Verifica tu usuario y contraseña.")
    }
    setLoading(false)
  }

  return createPortal(
    <div 
      onClick={onClose}
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        background: 'rgba(0,0,0,0.95)', 
        backdropFilter: 'blur(20px)',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        zIndex: 9999999,
        padding: '20px'
      }}
    >
      <div 
        className="glass-card fade-in" 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          width: '100%', 
          maxWidth: '450px', 
          padding: '50px', 
          position: 'relative',
          border: '1px solid var(--cta)',
          boxShadow: '0 0 50px rgba(37, 99, 235, 0.2)'
        }}
      >
        <button 
          onClick={onClose} 
          style={{ 
            position: 'absolute', 
            top: '25px', 
            right: '25px', 
            background: 'transparent', 
            border: 'none', 
            color: 'white', 
            cursor: 'pointer',
            opacity: 0.5
          }}
        >
          <X size={24} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ 
            width: '60px', 
            height: '60px', 
            background: 'var(--accent-gradient)', 
            margin: '0 auto 20px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center'
          }}>
            <Lock size={30} color="white" />
          </div>
          <h2 className="urban-font gold-text" style={{ fontSize: '1.5rem' }}>ACCESO STAFF</h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', marginTop: '10px', textTransform: 'uppercase', letterSpacing: '2px' }}>Urban Luxury Management</p>
        </div>
        
        {error && (
          <div className="fade-in" style={{ 
            padding: '15px', 
            background: 'rgba(239, 68, 68, 0.1)', 
            color: '#ef4444', 
            fontSize: '0.8rem', 
            marginBottom: '25px', 
            textAlign: 'center', 
            border: '1px solid rgba(239, 68, 68, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            justifyContent: 'center'
          }}>
            <ShieldAlert size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>Usuario</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--cta)' }} />
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{ width: '100%', paddingLeft: '45px' }}
                placeholder="Nombre de usuario"
              />
            </div>
          </div>

          <div style={{ marginBottom: '40px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--cta)' }} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: '100%', paddingLeft: '45px' }}
                placeholder="••••••••"
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', height: '55px' }}>
            {loading ? 'AUTENTICANDO...' : 'INICIAR SESIÓN'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '30px', color: 'var(--text-dim)', fontSize: '0.7rem' }}>
          Solo personal autorizado. <br/> El acceso no autorizado es monitoreado.
        </p>
      </div>
    </div>,
    document.body
  )
}

export default LoginModal
