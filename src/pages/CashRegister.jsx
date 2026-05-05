import React, { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import { Landmark, Calendar, DollarSign, ArrowUpRight, ArrowDownRight, Filter, Plus, CreditCard, Wallet, Landmark as BankIcon, Shield, History, X, Search } from 'lucide-react'
import { createPortal } from 'react-dom'

const Modal = ({ children, onClose }) => {
  return createPortal(
    <div style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '40px'
    }}>
      <div className="glass-card fade-in" style={{ 
        width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', 
        position: 'relative', padding: '50px', border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '25px', right: '25px', border: 'none', background: 'transparent', color: 'white', cursor: 'pointer' }}><X size={28} /></button>
        {children}
      </div>
    </div>,
    document.body
  )
}

const CashRegister = () => {
  const [summary, setSummary] = useState(null)
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMovements, setLoadingMovements] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [showMoveModal, setShowMoveModal] = useState(false)
  
  const [dates, setDates] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })

  const [newMove, setNewMove] = useState({
    amount: '',
    movement_type: 'OUT',
    payment_method: 'efectivo',
    bank: '',
    description: ''
  })

  const observer = useRef()
  const lastMoveRef = useCallback(node => {
    if (loadingMovements) return
    if (observer.current) observer.current.disconnect()
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1)
      }
    })
    if (node) observer.current.observe(node)
  }, [loadingMovements, hasMore])

  useEffect(() => {
    setMovements([])
    setPage(1)
    setHasMore(true)
    fetchSummary()
  }, [dates])

  useEffect(() => {
    fetchMovements()
  }, [page, dates])

  const fetchSummary = async () => {
    setLoading(true)
    const token = localStorage.getItem('token')
    try {
      const res = await axios.get(`http://127.0.0.1:8000/api/cash/summary/?start_date=${dates.start}&end_date=${dates.end}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSummary(res.data)
    } catch (err) {
      console.error("Error fetching summary", err)
    }
    setLoading(false)
  }

  const fetchMovements = async () => {
    setLoadingMovements(true)
    const token = localStorage.getItem('token')
    try {
      const res = await axios.get(`http://127.0.0.1:8000/api/cash/movements/?start_date=${dates.start}&end_date=${dates.end}&page=${page}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (page === 1) {
        setMovements(res.data.results)
      } else {
        setMovements(prev => [...prev, ...res.data.results])
      }
      setHasMore(res.data.has_more)
    } catch (err) {
      console.error("Error fetching movements", err)
    }
    setLoadingMovements(false)
  }

  const handleCreateMove = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    try {
      await axios.post('http://127.0.0.1:8000/api/movements/', newMove, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setShowMoveModal(false)
      setNewMove({ amount: '', movement_type: 'OUT', payment_method: 'efectivo', bank: '', description: '' })
      setPage(1)
      setMovements([])
      fetchSummary()
      fetchMovements()
    } catch (err) {
      alert("Error al registrar movimiento")
    }
  }

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val)
  }

  const getMethodIcon = (method) => {
    switch (method?.toLowerCase()) {
      case 'efectivo': return <Wallet size={20} />
      case 'transaccion': return <Landmark size={20} />
      default: return <CreditCard size={20} />
    }
  }

  return (
    <div className="fade-in" style={{ maxWidth: '1300px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '50px' }}>
        <div>
          <h2 className="urban-font gold-text" style={{ fontSize: '2.5rem', marginBottom: '10px' }}>CONTROL DE CAJA</h2>
          <p style={{ color: 'var(--text-dim)' }}>Seguimiento financiero y movimientos en tiempo real</p>
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <button onClick={() => setShowMoveModal(true)} className="btn-primary">
            <Plus size={20} /> NUEVO MOVIMIENTO
          </button>
          <div style={{ display: 'flex', gap: '15px', background: 'var(--secondary)', padding: '15px 25px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '5px' }}>Desde</label>
              <input type="date" value={dates.start} onChange={e => setDates({...dates, start: e.target.value})} style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', fontSize: '0.9rem' }} />
            </div>
            <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '5px' }}>Hasta</label>
              <input type="date" value={dates.end} onChange={e => setDates({...dates, end: e.target.value})} style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', fontSize: '0.9rem' }} />
            </div>
          </div>
        </div>
      </div>

      {loading && page === 1 ? (
        <div style={{ textAlign: 'center', padding: '100px', color: 'var(--cta)' }}>PROCESANDO DATOS FINANCIEROS...</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '30px', marginBottom: '50px' }}>
            <div className="glass-card" style={{ padding: '35px', background: 'linear-gradient(135deg, rgba(184, 158, 72, 0.1) 0%, rgba(184, 158, 72, 0.02) 100%)', border: '1px solid rgba(184, 158, 72, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ width: '45px', height: '45px', borderRadius: '10px', background: 'var(--cta)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                  <DollarSign size={24} />
                </div>
                <div style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                  <ArrowUpRight size={16} /> UTILIDAD NETA (FLUJO)
                </div>
              </div>
              <h3 style={{ fontSize: '2rem', color: 'white', marginBottom: '5px' }}>{formatCurrency(summary?.net_income)}</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>Ventas + Entradas - Salidas</p>
            </div>

            <div className="glass-card" style={{ padding: '35px', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ width: '45px', height: '45px', borderRadius: '10px', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cta)' }}>
                  <Shield size={24} />
                </div>
                <div style={{ color: 'var(--cta)', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                  DEPÓSITOS EN CUSTODIA
                </div>
              </div>
              <h3 style={{ fontSize: '2rem', color: 'white', marginBottom: '5px' }}>{formatCurrency(summary?.total_guarantees)}</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>Garantías activas en caja</p>
            </div>

            <div className="glass-card" style={{ padding: '35px', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ width: '45px', height: '45px', borderRadius: '10px', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  <Landmark size={24} />
                </div>
                <div style={{ color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                  TOTAL EN CAJA (REAL)
                </div>
              </div>
              <h3 style={{ fontSize: '2rem', color: 'white', marginBottom: '5px' }}>{formatCurrency((summary?.net_income || 0) + (summary?.total_guarantees || 0))}</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>Efectivo + Bancos total</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '40px' }}>
            {/* Movements List with Infinite Scroll */}
            <div>
              <h3 className="urban-font" style={{ fontSize: '1.2rem', marginBottom: '30px', color: 'white', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <History size={20} /> Movimientos
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {movements.map((move, index) => (
                  <div 
                    ref={index === movements.length - 1 ? lastMoveRef : null}
                    key={move.id} 
                    className="glass-card" 
                    style={{ 
                      padding: '20px', 
                      background: 'rgba(255,255,255,0.02)', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      borderLeft: `4px solid ${(move.movement_type === 'IN' || move.type === 'IN') ? '#10b981' : '#ef4444'}` 
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'white' }}>
                        {(move.description || 'Movimiento').toUpperCase()}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px', display: 'flex', gap: '10px' }}>
                        <span>{new Date(move.created_at).toLocaleDateString()} {new Date(move.created_at).toLocaleTimeString()}</span>
                        <span>•</span>
                        <span>{move.staff_name || 'Sistema'}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 'bold', color: (move.movement_type === 'IN' || move.type === 'IN') ? '#10b981' : '#ef4444', fontSize: '1.1rem' }}>
                        {(move.movement_type === 'IN' || move.type === 'IN') ? '+' : '-'}{formatCurrency(move.amount)}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginTop: '4px' }}>
                        {(move.payment_method || move.method || 'Efectivo')} {move.bank ? `(${move.bank})` : ''}
                      </div>
                    </div>
                  </div>
                ))}
                {loadingMovements && <div style={{ textAlign: 'center', padding: '20px', color: 'var(--cta)', fontSize: '0.8rem' }}>CARGANDO MÁS...</div>}
              </div>
            </div>

            {/* Channels & Methods */}
            <div>
              <h3 className="urban-font" style={{ fontSize: '1.2rem', marginBottom: '30px', color: 'white', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <BankIcon size={20} /> Disponibilidad de Fondos
              </h3>
              <div className="glass-card" style={{ padding: '0', overflow: 'hidden', background: 'rgba(255,255,255,0.02)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.05)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      <th style={{ padding: '15px 20px' }}>Canal / Entidad</th>
                      <th style={{ padding: '15px 20px' }}>Conceptos</th>
                      <th style={{ padding: '15px 20px', textAlign: 'right' }}>Total Disponible</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary?.channels_detailed?.map(item => (
                      <tr key={item.channel} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '20px', fontWeight: 'bold', textTransform: 'uppercase', color: item.channel === 'Efectivo' ? '#10b981' : 'var(--cta)' }}>
                          {item.channel.replace('_', ' ')}
                        </td>
                        <td style={{ padding: '20px' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Disponibilidad: {formatCurrency(item.income)}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--cta)' }}>Garantías: {formatCurrency(item.guarantees)}</div>
                        </td>
                        <td style={{ padding: '20px', textAlign: 'right', fontWeight: 'bold' }}>
                          {formatCurrency(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ marginTop: '30px', padding: '0 30px 30px 30px' }}>
                  <h4 style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '20px', letterSpacing: '1px' }}>Resumen por Medio</h4>
                  {summary?.income_by_method?.map(m => (
                    <div key={m.payment_method} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem' }}>
                      <span style={{ textTransform: 'capitalize' }}>{m.payment_method}</span>
                      <span style={{ fontWeight: '500' }}>{formatCurrency(m.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {showMoveModal && (
        <Modal onClose={() => setShowMoveModal(false)}>
          <h3 className="urban-font gold-text" style={{ fontSize: '1.5rem', marginBottom: '30px' }}>NUEVO MOVIMIENTO</h3>
          <form onSubmit={handleCreateMove}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Tipo</label>
                <select 
                  value={newMove.movement_type} 
                  onChange={e => setNewMove({...newMove, movement_type: e.target.value})}
                  style={{ width: '100%', marginTop: '8px' }}
                >
                  <option value="IN">ENTRADA (INGRESO)</option>
                  <option value="OUT">SALIDA (GASTO / RETIRO)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Monto</label>
                <input 
                  type="number" 
                  value={newMove.amount} 
                  onChange={e => setNewMove({...newMove, amount: e.target.value})}
                  style={{ width: '100%', marginTop: '8px' }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Método</label>
                <select 
                  value={newMove.payment_method} 
                  onChange={e => setNewMove({...newMove, payment_method: e.target.value})}
                  style={{ width: '100%', marginTop: '8px' }}
                >
                  <option value="efectivo">EFECTIVO</option>
                  <option value="transaccion">TRANSACCIÓN</option>
                </select>
              </div>
              {newMove.payment_method === 'transaccion' && (
                <div>
                  <label style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Banco</label>
                  <select 
                    value={newMove.bank} 
                    onChange={e => setNewMove({...newMove, bank: e.target.value})}
                    style={{ width: '100%', marginTop: '8px' }}
                  >
                    <option value="nequi">NEQUI</option>
                    <option value="bancolombia">BANCOLOMBIA</option>
                    <option value="daviplata">DAVIPLATA</option>
                    <option value="banco_bogota">BANCO DE BOGOTÁ</option>
                    <option value="otro">OTRO</option>
                  </select>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Descripción / Concepto</label>
              <input 
                type="text" 
                value={newMove.description} 
                onChange={e => setNewMove({...newMove, description: e.target.value})}
                style={{ width: '100%', marginTop: '8px' }}
                placeholder="Ej: Pago de servicios, Compra de insumos..."
                required
              />
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%' }}>REGISTRAR MOVIMIENTO</button>
          </form>
        </Modal>
      )}
    </div>
  )
}

export default CashRegister
