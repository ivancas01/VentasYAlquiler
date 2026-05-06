import React from 'react'
import { createPortal } from 'react-dom'
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react'

const FeedbackModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  type = 'info', // 'success', 'error', 'warning', 'info'
  title, 
  message, 
  showCancel = false,
  confirmText = 'ACEPTAR',
  cancelText = 'CANCELAR'
}) => {
  if (!isOpen) return null

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle size={50} color="#10b981" />
      case 'error': return <XCircle size={50} color="#ef4444" />
      case 'warning': return <AlertCircle size={50} color="#f59e0b" />
      default: return <Info size={50} color="var(--cta)" />
    }
  }

  return createPortal(
    <div style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(15px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999999,
      padding: '20px'
    }}>
      <div className="glass-card fade-in" style={{ 
        width: '100%', maxWidth: '420px', padding: '40px', 
        textAlign: 'center', position: 'relative', border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ marginBottom: '25px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ 
            background: 'rgba(255,255,255,0.03)', 
            padding: '20px', 
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            {getIcon()}
          </div>
        </div>
        
        <h3 className="urban-font gold-text" style={{ fontSize: '1.4rem', marginBottom: '15px', letterSpacing: '1px' }}>
          {title.toUpperCase()}
        </h3>
        
        <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '35px' }}>
          {message}
        </p>
        
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
          {showCancel && (
            <button onClick={onClose} className="btn-outline" style={{ flex: 1, padding: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
              {cancelText}
            </button>
          )}
          <button 
            onClick={() => {
              if (onConfirm) onConfirm()
              onClose()
            }} 
            className="btn-primary" 
            style={{ flex: 1, padding: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default FeedbackModal
