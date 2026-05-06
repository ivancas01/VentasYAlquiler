import React from 'react'
import { Mail, Phone, MapPin, Send } from 'lucide-react'

const Contact = () => {
  return (
    <div className="fade-in" style={{ padding: '150px 20px 100px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h2 style={{ fontSize: '3rem', color: 'var(--primary)', marginBottom: '10px' }}>Contáctanos</h2>
        <p style={{ color: 'var(--secondary)' }}>¿Tienes alguna duda? Estamos aquí para ayudarte.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '50px' }}>
        {/* Info */}
        <div>
          <div className="glass-card" style={{ padding: '30px', marginBottom: '30px' }}>
            <h4 style={{ marginBottom: '20px' }}>Información de Contacto</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
              <div style={{ background: 'var(--cta)', padding: '10px', borderRadius: '50%', color: 'white' }}><Phone size={20} /></div>
              <div>
                <p style={{ fontSize: '0.8rem', color: '#999' }}>Teléfono</p>
                <p>+1 234 567 890</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
              <div style={{ background: 'var(--cta)', padding: '10px', borderRadius: '50%', color: 'white' }}><Mail size={20} /></div>
              <div>
                <p style={{ fontSize: '0.8rem', color: '#999' }}>Email</p>
                <p>contacto@ventasyalquiler.com</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ background: 'var(--cta)', padding: '10px', borderRadius: '50%', color: 'white' }}><MapPin size={20} /></div>
              <div>
                <p style={{ fontSize: '0.8rem', color: '#999' }}>Ubicación</p>
                <p>Calle Principal #123, Ciudad</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form 
          className="glass-card" 
          style={{ padding: '40px' }}
          onSubmit={(e) => {
            e.preventDefault()
            const name = e.target.name.value
            const email = e.target.email.value
            const subject = e.target.subject.value
            const message = e.target.message.value
            
            const text = `Hola! Mi nombre es ${name}.
Email: ${email}
Asunto: ${subject}

Mensaje: ${message}`
            
            // Default to a common number or handle logic
            const whatsappUrl = `https://wa.me/573000000000?text=${encodeURIComponent(text)}`
            window.open(whatsappUrl, '_blank')
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Nombre</label>
              <input name="name" type="text" required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Email</label>
              <input name="email" type="email" required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }} />
            </div>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Asunto</label>
            <input name="subject" type="text" required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }} />
          </div>
          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Mensaje</label>
            <textarea name="message" rows="5" required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}></textarea>
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <Send size={20} /> Enviar Mensaje
          </button>
        </form>
      </div>
    </div>
  )
}

export default Contact
