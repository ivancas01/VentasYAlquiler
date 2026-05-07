import React, { useState, useEffect, useMemo } from 'react'
import useDebounce from '../hooks/useDebounce'
import api from '../api/axios'
import { Plus, Trash2, ShoppingCart, Calendar, User, DollarSign, Package, Eye, AlertCircle, CheckCircle, Info, Landmark, X, Search, Upload, Printer } from 'lucide-react'
import FeedbackModal from '../components/FeedbackModal'
import { createPortal } from 'react-dom'
import { formatCurrency } from '../utils/format'
import Pagination from '../components/shared/Pagination'
import POSReceipt from '../components/POSReceipt'
import { useSite } from '../context/SiteContext'
import { useAuth } from '../context/AuthContext'

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${api.defaults.baseURL.replace('/api', '')}${cleanPath}`;
}

const Modal = ({ children, onClose, title }) => {
  return createPortal(
    <div style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(15px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999999 
    }}>
      <div className="glass-card" style={{ 
        padding: '50px', width: '95%', maxWidth: '800px', maxHeight: '90vh', 
        overflowY: 'auto', background: 'var(--primary)', border: '1px solid var(--cta)',
        position: 'relative'
      }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '30px', right: '30px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'white', zIndex: 10 }}>
          <X size={28} />
        </button>
        <h3 className="urban-font gold-text" style={{ fontSize: '1.8rem', marginBottom: '30px' }}>{title}</h3>
        {children}
      </div>
    </div>,
    document.body
  )
}

const AdminPOS = () => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [cart, setCart] = useState([])
  
  const [showProductModal, setShowProductModal] = useState(false)
  const [loadingProduct, setLoadingProduct] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [productForm, setProductForm] = useState({
    name: '', description: '', color: '', pieces_count: 1, size: '',
    category: '', product_type: 'both', price_sale: '', price_rental: '',
    stock: 1, reference: '', is_active: true
  })
  
  const [customer, setCustomer] = useState({
    full_name: '',
    doc_type: 'CC',
    doc_id: '',
    city: '',
    address: '',
    phone: '',
    phone_ref: '',
    name_ref: ''
  })
  
  const [paymentMethod, setPaymentMethod] = useState('efectivo')
  const [bank, setBank] = useState('nequi')
  const [initialPayment, setInitialPayment] = useState('0')
  const [type, setType] = useState('sale') 
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [guarantee, setGuarantee] = useState('')
  const [guaranteeType, setGuaranteeType] = useState('documento')
  const [description, setDescription] = useState('')

  const [feedback, setFeedback] = useState({ isOpen: false, title: '', message: '', type: 'info', onConfirm: null, showCancel: false })
  
  // Receipt State
  const [showReceipt, setShowReceipt] = useState(false)
  const [receiptData, setReceiptData] = useState(null)
  const { config } = useSite()
  const { user: currentUser } = useAuth()
  
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [success, setSuccess] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [availability, setAvailability] = useState({})
  const [conflicts, setConflicts] = useState({})

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    if (type === 'rental' && startDate && endDate && products.length > 0) {
      fetchAvailability()
    } else {
      setAvailability({})
    }
  }, [type, startDate, endDate, products])

  const debouncedSearch = useDebounce(searchTerm, 500)
  const debouncedDocId = useDebounce(customer.doc_id, 800)

  useEffect(() => {
    fetchProducts(1)
  }, [debouncedSearch, selectedCategory])

  useEffect(() => {
    if (debouncedDocId && debouncedDocId.length >= 5) {
      lookupCustomer(debouncedDocId)
    }
  }, [debouncedDocId])

  useEffect(() => {
    const initData = async () => {
      setFetching(true)
      await fetchCategories()
      // fetchProducts(1) removed here as it's triggered by the other useEffect [searchTerm, selectedCategory]
      setFetching(false)
    }
    initData()
  }, [])

  const fetchAvailability = async () => {
    if (!startDate || !endDate || products.length === 0) return
    try {
      const ids = products.map(p => p.id).join(',')
      const res = await api.get(`/products/availability/?start_date=${startDate}&end_date=${endDate}&ids=${ids}`)
      const availMap = {}
      const conflictMap = {}
      res.data.forEach(item => {
        availMap[item.id] = item.available_stock
        conflictMap[item.id] = item.conflicts
      })
      setAvailability(availMap)
      setConflicts(conflictMap)
    } catch (err) {
      console.error("Error fetching availability", err)
    }
  }

  const fetchProducts = async (page = 1) => {
    try {
      const res = await api.get(`/products/`, {
        params: { 
          page, 
          search: searchTerm, 
          category: selectedCategory !== 'all' ? selectedCategory : undefined 
        }
      })
      const data = res.data.results || res.data
      setProducts(Array.isArray(data) ? data : [])
      
      if (res.data.count) {
        setTotalPages(Math.ceil(res.data.count / 10))
      }
      setCurrentPage(page)
    } catch (err) { 
      console.error("Error fetching products", err)
      setProducts([])
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories/')
      const data = res.data.results || res.data
      setCategories(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Error fetching categories", err)
    }
  }

  const lookupCustomer = async (val) => {
    if (!val || val.length < 5) {
      setCustomer(prev => ({ ...prev, id: null }))
      return
    }
    try {
      const res = await api.get(`/customers/?doc_id=${val}`)
      const data = res.data.results || res.data
      const results = Array.isArray(data) ? data : []
      
      if (results.length === 1) {
        const c = results[0]
        if (c.doc_id === val || c.dni === val) {
          setCustomer({
            id: c.id,
            full_name: c.full_name || '',
            doc_type: c.doc_type || 'CC',
            doc_id: c.doc_id || c.dni || val, 
            city: c.city || '',
            address: c.address || '',
            phone: c.phone || '',
            phone_ref: c.phone_ref || '',
            name_ref: c.name_ref || ''
          })
        }
      } else {
        setCustomer(prev => ({ ...prev, id: null }))
      }
    } catch (err) {
      console.error("Lookup error", err)
    }
  }

  const submitQuickProduct = async (e) => {
    e.preventDefault()
    setLoadingProduct(true)
    const token = localStorage.getItem('token')
    const data = new FormData()
    
    const cleanedForm = { ...productForm }
    if (cleanedForm.price_sale === '') delete cleanedForm.price_sale
    if (cleanedForm.price_rental === '') delete cleanedForm.price_rental
    if (!cleanedForm.category && categories.length > 0) cleanedForm.category = categories[0].id

    Object.keys(cleanedForm).forEach(key => data.append(key, cleanedForm[key]))
    if (imageFile) data.append('image', imageFile)

    try {
      const res = await api.post('/products/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      fetchProducts()
      addToCart(res.data)
      setShowProductModal(false)
      setProductForm({
        name: '', description: '', color: '', pieces_count: 1, size: '',
        category: categories[0]?.id || '', product_type: 'both', price_sale: '', price_rental: '',
        stock: 1, reference: '', is_active: true
      })
      setImageFile(null)
      setImagePreview(null)
    } catch (err) {
      setFeedback({ isOpen: true, title: 'Error', message: 'Error al crear producto rápido', type: 'error' })
    }
    setLoadingProduct(false)
  }

  const addToCart = (product) => {
    if (type === 'sale' && product.stock <= 0) {
      setFeedback({ isOpen: true, title: 'Sin Stock', message: 'Producto sin stock disponible para venta.', type: 'error' })
      return
    }
    
    if (type === 'rental') {
      if (!startDate || !endDate) {
        setFeedback({ isOpen: true, title: 'Fechas Requeridas', message: 'Por favor seleccione las fechas del alquiler antes de agregar prendas.', type: 'warning' })
        return
      }
      const avail = availability[product.id] ?? product.stock
      if (avail <= 0) {
        setFeedback({ isOpen: true, title: 'No Disponible', message: 'Este producto no está disponible para las fechas seleccionadas.', type: 'error' })
        return
      }
    }

    if (cart.find(item => item.id === product.id)) return
    const price = type === 'sale' ? (product.price_sale || 0) : (product.price_rental || 0)
    setCart([...cart, { ...product, quantity: 1, custom_price: price }])
  }

  const calculateTotal = () => {
    return cart.reduce((acc, item) => acc + (parseFloat(item.custom_price || 0) * (item.quantity || 1)), 0)
  }

  const handleSubmit = async () => {
    const name = (customer.full_name || '').trim()
    const doc = (customer.doc_id || '').trim()

    if (cart.length === 0) {
      setFeedback({ isOpen: true, title: 'Carrito Vacío', message: 'El carrito está vacío.', type: 'warning' })
      return
    }
    if (!name || !doc) {
      setFeedback({ isOpen: true, title: 'Datos del Cliente', message: 'Por favor complete el nombre y documento del cliente.', type: 'warning' })
      return
    }
    if (type === 'rental' && (!startDate || !endDate)) {
      setFeedback({ isOpen: true, title: 'Fechas Requeridas', message: 'Por favor seleccione las fechas de recogida y devolución.', type: 'warning' })
      return
    }

    setLoading(true)

    const token = localStorage.getItem('token')
    const total = calculateTotal()

    try {
      let customerId = customer.id
      const customerPayload = { ...customer }
      if (customerId) {
        await api.patch(`/customers/${customerId}/`, customerPayload)
      } else {
        const cRes = await api.post('/customers/', customerPayload)
        customerId = cRes.data.id
      }

      let res;
      if (type === 'sale') {
        res = await api.post('/sales/', {
          customer: customerId,
          total: total,
          description: description,
          items: cart.map(item => ({ product: item.id, quantity: 1, price_at_sale: item.custom_price }))
        })
      } else {
        res = await api.post('/rentals/', {
          customer: customerId,
          start_date: startDate || new Date().toISOString().split('T')[0],
          end_date: endDate || new Date().toISOString().split('T')[0],
          total: total,
          guarantee_type: guaranteeType,
          guarantee_info: guarantee,
          description: description,
          items: cart.map(item => ({ product: item.id, price_at_rental: item.custom_price }))
        })
      }

      if (parseFloat(initialPayment) > 0) {
        await api.post('/payments/', {
          rental: type === 'rental' ? res.data.id : null,
          sale: type === 'sale' ? res.data.id : null,
          amount: initialPayment,
          payment_method: paymentMethod,
          bank: paymentMethod === 'transferencia' ? bank : null,
          label: type === 'sale' ? 'Venta' : 'Abono Inicial'
        })
      }

      setFeedback({ 
        isOpen: true, 
        title: '¡TRANSACCIÓN EXITOSA!', 
        message: type === 'sale' ? 'La venta se ha procesado con éxito.' : 'El alquiler se ha registrado correctamente.',
        type: 'success' 
      })
      // Refetch to get updated totals and payments
      const finalRes = await api.get(type === 'sale' ? `/sales/${res.data.id}/` : `/rentals/${res.data.id}/`)

      setReceiptData({
        ...finalRes.data,
        customer_name: name,
        customer_doc: doc,
        staff_name: currentUser?.username || 'Admin',
        payment_method: paymentMethod,
        bank: paymentMethod === 'transferencia' ? bank : null,
        description: description
      })
      setShowReceipt(true)

      setCart([])
      setCustomer({ full_name: '', doc_type: 'CC', doc_id: '', city: '', address: '', phone: '', phone_ref: '', name_ref: '' })
      setInitialPayment('0')
      setStartDate('')
      setEndDate('')
      setGuarantee('')
      setDescription('')
      fetchProducts()
      if (type === 'rental') fetchAvailability()
    } catch (err) {
      setFeedback({ isOpen: true, title: 'Error', message: 'Error al procesar la transacción. Verifica los campos obligatorios.', type: 'error' })
    }
    setLoading(false)
  }

  const filteredProducts = products.filter(p => {
    const matchesType = type === 'sale' ? p.product_type !== 'rental' : p.product_type !== 'sale'
    return matchesType
  })

  return (
    <div className="fade-in pos-main-container" style={{ width: '100%', margin: '0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '40px' }}>
      
      <div className="glass-card" style={{ padding: '40px', display: 'flex', flexDirection: 'column' }}>
      <div className="admin-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '20px', marginBottom: '30px' }}>
        <h2 className="urban-font gold-text admin-title" style={{ marginBottom: '10px' }}>Punto de Venta</h2>
        <div className="admin-actions">
          <button onClick={() => {
            setShowProductModal(true)
            setProductForm({ ...productForm, reference: 'REF-' + Math.random().toString(36).substr(2, 6).toUpperCase() })
          }} className="btn-outline btn-sm">
            <Plus size={16} /> NUEVO
          </button>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => { setType('sale'); setCart([]); }} className={`${type === 'sale' ? 'btn-primary' : 'btn-outline'} btn-sm`}>Venta</button>
            <button onClick={() => { setType('rental'); setCart([]); }} className={`${type === 'rental' ? 'btn-primary' : 'btn-outline'} btn-sm`}>Alquiler</button>
          </div>
        </div>
      </div>
      
      {type === 'rental' && (!startDate || !endDate) && (
        <div className="fade-in" style={{ 
          background: 'rgba(37, 99, 235, 0.1)', 
          border: '1px solid var(--cta)', 
          padding: '15px 25px', 
          marginBottom: '30px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '15px',
          borderRadius: '0px'
        }}>
          <Calendar size={24} color="var(--cta)" />
          <div>
            <h4 style={{ fontSize: '0.8rem', color: 'white', letterSpacing: '1px' }}>ACCION REQUERIDA</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Por favor, seleccione las fechas de recogida y devolución para verificar disponibilidad.</p>
          </div>
        </div>
      )}

        <div className="pos-search-filters" style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--cta)' }} />
            <input type="text" placeholder="Buscar producto..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: '100%', paddingLeft: '40px' }} />
          </div>
          <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} style={{ width: '220px' }}>
            <option value="all">TODAS LAS CATEGORÍAS</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}
          </select>
        </div>

        {fetching ? (
          <div style={{ textAlign: 'center', padding: '100px', color: 'var(--cta)' }}>CARGANDO ARTÍCULOS...</div>
        ) : (
          <div className="pos-products-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '25px' }}>
            {filteredProducts.map(product => {
              const avail = availability[product.id] ?? product.stock
              const hasDates = type === 'rental' && startDate && endDate
              const isAvailable = hasDates ? (avail > 0) : (product.stock > 0)
              const availCount = hasDates ? (availability[product.id] ?? product.stock) : product.stock
              
              return (
                <div key={product.id} className="glass-card" style={{ padding: '20px', textAlign: 'center', opacity: isAvailable ? 1 : 0.6 }}>
                  <div style={{ height: '120px', background: 'var(--secondary)', borderRadius: '4px', marginBottom: '15px', overflow: 'hidden', position: 'relative' }}>
                    {product.image && <img src={getImageUrl(product.image)} alt="" style={{width: '100%', height: '100%', objectFit: 'cover'}} />}
                    {!isAvailable && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {type === 'sale' ? 'AGOTADO' : 'ALQUILADO'}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '0.9rem', color: 'white', marginBottom: '4px' }}>{product.name}</h4>
                    <span style={{ fontSize: '0.65rem', color: 'var(--cta)', fontWeight: 'bold' }}>{product.reference || `#${product.id}`}</span>
                  </div>
                  <p style={{ color: 'var(--cta)', fontWeight: 'bold', fontSize: '0.9rem' }}>{formatCurrency(type === 'sale' ? (product.price_sale || 0) : (product.price_rental || 0))}</p>
                  
                  <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <p style={{ fontSize: '0.65rem', color: isAvailable ? 'var(--text-dim)' : '#ef4444', fontWeight: 'bold' }}>
                      {type === 'rental' ? 'DISPONIBILIDAD:' : 'STOCK VENTA:'} {availCount}
                    </p>
                    {type === 'rental' && (!startDate || !endDate) && (
                      <p style={{ fontSize: '0.6rem', color: 'var(--cta)', fontWeight: 'bold' }}>SELECCIONE FECHAS</p>
                    )}
                  </div>
                      {conflicts[product.id]?.length > 0 && (
                        <div style={{ marginTop: '8px', padding: '10px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                          <p style={{ fontSize: '0.6rem', color: '#ef4444', fontWeight: 'bold', marginBottom: '4px', textTransform: 'uppercase' }}>Ocupado en:</p>
                          {conflicts[product.id].map((c, idx) => (
                            <div key={idx} style={{ fontSize: '0.55rem', color: 'var(--text-dim)' }}>
                              {c.start} al {c.end}
                            </div>
                          ))}
                        </div>
                      )}
                  <button 
                    onClick={() => addToCart(product)} 
                    disabled={!isAvailable}
                    className="btn-primary" 
                    style={{ marginTop: '15px', width: '100%', opacity: isAvailable ? 1 : 0.3 }}
                  >
                    <Plus size={18} /> AGREGAR
                  </button>
                </div>
              )
            })}
            {filteredProducts.length === 0 && (
              <div style={{ gridColumn: '1 / -1', padding: '50px', textAlign: 'center', color: 'var(--text-dim)' }}>
                No se encontraron productos.
              </div>
            )}
          </div>
        )}
        <Pagination 
          current={currentPage} 
          total={totalPages} 
          onPageChange={(p) => {
            setCurrentPage(p);
            fetchProducts(p);
          }} 
        />
      </div>

      <div className="glass-card" style={{ padding: '40px', height: 'fit-content', border: '1px solid var(--cta)', position: 'sticky', top: '20px' }}>
        {cart.length > 0 && (
          <div style={{ marginBottom: '40px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h3 className="urban-font" style={{ margin: 0, color: 'white', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShoppingCart size={22} /> Items en Carrito
              </h3>
              <button onClick={() => setCart([])} className="btn-outline btn-sm" style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}>LIMPIAR</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
              {cart.map(item => (
                <div key={item.id} className="glass-card pos-cart-item" style={{ padding: '15px', background: 'rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{item.name}</div>
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>{item.category_name}</div>
                  </div>
                  <div className="pos-cart-item-actions" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <label style={{ fontSize: '0.6rem', color: 'var(--text-dim)', display: 'block', marginBottom: '2px' }}>PRECIO</label>
                      <input 
                        type="number" 
                        value={item.custom_price} 
                        onChange={(e) => {
                          const newCart = cart.map(i => i.id === item.id ? { ...i, custom_price: e.target.value } : i)
                          setCart(newCart)
                        }} 
                        style={{ width: '100px', textAlign: 'right', padding: '5px', fontSize: '0.9rem', background: 'transparent', border: '1px solid var(--cta)' }} 
                      />
                    </div>
                    <button onClick={() => setCart(cart.filter(i => i.id !== item.id))} style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', padding: '5px' }}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <h3 className="urban-font" style={{ marginBottom: '30px', color: 'var(--cta)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <User size={22} /> Datos del Cliente
          {customer.id && (
            <span className="fade-in" style={{ fontSize: '0.65rem', color: 'var(--cta)', border: '1px solid var(--cta)', padding: '2px 8px', borderRadius: '4px', marginLeft: '10px' }}>REGISTRADO</span>
          )}
        </h3>
        
        <div className="pos-form-row">
          <div className="pos-form-group">
            <label style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Tipo Doc</label>
            <select value={customer.doc_type || 'CC'} onChange={e => setCustomer({...customer, doc_type: e.target.value})} style={{ width: '100%' }}>
              <option value="CC">Cédula Ciudadanía</option>
              <option value="CE">Extranjería</option>
              <option value="TI">Tarjeta Identidad</option>
              <option value="PP">Pasaporte</option>
            </select>
          </div>
          <div className="pos-form-group">
            <label style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Documento</label>
            <input type="text" value={customer.doc_id || ''} onChange={e => setCustomer({...customer, doc_id: e.target.value})} style={{ width: '100%' }} />
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Nombre Completo</label>
          <input type="text" value={customer.full_name || ''} onChange={e => setCustomer({...customer, full_name: e.target.value})} style={{ width: '100%' }} />
        </div>

        <div className="pos-form-row">
          <div className="pos-form-group">
            <label style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Ciudad</label>
            <input type="text" value={customer.city || ''} onChange={e => setCustomer({...customer, city: e.target.value})} style={{ width: '100%' }} />
          </div>
          <div className="pos-form-group">
            <label style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Dirección</label>
            <input type="text" value={customer.address || ''} onChange={e => setCustomer({...customer, address: e.target.value})} style={{ width: '100%' }} />
          </div>
        </div>

        <div className="pos-form-row">
          <div className="pos-form-group">
            <label style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Teléfono Personal</label>
            <input type="text" value={customer.phone || ''} onChange={e => setCustomer({...customer, phone: e.target.value})} style={{ width: '100%' }} />
          </div>
          <div className="pos-form-group">
            <label style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Nombre Referencia</label>
            <input type="text" value={customer.name_ref || ''} onChange={e => setCustomer({...customer, name_ref: e.target.value})} style={{ width: '100%' }} />
          </div>
          <div className="pos-form-group" style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Teléfono Referencia</label>
            <input type="text" value={customer.phone_ref || ''} onChange={e => setCustomer({...customer, phone_ref: e.target.value})} style={{ width: '100%' }} />
          </div>
        </div>

        <h3 className="urban-font" style={{ marginBottom: '25px', color: 'var(--cta)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Landmark size={22} /> Pago y Garantía
        </h3>

        {type === 'rental' && (
          <>
            <div className="pos-form-row">
              <div className="pos-form-group">
                <label style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Recogida</label>
                <input type="date" value={startDate || ''} onChange={e => setStartDate(e.target.value)} style={{ width: '100%' }} />
              </div>
              <div className="pos-form-group">
                <label style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Devolución</label>
                <input type="date" value={endDate || ''} onChange={e => setEndDate(e.target.value)} style={{ width: '100%' }} />
              </div>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Garantía</label>
              <div className="pos-form-row" style={{ marginTop: '8px' }}>
                <div className="pos-form-group">
                  <select value={guaranteeType || 'documento'} onChange={e => setGuaranteeType(e.target.value)} style={{ width: '100%' }}>
                    <option value="documento">DOCUMENTO</option>
                    <option value="monto">MONTO EFECTIVO</option>
                    <option value="otro">OTRO</option>
                  </select>
                </div>
                <div className="pos-form-group">
                  <input 
                    type="text" 
                    value={guarantee || ''} 
                    onChange={(e) => setGuarantee(e.target.value)} 
                    style={{ width: '100%' }} 
                    placeholder={guaranteeType === 'monto' ? 'Monto $' : 'Detalle...'} 
                  />
                </div>
              </div>
            </div>
          </>
        )}

        <div className="pos-form-row">
          <div className="pos-form-group">
            <label style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Método de Pago</label>
            <select value={paymentMethod || 'efectivo'} onChange={e => setPaymentMethod(e.target.value)} style={{ width: '100%' }}>
              <option value="efectivo">EFECTIVO</option>
              <option value="transferencia">TRANSFERENCIA</option>
            </select>
          </div>
          {paymentMethod === 'transferencia' && (
            <div className="pos-form-group">
              <label style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Banco</label>
              <select value={bank || 'nequi'} onChange={e => setBank(e.target.value)} style={{ width: '100%' }}>
                <option value="nequi">NEQUI</option>
                <option value="bancolombia">BANCOLOMBIA</option>
                <option value="daviplata">DAVIPLATA</option>
                <option value="banco_bogota">BANCO DE BOGOTÁ</option>
                <option value="otro">OTRO</option>
              </select>
            </div>
          )}
        </div>

        <div style={{ marginBottom: '25px' }}>
          <label style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Abono Inicial</label>
          <input type="number" value={initialPayment || '0'} onChange={e => setInitialPayment(e.target.value)} style={{ width: '100%', fontSize: '1.1rem', color: 'var(--cta)', fontWeight: 'bold' }} />
        </div>

        <div style={{ marginBottom: '25px' }}>
          <label style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Descripción / Notas de la Factura</label>
          <textarea 
            value={description || ''} 
            onChange={e => setDescription(e.target.value)} 
            placeholder="Ej: Vestido para grado, incluye accesorios..."
            style={{ width: '100%', minHeight: '80px', padding: '12px', background: 'transparent', border: '1px solid var(--cta)', color: 'white', borderRadius: '4px' }}
          />
        </div>

        {cart.length > 0 && (
          <div style={{ background: 'var(--secondary)', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.4rem', color: 'white', marginBottom: '8px' }}>
              <span>TOTAL</span>
              <span className="gold-text">{formatCurrency(calculateTotal())}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--cta)', fontSize: '0.9rem', fontWeight: 'bold' }}>
              <span>PENDIENTE</span>
              <span>{formatCurrency(calculateTotal() - parseFloat(initialPayment || 0))}</span>
            </div>
          </div>
        )}

        <button onClick={handleSubmit} disabled={loading || cart.length === 0} className="btn-primary" style={{ width: '100%' }}>
          {loading ? 'PROCESANDO...' : `CONFIRMAR ${type === 'sale' ? 'VENTA' : 'ALQUILER'}`}
        </button>
        
        {success && (
          <div className="fade-in" style={{ color: '#10b981', marginTop: '20px', textAlign: 'center', fontWeight: 'bold' }}>
             ¡TRANSACCIÓN EXITOSA!
          </div>
        )}
      </div>
      {showProductModal && (
        <Modal onClose={() => setShowProductModal(false)} title="NUEVO PRODUCTO RÁPIDO">
          <form onSubmit={submitQuickProduct} className="quick-product-form">
            <div className="pos-modal-image-section" style={{ display: 'flex', gap: '20px', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '25px' }}>
              <div style={{ width: '80px', height: '80px', minWidth: '80px', background: 'var(--secondary)', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed rgba(255,255,255,0.1)' }}>
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Upload size={30} color="var(--text-dim)" />
                )}
              </div>
              <div className="pos-form-group" style={{ flex: 1, justifyContent: 'center' }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px' }}>Imagen del Producto</label>
                <input type="file" onChange={e => {
                    const file = e.target.files[0]
                    setImageFile(file)
                    if (file) setImagePreview(URL.createObjectURL(file))
                  }} style={{ fontSize: '0.75rem', color: 'var(--cta)' }} />
              </div>
            </div>

            <div className="pos-form-row">
              <div className="pos-form-group" style={{ flex: 2 }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Nombre del Producto</label>
                <input type="text" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} required style={{ width: '100%' }} />
              </div>
              <div className="pos-form-group" style={{ flex: 1 }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>ID / Ref</label>
                <input type="text" value={productForm.reference} onChange={e => setProductForm({...productForm, reference: e.target.value})} style={{ width: '100%', color: 'var(--cta)', fontWeight: 'bold' }} />
              </div>
            </div>

            <div className="pos-form-row">
              <div className="pos-form-group">
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Color</label>
                <input type="text" value={productForm.color} onChange={e => setProductForm({...productForm, color: e.target.value})} style={{ width: '100%' }} />
              </div>
              <div className="pos-form-group">
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Talla / Tamaño</label>
                <input type="text" value={productForm.size} onChange={e => setProductForm({...productForm, size: e.target.value})} style={{ width: '100%' }} />
              </div>
            </div>

            <div className="pos-form-row">
              <div className="pos-form-group">
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Categoría</label>
                <select value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})} style={{ width: '100%' }}>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="pos-form-group">
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Stock Disponible</label>
                <input type="number" value={productForm.stock} onChange={e => setProductForm({...productForm, stock: e.target.value})} style={{ width: '100%' }} />
              </div>
            </div>

            <div style={{ padding: '20px', background: 'rgba(184, 158, 72, 0.05)', border: '1px solid rgba(184, 158, 72, 0.2)', borderRadius: '8px', marginTop: '10px' }}>
              <div className="pos-form-group" style={{ marginBottom: '15px' }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Modalidad de Negocio</label>
                <select value={productForm.product_type} onChange={e => setProductForm({...productForm, product_type: e.target.value})} style={{ width: '100%', background: 'var(--secondary)' }}>
                  <option value="sale">SOLO VENTA</option>
                  <option value="rental">SOLO ALQUILER</option>
                  <option value="both">AMBOS</option>
                </select>
              </div>
              <div className="pos-form-row" style={{ marginBottom: 0 }}>
                <div className="pos-form-group">
                  <input type="number" step="0.01" placeholder="Precio Venta $" value={productForm.price_sale} onChange={e => setProductForm({...productForm, price_sale: e.target.value})} disabled={productForm.product_type === 'rental'} style={{ width: '100%' }} />
                </div>
                <div className="pos-form-group">
                  <input type="number" step="0.01" placeholder="Precio Alquiler $" value={productForm.price_rental} onChange={e => setProductForm({...productForm, price_rental: e.target.value})} disabled={productForm.product_type === 'sale'} style={{ width: '100%' }} />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loadingProduct} className="btn-primary" style={{ width: '100%', marginTop: '30px' }}>
              {loadingProduct ? 'CREANDO...' : 'CREAR Y AGREGAR AL CARRITO'}
            </button>
          </form>
        </Modal>
      )}

      <style>{`
        @media (max-width: 1024px) {
          .pos-main-container {
            grid-template-columns: minmax(0, 1fr) !important;
            gap: 20px !important;
          }
          .pos-search-filters {
            flex-direction: column !important;
            gap: 15px !important;
          }
          .pos-search-filters select {
            width: 100% !important;
          }
          
          /* Force all nested grids and form rows to be single column */
          .pos-main-container div[style*="display: grid"]:not(.pos-products-grid),
          .pos-main-container div[style*="display:grid"]:not(.pos-products-grid),
          .pos-modal-grid div[style*="display: grid"],
          .pos-modal-grid,
          .pos-customer-form-grid,
          .pos-payment-guarantee-grid,
          .pos-business-mode-grid {
            grid-template-columns: 1fr !important;
            display: grid !important;
            gap: 15px !important;
          }

          .pos-products-grid {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 15px !important;
          }

          .pos-modal-image-section {
            flex-direction: column !important;
            align-items: center !important;
            text-align: center;
            padding: 15px !important;
            gap: 15px !important;
          }
          .pos-modal-image-section div:first-child {
            width: 80px !important;
            height: 80px !important;
          }
          
          /* Style file input to not overflow */
          input[type="file"] {
            width: 100% !important;
            font-size: 0.7rem !important;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .glass-card {
            padding: 20px !important;
          }
          .pos-cart-item {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 15px !important;
          }
          .pos-cart-item-actions {
            width: 100% !important;
            justify-content: space-between !important;
          }
          input, select, textarea {
            font-size: 16px !important; 
          }
        }

        @media (max-width: 768px) {
          .pos-products-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }

        @media (max-width: 480px) {
          .pos-products-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      <POSReceipt 
        isOpen={showReceipt} 
        onClose={() => setShowReceipt(false)} 
        data={receiptData}
        config={config}
        staffName={currentUser?.username}
      />
      <FeedbackModal 
        isOpen={feedback.isOpen} 
        title={feedback.title} 
        message={feedback.message} 
        type={feedback.type} 
        onConfirm={feedback.onConfirm}
        onCancel={() => setFeedback({ ...feedback, isOpen: false })}
        showCancel={feedback.showCancel}
        onClose={() => setFeedback({ ...feedback, isOpen: false })} 
      />
    </div>
  )
}

export default AdminPOS
