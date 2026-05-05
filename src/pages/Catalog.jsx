import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { createPortal } from 'react-dom'
import { Search, Filter, ShoppingBag, ArrowRight } from 'lucide-react'
import { formatCurrency } from '../utils/format'

const Catalog = () => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [filterType, setFilterType] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [config, setConfig] = useState(null)

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [filterType, filterCategory])
  useEffect(() => {
    if (selectedProduct) {
      // Ensure modal starts at top
      const modal = document.getElementById('catalog-modal-content')
      if (modal) modal.scrollTop = 0
    }
  }, [selectedProduct])

  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const fetchInitialData = async () => {
    // Fetch categories
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/categories/')
      setCategories(res.data.results || res.data)
    } catch (err) {
      console.error("Error fetching categories", err)
    }

    // Fetch config
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/config/')
      if (res.data) setConfig(res.data)
    } catch (err) {
      console.error("Error fetching config", err)
    }
  }

  const fetchProducts = async (reset = true) => {
    if (reset) {
      setLoading(true)
      setPage(1)
    }
    try {
      let url = `http://127.0.0.1:8000/api/products/?page=${reset ? 1 : page + 1}&`
      if (filterType !== 'all') url += `type=${filterType}&`
      if (filterCategory !== 'all') url += `category=${filterCategory}`
      
      const res = await axios.get(url)
      const newProducts = res.data.results || []
      setProducts(reset ? newProducts : [...products, ...newProducts])
      setHasMore(!!res.data.next)
      if (!reset) setPage(prev => prev + 1)
    } catch (err) {
      console.error("Error fetching products", err)
      if (reset) setProducts([])
    }
    setLoading(false)
  }

  const filteredProducts = Array.isArray(products) 
    ? products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : []

  return (
    <div className="fade-in" style={{ padding: '160px 20px 80px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '80px' }}>
        <h2 className="gold-text" style={{ fontSize: '3rem', marginBottom: '20px' }}>Exclusividad</h2>
        <p style={{ color: 'var(--text-dim)', letterSpacing: '2px', textTransform: 'uppercase' }}>Explora nuestra colección de alta costura disponible para venta y alquiler.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '30px', alignItems: 'center', marginBottom: '50px' }}>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '400px' }}>
            <Search size={20} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--cta)' }} />
            <input 
              type="text" 
              placeholder="Buscar prendas..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '15px 15px 15px 50px', fontSize: '1rem', background: 'var(--secondary)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
            />
          </div>

          <select 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{ width: '250px', background: 'var(--secondary)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0 15px' }}
          >
            <option value="all">TODAS LAS CATEGORÍAS</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name.toUpperCase()}</option>
            ))}
          </select>

          <div style={{ display: 'flex', gap: '10px', background: 'var(--secondary)', padding: '5px', border: '1px solid rgba(255,255,255,0.05)' }}>
            {['all', 'sale', 'rental'].map(t => (
              <button 
                key={t}
                onClick={() => setFilterType(t)}
                style={{ 
                  padding: '10px 20px', 
                  fontSize: '0.75rem', 
                  background: filterType === t ? 'var(--cta)' : 'transparent',
                  color: filterType === t ? 'black' : 'white',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  textTransform: 'uppercase'
                }}
              >
                {t === 'all' ? 'Todo' : t === 'sale' ? 'Venta' : 'Alquiler'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px', color: 'var(--cta)' }}>CARGANDO COLECCIÓN...</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '40px' }}>
            {filteredProducts.map(product => (
              <div 
                key={product.id} 
                className="glass-card" 
                onClick={() => setSelectedProduct(product)}
                style={{ padding: '25px', display: 'flex', flexDirection: 'column', transition: 'transform 0.3s ease', cursor: 'pointer' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-10px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ height: '350px', background: 'var(--secondary)', marginBottom: '20px', overflow: 'hidden', position: 'relative' }}>
                  {product.image && <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  {product.stock === 0 && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.2rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', zIndex: 10 }}>
                      {product.product_type === 'sale' ? 'AGOTADO' : 'ALQUILADO'}
                    </div>
                  )}
                  <div style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(0,0,0,0.7)', color: 'var(--cta)', padding: '5px 12px', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase', border: '1px solid var(--cta)', zIndex: 11 }}>
                    {product.product_type === 'both' ? 'VENTA / ALQUILER' : product.product_type.toUpperCase()}
                  </div>
                </div>
                <h3 className="urban-font" style={{ fontSize: '1.1rem', marginBottom: '10px', color: 'white' }}>{product.name}</h3>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '20px', flex: 1, lineHeight: '1.5' }}>
                  {product.description?.length > 100 ? product.description.substring(0, 100) + '...' : product.description}
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      {product.price_sale && <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }}>{formatCurrency(product.price_sale)}</div>}
                      {product.price_rental && <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--cta)' }}>{formatCurrency(product.price_rental)} <span style={{fontSize: '0.6rem', color: 'var(--text-dim)'}}>ALQ</span></div>}
                    </div>
                  </div>
                  <button onClick={() => setSelectedProduct(product)} className="btn-primary" style={{ width: '100%', height: '45px', fontSize: '0.75rem' }}>VER DETALLES</button>
                </div>
              </div>
            ))}
          </div>
          
          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: '60px' }}>
              <button onClick={() => fetchProducts(false)} className="btn-outline" style={{ padding: '15px 50px' }}>
                CARGAR MÁS PRENDAS
              </button>
            </div>
          )}
        </>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && createPortal(
        <div 
          onClick={() => setSelectedProduct(null)}
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            background: 'rgba(0,0,0,0.98)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 99999999, 
            padding: '40px', 
            backdropFilter: 'blur(20px)' 
          }}
        >
          <div 
            id="catalog-modal-content" 
            className="glass-card fade-in" 
            onClick={(e) => e.stopPropagation()}
            style={{ 
              maxWidth: '1100px', 
              width: '100%', 
              display: 'grid', 
              gridTemplateColumns: '1.2fr 1fr', 
              gap: '60px', 
              padding: '60px', 
              position: 'relative', 
              maxHeight: '90vh', 
              overflowY: 'auto',
              background: 'var(--bg)',
              border: '1px solid var(--glass-border)'
            }}
          >
            <button onClick={() => setSelectedProduct(null)} style={{ position: 'absolute', top: '30px', right: '30px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', zIndex: 10 }}>
              <ArrowRight size={35} style={{ transform: 'rotate(180deg)' }} />
            </button>
            
            <div style={{ height: '600px', background: 'var(--secondary)', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
              {selectedProduct.image && <img src={selectedProduct.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: 'var(--cta)', letterSpacing: '4px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '15px' }}>{selectedProduct.category_name}</span>
              <h2 className="urban-font gold-text" style={{ fontSize: '3rem', marginBottom: '25px', lineHeight: '1.1' }}>{selectedProduct.name}</h2>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.05rem', lineHeight: '1.8', marginBottom: '40px', background: 'rgba(255,255,255,0.03)', padding: '25px', borderLeft: '3px solid var(--cta)' }}>
                {selectedProduct.description || 'Sin descripción detallada disponible para esta pieza exclusiva.'}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '40px' }}>
                <div className="detail-item">
                  <label style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>Color</label>
                  <p style={{ fontSize: '1.2rem', color: 'white', fontWeight: '500' }}>{selectedProduct.color || 'N/A'}</p>
                </div>
                <div className="detail-item">
                  <label style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>Talla / Tamaño</label>
                  <p style={{ fontSize: '1.2rem', color: 'white', fontWeight: '500' }}>{selectedProduct.size || 'N/A'}</p>
                </div>
                <div className="detail-item">
                  <label style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>Composición</label>
                  <p style={{ fontSize: '1.2rem', color: 'white', fontWeight: '500' }}>{selectedProduct.pieces_count} piezas</p>
                </div>
                <div className="detail-item">
                  <label style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>Estado</label>
                  <p style={{ fontSize: '1.2rem', color: selectedProduct.stock > 0 ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>{selectedProduct.stock > 0 ? 'DISPONIBLE' : 'AGOTADO'}</p>
                </div>
              </div>

              <div style={{ marginTop: 'auto', background: 'rgba(255,255,255,0.02)', padding: '35px', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    {selectedProduct.price_sale && <div style={{ fontSize: '2.2rem', fontWeight: 'bold', color: 'white' }}>{formatCurrency(selectedProduct.price_sale)} <span style={{fontSize: '0.8rem', color: 'var(--text-dim)'}}>VENTA</span></div>}
                    {selectedProduct.price_rental && <div style={{ fontSize: '2.2rem', fontWeight: 'bold', color: 'var(--cta)', marginTop: '8px' }}>{formatCurrency(selectedProduct.price_rental)} <span style={{fontSize: '0.8rem', color: 'var(--text-dim)'}}>ALQUILER</span></div>}
                  </div>
                  <a 
                    href={`https://wa.me/${config?.contact_phone?.replace(/\D/g, '') || '573000000000'}?text=Hola, estoy interesado en el producto: ${selectedProduct.name}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="btn-primary" 
                    style={{ padding: '20px 40px', fontSize: '0.9rem' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    SOLICITAR AHORA
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default Catalog
