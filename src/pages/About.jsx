import React from 'react'

const About = () => {
  return (
    <div className="fade-in" style={{ padding: '150px 20px 100px', maxWidth: '1000px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '3rem', color: 'var(--primary)', marginBottom: '30px', textAlign: 'center' }}>Sobre Nosotros</h2>
      
      <div className="glass-card" style={{ padding: '40px', marginBottom: '50px' }}>
        <p style={{ fontSize: '1.2rem', lineHeight: '1.8', color: 'var(--secondary)' }}>
          En <strong>VentasYAlquiler</strong>, nos dedicamos a conectar a profesionales y empresas con las herramientas y productos que necesitan para crecer. 
          Nuestra misión es simplificar el acceso a bienes de alta calidad, ofreciendo tanto la opción de compra definitiva como el alquiler flexible para proyectos temporales.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
        <div>
          <h3 style={{ color: 'var(--primary)', marginBottom: '20px' }}>Nuestra Visión</h3>
          <p style={{ color: 'var(--secondary)', lineHeight: '1.6' }}>
            Ser la plataforma de referencia en el mercado regional, reconocida por nuestra transparencia, calidad de servicio y tecnología de vanguardia.
          </p>
        </div>
        <div>
          <h3 style={{ color: 'var(--primary)', marginBottom: '20px' }}>Nuestros Valores</h3>
          <ul style={{ color: 'var(--secondary)', lineHeight: '1.6', paddingLeft: '20px' }}>
            <li>Integridad en cada transacción.</li>
            <li>Excelencia operativa.</li>
            <li>Compromiso con el éxito de nuestros clientes.</li>
            <li>Innovación constante.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default About
