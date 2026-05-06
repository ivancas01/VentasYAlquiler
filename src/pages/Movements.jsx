import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Landmark, ArrowUpRight, ArrowDownLeft, Calendar, User, Search, Filter, CreditCard, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const Movements = () => {
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterMethod, setFilterMethod] = useState('all')
  const navigate = useNavigate()

  useEffect(() => {
    fetchMovements()
  }, [])

  const fetchMovements = async () => {
    setLoading(true)
    const token = localStorage.getItem('token')
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/payments/?page_size=500', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const results = res.data.results || res.data
      setMovements(Array.isArray(results) ? results : [])
    } catch (err) {
      console.error(err)
      setMovements([])
    }
    setLoading(false)
  }

  const filteredMovements = movements.filter(m => {
    const matchesSearch = (m.reference || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (m.staff_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (m.label || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesMethod = filterMethod === 'all' || m.payment_method === filterMethod
    return matchesSearch && matchesMethod
  })

  const totalAmount = filteredMovements.reduce((acc, m) => acc + parseFloat(m.amount), 0)

  const goToTransaction = (m) => {
    // Navigate to transactions page with search term as the ID/Reference
    const transId = m.reference.split(' ')[1].replace('#', '')
    navigate(`/admin/transactions?id=${transId}`)
  }

  return (
    <div className="fade-in">
      <div className="admin-header">
        <div className="admin-title-section">
          <h1 className="urban-font gold-text admin-title" style={{ fontSize: '1.8rem', marginBottom: '5px' }}>MOVIMIENTOS</h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Registro histórico de transacciones financieras</p>
        </div>
        <div className="glass-card" style={{ padding: '15px 30px', textAlign: 'right', minWidth: '220px' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '5px', textTransform: 'uppercase' }}>Total Filtrado</p>
          <h2 className="gold-text urban-font" style={{ fontSize: '1.4rem' }}>${totalAmount.toLocaleString()}</h2>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '25px', marginBottom: '35px', background: 'rgba(255,255,255,0.02)' }}>
        <div className="filters-stack">
          <div className="filter-item" style={{ position: 'relative' }}>
            <label style={{ fontSize: '0.6rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Buscador</label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--cta)' }} />
              <input 
                type="text" 
                placeholder="Referencia, tipo o responsable..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                style={{ width: '100%', paddingLeft: '40px' }} 
              />
            </div>
          </div>
          <div className="filter-item">
            <label style={{ fontSize: '0.6rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Método de Pago</label>
            <select value={filterMethod} onChange={e => setFilterMethod(e.target.value)} style={{ width: '100%' }}>
              <option value="all">TODOS LOS MÉTODOS</option>
              <option value="efectivo">EFECTIVO</option>
              <option value="transaccion">TRANSFERENCIA</option>
            </select>
          </div>
          <button onClick={fetchMovements} className="btn-outline" style={{ height: '45px', marginTop: '5px' }}>Refrescar Datos</button>
        </div>
      </div>

      <div className="table-container" style={{ background: 'var(--primary)', border: '1px solid var(--glass-border)' }}>
        <table className="urban-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>FECHA</th>
              <th>TIPO</th>
              <th>REFERENCIA</th>
              <th>RESPONSABLE</th>
              <th>MÉTODO</th>
              <th style={{ textAlign: 'right' }}>MONTO</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ padding: '100px', textAlign: 'center', color: 'var(--text-dim)' }}>Cargando movimientos...</td>
              </tr>
            ) : filteredMovements.map(m => (
              <tr key={m.id}>
                <td style={{ fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Calendar size={14} color="var(--text-dim)" />
                    {new Date(m.created_at).toLocaleDateString()}
                  </div>
                </td>
                <td>
                  <span style={{ color: 'var(--cta)', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {m.label}
                  </span>
                </td>
                <td>
                  <button 
                    onClick={() => goToTransaction(m)}
                    className="hover-gold"
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      textAlign: 'left', 
                      cursor: 'pointer', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      padding: '0'
                    }}
                  >
                    <span style={{ color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>{m.reference}</span>
                    <ExternalLink size={14} color="var(--cta)" />
                  </button>
                </td>
                <td style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <User size={14} /> {m.staff_name}
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ 
                      padding: '4px 12px', 
                      borderRadius: '6px', 
                      fontSize: '0.7rem', 
                      background: m.payment_method === 'efectivo' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                      color: m.payment_method === 'efectivo' ? '#10b981' : '#3b82f6',
                      textTransform: 'uppercase',
                      width: 'fit-content',
                      border: `1px solid ${m.payment_method === 'efectivo' ? '#10b98133' : '#3b82f633'}`,
                      fontWeight: 'bold'
                    }}>
                      {m.payment_method}
                    </span>
                    {m.bank && (
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginLeft: '4px' }}>
                        {m.bank.toUpperCase()}
                      </span>
                    )}
                  </div>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem' }}>
                    ${parseFloat(m.amount).toLocaleString()}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && filteredMovements.length === 0 && (
              <tr>
                <td colSpan="6" style={{ padding: '100px', textAlign: 'center', color: 'var(--text-dim)' }}>No se encontraron movimientos registrados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <style>{`
        .filters-stack {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          align-items: flex-end;
        }
        
        @media (max-width: 1024px) {
          .filters-stack {
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

          .admin-title {
            font-size: 1.5rem !important;
          }
        }
      `}</style>
    </div>
  )
}

export default Movements
