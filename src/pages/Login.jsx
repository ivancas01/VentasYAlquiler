import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Lock, User } from 'lucide-react'

const Login = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const success = await login(username, password)
    if (success) {
      navigate('/admin')
    } else {
      setError("Credenciales incorrectas. Intenta de nuevo.")
    }
    setLoading(false)
  }

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)'
    }}>
      <form onSubmit={handleSubmit} className="glass-card" style={{ padding: '40px', width: '100%', maxWidth: '400px', border: error ? '1px solid #ef4444' : '1px solid var(--glass-border)' }}>
        <h2 className="urban-font" style={{ textAlign: 'center', marginBottom: '30px', color: 'white' }}>Acceso Administrativo</h2>
        
        {error && (
          <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '0.85rem', marginBottom: '20px', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Usuario</label>
          <div style={{ position: 'relative' }}>
            <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary)' }} />
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 12px 12px 40px',
                border: '1px solid var(--glass-border)',
                background: 'rgba(255,255,255,0.05)',
                color: 'white',
                outline: 'none',
                opacity: loading ? 0.6 : 1
              }}
              placeholder="admin"
            />
          </div>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Contraseña</label>
          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary)' }} />
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 12px 12px 40px',
                border: '1px solid var(--glass-border)',
                background: 'rgba(255,255,255,0.05)',
                color: 'white',
                outline: 'none',
                opacity: loading ? 0.6 : 1
              }}
              placeholder="••••••••"
            />
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Entrando...' : 'Entrar al Sistema'}
        </button>
      </form>
    </div>
  )
}

export default Login
