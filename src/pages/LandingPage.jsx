import React, { useEffect } from 'react'
import axios from 'axios'
import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, Mail, Phone, MapPin, Send, ChevronDown } from 'lucide-react'

const LandingPage = () => {
  const { hash } = useLocation()
  const [config, setConfig] = React.useState(null)

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/config/')
      .then(res => setConfig(res.data))
      .catch(err => console.error(err))
  }, [])

  useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.replace('#', ''))
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [hash])

  return (
    <div className="fade-in">
      
      {/* Section: INICIO (HERO) */}
      <section id="inicio" style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        padding: '100px 20px',
        background: 'radial-gradient(circle at center, #171717 0%, #050505 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative elements */}
        <div style={{ position: 'absolute', top: '15%', left: '10%', width: '400px', height: '400px', background: 'var(--cta)', filter: 'blur(200px)', opacity: 0.07 }}></div>
        <div style={{ position: 'absolute', bottom: '15%', right: '10%', width: '400px', height: '400px', background: 'var(--cta)', filter: 'blur(200px)', opacity: 0.07 }}></div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: '1rem', color: 'var(--cta)', letterSpacing: '8px', marginBottom: '20px', fontWeight: 'bold' }}>{config?.hero_tagline || 'ESTILO SIN LÍMITES'}</h2>
          <h1 style={{ fontSize: '6rem', color: 'white', marginBottom: '30px', lineHeight: 0.9 }}>
            {config?.hero_title_white || 'URBAN'}<br/>
            <span className="gold-text">{config?.hero_title_gold || 'LUXURY'}</span>
          </h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-dim)', maxWidth: '700px', margin: '0 auto 50px', letterSpacing: '1px', lineHeight: '1.6' }}>
            {config?.hero_subtitle || 'ALQUILER Y VENTA DE ALTA COSTURA PARA EVENTOS EXCLUSIVOS. EL LUJO QUE MERECES, SIN COMPROMISOS.'}
          </p>
          <div style={{ display: 'flex', gap: '30px', justifyContent: 'center' }}>
            <Link to="/catalog" className="btn-primary" style={{ padding: '20px 60px' }}>
              VER CATÁLOGO <ArrowRight size={20} />
            </Link>
            <a href="#nosotros" className="btn-outline" style={{ padding: '20px 60px' }}>CONÓCENOS</a>
          </div>
        </div>

        <a href="#nosotros" style={{ position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', color: 'var(--text-dim)', animation: 'bounce 2s infinite' }}>
          <ChevronDown size={32} />
        </a>
      </section>

      {/* Section: NOSOTROS */}
      <section id="nosotros" style={{ padding: '150px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <h2 className="gold-text" style={{ fontSize: '3.5rem', marginBottom: '20px' }}>NOSOTROS</h2>
          <div style={{ width: '80px', height: '2px', background: 'var(--cta)', margin: '0 auto' }}></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
          <div className="glass-card" style={{ padding: '60px', borderLeft: '4px solid var(--cta)' }}>
            <p style={{ fontSize: '1.4rem', lineHeight: '1.8', color: 'white', marginBottom: '30px' }}>
              {config?.about_text || 'En Urban Luxury, redefinimos la experiencia de vestir bien. Creemos que la elegancia no debería ser una carga, sino una elección libre y flexible.'}
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px' }}>
            <div className="glass-card" style={{ padding: '30px' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--cta)', marginBottom: '15px' }}>Nuestra Visión</h3>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>{config?.about_vision || 'Convertirnos en el referente nacional de moda circular de lujo, promoviendo un estilo de vida sofisticado y sostenible.'}</p>
            </div>
            <div className="glass-card" style={{ padding: '30px' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--cta)', marginBottom: '15px' }}>Nuestra Misión</h3>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>{config?.about_mission || 'Facilitar el acceso a prendas exclusivas mediante un servicio impecable de alquiler y venta, garantizando que cada cliente se sienta su mejor versión.'}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section: CONTACTO */}
      <section id="contacto" style={{ padding: '150px 20px', background: 'var(--secondary)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <h2 className="gold-text" style={{ fontSize: '3.5rem', marginBottom: '20px' }}>CONTACTO</h2>
            <p style={{ color: 'var(--text-dim)' }}>¿Tienes alguna pregunta? Estamos listos para asesorarte de manera personalizada.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '60px' }}>
            <div>
              <div className="glass-card" style={{ padding: '40px', marginBottom: '30px' }}>
                <h4 className="urban-font" style={{ marginBottom: '30px', fontSize: '1rem', color: 'white' }}>Información de Contacto</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
                  <div style={{ background: 'var(--gold-gradient)', padding: '12px', borderRadius: '50%', color: 'black' }}><Phone size={22} /></div>
                  <div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>WhatsApp / Teléfono</p>
                    <p style={{ fontSize: '1.1rem' }}>{config?.contact_phone || '+57 300 000 0000'}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
                  <div style={{ background: 'var(--gold-gradient)', padding: '12px', borderRadius: '50%', color: 'black' }}><Mail size={22} /></div>
                  <div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Correo Electrónico</p>
                    <p style={{ fontSize: '1.1rem' }}>{config?.contact_email || 'info@urbanluxury.com'}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ background: 'var(--gold-gradient)', padding: '12px', borderRadius: '50%', color: 'black' }}><MapPin size={22} /></div>
                  <div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Ubicación</p>
                    <p style={{ fontSize: '1.1rem' }}>{config?.contact_address || 'Avenida Lujo #45-12, Ciudad'}</p>
                  </div>
                </div>
              </div>
            </div>

            <form className="glass-card" style={{ padding: '50px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginBottom: '25px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Nombre Completo</label>
                  <input type="text" style={{ width: '100%', padding: '15px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Email</label>
                  <input type="email" style={{ width: '100%', padding: '15px' }} />
                </div>
              </div>
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Mensaje</label>
                <textarea rows="6" style={{ width: '100%', padding: '15px' }}></textarea>
              </div>
              <button type="button" className="btn-primary" style={{ width: '100%', gap: '15px' }}>
                ENVIAR MENSAJE <Send size={20} />
              </button>
            </form>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {transform: translateY(0) translateX(-50%);}
          40% {transform: translateY(-10px) translateX(-50%);}
          60% {transform: translateY(-5px) translateX(-50%);}
        }
      `}</style>
    </div>
  )
}

export default LandingPage
