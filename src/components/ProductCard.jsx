import React from 'react'
import { ShoppingCart, Calendar } from 'lucide-react'

const ProductCard = ({ product }) => {
  return (
    <div className="glass-card" style={{
      overflow: 'hidden',
      transition: 'transform 0.3s ease',
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
       onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
      
      <div style={{
        height: '200px',
        backgroundColor: '#e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#9ca3af'
      }}>
        {product.image ? <img src={product.image} alt={product.name} style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : 'Sin Imagen'}
      </div>

      <div style={{ padding: '20px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--cta)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>
          {product.category_name}
        </span>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'var(--primary)' }}>{product.name}</h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--secondary)', marginBottom: '20px', lineClamp: 2, overflow: 'hidden' }}>
          {product.description}
        </p>

        <div style={{ marginTop: 'auto' }}>
          {product.product_type !== 'rental' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.9rem' }}>Venta</span>
              <span style={{ fontWeight: 'bold' }}>${product.price_sale}</span>
            </div>
          )}
          {product.product_type !== 'sale' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.9rem' }}>Alquiler / día</span>
              <span style={{ fontWeight: 'bold' }}>${product.price_rental_daily}</span>
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            {product.product_type !== 'rental' && (
              <button className="btn-primary" style={{ flex: 1, padding: '8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                <ShoppingCart size={14} /> Comprar
              </button>
            )}
            {product.product_type !== 'sale' && (
              <button className="btn-primary" style={{ flex: 1, padding: '8px', fontSize: '0.8rem', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                <Calendar size={14} /> Alquilar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductCard
