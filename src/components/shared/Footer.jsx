import React, { useState, useEffect } from 'react'
import api from '../../api/axios'
import { Link } from 'react-router-dom'
import { Mail, Phone, MapPin, ExternalLink, MessageCircle } from 'lucide-react'

const Footer = () => {
  const [config, setConfig] = useState(null)

  useEffect(() => {
    api.get('/config/')
      .then(res => {
        const data = Array.isArray(res.data) ? res.data[0] : res.data
        if (data) setConfig(data)
      })
      .catch(err => console.error(err))
  }, [])

  return (
    <footer style={{
      background: 'var(--primary)',
      color: 'white',
      padding: '80px 20px 40px'
    }} className="main-footer">
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '40px'
      }} className="footer-grid">
        <div style={{ flex: 1, minWidth: '300px' }} className="footer-info">
          <h2 className="urban-font" style={{ fontSize: '1.5rem', color: 'white', marginBottom: '20px' }}>
            {config?.company_name_white || 'URBAN'} <span className="gold-text">{config?.company_name_gold || 'LUXURY'}</span>
          </h2>
          <p style={{ color: '#a8a29e', lineHeight: '1.6', marginBottom: '20px' }}>
            {config?.footer_text || 'La plataforma líder en gestión de activos, brindando soluciones eficientes para ventas y alquileres industriales y comerciales.'}
          </p>
          <div style={{ display: 'flex', gap: '15px' }}>
            {config?.facebook_url && <a href={config.facebook_url} target="_blank" rel="noreferrer" style={{ color: 'var(--cta)' }}><ExternalLink size={20} /></a>}
            {config?.instagram_url && <a href={config.instagram_url} target="_blank" rel="noreferrer" style={{ color: 'var(--cta)' }}><ExternalLink size={20} /></a>}
            {config?.whatsapp_url && <a href={config.whatsapp_url} target="_blank" rel="noreferrer" style={{ color: 'var(--cta)' }}><MessageCircle size={20} /></a>}
          </div>
        </div>

        <div className="footer-links">
          <h3 style={{ marginBottom: '20px' }}>{config?.footer_links_title || 'Enlaces Rápidos'}</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ marginBottom: '10px' }}><Link to="/" style={{ color: '#a8a29e' }}>Inicio</Link></li>
            <li style={{ marginBottom: '10px' }}><Link to="/catalog" style={{ color: '#a8a29e' }}>Catálogo</Link></li>
            <li style={{ marginBottom: '10px' }}><Link to="/#nosotros" style={{ color: '#a8a29e' }}>Nosotros</Link></li>
            <li style={{ marginBottom: '10px' }}><Link to="/#contacto" style={{ color: '#a8a29e' }}>Contacto</Link></li>
          </ul>
        </div>

        <div className="footer-contact">
          <h3 style={{ marginBottom: '20px' }}>{config?.footer_contact_title || 'Contacto'}</h3>
          <ul style={{ listStyle: 'none', padding: 0, color: '#a8a29e' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <MapPin size={18} /> {config?.contact_address || 'Avenida Lujo #45-12, Ciudad'}
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <Phone size={18} /> {config?.contact_phone || '+57 300 000 0000'}
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <Mail size={18} /> {config?.contact_email || 'info@urbanluxury.com'}
            </li>
          </ul>
        </div>
      </div>

      <div style={{
        maxWidth: '1200px',
        margin: '60px auto 0',
        paddingTop: '20px',
        borderTop: '1px solid #44403c',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: '#78716c'
      }}>
        © {new Date().getFullYear()} {config?.company_name || 'Urban Luxury'}. Todos los derechos reservados.
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .main-footer { padding: 60px 20px 40px !important; text-align: center; }
          .footer-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          .footer-info { min-width: 100% !important; }
          .footer-info div { justify-content: center; }
          .footer-contact ul li { justify-content: center; }
        }
      `}</style>
    </footer>
  )
}

export default Footer
