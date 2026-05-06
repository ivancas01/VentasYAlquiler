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
      <div className="glass-card fade-in modal-content-card" style={{
        width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto',
        position: 'relative', padding: '30px', border: '1px solid rgba(255,255,255,0.1)'
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
      const res = await axios.get(`http://192.168.1.17:8000/api/cash/summary/?start_date=${dates.start}&end_date=${dates.end}`, {
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
      const res = await axios.get(`http://192.168.1.17:8000/api/cash/movements/?start_date=${dates.start}&end_date=${dates.end}&page=${page}`, {
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
      await axios.post('http://192.168.1.17:8000/api/movements/', newMove, {
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
    <div className="fade-in" style={{ width: '100%', margin: '0' }}>
      <div className="admin-header">
        <div className="admin-title-section">
          <h2 className="urban-font gold-text admin-title" style={{ marginBottom: '5px' }}>CONTROL DE CAJA</h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Seguimiento financiero y movimientos en tiempo real</p>
        </div>
        <div className="admin-actions cash-actions">
          <button onClick={() => setShowMoveModal(true)} className="btn-primary main-action-btn">
            <Plus size={20} /> NUEVO MOVIMIENTO
          </button>
          <div className="date-filter-box">
            <div className="date-input-group">
              <label>Desde</label>
              <input type="date" value={dates.start} onChange={e => setDates({ ...dates, start: e.target.value })} />
            </div>
            <div className="date-separator"></div>
            <div className="date-input-group">
              <label>Hasta</label>
              <input type="date" value={dates.end} onChange={e => setDates({ ...dates, end: e.target.value })} />
            </div>
          </div>
        </div>
      </div>

      {loading && page === 1 ? (
        <div style={{ textAlign: 'center', padding: '100px', color: 'var(--cta)' }}>PROCESANDO DATOS FINANCIEROS...</div>
      ) : (
        <>
          <div className="cash-summary-grid">
            <div className="glass-card" style={{ padding: '35px', background: 'rgba(255,255,255,0.02)' }}>
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

          <div className="cash-content-grid">
            {/* Movements List with Infinite Scroll */}
            <div>
              <h3 className="urban-font" style={{ fontSize: '1.2rem', marginBottom: '30px', marginTop: '40px', color: 'white', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <History size={20} /> Movimientos
              </h3>
              <div className="movements-list" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {movements.map((move, index) => (
                  <div
                    ref={index === movements.length - 1 ? lastMoveRef : null}
                    key={move.id}
                    className="glass-card movement-card"
                    style={{
                      padding: '20px',
                      background: 'rgba(255,255,255,0.02)',
                      borderLeft: `4px solid ${(move.movement_type === 'IN' || move.type === 'IN') ? '#10b981' : '#ef4444'}`
                    }}
                  >
                    <div className="movement-info">
                      <div className="movement-desc">
                        {(move.description || 'Movimiento').toUpperCase()}
                      </div>
                      <div className="movement-meta">
                        <span>{new Date(move.created_at).toLocaleDateString()} {new Date(move.created_at).toLocaleTimeString()}</span>
                        <span className="meta-sep">•</span>
                        <span>{move.staff_name || 'Sistema'}</span>
                      </div>
                    </div>
                    <div className="movement-amount-section">
                      <div className="movement-value" style={{ color: (move.movement_type === 'IN' || move.type === 'IN') ? '#10b981' : '#ef4444' }}>
                        {(move.movement_type === 'IN' || move.type === 'IN') ? '+' : '-'}{formatCurrency(move.amount)}
                      </div>
                      <div className="movement-method">
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
              <h3 className="urban-font" style={{ fontSize: '1.2rem', marginBottom: '30px', marginTop: '40px', color: 'white', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <BankIcon size={20} /> Disponibilidad de Fondos
              </h3>
              <div className="table-container" style={{ background: 'var(--primary)', border: '1px solid var(--glass-border)', borderRadius: '12px' }}>
                <table className="urban-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ whiteSpace: 'nowrap' }}>Canal / Entidad</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Conceptos</th>
                      <th style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>Total Disponible</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary?.channels_detailed?.map(item => (
                      <tr key={item.channel}>
                        <td style={{ fontWeight: 'bold', textTransform: 'uppercase', color: item.channel === 'Efectivo' ? '#10b981' : 'var(--cta)', whiteSpace: 'nowrap' }}>
                          {item.channel.replace('_', ' ')}
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Disponibilidad: {formatCurrency(item.income)}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--cta)' }}>Garantías: {formatCurrency(item.guarantees)}</div>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '1rem', whiteSpace: 'nowrap' }}>
                          {formatCurrency(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
        </>
      )}

      {showMoveModal && (
        <Modal onClose={() => setShowMoveModal(false)}>
          <h3 className="urban-font gold-text" style={{ fontSize: '1.5rem', marginBottom: '30px' }}>NUEVO MOVIMIENTO</h3>
          <form onSubmit={handleCreateMove}>
            <div className="pos-form-row">
              <div className="pos-form-group">
                <label style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Tipo</label>
                <select
                  value={newMove.movement_type}
                  onChange={e => setNewMove({ ...newMove, movement_type: e.target.value })}
                  style={{ width: '100%' }}
                >
                  <option value="IN">ENTRADA (INGRESO)</option>
                  <option value="OUT">SALIDA (GASTO / RETIRO)</option>
                </select>
              </div>
              <div className="pos-form-group">
                <label style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Monto</label>
                <input
                  type="number"
                  value={newMove.amount}
                  onChange={e => setNewMove({ ...newMove, amount: e.target.value })}
                  style={{ width: '100%' }}
                  required
                />
              </div>
            </div>

            <div className="pos-form-row">
              <div className="pos-form-group">
                <label style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Método</label>
                <select
                  value={newMove.payment_method}
                  onChange={e => setNewMove({ ...newMove, payment_method: e.target.value })}
                  style={{ width: '100%' }}
                >
                  <option value="efectivo">EFECTIVO</option>
                  <option value="transaccion">TRANSACCIÓN</option>
                </select>
              </div>
              {newMove.payment_method === 'transaccion' && (
                <div className="pos-form-group">
                  <label style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Banco</label>
                  <select
                    value={newMove.bank}
                    onChange={e => setNewMove({ ...newMove, bank: e.target.value })}
                    style={{ width: '100%' }}
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
                onChange={e => setNewMove({ ...newMove, description: e.target.value })}
                style={{ width: '100%', marginTop: '8px' }}
                placeholder="Ej: Pago de servicios, Compra de insumos..."
                required
              />
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%' }}>REGISTRAR MOVIMIENTO</button>
          </form>
        </Modal>
      )}

      <style>{`
        .cash-summary-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 30px;
          marginBottom: 50px;
        }
        
        .cash-content-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 40px;
        }

        .date-filter-box {
          display: flex;
          gap: 40px;
          background: transparent;
          padding: 0;
          align-items: center;
          height: 60px;
        }

        .date-input-group {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .date-input-group label {
          font-size: 0.6rem;
          color: var(--cta);
          font-weight: bold;
          text-transform: uppercase;
        }

        .date-input-group input {
          background: transparent;
          border: none;
          color: white;
          outline: none;
          font-size: 0.9rem;
          cursor: pointer;
          padding: 8px 15px;
        }

        .date-separator {
          width: 1px;
          align-self: stretch;
          background: rgba(255,255,255,0.1);
          margin: 12px 0;
        }

        .main-action-btn {
          height: 45px !important;
          padding: 0 20px !important;
          font-size: 0.75rem !important;
        }

        .cash-actions {
          gap: 60px !important;
          align-items: flex-end !important;
        }

        .movement-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .movement-desc {
          font-weight: bold;
          font-size: 0.9rem;
          color: white;
        }

        .movement-meta {
          font-size: 0.7rem;
          color: var(--text-dim);
          margin-top: 4px;
          display: flex;
          gap: 10px;
        }

        .movement-value {
          font-weight: bold;
          font-size: 1.1rem;
        }

        .movement-method {
          font-size: 0.65rem;
          color: var(--text-dim);
          text-transform: uppercase;
          margin-top: 4px;
        }

        @media (max-width: 1024px) {
          .cash-summary-grid {
            grid-template-columns: 1fr !important;
            width: 100% !important;
          }
          
          .cash-content-grid {
            grid-template-columns: 1.2fr 1fr !important;
            width: 100% !important;
            gap: 25px !important;
          }
          
          .cash-content-grid > div {
            width: 100% !important;
            max-width: 100% !important;
            display: block !important;
            min-width: 0 !important;
          }
        }

        @media (max-width: 768px) {
          .cash-content-grid {
            grid-template-columns: 1fr !important;
          }
          
          .date-filter-box {
            width: 100% !important;
            height: auto !important;
            flex-direction: column !important;
            padding: 10px 0 !important;
            gap: 15px !important;
            align-items: stretch !important;
          }
          
          .date-input-group input {
            width: 100% !important;
            padding: 8px 15px !important;
            border-bottom: 1px solid rgba(255,255,255,0.1) !important;
          }
          
          .date-separator {
            display: none !important;
          }
          
          .cash-actions {
            flex-direction: column !important;
            width: 100% !important;
            gap: 15px !important;
            align-items: stretch !important;
          }
          
          .main-action-btn {
            width: 100% !important;
          }

          .movements-list {
            align-items: center !important;
            display: flex !important;
            flex-direction: column !important;
          }

          .movement-card {
            display: flex !important;
            width: 100% !important;
            flex-direction: column !important;
            text-align: center !important;
            gap: 15px !important;
          }

          .movement-meta {
            justify-content: center !important;
          }

          .movement-amount-section {
            width: 100% !important;
            border-top: 1px solid rgba(255,255,255,0.05) !important;
            padding-top: 10px !important;
          }

          .modal-content-card {
            padding: 20px !important;
          }
        }
      `}</style>
    </div>
  )
}

export default CashRegister
