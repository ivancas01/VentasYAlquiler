import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'
import { useLocation } from 'react-router-dom'
import { History, ShoppingBag, Calendar, User, DollarSign, ChevronRight, Eye, Edit3, CheckCircle, Package, Truck, RotateCcw, X, Plus, Trash2, ArrowRight, Search, Filter, Shield } from 'lucide-react'
import { useCallback, useRef } from 'react'
import { formatCurrency, formatDate } from '../utils/format'

const Modal = ({ children, onClose }) => {
  return createPortal(
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      background: 'rgba(0,0,0,0.85)', 
      backdropFilter: 'blur(10px)',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      zIndex: 2000,
      padding: '40px'
    }}>
      <div className="glass-card fade-in" style={{ 
        width: '100%', 
        maxWidth: '1200px', 
        maxHeight: '90vh', 
        overflowY: 'auto', 
        position: 'relative',
        padding: '50px',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '25px', right: '25px', border: 'none', background: 'transparent', color: 'white', cursor: 'pointer' }}><X size={28} /></button>
        {children}
      </div>
    </div>,
    document.body
  )
}

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `http://127.0.0.1:8000${cleanPath}`;
}

const Transactions = () => {
  const [sales, setSales] = useState([])
  const [rentals, setRentals] = useState([])
  const [categories, setCategories] = useState([])
  const [activeTab, setActiveTab] = useState('sales')
  const [loading, setLoading] = useState(true)
  const [selectedRental, setSelectedRental] = useState(null)
  const [products, setProducts] = useState([])
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentLabel, setPaymentLabel] = useState('Abono')
  const [paymentMethod, setPaymentMethod] = useState('efectivo')
  const [bank, setBank] = useState('nequi')

  // Inner Rental Management
  const [innerSearch, setInnerSearch] = useState('')
  const [innerCat, setInnerCat] = useState('all')
  const [customPrices, setCustomPrices] = useState({})

  // Filter States
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' })

  // Pagination States
  const [pageSales, setPageSales] = useState(1)
  const [hasMoreSales, setHasMoreSales] = useState(true)
  const [loadingMoreSales, setLoadingMoreSales] = useState(false)
  
  const [pageRentals, setPageRentals] = useState(1)
  const [hasMoreRentals, setHasMoreRentals] = useState(true)
  const [loadingMoreRentals, setLoadingMoreRentals] = useState(false)

  const observerSales = useRef()
  const observerRentals = useRef()

  const location = useLocation()

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await Promise.all([fetchTransactions(1), fetchProducts(), fetchCategories()])
      setLoading(false)
    }
    init()
  }, [])

  const lastSaleRef = useCallback(node => {
    if (loadingMoreSales) return
    if (observerSales.current) observerSales.current.disconnect()
    observerSales.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMoreSales) {
        setPageSales(prev => prev + 1)
      }
    })
    if (node) observerSales.current.observe(node)
  }, [loadingMoreSales, hasMoreSales])

  const lastRentalRef = useCallback(node => {
    if (loadingMoreRentals) return
    if (observerRentals.current) observerRentals.current.disconnect()
    observerRentals.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMoreRentals) {
        setPageRentals(prev => prev + 1)
      }
    })
    if (node) observerRentals.current.observe(node)
  }, [loadingMoreRentals, hasMoreRentals])

  useEffect(() => {
    if (pageSales > 1) fetchMoreSales()
  }, [pageSales])

  useEffect(() => {
    if (pageRentals > 1) fetchMoreRentals()
  }, [pageRentals])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const searchParam = params.get('search')
    const idParam = params.get('id')
    
    if (searchParam) setSearchTerm(searchParam)
    if (idParam) setSearchTerm(`#${idParam}`)
  }, [location.search])

  useEffect(() => {
    if (!loading && searchTerm.startsWith('#')) {
      const id = searchTerm.replace('#', '')
      const foundRental = rentals.find(r => String(r.id) === id)
      if (foundRental) {
        setActiveTab('rentals')
        setSelectedRental(foundRental)
      } else {
        const foundSale = sales.find(s => String(s.id) === id)
        if (foundSale) {
          setActiveTab('sales')
          // Add sale modal support if needed
        }
      }
    }
  }, [loading, searchTerm, rentals, sales])

  const fetchTransactions = async (p = 1) => {
    const token = localStorage.getItem('token')
    try {
      const [salesRes, rentalsRes] = await Promise.all([
        axios.get(`http://127.0.0.1:8000/api/sales/`, { 
          params: { page: p, search: searchTerm, start_date: dateFilter.start, end_date: dateFilter.end },
          headers: { Authorization: `Bearer ${token}` } 
        }),
        axios.get(`http://127.0.0.1:8000/api/rentals/`, { 
          params: { page: p, search: searchTerm, status: statusFilter, start_date: dateFilter.start, end_date: dateFilter.end },
          headers: { Authorization: `Bearer ${token}` } 
        })
      ])
      
      const newSales = salesRes.data.results || salesRes.data
      const newRentals = rentalsRes.data.results || rentalsRes.data

      if (p === 1) {
        setSales(newSales)
        setRentals(newRentals)
        setPageSales(1)
        setPageRentals(1)
      } else {
        // This is handled by fetchMoreSales/fetchMoreRentals
      }
      
      setHasMoreSales(!!salesRes.data.next)
      setHasMoreRentals(!!rentalsRes.data.next)
    } catch (err) {
      console.error("Error fetching transactions", err)
    }
    setLoading(false)
  }

  const fetchMoreSales = async () => {
    const token = localStorage.getItem('token')
    setLoadingMoreSales(true)
    try {
      const res = await axios.get(`http://127.0.0.1:8000/api/sales/`, { 
        params: { page: pageSales, search: searchTerm, start_date: dateFilter.start, end_date: dateFilter.end },
        headers: { Authorization: `Bearer ${token}` } 
      })
      setSales(prev => [...prev, ...(res.data.results || [])])
      setHasMoreSales(!!res.data.next)
    } catch (err) {}
    setLoadingMoreSales(false)
  }

  const fetchMoreRentals = async () => {
    const token = localStorage.getItem('token')
    setLoadingMoreRentals(true)
    try {
      const res = await axios.get(`http://127.0.0.1:8000/api/rentals/`, { 
        params: { page: pageRentals, search: searchTerm, status: statusFilter, start_date: dateFilter.start, end_date: dateFilter.end },
        headers: { Authorization: `Bearer ${token}` } 
      })
      setRentals(prev => [...prev, ...(res.data.results || [])])
      setHasMoreRentals(!!res.data.next)
    } catch (err) {}
    setLoadingMoreRentals(false)
  }

  // Refetch on filter change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTransactions(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm, statusFilter, dateFilter])

  const fetchProducts = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/products/?page_size=1000')
      setProducts(res.data.results || res.data)
    } catch (err) {
      console.error("Error fetching products", err)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/categories/?page_size=100')
      setCategories(res.data.results || res.data)
    } catch (err) {
      console.error("Error fetching categories", err)
    }
  }

  const updateStatus = async (id, newStatus) => {
    const rentalInfo = selectedRental || rentals.find(t => t.id === id)
    
    if (newStatus === 'delivered' && parseFloat(rentalInfo.total_paid) < parseFloat(rentalInfo.total)) {
      alert("No se puede entregar el alquiler porque aún tiene saldo pendiente. El valor total debe estar cancelado.")
      return
    }

    const token = localStorage.getItem('token')
    try {
      await axios.patch(`http://127.0.0.1:8000/api/rentals/${id}/`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (newStatus === 'received') {
        alert(`🚨 RECORDATORIO DE GARANTÍA 🚨\n\nEl alquiler ha sido marcado como RECIBIDO.\n\nPor favor, asegúrate de devolver la garantía:\n👉 ${rentalInfo?.guarantee_info || 'No especificada'}`)
      }

      fetchTransactions()
      if (selectedRental) setSelectedRental({ ...selectedRental, status: newStatus })
    } catch (err) {
      console.error("Error updating status", err)
    }
  }

  const updateGuarantee = async () => {
    const token = localStorage.getItem('token')
    try {
      await axios.patch(`http://127.0.0.1:8000/api/rentals/${selectedRental.id}/`, { 
        guarantee_type: selectedRental.guarantee_type,
        guarantee_info: selectedRental.guarantee_info 
      }, { headers: { Authorization: `Bearer ${token}` } })
      fetchTransactions()
      alert("Garantía actualizada correctamente")
    } catch (err) {
      console.error("Error updating guarantee", err)
    }
  }

  const addPayment = async (e) => {
    e.preventDefault()
    if (!paymentAmount) return
    const token = localStorage.getItem('token')
    try {
      await axios.post('http://127.0.0.1:8000/api/payments/', {
        rental: selectedRental.id,
        amount: paymentAmount,
        payment_method: paymentMethod,
        bank: paymentMethod === 'transferencia' ? bank : null,
        label: paymentLabel
      }, { headers: { Authorization: `Bearer ${token}` } })
      setPaymentAmount('')
      setPaymentLabel('Abono')
      fetchTransactions()
      const res = await axios.get(`http://127.0.0.1:8000/api/rentals/${selectedRental.id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSelectedRental(res.data)
    } catch (err) {
      console.error("Error adding payment", err)
    }
  }

  const removeItemFromRental = async (productId) => {
    if (selectedRental.status === 'delivered' || selectedRental.status === 'received') {
      return alert("No se pueden editar items de un alquiler ya entregado o recibido.")
    }
    const token = localStorage.getItem('token')
    const newItems = selectedRental.items.filter(i => i.product !== productId)
    const newTotal = newItems.reduce((acc, i) => acc + (parseFloat(i.price_at_rental)), 0)

    try {
      const res = await axios.patch(`http://127.0.0.1:8000/api/rentals/${selectedRental.id}/`, {
        items: newItems.map(i => ({ product: i.product, price_at_rental: i.price_at_rental })),
        total: newTotal
      }, { headers: { Authorization: `Bearer ${token}` } })
      setSelectedRental(res.data)
      fetchTransactions()
    } catch (err) {
      console.error("Error updating items", err)
    }
  }

  const addItemToRental = async (product, customPrice) => {
    if (selectedRental.status === 'delivered' || selectedRental.status === 'received') {
      return alert("No se pueden agregar items a un alquiler ya entregado o recibido.")
    }
    const token = localStorage.getItem('token')
    const price = parseFloat(customPrice || product.price_rental || 0)
    const newItems = [...selectedRental.items, { product: product.id, price_at_rental: price }]
    const newTotal = newItems.reduce((acc, i) => acc + (parseFloat(i.price_at_rental)), 0)

    try {
      const res = await axios.patch(`http://127.0.0.1:8000/api/rentals/${selectedRental.id}/`, {
        items: newItems.map(i => ({ product: i.product, price_at_rental: i.price_at_rental })),
        total: newTotal
      }, { headers: { Authorization: `Bearer ${token}` } })
      setSelectedRental(res.data)
      fetchTransactions()
    } catch (err) {
      console.error("Error updating items", err)
    }
  }

  // Filtering Logic
  // Filtering Logic (Client side for categories only, others are backend)
  const filteredData = (activeTab === 'sales' ? sales : rentals).filter(t => {
    if (categoryFilter !== 'all') {
      return t.items.some(item => {
        const prod = products.find(p => p.id === item.product)
        return prod && String(prod.category) === categoryFilter
      })
    }
    return true
  })

  if (loading) return <div style={{ padding: '200px', textAlign: 'center', color: 'var(--cta)' }}>CARGANDO HISTORIAL...</div>

  return (
    <div className="fade-in" style={{ width: '100%', margin: '0' }}>
      <h2 className="urban-font gold-text" style={{ fontSize: '2.5rem', marginBottom: '50px', display: 'flex', alignItems: 'center', gap: '25px' }}>
        <History size={48} /> Historial
      </h2>

      {/* Filters Section */}
      <div className="glass-card" style={{ padding: '30px', marginBottom: '40px', background: 'rgba(255,255,255,0.02)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr', gap: '20px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Buscar Cliente o ID (#)</label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--cta)' }} />
              <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Ej: Juan o #15" style={{ width: '100%', paddingLeft: '40px' }} />
            </div>
          </div>
          
          {activeTab === 'rentals' && (
            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Estado</label>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: '100%' }}>
                <option value="all">TODOS LOS ESTADOS</option>
                <option value="reserved">RESERVADO</option>
                <option value="preparing">ALISTADO</option>
                <option value="ready">LISTO</option>
                <option value="delivered">ENTREGADO</option>
                <option value="received">RECIBIDO</option>
              </select>
            </div>
          )}

          <div>
            <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Categoría de Artículos</label>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ width: '100%' }}>
              <option value="all">TODAS LAS CATEGORÍAS</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Desde</label>
            <input type="date" value={dateFilter.start} onChange={e => setDateFilter({...dateFilter, start: e.target.value})} style={{ width: '100%' }} />
          </div>

          <div>
            <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Hasta</label>
            <input type="date" value={dateFilter.end} onChange={e => setDateFilter({...dateFilter, end: e.target.value})} style={{ width: '100%' }} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '40px', marginBottom: '40px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '20px' }}>
        <button onClick={() => { setActiveTab('sales'); setStatusFilter('all'); }} className="urban-font" style={{ border: 'none', background: 'transparent', fontSize: '1.2rem', fontWeight: 'bold', color: activeTab === 'sales' ? 'var(--cta)' : 'var(--text-dim)', cursor: 'pointer', borderBottom: activeTab === 'sales' ? '3px solid var(--cta)' : '3px solid transparent', paddingBottom: '15px', transition: 'all 0.3s' }}>
          Ventas
        </button>
        <button onClick={() => { setActiveTab('rentals'); setStatusFilter('all'); }} className="urban-font" style={{ border: 'none', background: 'transparent', fontSize: '1.2rem', fontWeight: 'bold', color: activeTab === 'rentals' ? 'var(--cta)' : 'var(--text-dim)', cursor: 'pointer', borderBottom: activeTab === 'rentals' ? '3px solid var(--cta)' : '3px solid transparent', paddingBottom: '15px', transition: 'all 0.3s' }}>
          Alquileres
        </button>
      </div>

      <div className="table-container" style={{ background: 'var(--primary)', border: '1px solid var(--glass-border)' }}>
        <table className="urban-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Cliente</th>
              <th>{activeTab === 'sales' ? 'Items' : 'Fechas'}</th>
              <th>Total</th>
              <th>Estado / Vendedor</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((t, index) => (
              <tr 
                ref={activeTab === 'sales' 
                  ? (index === sales.length - 1 ? lastSaleRef : null) 
                  : (index === rentals.length - 1 ? lastRentalRef : null)
                }
                key={t.id} 
              >
                <td style={{ color: 'var(--cta)', fontWeight: 'bold' }}>#{t.id}</td>
                <td style={{ fontWeight: '600' }}>{t.customer_data?.full_name || t.customer_name || 'CONSUMIDOR FINAL'}</td>
                <td style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                  {activeTab === 'sales' ? (
                    <span>{t.items?.length} productos</span>
                  ) : (
                    <span>{formatDate(t.start_date)} <ArrowRight size={12} style={{verticalAlign: 'middle'}} /> {formatDate(t.end_date)}</span>
                  )}
                </td>
                <td>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{formatCurrency(t.total)}</div>
                  {activeTab === 'rentals' && (
                    <div style={{ fontSize: '0.7rem', color: parseFloat(t.total_paid) >= parseFloat(t.total) ? '#10b981' : 'var(--cta)' }}>
                      Pagado: {formatCurrency(t.total_paid)}
                    </div>
                  )}
                </td>
                <td>
                  <span style={{ 
                    padding: '6px 15px', 
                    borderRadius: '6px', 
                    fontSize: '0.7rem', 
                    textTransform: 'uppercase',
                    fontWeight: 'bold',
                    background: 'var(--secondary)',
                    color: t.status === 'received' ? '#10b981' : 'white',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>{t.status || t.staff_name}</span>
                </td>
                <td>
                  <button onClick={() => activeTab === 'rentals' ? setSelectedRental(t) : null} className="btn-icon btn-sm">
                    <Eye size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(loadingMoreSales || loadingMoreRentals) && <div style={{ padding: '20px', textAlign: 'center', color: 'var(--cta)', fontSize: '0.8rem' }}>CARGANDO MÁS TRANSACCIONES...</div>}
        {filteredData.length === 0 && (
          <div style={{ padding: '50px', textAlign: 'center', color: 'var(--text-dim)' }}>No se encontraron transacciones con los filtros aplicados.</div>
        )}
      </div>

      {selectedRental && (
        <Modal onClose={() => setSelectedRental(null)}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '40px' }}>
              <h3 className="urban-font gold-text" style={{ fontSize: '1.8rem', marginBottom: '10px' }}>GESTIÓN DE ALQUILER #{selectedRental.id}</h3>
              <p style={{ color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.7rem' }}>
                Alquilado por: <span style={{color: 'white'}}>{selectedRental.staff_name}</span> | 
                Último cambio por: <span style={{color: 'var(--cta)'}}>{selectedRental.last_updated_by_name || 'N/A'}</span>
              </p>
              <p style={{ color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.7rem', marginTop: '5px' }}>
                Cliente: {selectedRental.customer_data?.full_name || selectedRental.customer_name}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '50px' }}>
              <div>
                <h4 className="urban-font" style={{ marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '15px', fontSize: '1rem', color: 'var(--cta)' }}>
                  <Truck size={22} /> Estado del Proceso
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '40px' }}>
                  {['reserved', 'preparing', 'ready', 'delivered', 'received'].map(s => (
                    <button 
                      key={s} 
                      onClick={() => updateStatus(selectedRental.id, s)} 
                      className={selectedRental.status === s ? 'btn-primary btn-sm' : 'btn-outline btn-sm'}
                      style={{ opacity: selectedRental.status === s ? 1 : 0.5 }}
                    >
                      {s === 'reserved' ? 'Reservado' : s === 'preparing' ? 'Alistado' : s === 'ready' ? 'Listo' : s === 'delivered' ? 'Entregado' : 'Recibido'}
                    </button>
                  ))}
                </div>

                <h4 className="urban-font" style={{ marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '15px', fontSize: '1rem', color: 'var(--cta)' }}>
                  <Shield size={22} /> Garantía y Fechas
                </h4>
                <div className="glass-card" style={{ padding: '30px', marginBottom: '40px', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Información de Garantía</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
                      <select 
                        value={selectedRental.guarantee_type || 'documento'} 
                        onChange={e => setSelectedRental({...selectedRental, guarantee_type: e.target.value})} 
                        style={{ width: '100%' }}
                      >
                        <option value="documento">DOCUMENTO</option>
                        <option value="monto">MONTO EFECTIVO</option>
                        <option value="otro">OTRO</option>
                      </select>
                      <input 
                        type="text" 
                        value={selectedRental.guarantee_info || ''} 
                        onChange={e => setSelectedRental({...selectedRental, guarantee_info: e.target.value})} 
                        style={{ flex: 1 }}
                        placeholder="Detalle..."
                      />
                    </div>
                    <button onClick={updateGuarantee} className="btn-primary" style={{ width: '100%', marginTop: '10px' }}>Actualizar Garantía</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                      <label style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Salida</label>
                      <div style={{ color: 'white', fontWeight: 'bold', marginTop: '5px' }}>{formatDate(selectedRental.start_date)}</div>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Devolución</label>
                      <div style={{ color: 'white', fontWeight: 'bold', marginTop: '5px' }}>{formatDate(selectedRental.end_date)}</div>
                    </div>
                  </div>
                </div>

                <h4 className="urban-font" style={{ marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '15px', fontSize: '1rem', color: 'var(--cta)' }}>
                  <DollarSign size={22} /> Pagos y Abonos
                </h4>

                {/* History moved outside the form to ensure it's always visible */}
                <div className="glass-card" style={{ padding: '20px', marginBottom: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' }}>
                  <label style={{ color: 'var(--text-dim)', textTransform: 'uppercase', fontSize: '0.65rem', display: 'block', marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '5px' }}>
                    Historial de Transacciones
                  </label>
                  <div style={{ maxHeight: '180px', overflowY: 'auto', paddingRight: '10px' }}>
                    {selectedRental.payments?.map(p => (
                      <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'white' }}>{p.label}</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>{p.created_at?.split('T')[0]} | {p.payment_method.toUpperCase()}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.9rem', color: '#10b981', fontWeight: 'bold' }}>{formatCurrency(p.amount)}</div>
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>Por: {p.staff_name || 'N/A'}</div>
                        </div>
                      </div>
                    ))}
                    {(!selectedRental.payments || selectedRental.payments.length === 0) && (
                      <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.75rem', padding: '20px' }}>No hay registros de pagos.</div>
                    )}
                  </div>
                </div>

                <div className="glass-card" style={{ padding: '25px', marginBottom: '30px', background: 'var(--secondary)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                    <span>Costo Alquiler:</span>
                    <span style={{ fontWeight: 'bold', color: 'white' }}>{formatCurrency(selectedRental.total)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                    <span>Abonos Realizados:</span>
                    <span style={{ fontWeight: 'bold', color: '#10b981' }}>{formatCurrency(selectedRental.total_paid)}</span>
                  </div>
                  
                  {/* Separate Guarantee Display */}
                  {selectedRental.payments?.some(p => p.label === 'Garantia') && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', padding: '8px 12px', background: 'rgba(212, 175, 55, 0.1)', borderRadius: '8px', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                      <span style={{ color: 'var(--cta)', fontSize: '0.8rem', fontWeight: 'bold' }}>GARANTÍA EN CAJA:</span>
                      <span style={{ fontWeight: 'bold', color: 'var(--cta)' }}>
                        ${selectedRental.payments.filter(p => p.label === 'Garantia').reduce((acc, p) => acc + parseFloat(p.amount), 0).toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px', marginTop: '10px' }}>
                    <span className="urban-font" style={{fontSize: '0.85rem', color: 'white'}}>SALDO PENDIENTE:</span>
                    <span className="gold-text" style={{ fontWeight: 'bold', fontSize: '1.4rem' }}>
                      {formatCurrency(parseFloat(selectedRental.total) - parseFloat(selectedRental.total_paid))}
                    </span>
                  </div>
                </div>

                {selectedRental.status !== 'received' && (
                  <form onSubmit={addPayment} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                      <div>
                        <label style={{ fontSize: '0.6rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '5px', display: 'block' }}>Concepto</label>
                        <select value={paymentLabel} onChange={e => setPaymentLabel(e.target.value)} style={{ width: '100%' }}>
                          <option value="Abono">Abono</option>
                          <option value="Saldo">Pago de Saldo</option>
                          <option value="Garantia">Garantía</option>
                          <option value="Multa">Multa / Otros</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.6rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '5px', display: 'block' }}>Método</label>
                        <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={{ width: '100%' }}>
                          <option value="efectivo">EFECTIVO</option>
                          <option value="transferencia">TRANSFERENCIA</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: paymentMethod === 'transferencia' ? '1fr 1fr' : '1fr', gap: '15px' }}>
                      {paymentMethod === 'transferencia' && (
                        <div>
                          <label style={{ fontSize: '0.6rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '5px', display: 'block' }}>Banco</label>
                          <select value={bank} onChange={e => setBank(e.target.value)} style={{ width: '100%' }}>
                            <option value="nequi">NEQUI</option>
                            <option value="bancolombia">BANCOLOMBIA</option>
                            <option value="daviplata">DAVIPLATA</option>
                            <option value="banco_bogota">B. BOGOTÁ</option>
                            <option value="otro">OTRO</option>
                          </select>
                        </div>
                      )}
                      <div>
                        <label style={{ fontSize: '0.6rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '5px', display: 'block' }}>Monto a Registrar</label>
                        <input type="number" placeholder="Monto $" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} style={{ width: '100%' }} />
                      </div>
                    </div>
                    <button type="submit" className="btn-primary" style={{ width: '100%' }}>Registrar Pago</button>
                  </form>
                )}
              </div>

              <div>
                <h4 className="urban-font" style={{ marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '15px', fontSize: '1rem', color: 'white' }}>
                  <Package size={22} /> Prendas del Alquiler
                </h4>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '25px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '40px' }}>
                  {selectedRental.items.map(item => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ width: '50px', height: '50px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                        {item.product_image ? (
                          <img src={getImageUrl(item.product_image)} alt={item.product_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Package size={16} color="var(--text-dim)" />
                          </div>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>{item.product_name}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--cta)', fontWeight: 'bold' }}>{formatCurrency(item.price_at_rental)}</div>
                      </div>
                      {(selectedRental.status === 'reserved' || selectedRental.status === 'preparing' || selectedRental.status === 'ready') && (
                        <button onClick={() => removeItemFromRental(item.product)} style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={18} /></button>
                      )}
                    </div>
                  ))}
                  {selectedRental.items.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-dim)', fontSize: '0.8rem' }}>No hay prendas en este alquiler.</div>
                  )}
                </div>

                {(selectedRental.status === 'reserved' || selectedRental.status === 'preparing' || selectedRental.status === 'ready') && (
                  <div className="fade-in">
                    <h4 className="urban-font" style={{ marginBottom: '20px', fontSize: '1rem', color: 'var(--cta)' }}>Añadir Más Prendas</h4>
                    
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                      <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--cta)' }} />
                        <input 
                          type="text" 
                          placeholder="Buscar prenda..." 
                          value={innerSearch} 
                          onChange={e => setInnerSearch(e.target.value)} 
                          style={{ paddingLeft: '35px', fontSize: '0.8rem', height: '40px' }}
                        />
                      </div>
                      <select 
                        value={innerCat} 
                        onChange={e => setInnerCat(e.target.value)} 
                        style={{ width: '130px', fontSize: '0.8rem', height: '40px' }}
                      >
                        <option value="all">Categoría</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>

                    <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '10px' }}>
                      {products.filter(p => {
                        const matchesSearch = p.name.toLowerCase().includes(innerSearch.toLowerCase())
                        const matchesCat = innerCat === 'all' || String(p.category) === innerCat
                        const alreadyIn = selectedRental.items.find(i => i.product === p.id)
                        return matchesSearch && matchesCat && !alreadyIn && p.product_type !== 'sale'
                      }).map(p => (
                        <div key={p.id} className="glass-card" style={{ padding: '12px 15px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', gap: '15px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ width: '45px', height: '45px', borderRadius: '4px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)' }}>
                            {p.image ? (
                              <img src={getImageUrl(p.image)} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Package size={14} color="var(--text-dim)" />
                              </div>
                            )}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>{p.name}</div>
                            <div style={{ color: 'var(--text-dim)', fontSize: '0.65rem' }}>Stock: {p.stock} | Base: ${p.price_rental}</div>
                          </div>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <div style={{ textAlign: 'right' }}>
                              <label style={{ fontSize: '0.55rem', color: 'var(--text-dim)', display: 'block', marginBottom: '2px' }}>PRECIO</label>
                              <input 
                                type="number" 
                                placeholder={p.price_rental}
                                value={customPrices[p.id] || ''} 
                                onChange={e => setCustomPrices({...customPrices, [p.id]: e.target.value})} 
                                style={{ width: '80px', padding: '5px', fontSize: '0.8rem', textAlign: 'right', height: '30px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)' }} 
                              />
                            </div>
                            <button onClick={() => addItemToRental(p, customPrices[p.id])} className="btn-primary" style={{ width: '32px', height: '32px', padding: '0', borderRadius: '6px' }}>
                              <Plus size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default Transactions
