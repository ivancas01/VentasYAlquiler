import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Plus, Trash2, ShoppingCart, Calendar, CheckCircle, CreditCard, Shield, Edit3, ArrowRight, Search, Filter, User, MapPin, Phone, CreditCard as CardIcon, Landmark, X, Upload } from 'lucide-react'
import { createPortal } from 'react-dom'

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
  
  // Quick Add State
  const [showProductModal, setShowProductModal] = useState(false)
  const [loadingProduct, setLoadingProduct] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [productForm, setProductForm] = useState({
    name: '', description: '', color: '', pieces_count: 1, size: '',
    category: '', product_type: 'both', price_sale: '', price_rental: '',
    stock: 1, is_active: true
  })
  
  // Customer State
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
  
  // Payment & Transaction State
  const [paymentMethod, setPaymentMethod] = useState('efectivo')
  const [bank, setBank] = useState('nequi')
  const [initialPayment, setInitialPayment] = useState('0')
  const [type, setType] = useState('sale') 
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [guarantee, setGuarantee] = useState('')
  const [guaranteeType, setGuaranteeType] = useState('documento')

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [success, setSuccess] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [availability, setAvailability] = useState({})
  const [conflicts, setConflicts] = useState({})

  useEffect(() => {
    const initData = async () => {
      setFetching(true)
      await Promise.all([fetchProducts(), fetchCategories()])
      setFetching(false)
    }
    initData()
  }, [])

  useEffect(() => {
    if (type === 'rental' && startDate && endDate) {
      fetchAvailability()
    } else {
      setAvailability({})
    }
  }, [type, startDate, endDate])

  const fetchAvailability = async () => {
    try {
      const res = await axios.get(`http://127.0.0.1:8000/api/products/availability/?start_date=${startDate}&end_date=${endDate}`)
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

  const fetchProducts = async () => {
    const token = localStorage.getItem('token')
    try {
      // For POS we want more than 10 initially, or we should handle pagination
      // Let's request a larger page for POS
      const res = await axios.get('http://127.0.0.1:8000/api/products/?page_size=100', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      const data = res.data.results || res.data
      setProducts(Array.isArray(data) ? data : [])
    } catch (err) { 
      console.error("Error fetching products", err)
      setProducts([])
    }
  }

  const fetchCategories = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/categories/', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
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
    const token = localStorage.getItem('token')
    try {
      // Use exact doc_id filter instead of general search for autocomplete
      const res = await axios.get(`http://127.0.0.1:8000/api/customers/?doc_id=${val}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = res.data.results || res.data
      const results = Array.isArray(data) ? data : []
      
      if (results.length === 1) {
        const c = results[0]
        // Only fill if it's an exact match of what was typed
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
        // If no exact match, just ensure we are in "new customer" mode (id: null)
        // but DO NOT clear the fields so the user can continue typing/editing
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
      const res = await axios.post('http://127.0.0.1:8000/api/products/', data, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      })
      fetchProducts() // Refresh the list
      addToCart(res.data)
      setShowProductModal(false)
      setProductForm({
        name: '', description: '', color: '', pieces_count: 1, size: '',
        category: categories[0]?.id || '', product_type: 'both', price_sale: '', price_rental: '',
        stock: 1, is_active: true
      })
      setImageFile(null)
      setImagePreview(null)
    } catch (err) {
      console.error(err)
      alert("Error al crear producto rápido")
    }
    setLoadingProduct(false)
  }

  const addToCart = (product) => {
    if (type === 'sale' && product.stock <= 0) {
      alert("Producto sin stock disponible para venta.")
      return
    }
    
    if (type === 'rental') {
      if (!startDate || !endDate) {
        alert("Por favor seleccione las fechas del alquiler antes de agregar prendas.")
        return
      }
      const avail = availability[product.id] ?? product.stock
      if (avail <= 0) {
        alert("Este producto no está disponible para las fechas seleccionadas.")
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
    // Trim and check
    const name = (customer.full_name || '').trim()
    const doc = (customer.doc_id || '').trim()

    if (cart.length === 0) {
      alert("El carrito está vacío.")
      return
    }
    if (!name || !doc) {
      alert("Por favor complete el nombre y documento del cliente.")
      return
    }
    if (type === 'rental' && (!startDate || !endDate)) {
      alert("Por favor seleccione las fechas de recogida y devolución.")
      return
    }

    setLoading(true)

    const token = localStorage.getItem('token')
    const total = calculateTotal()

    try {
      let customerId = customer.id
      const customerPayload = { ...customer }
      if (customerId) {
        await axios.patch(`http://127.0.0.1:8000/api/customers/${customerId}/`, customerPayload, {
          headers: { Authorization: `Bearer ${token}` }
        })
      } else {
        const cRes = await axios.post('http://127.0.0.1:8000/api/customers/', customerPayload, {
          headers: { Authorization: `Bearer ${token}` }
        })
        customerId = cRes.data.id
      }

      let res;
      if (type === 'sale') {
        res = await axios.post('http://127.0.0.1:8000/api/sales/', {
          customer: customerId,
          total: total,
          items: cart.map(item => ({ product: item.id, quantity: 1, price_at_sale: item.custom_price }))
        }, { headers: { Authorization: `Bearer ${token}` } })
      } else {
        res = await axios.post('http://127.0.0.1:8000/api/rentals/', {
          customer: customerId,
          start_date: startDate || new Date().toISOString().split('T')[0],
          end_date: endDate || new Date().toISOString().split('T')[0],
          total: total,
          guarantee_type: guaranteeType,
          guarantee_info: guarantee,
          items: cart.map(item => ({ product: item.id, price_at_rental: item.custom_price }))
        }, { headers: { Authorization: `Bearer ${token}` } })
      }

      if (parseFloat(initialPayment) > 0) {
        await axios.post('http://127.0.0.1:8000/api/payments/', {
          rental: type === 'rental' ? res.data.id : null,
          sale: type === 'sale' ? res.data.id : null,
          amount: initialPayment,
          payment_method: paymentMethod,
          bank: paymentMethod === 'transaccion' ? bank : null,
          label: type === 'sale' ? 'Venta' : 'Abono Inicial'
        }, { headers: { Authorization: `Bearer ${token}` } })
      }

      setSuccess(true)
      setCart([])
      setCustomer({ full_name: '', doc_type: 'CC', doc_id: '', city: '', address: '', phone: '', phone_ref: '', name_ref: '' })
      setInitialPayment('0')
      setGuarantee('')
      fetchProducts() // Refresh stock in UI
      if (type === 'rental') fetchAvailability()
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error(err)
      alert("Error al procesar la transacción. Verifica los campos obligatorios.")
    }
    setLoading(false)
  }

  const filteredProducts = Array.isArray(products) ? products.filter(p => {
    const matchesType = type === 'sale' ? p.product_type !== 'rental' : p.product_type !== 'sale'
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || String(p.category) === selectedCategory
    return matchesType && matchesSearch && matchesCategory
  }) : []

  return (
    <div className="fade-in" style={{ width: '100%', margin: '0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '40px' }}>
      
      <div className="glass-card" style={{ padding: '40px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' }}>
          <h2 className="urban-font gold-text" style={{ fontSize: '1.8rem' }}>Punto de Venta</h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setShowProductModal(true)} className="btn-outline">
              <Plus size={18} /> NUEVO
            </button>
            <button onClick={() => { setType('sale'); setCart([]); }} className={type === 'sale' ? 'btn-primary' : 'btn-outline'}>Venta</button>
            <button onClick={() => { setType('rental'); setCart([]); }} className={type === 'rental' ? 'btn-primary' : 'btn-outline'}>Alquiler</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '25px' }}>
            {filteredProducts.map(product => {
              const isAvailable = type === 'rental' && startDate && endDate ? (availability[product.id] > 0) : (product.stock > 0)
              const availCount = type === 'rental' && startDate && endDate ? (availability[product.id] ?? product.stock) : product.stock
              
              return (
                <div key={product.id} className="glass-card" style={{ padding: '20px', textAlign: 'center', opacity: isAvailable ? 1 : 0.6 }}>
                  <div style={{ height: '120px', background: 'var(--secondary)', borderRadius: '4px', marginBottom: '15px', overflow: 'hidden', position: 'relative' }}>
                    {product.image && <img src={product.image} alt="" style={{width: '100%', height: '100%', objectFit: 'cover'}} />}
                    {!isAvailable && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {type === 'sale' ? 'AGOTADO' : 'ALQUILADO'}
                      </div>
                    )}
                  </div>
                  <h4 style={{ fontSize: '0.9rem', color: 'white', marginBottom: '8px' }}>{product.name}</h4>
                  <p style={{ color: 'var(--cta)', fontWeight: 'bold', fontSize: '0.9rem' }}>${type === 'sale' ? (product.price_sale || 0) : (product.price_rental || 0)}</p>
                  
                  <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <p style={{ fontSize: '0.65rem', color: isAvailable ? 'var(--text-dim)' : '#ef4444', fontWeight: 'bold' }}>
                      {type === 'rental' ? 'DISPONIBILIDAD:' : 'STOCK VENTA:'} {availCount}
                    </p>
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
      </div>

      <div className="glass-card" style={{ padding: '40px', height: 'fit-content', border: '1px solid var(--cta)', position: 'sticky', top: '20px' }}>
        {cart.length > 0 && (
          <div style={{ marginBottom: '40px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '30px' }}>
            <h3 className="urban-font" style={{ marginBottom: '25px', color: 'white', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShoppingCart size={22} /> Items en Carrito
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
              {cart.map(item => (
                <div key={item.id} className="glass-card" style={{ padding: '15px', background: 'rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{item.name}</div>
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>{item.category_name}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
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
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '15px', marginBottom: '20px' }}>
          <div>
            <label style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Tipo Doc</label>
            <select value={customer.doc_type || 'CC'} onChange={e => setCustomer({...customer, doc_type: e.target.value})} style={{ width: '100%' }}>
              <option value="CC">Cédula Ciudadanía</option>
              <option value="CE">Extranjería</option>
              <option value="TI">Tarjeta Identidad</option>
              <option value="PP">Pasaporte</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Documento</label>
            <input type="text" value={customer.doc_id || ''} onChange={e => { setCustomer({...customer, doc_id: e.target.value}); lookupCustomer(e.target.value); }} style={{ width: '100%' }} />
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Nombre Completo</label>
          <input type="text" value={customer.full_name || ''} onChange={e => setCustomer({...customer, full_name: e.target.value})} style={{ width: '100%' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
          <div>
            <label style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Ciudad</label>
            <input type="text" value={customer.city || ''} onChange={e => setCustomer({...customer, city: e.target.value})} style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Dirección</label>
            <input type="text" value={customer.address || ''} onChange={e => setCustomer({...customer, address: e.target.value})} style={{ width: '100%' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '30px' }}>
          <div>
            <label style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Teléfono Personal</label>
            <input type="text" value={customer.phone || ''} onChange={e => setCustomer({...customer, phone: e.target.value})} style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Nombre Referencia</label>
            <input type="text" value={customer.name_ref || ''} onChange={e => setCustomer({...customer, name_ref: e.target.value})} style={{ width: '100%' }} />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Teléfono Referencia</label>
            <input type="text" value={customer.phone_ref || ''} onChange={e => setCustomer({...customer, phone_ref: e.target.value})} style={{ width: '100%' }} />
          </div>
        </div>

        <h3 className="urban-font" style={{ marginBottom: '25px', color: 'var(--cta)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Landmark size={22} /> Pago y Garantía
        </h3>

        {type === 'rental' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Recogida</label>
                <input type="date" value={startDate || ''} onChange={e => setStartDate(e.target.value)} style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Devolución</label>
                <input type="date" value={endDate || ''} onChange={e => setEndDate(e.target.value)} style={{ width: '100%' }} />
              </div>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Garantía</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
                <select value={guaranteeType || 'documento'} onChange={e => setGuaranteeType(e.target.value)} style={{ width: '100%' }}>
                  <option value="documento">DOCUMENTO</option>
                  <option value="monto">MONTO EFECTIVO</option>
                  <option value="otro">OTRO</option>
                </select>
                <input 
                  type="text" 
                  value={guarantee || ''} 
                  onChange={(e) => setGuarantee(e.target.value)} 
                  style={{ width: '100%' }} 
                  placeholder={guaranteeType === 'monto' ? 'Monto $' : 'Detalle...'} 
                />
              </div>
            </div>
          </>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
          <div>
            <label style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Método de Pago</label>
            <select value={paymentMethod || 'efectivo'} onChange={e => setPaymentMethod(e.target.value)} style={{ width: '100%' }}>
              <option value="efectivo">EFECTIVO</option>
              <option value="transferencia">TRANSFERENCIA</option>
            </select>
          </div>
          {paymentMethod === 'transferencia' && (
            <div>
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

        {cart.length > 0 && (
          <div style={{ background: 'var(--secondary)', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.4rem', color: 'white', marginBottom: '8px' }}>
              <span>TOTAL</span>
              <span className="gold-text">${calculateTotal().toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--cta)', fontSize: '0.9rem', fontWeight: 'bold' }}>
              <span>PENDIENTE</span>
              <span>${(calculateTotal() - parseFloat(initialPayment || 0)).toFixed(2)}</span>
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
          <form onSubmit={submitQuickProduct}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
              
              <div style={{ gridColumn: 'span 2', display: 'flex', gap: '30px', background: 'rgba(255,255,255,0.02)', padding: '25px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '10px' }}>
                <div style={{ width: '150px', height: '150px', background: 'var(--secondary)', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed rgba(255,255,255,0.1)' }}>
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Upload size={40} color="var(--text-dim)" />
                  )}
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '10px', display: 'block' }}>Imagen</label>
                  <input type="file" onChange={e => {
                      const file = e.target.files[0]
                      setImageFile(file)
                      if (file) setImagePreview(URL.createObjectURL(file))
                    }} style={{ fontSize: '0.8rem', color: 'var(--cta)' }} />
                </div>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Nombre</label>
                <input type="text" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} required style={{ width: '100%' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Color</label>
                <input type="text" value={productForm.color} onChange={e => setProductForm({...productForm, color: e.target.value})} style={{ width: '100%' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Talla / Tamaño</label>
                <input type="text" value={productForm.size} onChange={e => setProductForm({...productForm, size: e.target.value})} style={{ width: '100%' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Categoría</label>
                <select value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})} style={{ width: '100%' }}>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Stock</label>
                <input type="number" value={productForm.stock} onChange={e => setProductForm({...productForm, stock: e.target.value})} style={{ width: '100%' }} />
              </div>

              <div style={{ gridColumn: 'span 2', padding: '20px', background: 'rgba(184, 158, 72, 0.05)', border: '1px solid rgba(184, 158, 72, 0.2)', borderRadius: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                  <select value={productForm.product_type} onChange={e => setProductForm({...productForm, product_type: e.target.value})} style={{ width: '100%', background: 'var(--secondary)' }}>
                    <option value="sale">SOLO VENTA</option>
                    <option value="rental">SOLO ALQUILER</option>
                    <option value="both">AMBOS</option>
                  </select>
                  <input type="number" step="0.01" placeholder="Precio Venta $" value={productForm.price_sale} onChange={e => setProductForm({...productForm, price_sale: e.target.value})} disabled={productForm.product_type === 'rental'} style={{ width: '100%' }} />
                  <input type="number" step="0.01" placeholder="Precio Alquiler $" value={productForm.price_rental} onChange={e => setProductForm({...productForm, price_rental: e.target.value})} disabled={productForm.product_type === 'sale'} style={{ width: '100%' }} />
                </div>
              </div>

            </div>
            <button type="submit" disabled={loadingProduct} className="btn-primary" style={{ width: '100%', marginTop: '40px' }}>
              {loadingProduct ? 'CREANDO...' : 'CREAR Y AGREGAR AL CARRITO'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}

export default AdminPOS
