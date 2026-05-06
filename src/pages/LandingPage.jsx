import React, { useEffect } from 'react'
import axios from 'axios'
import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, Mail, Phone, MapPin, Send, ChevronDown } from 'lucide-react'
import { formatCurrency } from '../utils/format'

const LandingPage = () => {
  const { hash } = useLocation()
  const [products, setProducts] = React.useState([])
  const [heroImages, setHeroImages] = React.useState([])
  const [aboutImages, setAboutImages] = React.useState([])
  const [config, setConfig] = React.useState(null)
  const [currentAboutImage, setCurrentAboutImage] = React.useState(0)

  useEffect(() => {
    axios.get('http://192.168.1.17:8000/api/config/')
      .then(res => setConfig(res.data))
      .catch(err => console.error(err))

    axios.get('http://192.168.1.17:8000/api/products/')
      .then(res => {
        const data = res.data.results || res.data
        if (Array.isArray(data)) setProducts(data.slice(0, 10))
      })
      .catch(err => console.error(err))

    axios.get('http://192.168.1.17:8000/api/hero-images/')
      .then(res => setHeroImages(res.data))
      .catch(err => console.error(err))

    axios.get('http://192.168.1.17:8000/api/about-images/')
      .then(res => setAboutImages(res.data))
      .catch(err => console.error(err))
  }, [])

  useEffect(() => {
    if (aboutImages.length > 1) {
      const timer = setInterval(() => {
        setCurrentAboutImage(prev => (prev + 1) % aboutImages.length)
      }, 5000)
      return () => clearInterval(timer)
    }
  }, [aboutImages])

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

  const aboutFallbacks = [
    'https://images.unsplash.com/photo-1441984969813-91c70513e273?q=80&w=1200',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200'
  ]

  const displayAboutImages = aboutImages.length > 0 ? aboutImages.map(img => img.image) : aboutFallbacks

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
        <div style={{ position: 'absolute', top: '15%', left: '10%', width: '400px', height: '400px', background: 'var(--cta)', filter: 'blur(200px)', opacity: 0.1 }}></div>
        <div style={{ position: 'absolute', bottom: '15%', right: '10%', width: '400px', height: '400px', background: 'var(--cta)', filter: 'blur(200px)', opacity: 0.1 }}></div>

        {/* Floating Products Background */}
        <div className="hero-floating-images" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}>
          {(heroImages.length > 0 ? heroImages : (products.length > 0 ? products : [1,2,3,4,5,6,7,8,9,10,11,12])).map((p, i) => {
            const fallbackImages = [
              'https://images.unsplash.com/photo-1539109136881-3be0616acf4b',
              'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f',
              'https://images.unsplash.com/photo-1483985988355-763728e1935b',
              'https://images.unsplash.com/photo-1490481651871-ab68de25d43d',
              'https://images.unsplash.com/photo-1558769132-cb1aea458c5e',
              'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1',
              'https://images.unsplash.com/photo-1445205170230-053b830c6039',
              'https://images.unsplash.com/photo-1581044777550-4cfa60707c03',
              'https://images.unsplash.com/photo-1512436991641-6745cdb1723f',
              'https://images.unsplash.com/photo-1562157873-818bc0726f68',
              'https://images.unsplash.com/photo-1479064566235-aa2742b96a46',
              'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3'
            ];
            
            const fallbackImage = fallbackImages[i % fallbackImages.length] + '?q=80&w=800&auto=format&fit=crop';
            const imageUrl = p.image 
              ? (typeof p.image === 'string' && p.image.startsWith('http') ? p.image : `http://192.168.1.17:8000${p.image}`)
              : fallbackImage;
            
            return (
              <div key={p.id || i} style={{
                position: 'absolute',
                top: `${[15, 10, 65, 75, 5, 80, 45, 60, 2, 88, 25, 70][i % 12]}%`,
                left: `${[8, 82, 5, 92, 70, 12, 85, 2, 40, 60, 93, 30][i % 12]}%`,
                width: '300px',
                height: '400px',
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'brightness(0.6) contrast(1.1)',
                opacity: 0.4,
                '--base-rot': `${(i % 2 === 0 ? 1 : -1) * (10 + (i * 4) % 20)}deg`,
                transform: 'rotate(var(--base-rot))',
                animation: `float-natural ${40 + (i % 6) * 10}s infinite ease-in-out alternate`,
                animationDelay: `${i * 0.5}s`,
                border: '1px solid rgba(255,255,255,0.05)',
                boxShadow: '40px 40px 80px rgba(0,0,0,0.9)',
                transition: 'transform 1s ease-out'
              }}></div>
            );
          })}
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: '1rem', color: 'var(--cta)', letterSpacing: '8px', marginBottom: '20px', fontWeight: 'bold' }}>{config?.hero_tagline || 'ESTILO SIN LÍMITES'}</h2>
          <h1 className="hero-title" style={{ fontSize: '6rem', color: 'white', marginBottom: '30px', lineHeight: 0.9 }}>
            {config?.hero_title_white || 'URBAN'}<br/>
            <span className="gold-text">{config?.hero_title_gold || 'LUXURY'}</span>
          </h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-dim)', maxWidth: '700px', margin: '0 auto 50px', letterSpacing: '1px', lineHeight: '1.6' }}>
            {config?.hero_subtitle || 'ALQUILER Y VENTA DE ALTA COSTURA PARA EVENTOS EXCLUSIVOS. EL LUJO QUE MERECES, SIN COMPROMISOS.'}
          </p>
          <div className="hero-buttons" style={{ display: 'flex', gap: '30px', justifyContent: 'center' }}>
            <Link to="/catalog" className="btn-primary" style={{ padding: '20px 60px' }}>
              VER CATÁLOGO <ArrowRight size={20} />
            </Link>
            <a href="#nosotros" className="btn-outline" style={{ padding: '20px 60px' }}>CONÓCENOS</a>
          </div>
        </div>

        <a href="#productos-destacados" className="scroll-hint" style={{ position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', color: 'var(--text-dim)', animation: 'bounce 2s infinite' }}>
          <ChevronDown size={32} />
        </a>
      </section>

      {/* Section: PRODUCTOS DESTACADOS */}
      <section id="productos-destacados" style={{ padding: '100px 20px', background: 'var(--bg)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '60px' }}>
            <div>
              <h2 className="gold-text urban-font" style={{ fontSize: '0.8rem', letterSpacing: '4px', marginBottom: '15px' }}>COLECCIÓN EXCLUSIVA</h2>
              <h1 style={{ fontSize: '3rem', color: 'white', margin: 0 }}>PRODUCTOS DESTACADOS</h1>
            </div>
            <Link to="/catalog" className="btn-outline desktop-only" style={{ padding: '12px 30px', fontSize: '0.8rem' }}>EXPLORAR TODO EL CATÁLOGO</Link>
          </div>

          <div className="products-scroll-container">
            <div className="products-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '40px' }}>
              {products.slice(0, 3).map((p) => (
                <div 
                  key={p.id} 
                  className="glass-card product-card" 
                  style={{ padding: '25px', display: 'flex', flexDirection: 'column', transition: 'transform 0.4s ease', cursor: 'pointer' }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-10px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ height: '400px', background: 'var(--secondary)', marginBottom: '25px', overflow: 'hidden', position: 'relative' }}>
                    <img 
                      src={p.image ? (typeof p.image === 'string' && p.image.startsWith('http') ? p.image : `http://192.168.1.17:8000${p.image}`) : 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800'} 
                      alt={p.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    
                    {/* Status Overlay */}
                    {p.stock === 0 && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.2rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', zIndex: 10 }}>
                        {p.product_type === 'sale' ? 'AGOTADO' : 'ALQUILADO'}
                      </div>
                    )}

                    {/* Type Badge */}
                    <div style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(0,0,0,0.7)', color: 'var(--cta)', padding: '5px 12px', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase', border: '1px solid var(--cta)', zIndex: 11 }}>
                      {p.product_type === 'both' ? 'VENTA / ALQUILER' : (p.product_type === 'sale' ? 'VENTA' : 'ALQUILER')}
                    </div>
                  </div>

                  <h3 className="urban-font" style={{ fontSize: '1.2rem', marginBottom: '10px', color: 'white' }}>{p.name.toUpperCase()}</h3>
                  <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '25px', flex: 1, lineHeight: '1.6' }}>
                    {p.description?.length > 100 ? p.description.substring(0, 100) + '...' : p.description || 'Elegancia y distinción en cada detalle de esta pieza exclusiva.'}
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      {p.price_sale && <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }}>{formatCurrency(p.price_sale)}</div>}
                      {p.price_rental && <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--cta)' }}>{formatCurrency(p.price_rental)} <span style={{fontSize: '0.6rem', color: 'var(--text-dim)'}}>ALQ</span></div>}
                    </div>
                    <Link to="/catalog" className="btn-primary" style={{ width: '100%', height: '45px', fontSize: '0.75rem' }}>VER DETALLES</Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mobile-only view-all-btn-container" style={{ marginTop: '40px', textAlign: 'center' }}>
            <Link to="/catalog" className="btn-outline" style={{ padding: '15px 40px', width: '100%' }}>VER TODO EL CATÁLOGO</Link>
          </div>
        </div>
      </section>

      {/* Section: NOSOTROS */}
      <section id="nosotros" style={{ padding: '150px 20px', maxWidth: '1400px', margin: '0 auto' }}>
        <div className="section-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '100px', alignItems: 'center' }}>
          <div>
            <h2 className="gold-text urban-font" style={{ fontSize: '1rem', letterSpacing: '5px', marginBottom: '20px' }}>ESTILO Y EXCLUSIVIDAD</h2>
            <h1 className="section-title" style={{ fontSize: '3.5rem', color: 'white', marginBottom: '40px', lineHeight: 1.1 }}>{config?.nosotros_title || 'NOSOTROS'}</h1>
            <div style={{ width: '60px', height: '4px', background: 'var(--cta)', marginBottom: '50px' }}></div>
            
            <p className="section-desc" style={{ fontSize: '1.3rem', lineHeight: '1.8', color: 'var(--text-dim)', marginBottom: '50px', maxWidth: '800px' }}>
              {config?.about_text || 'En Urban Luxury, redefinimos la experiencia de vestir bien. Creemos que la elegancia no debería ser una carga, sino una elección libre y flexible.'}
            </p>

            <div className="vision-mission-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
              <div>
                <h3 className="urban-font" style={{ fontSize: '0.8rem', color: 'var(--cta)', letterSpacing: '2px', marginBottom: '15px' }}>NUESTRA VISIÓN</h3>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', lineHeight: '1.6' }}>{config?.about_vision || 'Convertirnos en el referente nacional de moda circular de lujo, promoviendo un estilo de vida sofisticado y sostenible.'}</p>
              </div>
              <div>
                <h3 className="urban-font" style={{ fontSize: '0.8rem', color: 'var(--cta)', letterSpacing: '2px', marginBottom: '15px' }}>NUESTRA MISIÓN</h3>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', lineHeight: '1.6' }}>{config?.about_mission || 'Facilitar el acceso a prendas exclusivas mediante un servicio impecable de alquiler y venta, garantizando que cada cliente se sienta su mejor versión.'}</p>
              </div>
            </div>
          </div>

          <div className="about-image-container" style={{ position: 'relative' }}>
            <div className="about-image-frame" style={{ 
              width: '100%', 
              height: '600px', 
              background: 'var(--secondary)',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 50px 100px rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              {displayAboutImages.map((img, idx) => (
                <div 
                  key={idx}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundImage: `url(${img})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: currentAboutImage === idx ? 1 : 0,
                    transition: 'opacity 1.5s ease-in-out',
                    transform: currentAboutImage === idx ? 'scale(1.05)' : 'scale(1)',
                    transitionProperty: 'opacity, transform'
                  }}
                />
              ))}
              
              {/* Decorative Frame */}
              <div style={{ position: 'absolute', top: '20px', left: '20px', right: '20px', bottom: '20px', border: '1px solid rgba(184, 158, 72, 0.3)', pointerEvents: 'none' }}></div>
            </div>
            
            {/* Carousel Indicators */}
            <div className="carousel-indicators" style={{ position: 'absolute', bottom: '-40px', right: 0, display: 'flex', gap: '15px' }}>
              {displayAboutImages.map((_, idx) => (
                <div 
                  key={idx}
                  onClick={() => setCurrentAboutImage(idx)}
                  style={{ 
                    width: '40px', 
                    height: '2px', 
                    background: currentAboutImage === idx ? 'var(--cta)' : 'rgba(255,255,255,0.1)', 
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section: CONTACTO */}
      <section id="contacto" className="contact-section" style={{ padding: '150px 20px 80px', background: 'var(--secondary)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="contact-header" style={{ textAlign: 'center', marginBottom: '80px' }}>
            <h2 className="gold-text contact-title" style={{ fontSize: '3.5rem', marginBottom: '20px' }}>{config?.contacto_title || 'CONTACTO'}</h2>
            <p style={{ color: 'var(--text-dim)' }}>{config?.contacto_subtitle || '¿Tienes alguna pregunta? Estamos listos para asesorarte de manera personalizada.'}</p>
          </div>

          <div className="contact-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '60px' }}>
            <div>
              <div className="glass-card" style={{ padding: '40px', marginBottom: '30px' }}>
                <h4 className="urban-font" style={{ marginBottom: '30px', fontSize: '1rem', color: 'white' }}>Información de Contacto</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
                  <div style={{ background: 'var(--cta)', padding: '12px', color: 'white' }}><Phone size={22} /></div>
                  <div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>WhatsApp / Teléfono</p>
                    <p style={{ fontSize: '1.1rem' }}>{config?.contact_phone || '+57 300 000 0000'}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
                  <div style={{ background: 'var(--cta)', padding: '12px', color: 'white' }}><Mail size={22} /></div>
                  <div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Correo Electrónico</p>
                    <p style={{ fontSize: '1.1rem' }}>{config?.contact_email || 'info@urbanluxury.com'}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ background: 'var(--cta)', padding: '12px', color: 'white' }}><MapPin size={22} /></div>
                  <div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Ubicación</p>
                    <p style={{ fontSize: '1.1rem' }}>{config?.contact_address || 'Avenida Lujo #45-12, Ciudad'}</p>
                  </div>
                </div>
              </div>
            </div>

            <form className="glass-card contact-form" style={{ padding: '50px' }}>
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginBottom: '25px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Nombre Completo *</label>
                  <input type="text" required style={{ width: '100%', padding: '15px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Email *</label>
                  <input type="email" required style={{ width: '100%', padding: '15px' }} />
                </div>
              </div>
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginBottom: '25px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Número de Documento *</label>
                  <input type="text" required style={{ width: '100%', padding: '15px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Teléfono *</label>
                  <input type="tel" required style={{ width: '100%', padding: '15px' }} />
                </div>
              </div>
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Motivo de Contacto *</label>
                <select required style={{ width: '100%', padding: '15px', background: 'var(--bg)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
                  <option value="">Seleccione un motivo...</option>
                  <option value="alquiler">Información sobre Alquiler</option>
                  <option value="venta">Información sobre Venta</option>
                  <option value="cita">Agendar Cita</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Mensaje *</label>
                <textarea rows="4" required style={{ width: '100%', padding: '15px' }}></textarea>
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', gap: '15px' }}>
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
        @keyframes float-natural {
          0% { transform: translate(0, 0) rotate(var(--base-rot)); }
          25% { transform: translate(30px, -50px) rotate(calc(var(--base-rot) + 2deg)); }
          50% { transform: translate(-20px, -80px) rotate(calc(var(--base-rot) - 2deg)); }
          75% { transform: translate(-40px, -30px) rotate(calc(var(--base-rot) + 1deg)); }
          100% { transform: translate(0, 0) rotate(var(--base-rot)); }
        }

        .desktop-only { display: block; }
        .mobile-only { display: none; }

        @media (max-width: 1024px) {
          .desktop-only { display: none !important; }
          .mobile-only { display: block !important; }

          .hero-floating-images { display: none !important; }
          .hero-title { font-size: clamp(1.1rem, 9vw, 2.2rem) !important; line-height: 1.2 !important; letter-spacing: 1px !important; }
          .hero-buttons { flex-direction: column !important; gap: 15px !important; width: 100%; padding: 0 10px; box-sizing: border-box; }
          .hero-buttons a { width: 100%; padding: 15px !important; font-size: 0.8rem !important; text-align: center; }

          #productos-destacados { padding: 50px 0 !important; }
          .section-header { margin-bottom: 30px !important; text-align: center; display: block !important; padding: 0 15px; }
          .section-header h1 { font-size: clamp(1.3rem, 8vw, 1.8rem) !important; margin-top: 8px; }

          .products-scroll-container {
            overflow-x: auto;
            padding-bottom: 25px;
            padding-left: 15px;
            padding-right: 15px;
            display: flex;
            gap: 15px;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
          }
          
          .products-grid {
            display: flex !important;
            flex-wrap: nowrap !important;
            gap: 15px !important;
            width: max-content;
          }
          .product-card {
            flex: 0 0 calc(100vw - 50px) !important;
            max-width: 300px !important;
            padding: 15px !important;
            scroll-snap-align: center;
          }

          .view-all-btn-container { padding: 0 15px !important; box-sizing: border-box !important; }

          #nosotros { padding: 60px 15px !important; }
          .section-grid {
            grid-template-columns: 1fr !important;
            gap: 30px !important;
            text-align: center;
          }
          .section-title { font-size: clamp(1.3rem, 8vw, 1.8rem) !important; }
          .section-desc { font-size: 0.9rem !important; margin: 0 auto 25px !important; line-height: 1.6 !important; }
          .vision-mission-grid { grid-template-columns: 1fr !important; gap: 15px !important; }
          .about-image-frame { height: 300px !important; }
          .carousel-indicators { justify-content: center !important; right: 50% !important; transform: translateX(50%) !important; bottom: -25px !important; }

          .contact-section { padding: 50px 15px !important; }
          .contact-header { margin-bottom: 30px !important; }
          .contact-title { font-size: clamp(1.3rem, 8vw, 1.8rem) !important; }
          .contact-grid { 
            grid-template-columns: 1fr !important; 
            gap: 15px !important; 
            width: 100% !important;
            margin: 0 auto !important;
          }
          .contact-grid > div { width: 100% !important; }
          .contact-grid .glass-card { padding: 20px !important; margin-bottom: 20px !important; width: 100% !important; box-sizing: border-box !important; }
          .contact-form { padding: 25px 20px !important; width: 100% !important; box-sizing: border-box !important; }
          .form-row { grid-template-columns: 1fr !important; gap: 15px !important; margin-bottom: 15px !important; }
          
          .btn-primary, .btn-outline { font-size: 0.8rem !important; }
        }
      `}</style>
    </div>
  )
}

export default LandingPage
