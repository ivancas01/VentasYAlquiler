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
      <div className="glass-card modal-content-card" style={{ 
        width: '95%', maxWidth: '800px', maxHeight: '90vh', 
        overflowY: 'auto', background: 'var(--primary)', border: '1px solid var(--cta)',
        position: 'relative', padding: '30px'
      }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '25px', right: '25px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'white' }}>
          <X size={28} />
        </button>
        <h3 className="urban-font gold-text" style={{ fontSize: '1.4rem', marginBottom: '25px' }}>{title}</h3>
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
      <div className="admin-header">
        <div className="admin-title-section">
          <h1 className="urban-font gold-text admin-title" style={{ marginBottom: '5px' }}>CLIENTES</h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Directorio de clientes registrados en Urban Luxury</p>
        </div>
        <div className="admin-actions">
          <button onClick={() => handleOpenModal()} className="btn-primary main-action-btn">
            <UserPlus size={20} /> REGISTRAR CLIENTE
          </button>
        </div>
      </div>

      {/* Filters Section (Matching Transactions Style) */}
      <div className="glass-card" style={{ padding: '25px', marginBottom: '40px', background: 'rgba(255,255,255,0.02)' }}>
        <div className="filters-grid">
          <div className="filter-item">
            <label style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Buscar Cliente o Documento</label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--cta)' }} />
              <input 
                type="text" 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                placeholder="Ej: Juan o 1032..." 
                style={{ width: '100%', paddingLeft: '40px' }} 
              />
            </div>
          </div>
        </div>
      </div>

      <div className="table-container" style={{ background: 'var(--primary)', border: '1px solid var(--glass-border)' }}>
        <table className="urban-table" style={{ width: '100%', minWidth: '800px' }}>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Documento</th>
              <th>Ubicación</th>
              <th>Contacto</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((c, index) => (
              <tr 
                ref={index === filteredCustomers.length - 1 ? lastCustomerRef : null}
                key={c.id} 
              >
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div className="customer-avatar">
                      {c.full_name[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '1rem', color: 'white' }}>{c.full_name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--cta)', textTransform: 'uppercase', letterSpacing: '1px' }}>ID: #{c.id}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: 'white', fontSize: '0.9rem', fontWeight: '500' }}>{c.doc_id}</span>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem', textTransform: 'uppercase' }}>{c.doc_type}</span>
                  </div>
                </td>
                <td>
                  <div style={{ fontSize: '0.85rem' }}>
                    <div style={{ fontWeight: '600', color: 'var(--text)' }}>{c.city}</div>
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginTop: '2px' }}>{c.address}</div>
                  </div>
                </td>
                <td style={{ fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)' }}>
                    <Phone size={14} className="gold-text-icon" />
                    {c.phone}
                  </div>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button onClick={() => handleOpenModal(c)} className="btn-icon" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <Edit size={16} />
                  </button>
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
            <div className="pos-form-row">
              <div className="pos-form-group">
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Nombre Completo</label>
                <input type="text" value={formData.full_name || ''} onChange={e => setFormData({...formData, full_name: e.target.value})} required style={{ width: '100%' }} />
              </div>
            </div>

            <div className="pos-form-row">
              <div className="pos-form-group">
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Tipo Doc</label>
                <select value={formData.doc_type || 'CC'} onChange={e => setFormData({...formData, doc_type: e.target.value})} style={{ width: '100%' }}>
                  <option value="CC">Cédula Ciudadanía</option>
                  <option value="CE">Extranjería</option>
                  <option value="TI">Tarjeta Identidad</option>
                  <option value="PP">Pasaporte</option>
                </select>
              </div>
              <div className="pos-form-group">
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Número Documento</label>
                <input type="text" value={formData.doc_id || ''} onChange={e => setFormData({...formData, doc_id: e.target.value})} required style={{ width: '100%' }} />
              </div>
            </div>

            <div className="pos-form-row">
              <div className="pos-form-group">
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Ciudad</label>
                <input type="text" value={formData.city || ''} onChange={e => setFormData({...formData, city: e.target.value})} style={{ width: '100%' }} />
              </div>
              <div className="pos-form-group">
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Dirección</label>
                <input type="text" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} style={{ width: '100%' }} />
              </div>
            </div>

            <div className="pos-form-row">
              <div className="pos-form-group">
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Teléfono Personal</label>
                <input type="text" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} required style={{ width: '100%' }} />
              </div>
              <div className="pos-form-group">
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Nombre Referencia</label>
                <input type="text" value={formData.name_ref || ''} onChange={e => setFormData({...formData, name_ref: e.target.value})} style={{ width: '100%' }} />
              </div>
            </div>

            <div className="pos-form-row">
              <div className="pos-form-group">
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Teléfono Referencia</label>
                <input type="text" value={formData.phone_ref || ''} onChange={e => setFormData({...formData, phone_ref: e.target.value})} style={{ width: '100%' }} />
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '40px' }}>
              {editingCustomer ? 'GUARDAR CAMBIOS' : 'REGISTRAR CLIENTE'}
            </button>
          </form>
        </Modal>
      )}

      <style>{`
        .filters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          align-items: flex-end;
        }

        .filter-item {
          width: 100%;
        }

        .customer-avatar {
          width: 45px;
          height: 45px;
          border-radius: 12px;
          background: var(--secondary);
          border: 1px solid rgba(255,255,255,0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--cta);
          font-weight: bold;
          font-size: 1.1rem;
          box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        }

        .gold-text-icon {
          color: var(--cta);
        }

        @media (max-width: 1024px) {
          .filters-grid {
            grid-template-columns: 1fr !important;
          }
          
          .admin-header {
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
            gap: 25px !important;
          }

          .admin-title-section {
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .admin-actions {
             width: 100% !important;
          }
          
          .main-action-btn {
            width: 100% !important;
          }

          .admin-title {
            font-size: 1.8rem !important;
          }

          .admin-header p {
            font-size: 0.75rem !important;
          }

          .modal-content-card {
            padding: 20px !important;
          }
        }
      `}</style>
    </div>
  )
}

export default Customers
