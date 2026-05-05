import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { 
  Globe, Layout, Info, Phone, Share2, 
  Save, RefreshCw, ExternalLink, Palette
} from 'lucide-react'

import { useSite } from '../context/SiteContext'

const CMS = () => {
  const { config: globalConfig, updateConfig } = useSite()
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (globalConfig) {
      setConfig(globalConfig)
    }
  }, [globalConfig])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!config || !config.id) return
    
    setLoading(true)
    const token = localStorage.getItem('token')
    try {
      const res = await axios.patch(`http://127.0.0.1:8000/api/config/${config.id}/`, config, {
        headers: { Authorization: `Bearer ${token}` }
      })
      updateConfig(res.data)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error("Save error", err)
      alert("Error al actualizar la configuración")
    }
    setLoading(false)
  }

  const handleChange = (e) => {
    setConfig({ ...config, [e.target.name]: e.target.value })
  }

  if (!config) {
    return <div style={{ padding: '100px', textAlign: 'center', color: 'var(--cta)' }}>CARGANDO CONFIGURACIÓN...</div>
  }

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 className="urban-font gold-text" style={{ fontSize: '2.5rem', marginBottom: '10px' }}>GESTIÓN DE CONTENIDO</h1>
          <p style={{ color: 'var(--text-dim)' }}>Personaliza los textos y configuraciones del sitio web público</p>
        </div>
        <button onClick={handleSubmit} disabled={loading} className="btn-primary">
          {loading ? <RefreshCw className="spin" size={20} /> : <Save size={20} />} 
          {loading ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
        </button>
      </div>

      {success && (
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '15px', borderRadius: '8px', marginBottom: '30px', border: '1px solid #10b981', textAlign: 'center', fontWeight: 'bold' }}>
          ¡CONFIGURACIÓN ACTUALIZADA EXITOSAMENTE!
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
          
          {/* General & Identity */}
          <div className="glass-card" style={{ padding: '40px' }}>
            <h3 className="urban-font" style={{ fontSize: '1rem', color: 'var(--cta)', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Globe size={18} /> IDENTIDAD VISUAL
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Nombre Empresa (Blanco)</label>
                <input type="text" name="company_name_white" value={config.company_name_white || ''} onChange={handleChange} style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Nombre Empresa (Dorado)</label>
                <input type="text" name="company_name_gold" value={config.company_name_gold || ''} onChange={handleChange} style={{ width: '100%' }} />
              </div>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Texto Footer</label>
              <textarea name="footer_text" value={config.footer_text || ''} onChange={handleChange} rows="2" style={{ width: '100%' }} />
            </div>
          </div>

          {/* Hero Section */}
          <div className="glass-card" style={{ padding: '40px' }}>
            <h3 className="urban-font" style={{ fontSize: '1rem', color: 'var(--cta)', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Layout size={18} /> SECCIÓN INICIO (HERO)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Título (Parte Blanca)</label>
                <input type="text" name="hero_title_white" value={config.hero_title_white || ''} onChange={handleChange} style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Título (Parte Dorada)</label>
                <input type="text" name="hero_title_gold" value={config.hero_title_gold || ''} onChange={handleChange} style={{ width: '100%' }} />
              </div>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Tagline (Línea superior)</label>
              <input type="text" name="hero_tagline" value={config.hero_tagline || ''} onChange={handleChange} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Subtítulo / Descripción</label>
              <textarea name="hero_subtitle" value={config.hero_subtitle || ''} onChange={handleChange} rows="3" style={{ width: '100%' }} />
            </div>
          </div>

          {/* About Us */}
          <div className="glass-card" style={{ padding: '40px', gridColumn: 'span 2' }}>
            <h3 className="urban-font" style={{ fontSize: '1rem', color: 'var(--cta)', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Info size={18} /> SECCIÓN NOSOTROS
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Historia / Quiénes Somos</label>
                <textarea name="about_text" value={config.about_text || ''} onChange={handleChange} rows="6" style={{ width: '100%' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Nuestra Visión</label>
                  <textarea name="about_vision" value={config.about_vision || ''} onChange={handleChange} rows="2" style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Nuestra Misión</label>
                  <textarea name="about_mission" value={config.about_mission || ''} onChange={handleChange} rows="2" style={{ width: '100%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="glass-card" style={{ padding: '40px' }}>
            <h3 className="urban-font" style={{ fontSize: '1rem', color: 'var(--cta)', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Phone size={18} /> DATOS DE CONTACTO
            </h3>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Teléfono / WhatsApp</label>
              <input type="text" name="contact_phone" value={config.contact_phone || ''} onChange={handleChange} style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Email de Contacto</label>
              <input type="email" name="contact_email" value={config.contact_email || ''} onChange={handleChange} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Dirección Física</label>
              <input type="text" name="contact_address" value={config.contact_address || ''} onChange={handleChange} style={{ width: '100%' }} />
            </div>
          </div>

          {/* Social Media */}
          <div className="glass-card" style={{ padding: '40px' }}>
            <h3 className="urban-font" style={{ fontSize: '1rem', color: 'var(--cta)', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Share2 size={18} /> REDES SOCIALES (URLs)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Facebook</label>
                <input type="url" name="facebook_url" value={config.facebook_url || ''} onChange={handleChange} placeholder="https://..." style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Instagram</label>
                <input type="url" name="instagram_url" value={config.instagram_url || ''} onChange={handleChange} placeholder="https://..." style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>TikTok</label>
                <input type="url" name="tiktok_url" value={config.tiktok_url || ''} onChange={handleChange} placeholder="https://..." style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>WhatsApp (Link)</label>
                <input type="url" name="whatsapp_url" value={config.whatsapp_url || ''} onChange={handleChange} placeholder="https://wa.me/..." style={{ width: '100%' }} />
              </div>
            </div>
          </div>

          {/* Themes & Style */}
          <div className="glass-card" style={{ padding: '40px', gridColumn: 'span 2' }}>
            <h3 className="urban-font" style={{ fontSize: '1rem', color: 'var(--cta)', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Palette size={18} /> PERSONALIZACIÓN DE ESTILO (THEMING)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Tema Visual</label>
                <select name="theme" value={config.theme} onChange={handleChange} style={{ width: '100%' }}>
                  <option value="noir">Urban Noir (Oscuro / Oro)</option>
                  <option value="arctic">Minimal Arctic (Claro / Plata)</option>
                  <option value="cyber">Street Cyber (Neon / Púrpura)</option>
                </select>
                <p style={{ fontSize: '0.65rem', marginTop: '10px', color: 'var(--text-dim)' }}>Cambia los colores globales de toda la plataforma.</p>
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Tipografía Principal</label>
                <select name="typography" value={config.typography} onChange={handleChange} style={{ width: '100%' }}>
                  <option value="modern">Modern Clean (Outfit)</option>
                  <option value="classic">Classic Editorial (Playfair Display)</option>
                  <option value="tech">Urban Tech (Space Grotesk)</option>
                </select>
                <p style={{ fontSize: '0.65rem', marginTop: '10px', color: 'var(--text-dim)' }}>Cambia el estilo de fuente en títulos y textos.</p>
              </div>
            </div>
          </div>

        </div>
      </form>

      <style>{`
        .spin { animation: rotate 1s linear infinite; }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

export default CMS
