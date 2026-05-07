import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import useDebounce from '../hooks/useDebounce'
import { createPortal } from 'react-dom'
import api from '../api/axios'
import { Plus, Edit, Trash2, X, Upload, Check, Package, ArrowRight, Tag, History, Search } from 'lucide-react'
import FeedbackModal from '../components/FeedbackModal'
import Pagination from '../components/shared/Pagination'

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
      <div className="glass-card modal-content-card" style={{ 
        width: '95%', maxWidth: '800px', maxHeight: '90vh', 
        overflowY: 'auto', background: 'var(--primary)', border: '1px solid var(--cta)',
        position: 'relative', padding: '30px'
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
  const [prodPage, setProdPage] = useState(1)
  const [prodTotalPages, setProdTotalPages] = useState(1)
  const [catPage, setCatPage] = useState(1)
  const [catTotalPages, setCatTotalPages] = useState(1)

  const [selectedCategory, setSelectedCategory] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showQuickCategory, setShowQuickCategory] = useState(false)
  const [quickCatName, setQuickCatName] = useState('')
  const [feedback, setFeedback] = useState({ isOpen: false, title: '', message: '', type: 'info', onConfirm: null, showCancel: false })

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
    reference: '',
    is_active: true
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  // Form State for Category
  const [categoryForm, setCategoryForm] = useState({ name: '', slug: '' })

  const fetchProducts = useCallback(async (p = null, catId = selectedCategory, search = searchTerm) => {
    const pageToFetch = p || prodPage
    setLoading(true)
    try {
      let url = `/products/?page=${pageToFetch}`
      if (catId) url += `&category=${catId}`
      if (search) url += `&search=${search}`
      const res = await api.get(url)
      setProducts(res.data.results || res.data)
      if (res.data.count) setProdTotalPages(Math.ceil(res.data.count / 10))
      setProdPage(pageToFetch)
    } catch (err) {
      console.error("Error fetching products", err)
    } finally {
      setLoading(false)
    }
  }, []) // Remove selectedCategory dependency to avoid re-creation

  const debouncedSearch = useDebounce(searchTerm, 500)

  const fetchCategories = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const res = await api.get(`/categories/?page=${p}`)
      setCategories(res.data.results || res.data)
      if (res.data.count) setCatTotalPages(Math.ceil(res.data.count / 10))
      setCatPage(p)
    } catch (err) {
      console.error("Error fetching categories", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts(1, selectedCategory, debouncedSearch)
  }, [debouncedSearch, selectedCategory])

  useEffect(() => {
    fetchCategories(1)
  }, [])

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
        reference: product.reference || '',
        is_active: product.is_active
      })
      setImagePreview(product.image)
    } else {
      setEditingItem(null)
      // Use the first category if available
      const initialCategory = categories.length > 0 ? categories[0].id : ''
      setProductForm({
        name: '',
        description: '',
        color: '',
        pieces_count: 1,
        size: '',
        category: initialCategory,
        product_type: 'sale',
        price_sale: '',
        price_rental: '',
        stock: 0,
        reference: 'REF-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
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
    
    const cleanedForm = { ...productForm }
    if (cleanedForm.price_sale === '') delete cleanedForm.price_sale
    if (cleanedForm.price_rental === '') delete cleanedForm.price_rental
    if (!cleanedForm.stock) cleanedForm.stock = 0

    if (!productForm.name?.trim() || !productForm.category) {
      setFeedback({ isOpen: true, title: 'Campos Obligatorios', message: 'El nombre y la categoría son requeridos.', type: 'warning' })
      setLoading(false)
      return
    }

    if ((productForm.product_type === 'sale' || productForm.product_type === 'both') && (productForm.price_sale === '' || productForm.price_sale === undefined)) {
      setFeedback({ isOpen: true, title: 'Precio Requerido', message: 'Por favor ingresa el precio de venta.', type: 'warning' })
      setLoading(false)
      return
    }

    if ((productForm.product_type === 'rental' || productForm.product_type === 'both') && (productForm.price_rental === '' || productForm.price_rental === undefined)) {
      setFeedback({ isOpen: true, title: 'Precio Requerido', message: 'Por favor ingresa el precio de alquiler.', type: 'warning' })
      setLoading(false)
      return
    }

    Object.keys(cleanedForm).forEach(key => data.append(key, cleanedForm[key]))
    if (imageFile) data.append('image', imageFile)

    try {
      if (editingItem) {
        await api.patch(`/products/${editingItem.id}/`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      } else {
        await api.post('/products/', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }
      setShowProductModal(false)
      fetchProducts(prodPage)
      setFeedback({
        isOpen: true,
        title: 'Éxito',
        message: editingItem ? 'Producto actualizado correctamente.' : 'Producto registrado con éxito.',
        type: 'success'
      })
    } catch (err) {
      setFeedback({
        isOpen: true,
        title: 'Error',
        message: 'No se pudo guardar el producto. Verifica los campos obligatorios.',
        type: 'error'
      })
    }
    setLoading(false)
  }

  const submitCategory = async (e) => {
    e.preventDefault()
    setLoading(true)
    const token = localStorage.getItem('token')
    if (!categoryForm.name) {
      setFeedback({ isOpen: true, title: 'Campos Obligatorios', message: 'El nombre de la categoría es requerido.', type: 'warning' })
      setLoading(false)
      return
    }
    const slug = categoryForm.slug || categoryForm.name.toLowerCase().trim().replace(/\s+/g, '-')
    try {
      if (editingItem) {
        await api.patch(`/categories/${editingItem.id}/`, { ...categoryForm, slug })
      } else {
        await api.post('/categories/', { ...categoryForm, slug })
      }
      setShowCategoryModal(false)
      fetchCategories(catPage)
      setFeedback({
        isOpen: true,
        title: 'Éxito',
        message: 'La categoría ha sido guardada correctamente.',
        type: 'success'
      })
    } catch (err) {
      setFeedback({
        isOpen: true,
        title: 'Error',
        message: 'Error al guardar la categoría. El nombre o slug podrían estar duplicados.',
        type: 'error'
      })
    }
    setLoading(false)
  }

  const handleDeleteProduct = async (id) => {
    setFeedback({
      isOpen: true,
      title: 'Eliminar Producto',
      message: '¿Estás seguro de que deseas eliminar este producto? Esta acción es irreversible.',
      type: 'warning',
      showCancel: true,
      onConfirm: async () => {
        const token = localStorage.getItem('token')
          try {
            await api.delete(`/products/${id}/`)
            fetchProducts(prodPage)
            setFeedback({ isOpen: true, title: 'Eliminado', message: 'Producto eliminado con éxito.', type: 'success' })
          } catch (err) {}
      }
    })
  }

  const handleDeleteCategory = async (id) => {
    setFeedback({
      isOpen: true,
      title: 'Eliminar Categoría',
      message: '¿Eliminar esta categoría? Se desvinculará de todos los productos relacionados.',
      type: 'warning',
      showCancel: true,
      onConfirm: async () => {
        const token = localStorage.getItem('token')
          try {
            await api.delete(`/categories/${id}/`)
            fetchCategories(catPage)
            setFeedback({ isOpen: true, title: 'Eliminado', message: 'Categoría eliminada con éxito.', type: 'success' })
          } catch (err) {}
      }
    })
  }

  return (
    <div className="fade-in" style={{ width: '100%', margin: '0' }}>
      <FeedbackModal {...feedback} onClose={() => setFeedback({ ...feedback, isOpen: false })} />
      <div className="admin-header">
        <h2 className="urban-font gold-text admin-title">
          <Package size={40} /> Inventario
        </h2>
        <div className="admin-actions">
          <button onClick={() => handleOpenCategoryModal()} className="btn-outline">
            <Tag size={20} /> NUEVA CATEGORÍA
          </button>
          <button onClick={() => handleOpenProductModal()} className="btn-primary">
            <Plus size={20} /> NUEVO PRODUCTO
          </button>
        </div>
      </div>

      <div className="inventory-tabs" style={{ display: 'flex', gap: '40px', marginBottom: '40px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px', overflowX: 'auto' }}>
        <button onClick={() => setActiveTab('products')} className={`urban-font tab-btn ${activeTab === 'products' ? 'active' : ''}`}>PRODUCTOS</button>
        <button onClick={() => setActiveTab('categories')} className={`urban-font tab-btn ${activeTab === 'categories' ? 'active' : ''}`}>CATEGORÍAS</button>
      </div>

      {activeTab === 'products' ? (
        <div className="products-container">
          <div className="inventory-filters" style={{ 
            marginBottom: '25px', 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '15px',
            flexWrap: 'wrap'
          }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--cta)' }} />
              <input 
                type="text" 
                placeholder="Buscar por nombre o ID/Ref..." 
                value={searchTerm} 
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  // Optionally add a debounce here, but for now simple search
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setProdPage(1)
                }}
                style={{ width: '100%', paddingLeft: '40px' }} 
              />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Categoría:</span>
              <select 
                value={selectedCategory} 
                onChange={(e) => {
                  setSelectedCategory(e.target.value)
                  setProdPage(1)
                }}
                style={{ 
                  background: 'var(--secondary)', 
                  color: 'white', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  outline: 'none',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  minWidth: '200px'
                }}
              >
              <option value="">Todas las Categorías</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
          
        <div className="table-container loading-overlay-container" style={{ background: 'var(--primary)', border: '1px solid var(--glass-border)' }}>
          {loading && !showProductModal && !showCategoryModal && (
            <div className="loading-overlay">
              <div className="urban-font gold-text" style={{ fontSize: '0.8rem', letterSpacing: '2px' }}>ACTUALIZANDO...</div>
            </div>
          )}
          <table className={`urban-table ${loading && !showProductModal && !showCategoryModal ? 'loading-blur' : ''}`} style={{ width: '100%' }}>
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
              {products.map((p) => (
                <tr key={p.id}>
                  <td style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '55px', height: '55px', background: 'var(--secondary)', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                      {p.image && <img src={p.image} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{p.name}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--cta)', fontWeight: 'bold' }}>REF: {p.reference || p.id}</span>
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
          <Pagination 
            current={prodPage} 
            total={prodTotalPages} 
            onPageChange={(p) => fetchProducts(p, selectedCategory, debouncedSearch)} 
          />
          </div>
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
          <Pagination 
            current={catPage} 
            total={catTotalPages} 
            onPageChange={(p) => fetchCategories(p)} 
          />
        </div>
      )}

      {showProductModal && (
        <Modal onClose={() => setShowProductModal(false)} title={editingItem ? 'EDITAR PRODUCTO' : 'NUEVO PRODUCTO'}>
          <form onSubmit={submitProduct}>
            <div className="inventory-form-container">
              
              {/* Image Preview and Upload Section */}
              <div className="image-upload-wrapper" style={{ display: 'flex', gap: '30px', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '25px', alignItems: 'center' }}>
                <div className="image-preview-box" style={{ width: '120px', height: '120px', background: 'var(--secondary)', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed rgba(255,255,255,0.1)', flexShrink: 0 }}>
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Upload size={30} color="var(--text-dim)" />
                  )}
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Imagen del Producto</label>
                  <input 
                    type="file" 
                    onChange={e => {
                      const file = e.target.files[0]
                      setImageFile(file)
                      if (file) setImagePreview(URL.createObjectURL(file))
                    }} 
                    style={{ fontSize: '0.7rem', width: '100%', maxWidth: '180px', color: 'var(--text-dim)' }}
                  />
                </div>
              </div>

              <div className="pos-form-row">
                <div className="pos-form-group" style={{ flex: 2 }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Nombre del Producto</label>
                  <input type="text" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} required style={{ width: '100%' }} />
                </div>
                <div className="pos-form-group" style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>ID / Referencia</label>
                  <input type="text" value={productForm.reference} onChange={e => setProductForm({...productForm, reference: e.target.value})} style={{ width: '100%', color: 'var(--cta)', fontWeight: 'bold' }} />
                </div>
              </div>

              <div className="pos-form-row">
                <div className="pos-form-group">
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Color</label>
                  <input type="text" value={productForm.color} onChange={e => setProductForm({...productForm, color: e.target.value})} placeholder="Ej: Azul Rey" style={{ width: '100%' }} />
                </div>
                <div className="pos-form-group">
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Tamaño / Talla</label>
                  <input type="text" value={productForm.size} onChange={e => setProductForm({...productForm, size: e.target.value})} placeholder="Ej: L, M o 1.5m" style={{ width: '100%' }} />
                </div>
              </div>

              <div className="pos-form-row">
                <div className="pos-form-group">
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Piezas</label>
                  <input type="number" value={productForm.pieces_count} onChange={e => setProductForm({...productForm, pieces_count: e.target.value})} style={{ width: '100%' }} />
                </div>
                <div className="pos-form-group">
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Categoría</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <select value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})} style={{ flex: 1 }}>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <button 
                      type="button" 
                      onClick={() => setShowQuickCategory(true)} 
                      className="btn-icon" 
                      style={{ background: 'var(--secondary)', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="pos-form-row">
                <div className="pos-form-group">
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Descripción</label>
                  <textarea value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} rows="2" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '12px', borderRadius: '8px' }} />
                </div>
              </div>

              <div style={{ padding: '20px', background: 'rgba(184, 158, 72, 0.05)', border: '1px solid rgba(184, 158, 72, 0.2)', borderRadius: '12px', marginBottom: '25px' }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--cta)', textTransform: 'uppercase', display: 'block', marginBottom: '15px', fontWeight: 'bold' }}>Modalidad de Negocio</label>
                <div className="pos-form-row">
                  <div className="pos-form-group">
                    <label style={{ fontSize: '0.6rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Tipo</label>
                    <select value={productForm.product_type} onChange={e => setProductForm({...productForm, product_type: e.target.value})} style={{ width: '100%', background: 'var(--secondary)' }}>
                      <option value="sale">SOLO VENTA</option>
                      <option value="rental">SOLO ALQUILER</option>
                      <option value="both">AMBOS</option>
                    </select>
                  </div>
                  <div className="pos-form-group">
                    <label style={{ fontSize: '0.6rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Venta $</label>
                    <input type="number" step="0.01" value={productForm.price_sale} onChange={e => setProductForm({...productForm, price_sale: e.target.value})} disabled={productForm.product_type === 'rental'} style={{ width: '100%', opacity: productForm.product_type === 'rental' ? 0.3 : 1 }} />
                  </div>
                  <div className="pos-form-group">
                    <label style={{ fontSize: '0.6rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Alquiler $</label>
                    <input type="number" step="0.01" value={productForm.price_rental} onChange={e => setProductForm({...productForm, price_rental: e.target.value})} disabled={productForm.product_type === 'sale'} style={{ width: '100%', opacity: productForm.product_type === 'sale' ? 0.3 : 1 }} />
                  </div>
                </div>
              </div>

              <div className="pos-form-row">
                <div className="pos-form-group">
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Stock Disponible</label>
                  <input type="number" value={productForm.stock} onChange={e => setProductForm({...productForm, stock: e.target.value})} style={{ width: '100%', fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }} />
                </div>
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

      {showQuickCategory && (
        <Modal onClose={() => setShowQuickCategory(false)} title="RÁPIDA: NUEVA CATEGORÍA">
          <div style={{ padding: '10px' }}>
            <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>Nombre de la Categoría</label>
            <input 
              type="text" 
              value={quickCatName} 
              onChange={e => setQuickCatName(e.target.value)} 
              placeholder="Ej: Accesorios"
              style={{ width: '100%', marginBottom: '25px' }} 
              autoFocus
            />
            <button 
              onClick={async () => {
                if (!quickCatName.trim()) return
                const slug = quickCatName.toLowerCase().trim().replace(/\s+/g, '-')
                const token = localStorage.getItem('token')
                try {
                  const res = await api.post('/categories/', { name: quickCatName, slug })
                  setCategories([...categories, res.data])
                  setProductForm({...productForm, category: res.data.id})
                  setShowQuickCategory(false)
                  setQuickCatName('')
                  setFeedback({ isOpen: true, title: 'Éxito', message: 'Categoría creada y seleccionada.', type: 'success' })
                } catch (err) {
                  setFeedback({ isOpen: true, title: 'Error', message: 'No se pudo crear la categoría rápida.', type: 'error' })
                }
              }} 
              className="btn-primary" 
              style={{ width: '100%' }}
            >
              CREAR Y SELECCIONAR
            </button>
          </div>
        </Modal>
      )}

      <FeedbackModal {...feedback} onClose={() => setFeedback({ ...feedback, isOpen: false })} />
      <style>{`
        .tab-btn {
          border: none;
          background: transparent;
          font-size: 1.2rem;
          font-weight: bold;
          color: var(--text-dim);
          cursor: pointer;
          border-bottom: 3px solid transparent;
          padding-bottom: 15px;
          transition: all 0.3s;
          white-space: nowrap;
        }
        .tab-btn.active {
          color: var(--cta);
          border-bottom: 3px solid var(--cta);
        }
        
        @media (max-width: 1024px) {
          .inventory-tabs {
            gap: 20px !important;
          }
          .tab-btn {
            font-size: 0.9rem !important;
            padding-bottom: 10px !important;
          }
          .admin-actions button {
            padding: 10px 15px !important;
            font-size: 0.7rem !important;
          }

          .image-upload-wrapper {
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
            gap: 20px !important;
          }

          .modal-content-card {
            padding: 20px !important;
          }
        }
      `}</style>
    </div>
  )
}

export default Inventory
