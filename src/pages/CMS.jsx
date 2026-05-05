import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { 
  Globe, Layout, Info, Phone, Share2, 
  Save, RefreshCw, Trash2, Plus, Image as ImageIcon
} from 'lucide-react'

import { useSite } from '../context/SiteContext'

const CMS = () => {
  const { config: globalConfig, updateConfig } = useSite()
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  
  const [heroImages, setHeroImages] = useState([])
  const [aboutImages, setAboutImages] = useState([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (globalConfig) {
      setConfig(globalConfig)
    }
    fetchImages()
  }, [globalConfig])

  const fetchImages = async () => {
    try {
      const [hRes, aRes] = await Promise.all([
        axios.get('http://127.0.0.1:8000/api/hero-images/'),
        axios.get('http://127.0.0.1:8000/api/about-images/')
      ])
      setHeroImages(hRes.data)
      setAboutImages(aRes.data)
    } catch (err) {
      console.error("Error fetching images", err)
    }
  }

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('image', file)
    
    const token = localStorage.getItem('token')
    const endpoint = type === 'hero' ? 'hero-images' : 'about-images'
    try {
      await axios.post(`http://127.0.0.1:8000/api/${endpoint}/`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })
      fetchImages()
    } catch (err) {
      alert("Error al subir imagen")
    }
    setUploading(false)
  }

  const handleDeleteImage = async (id, type) => {
    if (!window.confirm("¿Eliminar esta imagen?")) return
    
    const token = localStorage.getItem('token')
    const endpoint = type === 'hero' ? 'hero-images' : 'about-images'
    try {
      await axios.delete(`http://127.0.0.1:8000/api/${endpoint}/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchImages()
    } catch (err) {
      alert("Error al eliminar")
    }
  }

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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        
        {/* Identidad Visual */}
        <div className="glass-card" style={{ padding: '40px' }}>
          <h3 className="urban-font" style={{ fontSize: '1rem', color: 'var(--cta)', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Globe size={18} /> IDENTIDAD VISUAL
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Nombre Empresa (Blanco)</label>
              <input type="text" name="company_name_white" value={config.company_name_white || ''} onChange={handleChange} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Nombre Empresa (Dorado)</label>
              <input type="text" name="company_name_gold" value={config.company_name_gold || ''} onChange={handleChange} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Nombre Legal / Copyright</label>
              <input type="text" name="company_name" value={config.company_name || ''} onChange={handleChange} style={{ width: '100%' }} />
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

        {/* Hero Background Images Management */}
        <div className="glass-card" style={{ padding: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h3 className="urban-font" style={{ fontSize: '1rem', color: 'var(--cta)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ImageIcon size={18} /> IMÁGENES DE INICIO (HERO)
            </h3>
            <label className="btn-primary" style={{ padding: '8px 15px', cursor: 'pointer', fontSize: '0.75rem' }}>
              {uploading ? <RefreshCw className="spin" size={14} /> : <Plus size={14} />} 
              {uploading ? '...' : 'AGREGAR'}
              <input type="file" hidden onChange={(e) => handleImageUpload(e, 'hero')} accept="image/*" />
            </label>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '15px' }}>
            {heroImages.map(img => (
              <div key={img.id} style={{ position: 'relative', height: '120px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                <img src={img.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button 
                  onClick={() => handleDeleteImage(img.id, 'hero')}
                  style={{ position: 'absolute', top: '5px', right: '5px', background: '#ef4444', border: 'none', color: 'white', padding: '4px', cursor: 'pointer', borderRadius: '4px' }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* About Images Management */}
        <div className="glass-card" style={{ padding: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h3 className="urban-font" style={{ fontSize: '1rem', color: 'var(--cta)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ImageIcon size={18} /> IMÁGENES DE NOSOTROS
            </h3>
            <label className="btn-primary" style={{ padding: '8px 15px', cursor: 'pointer', fontSize: '0.75rem' }}>
              {uploading ? <RefreshCw className="spin" size={14} /> : <Plus size={14} />} 
              {uploading ? '...' : 'AGREGAR'}
              <input type="file" hidden onChange={(e) => handleImageUpload(e, 'about')} accept="image/*" />
            </label>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '15px' }}>
            {aboutImages.map(img => (
              <div key={img.id} style={{ position: 'relative', height: '120px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                <img src={img.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button 
                  onClick={() => handleDeleteImage(img.id, 'about')}
                  style={{ position: 'absolute', top: '5px', right: '5px', background: '#ef4444', border: 'none', color: 'white', padding: '4px', cursor: 'pointer', borderRadius: '4px' }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
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

        {/* Section Titles */}
        <div className="glass-card" style={{ padding: '40px', gridColumn: 'span 2' }}>
          <h3 className="urban-font" style={{ fontSize: '1rem', color: 'var(--cta)', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Layout size={18} /> TÍTULOS DE SECCIONES
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Título Sección "Nosotros"</label>
              <input type="text" name="nosotros_title" value={config.nosotros_title || ''} onChange={handleChange} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Título Sección "Contacto"</label>
              <input type="text" name="contacto_title" value={config.contacto_title || ''} onChange={handleChange} style={{ width: '100%' }} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Subtítulo Sección "Contacto"</label>
              <input type="text" name="contacto_subtitle" value={config.contacto_subtitle || ''} onChange={handleChange} style={{ width: '100%' }} />
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

        {/* Social Media & Footer */}
        <div className="glass-card" style={{ padding: '40px' }}>
          <h3 className="urban-font" style={{ fontSize: '1rem', color: 'var(--cta)', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Share2 size={18} /> REDES Y PIE DE PÁGINA
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Facebook</label>
              <input type="url" name="facebook_url" value={config.facebook_url || ''} onChange={handleChange} placeholder="https://..." style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Instagram</label>
              <input type="url" name="instagram_url" value={config.instagram_url || ''} onChange={handleChange} placeholder="https://..." style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>WhatsApp (Link)</label>
              <input type="url" name="whatsapp_url" value={config.whatsapp_url || ''} onChange={handleChange} placeholder="https://wa.me/..." style={{ width: '100%' }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Título "Enlaces Rápidos"</label>
              <input type="text" name="footer_links_title" value={config.footer_links_title || ''} onChange={handleChange} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Título "Contacto"</label>
              <input type="text" name="footer_contact_title" value={config.footer_contact_title || ''} onChange={handleChange} style={{ width: '100%' }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Descripción del Pie de Página (Footer)</label>
            <textarea name="footer_text" value={config.footer_text || ''} onChange={handleChange} rows="2" style={{ width: '100%' }} />
          </div>
        </div>

      </div>

      <style>{`
        .spin { animation: rotate 1s linear infinite; }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

export default CMS
