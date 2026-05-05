import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'
import { Plus, Edit, Trash2, X, Upload, Check, Package, ArrowRight, Tag, History } from 'lucide-react'
import { useCallback, useRef } from 'react'

const Modal = ({ children, onClose, title }) => {
  return createPortal(
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      background: 'rgba(0,0,0,0.92)', 
      backdropFilter: 'blur(15px)',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      zIndex: 99999999 
    }}>
      <div className="glass-card" style={{ 
        padding: '50px', 
        width: '95%', 
        maxWidth: '800px', 
        maxHeight: '90vh', 
        overflowY: 'auto', 
        background: 'var(--primary)',
        border: '1px solid var(--cta)',
        position: 'relative'
      }}>
        <button 
          onClick={onClose} 
          style={{ 
            position: 'absolute', 
            top: '30px', 
            right: '30px', 
            border: 'none', 
            background: 'transparent', 
            cursor: 'pointer',
            color: 'white',
            zIndex: 10
          }}
        >
          <X size={28} />
        </button>
        <h3 className="urban-font gold-text" style={{ fontSize: '1.8rem', marginBottom: '30px' }}>{title}</h3>
        {children}
      </div>
    </div>,
    document.body
  )
}

const Inventory = () => {
  const [activeTab, setActiveTab] = useState('products')
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [showProductModal, setShowProductModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [loading, setLoading] = useState(false)
  
  // Pagination State
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const observer = useRef()

  // Form State for Product
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    color: '',
    pieces_count: 1,
    size: '',
    category: '',
    product_type: 'sale',
    price_sale: '',
    price_rental: '',
    stock: 0,
    is_active: true
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  // Form State for Category
  const [categoryForm, setCategoryForm] = useState({ name: '', slug: '' })

  useEffect(() => {
    fetchData(1)
  }, [])

  const lastProductRef = useCallback(node => {
    if (loadingMore) return
    if (observer.current) observer.current.disconnect()
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => prev + 1)
      }
    })
    if (node) observer.current.observe(node)
  }, [loadingMore, hasMore])

  useEffect(() => {
    if (page > 1) {
      fetchMoreProducts()
    }
  }, [page])

  const fetchData = async (p = 1) => {
    setLoading(true)
    try {
      const [prodRes, catRes] = await Promise.all([
        axios.get(`http://127.0.0.1:8000/api/products/?page=${p}`),
        axios.get('http://127.0.0.1:8000/api/categories/')
      ])
      // Handle paginated responses
      setProducts(prodRes.data.results || prodRes.data)
      setHasMore(!!prodRes.data.next)
      setCategories(catRes.data.results || catRes.data)
    } catch (err) {
      console.error("Error fetching data", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchMoreProducts = async () => {
    setLoadingMore(true)
    try {
      const res = await axios.get(`http://127.0.0.1:8000/api/products/?page=${page}`)
      const newProducts = res.data.results || []
      setProducts(prev => [...prev, ...newProducts])
      setHasMore(!!res.data.next)
    } catch (err) {
      console.error("Error fetching more products", err)
    } finally {
      setLoadingMore(false)
    }
  }

  const handleOpenProductModal = (product = null) => {
    if (product) {
      setEditingItem(product)
      setProductForm({
        name: product.name,
        description: product.description || '',
        color: product.color || '',
        pieces_count: product.pieces_count || 1,
        size: product.size || '',
        category: product.category,
        product_type: product.product_type,
        price_sale: product.price_sale || '',
        price_rental: product.price_rental || '',
        stock: product.stock || 0,
        is_active: product.is_active
      })
      setImagePreview(product.image)
    } else {
      setEditingItem(null)
      setProductForm({
        name: '',
        description: '',
        color: '',
        pieces_count: 1,
        size: '',
        category: categories[0]?.id || '',
        product_type: 'sale',
        price_sale: '',
        price_rental: '',
        stock: 0,
        is_active: true
      })
      setImagePreview(null)
    }
    setImageFile(null)
    setShowProductModal(true)
  }

  const handleOpenCategoryModal = (cat = null) => {
    if (cat) {
      setEditingItem(cat)
      setCategoryForm({ name: cat.name, slug: cat.slug })
    } else {
      setEditingItem(null)
      setCategoryForm({ name: '', slug: '' })
    }
    setShowCategoryModal(true)
  }

  const submitProduct = async (e) => {
    e.preventDefault()
    setLoading(true)
    const token = localStorage.getItem('token')
    const data = new FormData()
    
    // Clean data before sending
    const cleanedForm = { ...productForm }
    if (cleanedForm.price_sale === '') delete cleanedForm.price_sale
    if (cleanedForm.price_rental === '') delete cleanedForm.price_rental
    if (!cleanedForm.stock) cleanedForm.stock = 0

    Object.keys(cleanedForm).forEach(key => data.append(key, cleanedForm[key]))
    if (imageFile) data.append('image', imageFile)

    try {
      if (editingItem) {
        await axios.patch(`http://127.0.0.1:8000/api/products/${editingItem.id}/`, data, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        })
      } else {
        await axios.post('http://127.0.0.1:8000/api/products/', data, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        })
      }
      setShowProductModal(false)
      fetchData()
      alert(editingItem ? "Producto actualizado con éxito" : "Producto creado con éxito")
    } catch (err) {
      console.error("Error saving product", err)
      alert("Error al guardar el producto. Verifica los campos.")
    }
    setLoading(false)
  }

  const submitCategory = async (e) => {
    e.preventDefault()
    setLoading(true)
    const token = localStorage.getItem('token')
    const slug = categoryForm.slug || categoryForm.name.toLowerCase().trim().replace(/\s+/g, '-')
    try {
      if (editingItem) {
        await axios.patch(`http://127.0.0.1:8000/api/categories/${editingItem.id}/`, { ...categoryForm, slug }, {
          headers: { Authorization: `Bearer ${token}` }
        })
      } else {
        await axios.post('http://127.0.0.1:8000/api/categories/', { ...categoryForm, slug }, {
          headers: { Authorization: `Bearer ${token}` }
        })
      }
      setShowCategoryModal(false)
      fetchData()
      alert("Categoría guardada con éxito")
    } catch (err) {
      console.error("Error saving category", err)
      alert("Error al guardar la categoría. Asegúrate de que el nombre o slug no estén duplicados.")
    }
    setLoading(false)
  }

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("¿Eliminar producto?")) return
    const token = localStorage.getItem('token')
    try {
      await axios.delete(`http://127.0.0.1:8000/api/products/${id}/`, { headers: { Authorization: `Bearer ${token}` } })
      fetchData()
    } catch (err) {}
  }

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("¿Eliminar categoría? Esto afectará a los productos relacionados.")) return
    const token = localStorage.getItem('token')
    try {
      await axios.delete(`http://127.0.0.1:8000/api/categories/${id}/`, { headers: { Authorization: `Bearer ${token}` } })
      fetchData()
    } catch (err) {}
  }

  return (
    <div className="fade-in" style={{ width: '100%', margin: '0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '50px' }}>
        <h2 className="urban-font gold-text" style={{ fontSize: '2.5rem', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Package size={40} /> Inventario
        </h2>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={() => handleOpenCategoryModal()} className="btn-outline">
            <Tag size={20} /> NUEVA CATEGORÍA
          </button>
          <button onClick={() => handleOpenProductModal()} className="btn-primary">
            <Plus size={20} /> NUEVO PRODUCTO
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '40px', marginBottom: '40px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
        <button onClick={() => setActiveTab('products')} className="urban-font" style={{ border: 'none', background: 'transparent', fontSize: '1.2rem', fontWeight: 'bold', color: activeTab === 'products' ? 'var(--cta)' : 'var(--text-dim)', cursor: 'pointer', borderBottom: activeTab === 'products' ? '3px solid var(--cta)' : '3px solid transparent', paddingBottom: '15px', transition: 'all 0.3s' }}>PRODUCTOS</button>
        <button onClick={() => setActiveTab('categories')} className="urban-font" style={{ border: 'none', background: 'transparent', fontSize: '1.2rem', fontWeight: 'bold', color: activeTab === 'categories' ? 'var(--cta)' : 'var(--text-dim)', cursor: 'pointer', borderBottom: activeTab === 'categories' ? '3px solid var(--cta)' : '3px solid transparent', paddingBottom: '15px', transition: 'all 0.3s' }}>CATEGORÍAS</button>
      </div>

      {activeTab === 'products' ? (
        <div className="table-container" style={{ background: 'var(--primary)', border: '1px solid var(--glass-border)' }}>
          <table className="urban-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Detalles</th>
                <th>Tipo</th>
                <th>Precios</th>
                <th>Stock</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, index) => (
                <tr 
                  ref={index === products.length - 1 ? lastProductRef : null}
                  key={p.id} 
                >
                  <td style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '55px', height: '55px', background: 'var(--secondary)', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                      {p.image && <img src={p.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{p.name}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>ID: #{p.id}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-dim)' }}>{p.category_name}</td>
                  <td>
                    <div style={{ fontSize: '0.8rem' }}>
                      <div><span style={{color: 'var(--text-dim)'}}>Color:</span> {p.color || '-'}</div>
                      <div><span style={{color: 'var(--text-dim)'}}>Talla:</span> {p.size || '-'}</div>
                    </div>
                  </td>
                  <td>
                     <span style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '0.7rem', textTransform: 'uppercase', background: 'var(--secondary)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--cta)', fontWeight: 'bold' }}>{p.product_type}</span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem' }}>
                      {p.price_sale && <div><span style={{color: 'var(--text-dim)'}}>Venta:</span> ${parseFloat(p.price_sale).toLocaleString()}</div>}
                      {p.price_rental && <div><span style={{color: 'var(--text-dim)'}}>Alq:</span> ${parseFloat(p.price_rental).toLocaleString()}</div>}
                    </div>
                  </td>
                  <td style={{ fontWeight: 'bold', fontSize: '1rem' }}>{p.stock}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button onClick={() => handleOpenProductModal(p)} className="btn-icon" style={{ padding: '8px' }}><Edit size={18} /></button>
                      <button onClick={() => handleDeleteProduct(p.id)} className="btn-icon-danger" style={{ padding: '8px' }}><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loadingMore && <div style={{ textAlign: 'center', padding: '20px', color: 'var(--cta)', fontSize: '0.8rem' }}>CARGANDO MÁS PRODUCTOS...</div>}
        </div>
      ) : (
        <div className="table-container" style={{ background: 'var(--primary)', border: '1px solid var(--glass-border)' }}>
          <table className="urban-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Nombre de Categoría</th>
                <th>Slug</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 'bold' }}>{c.name}</td>
                  <td style={{ color: 'var(--text-dim)' }}>{c.slug}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button onClick={() => handleOpenCategoryModal(c)} className="btn-icon" style={{ padding: '8px' }}><Edit size={18} /></button>
                      <button onClick={() => handleDeleteCategory(c.id)} className="btn-icon-danger" style={{ padding: '8px' }}><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showProductModal && (
        <Modal onClose={() => setShowProductModal(false)} title={editingItem ? 'EDITAR PRODUCTO' : 'NUEVO PRODUCTO'}>
          <form onSubmit={submitProduct}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
              
              {/* Image Preview and Upload Section */}
              <div style={{ gridColumn: 'span 2', display: 'flex', gap: '30px', background: 'rgba(255,255,255,0.02)', padding: '25px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '10px' }}>
                <div style={{ width: '150px', height: '150px', background: 'var(--secondary)', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed rgba(255,255,255,0.1)' }}>
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Upload size={40} color="var(--text-dim)" />
                  )}
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '10px', display: 'block' }}>Imagen del Producto</label>
                  <input 
                    type="file" 
                    onChange={e => {
                      const file = e.target.files[0]
                      setImageFile(file)
                      if (file) setImagePreview(URL.createObjectURL(file))
                    }} 
                  />
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '10px' }}>Formatos soportados: JPG, PNG. Máximo 5MB.</p>
                </div>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Nombre del Producto</label>
                <input type="text" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} required style={{ width: '100%' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Color</label>
                <input type="text" value={productForm.color} onChange={e => setProductForm({...productForm, color: e.target.value})} placeholder="Ej: Azul Rey" style={{ width: '100%' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Tamaño / Talla</label>
                <input type="text" value={productForm.size} onChange={e => setProductForm({...productForm, size: e.target.value})} placeholder="Ej: L, M o 1.5m" style={{ width: '100%' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Número de Piezas</label>
                <input type="number" value={productForm.pieces_count} onChange={e => setProductForm({...productForm, pieces_count: e.target.value})} style={{ width: '100%' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Categoría</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <select value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})} style={{ flex: 1 }}>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <button 
                    type="button" 
                    onClick={() => {
                      const name = prompt("Nombre de la nueva categoría:")
                      if (name) {
                        const slug = name.toLowerCase().trim().replace(/\s+/g, '-')
                        const token = localStorage.getItem('token')
                        axios.post('http://127.0.0.1:8000/api/categories/', { name, slug }, {
                          headers: { Authorization: `Bearer ${token}` }
                        }).then(res => {
                          setCategories([...categories, res.data])
                          setProductForm({...productForm, category: res.data.id})
                        }).catch(err => alert("Error al crear categoría rápida"))
                      }
                    }} 
                    className="btn-icon" 
                    style={{ background: 'var(--secondary)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Descripción</label>
                <textarea value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} rows="3" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '15px', borderRadius: '8px' }} />
              </div>

              <div style={{ gridColumn: 'span 2', padding: '20px', background: 'rgba(184, 158, 72, 0.05)', border: '1px solid rgba(184, 158, 72, 0.2)', borderRadius: '8px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--cta)', textTransform: 'uppercase', display: 'block', marginBottom: '15px', fontWeight: 'bold' }}>Modalidad de Negocio</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                  <select value={productForm.product_type} onChange={e => setProductForm({...productForm, product_type: e.target.value})} style={{ width: '100%', background: 'var(--secondary)' }}>
                    <option value="sale">SOLO VENTA</option>
                    <option value="rental">SOLO ALQUILER</option>
                    <option value="both">AMBOS</option>
                  </select>
                  
                  <div>
                    <input type="number" step="0.01" placeholder="Precio Venta $" value={productForm.price_sale} onChange={e => setProductForm({...productForm, price_sale: e.target.value})} disabled={productForm.product_type === 'rental'} style={{ width: '100%', opacity: productForm.product_type === 'rental' ? 0.3 : 1 }} />
                  </div>
                  
                  <div>
                    <input type="number" step="0.01" placeholder="Precio Alquiler $" value={productForm.price_rental} onChange={e => setProductForm({...productForm, price_rental: e.target.value})} disabled={productForm.product_type === 'sale'} style={{ width: '100%', opacity: productForm.product_type === 'sale' ? 0.3 : 1 }} />
                  </div>
                </div>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Stock Disponible</label>
                <input type="number" value={productForm.stock} onChange={e => setProductForm({...productForm, stock: e.target.value})} style={{ width: '100%', fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }} />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', marginTop: '40px' }}>
              {loading ? 'PROCESANDO...' : editingItem ? 'GUARDAR CAMBIOS' : 'CREAR PRODUCTO'}
            </button>
          </form>
        </Modal>
      )}

      {showCategoryModal && (
        <Modal onClose={() => setShowCategoryModal(false)} title={editingItem ? 'EDITAR CATEGORÍA' : 'NUEVA CATEGORÍA'}>
          <form onSubmit={submitCategory}>
            <div style={{ marginBottom: '25px' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Nombre</label>
              <input type="text" value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} required style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: '40px' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Slug (Opcional)</label>
              <input type="text" value={categoryForm.slug} onChange={e => setCategoryForm({...categoryForm, slug: e.target.value})} placeholder="ej: vestidos-gala" style={{ width: '100%' }} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%' }}>
              {loading ? 'GUARDANDO...' : editingItem ? 'ACTUALIZAR CATEGORÍA' : 'CREAR CATEGORÍA'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}

export default Inventory
