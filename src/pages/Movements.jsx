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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 className="urban-font gold-text" style={{ fontSize: '2.5rem', marginBottom: '10px' }}>MOVIMIENTOS</h1>
          <p style={{ color: 'var(--text-dim)' }}>Registro histórico de transacciones financieras</p>
        </div>
        <div className="glass-card" style={{ padding: '20px 40px', textAlign: 'right' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '5px' }}>TOTAL FILTRADO</p>
          <h2 className="gold-text urban-font" style={{ fontSize: '1.8rem' }}>${totalAmount.toLocaleString()}</h2>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '30px', marginBottom: '30px' }}>
        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--cta)' }} />
            <input 
              type="text" 
              placeholder="Buscar por referencia, tipo o responsable..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              style={{ width: '100%', paddingLeft: '40px' }} 
            />
          </div>
          <select value={filterMethod} onChange={e => setFilterMethod(e.target.value)} style={{ width: '220px' }}>
            <option value="all">TODOS LOS MÉTODOS</option>
            <option value="efectivo">EFECTIVO</option>
            <option value="transaccion">TRANSFERENCIA</option>
          </select>
          <button onClick={fetchMovements} className="btn-outline">Refrescar</button>
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
    </div>
  )
}

export default Movements
