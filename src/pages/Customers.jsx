import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { 
  Users, Search, UserPlus, Edit, Trash2, 
  MapPin, Phone, FileText, X, Filter, UserCheck
} from 'lucide-react'
import { createPortal } from 'react-dom'
import { useCallback, useRef } from 'react'

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
        <button onClick={onClose} style={{ position: 'absolute', top: '30px', right: '30px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'white' }}>
          <X size={28} />
        </button>
        <h3 className="urban-font gold-text" style={{ fontSize: '1.8rem', marginBottom: '30px' }}>{title}</h3>
        {children}
      </div>
    </div>,
    document.body
  )
}

const Customers = () => {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [formData, setFormData] = useState({
    full_name: '', doc_type: 'CC', doc_id: '', city: '', address: '', phone: '', phone_ref: '', name_ref: ''
  })

  // Pagination & Search
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const observer = useRef()

  useEffect(() => {
    fetchCustomers(1)
  }, [searchTerm])

  const lastCustomerRef = useCallback(node => {
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
    if (page > 1) fetchMoreCustomers()
  }, [page])

  const fetchCustomers = async (p = 1) => {
    setLoading(true)
    const token = localStorage.getItem('token')
    try {
      const res = await axios.get(`http://127.0.0.1:8000/api/customers/`, {
        params: { page: p, search: searchTerm },
        headers: { Authorization: `Bearer ${token}` }
      })
      const results = res.data.results || res.data
      setCustomers(results)
      setHasMore(!!res.data.next)
      setPage(1)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  const fetchMoreCustomers = async () => {
    setLoadingMore(true)
    const token = localStorage.getItem('token')
    try {
      const res = await axios.get(`http://127.0.0.1:8000/api/customers/`, {
        params: { page: page, search: searchTerm },
        headers: { Authorization: `Bearer ${token}` }
      })
      setCustomers(prev => [...prev, ...(res.data.results || [])])
      setHasMore(!!res.data.next)
    } catch (err) {}
    setLoadingMore(false)
  }

  const handleOpenModal = (customer = null) => {
    if (customer) {
      setEditingCustomer(customer)
      setFormData(customer)
    } else {
      setEditingCustomer(null)
      setFormData({ full_name: '', doc_type: 'CC', doc_id: '', city: '', address: '', phone: '', phone_ref: '', name_ref: '' })
    }
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    try {
      if (editingCustomer) {
        await axios.patch(`http://127.0.0.1:8000/api/customers/${editingCustomer.id}/`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        })
      } else {
        await axios.post('http://127.0.0.1:8000/api/customers/', formData, {
          headers: { Authorization: `Bearer ${token}` }
        })
      }
      setShowModal(false)
      fetchCustomers()
    } catch (err) {
      alert("Error al guardar cliente")
    }
  }

  const filteredCustomers = customers

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 className="urban-font gold-text" style={{ fontSize: '2.5rem', marginBottom: '10px' }}>CLIENTES</h1>
          <p style={{ color: 'var(--text-dim)' }}>Directorio de clientes registrados en Urban Luxury</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary">
          <UserPlus size={20} /> REGISTRAR CLIENTE
        </button>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <div className="glass-card" style={{ flex: 1, padding: '5px 20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Search size={20} color="var(--cta)" />
          <input 
            type="text" 
            placeholder="Buscar por nombre o documento..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ background: 'transparent', border: 'none', width: '100%', padding: '15px 0' }}
          />
        </div>
      </div>

      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--secondary)', textAlign: 'left' }}>
              <th style={{ padding: '20px', color: 'var(--cta)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Cliente</th>
              <th style={{ padding: '20px', color: 'var(--cta)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Documento</th>
              <th style={{ padding: '20px', color: 'var(--cta)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Ubicación</th>
              <th style={{ padding: '20px', color: 'var(--cta)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Contacto</th>
              <th style={{ padding: '20px', color: 'var(--cta)', fontSize: '0.8rem', textTransform: 'uppercase', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((c, index) => (
              <tr 
                ref={index === filteredCustomers.length - 1 ? lastCustomerRef : null}
                key={c.id} 
                style={{ borderBottom: '1px solid #222' }}
              >
                <td style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--gold-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black', fontWeight: 'bold' }}>
                      {c.full_name[0].toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 'bold' }}>{c.full_name}</span>
                  </div>
                </td>
                <td style={{ padding: '20px' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>{c.doc_type} {c.doc_id}</span>
                </td>
                <td style={{ padding: '20px' }}>
                  <div style={{ fontSize: '0.85rem' }}>
                    <div>{c.city}</div>
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>{c.address}</div>
                  </div>
                </td>
                <td style={{ padding: '20px' }}>
                  <div style={{ fontSize: '0.85rem' }}>
                    <div>{c.phone}</div>
                  </div>
                </td>
                <td style={{ padding: '20px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button onClick={() => handleOpenModal(c)} className="btn-icon"><Edit size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loadingMore && <div style={{ textAlign: 'center', padding: '20px', color: 'var(--cta)', fontSize: '0.8rem' }}>CARGANDO MÁS CLIENTES...</div>}
      </div>

      {showModal && (
        <Modal onClose={() => setShowModal(false)} title={editingCustomer ? 'EDITAR CLIENTE' : 'NUEVO CLIENTE'}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Nombre Completo</label>
                <input type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} required style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Tipo Doc</label>
                <select value={formData.doc_type} onChange={e => setFormData({...formData, doc_type: e.target.value})} style={{ width: '100%' }}>
                  <option value="CC">Cédula Ciudadanía</option>
                  <option value="CE">Extranjería</option>
                  <option value="TI">Tarjeta Identidad</option>
                  <option value="PP">Pasaporte</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Número Documento</label>
                <input type="text" value={formData.doc_id} onChange={e => setFormData({...formData, doc_id: e.target.value})} required style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Ciudad</label>
                <input type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Dirección</label>
                <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Teléfono Personal</label>
                <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Nombre Referencia</label>
                <input type="text" value={formData.name_ref} onChange={e => setFormData({...formData, name_ref: e.target.value})} style={{ width: '100%' }} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Teléfono Referencia</label>
                <input type="text" value={formData.phone_ref} onChange={e => setFormData({...formData, phone_ref: e.target.value})} style={{ width: '100%' }} />
              </div>
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '40px' }}>
              {editingCustomer ? 'GUARDAR CAMBIOS' : 'REGISTRAR CLIENTE'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}

export default Customers
