import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { 
  TrendingUp, Calendar, Package, AlertTriangle, 
  ArrowUpRight, ArrowDownRight, Clock, User, 
  DollarSign, ShoppingBag, RefreshCcw
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatCurrency, formatDate } from '../utils/format'

const Dashboard = () => {
  const [stats, setStats] = useState({
    monthly_sales: 0,
    active_rentals: 0,
    returns_today: 0,
    upcoming_deliveries: 0,
    revenue_today: 0,
    revenue_trend: 0,
    weekly_revenue: [],
    low_stock: 0,
    recent_rentals: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    const token = localStorage.getItem('token')
    try {
      const res = await axios.get('http://192.168.1.17:8000/api/dashboard-stats/', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setStats(res.data)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  const StatCard = ({ title, value, icon, color, trend, trendValue }) => (
    <div className="glass-card" style={{ padding: '30px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '80px', height: '80px', background: color, filter: 'blur(50px)', opacity: 0.1 }}></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
          {React.cloneElement(icon, { color: color, size: 24 })}
        </div>
        {trend && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: trend === 'up' ? '#10b981' : '#ef4444', fontWeight: 'bold', background: trend === 'up' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', padding: '4px 8px', borderRadius: '20px' }}>
            {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {trendValue}
          </div>
        )}
      </div>
      <h3 style={{ fontSize: '0.85rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>{title}</h3>
      <p className="urban-font" style={{ fontSize: '1.8rem', color: 'white', fontWeight: 'bold' }}>{value}</p>
    </div>
  )

  if (loading) return <div style={{ padding: '100px', textAlign: 'center', color: 'var(--cta)' }}>CARGANDO DASHBOARD...</div>

  return (
    <div className="fade-in dashboard-container">
      <div className="admin-header">
        <div>
          <h1 className="urban-font gold-text admin-title">DASHBOARD</h1>
          <p style={{ color: 'var(--text-dim)' }}>Resumen operativo de Urban Luxury</p>
        </div>
        <div className="admin-actions">
          <button onClick={fetchStats} className="btn-outline refresh-btn" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <RefreshCcw size={16} /> Actualizar
          </button>
        </div>
      </div>

      {/* Primary Stats */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px', marginBottom: '50px' }}>
        <StatCard 
          title="Ingresos Hoy" 
          value={formatCurrency(stats.revenue_today)} 
          icon={<DollarSign />} 
          color="var(--cta)" 
          trend={stats.revenue_trend >= 0 ? "up" : "down"} 
          trendValue={`${Math.abs(stats.revenue_trend)}%`}
        />
        <StatCard 
          title="Ventas del Mes" 
          value={formatCurrency(stats.monthly_sales)} 
          icon={<TrendingUp />} 
          color="#3b82f6" 
        />
        <StatCard 
          title="Alquileres Activos" 
          value={stats.active_rentals} 
          icon={<ShoppingBag />} 
          color="#10b981" 
        />
        <StatCard 
          title="Stock Bajo" 
          value={stats.low_stock} 
          icon={<AlertTriangle />} 
          color={stats.low_stock > 0 ? "#ef4444" : "var(--text-dim)"} 
        />
      </div>

      <div className="dashboard-main-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(0, 1fr))', gap: '40px' }}>
        
        {/* Recent Activity Table */}
        <div className="glass-card activity-card" style={{ padding: '35px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h3 className="urban-font section-title" style={{ fontSize: '1.2rem', color: 'white' }}>ALQUILERES RECIENTES</h3>
            <Link to="/admin/transactions" style={{ fontSize: '0.75rem', color: 'var(--cta)', fontWeight: 'bold', letterSpacing: '1px' }}>VER TODO</Link>
          </div>
          <div className="table-container">
            <table className="urban-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th className="hide-mobile">Vence</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_rentals.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', background: 'var(--secondary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', color: 'var(--cta)', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.05)' }}>
                          {r.customer_name?.[0] || 'C'}
                        </div>
                        <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{r.customer_name}</span>
                      </div>
                    </td>
                    <td className="hide-mobile" style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                      {formatDate(r.end_date)}
                    </td>
                    <td>
                      <span style={{ 
                        fontSize: '0.65rem', padding: '4px 10px', borderRadius: '6px', background: 'var(--secondary)', 
                        color: r.status === 'delivered' ? '#3b82f6' : r.status === 'overdue' ? '#ef4444' : 'var(--cta)',
                        border: '1px solid rgba(255,255,255,0.05)', textTransform: 'uppercase', fontWeight: 'bold'
                      }}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '0.9rem', color: 'white' }}>
                      {formatCurrency(r.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actionable Alerts Area */}
        <div className="alerts-column" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          <div className="glass-card agenda-card" style={{ padding: '30px', background: 'linear-gradient(145deg, rgba(184, 158, 72, 0.08) 0%, rgba(10, 10, 10, 0) 100%)', border: '1px solid rgba(184, 158, 72, 0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
              <div style={{ background: 'var(--gold-gradient)', padding: '10px', borderRadius: '8px' }}>
                <Clock size={24} color="black" />
              </div>
              <h3 className="urban-font" style={{ fontSize: '1.1rem' }}>AGENDA DE HOY</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                <div>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginBottom: '5px' }}>ENTREGAS PENDIENTES</p>
                  <p style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--cta)' }}>{stats.upcoming_deliveries}</p>
                </div>
                <Link to="/admin/notifications" style={{ alignSelf: 'center' }}><ArrowUpRight size={20} color="var(--cta)" /></Link>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                <div>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginBottom: '5px' }}>DEVOLUCIONES PARA HOY</p>
                  <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#3b82f6' }}>{stats.returns_today}</p>
                </div>
                <Link to="/admin/notifications" style={{ alignSelf: 'center' }}><ArrowUpRight size={20} color="#3b82f6" /></Link>
              </div>
            </div>
          </div>

          <div className="glass-card chart-card" style={{ padding: '30px' }}>
            <h3 style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '20px', textTransform: 'uppercase' }}>Ingresos últimos 7 días</h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', height: '100px', paddingTop: '20px' }}>
              {stats.weekly_revenue.map((dayData, i) => {
                const maxVal = Math.max(...stats.weekly_revenue.map(d => d.value), 1)
                const height = (dayData.value / maxVal) * 100
                const isToday = i === stats.weekly_revenue.length - 1
                return (
                  <div key={i} style={{ flex: 1, height: `${Math.max(height, 5)}%`, background: isToday ? 'var(--gold-gradient)' : 'rgba(255,255,255,0.05)', borderRadius: '4px 4px 0 0', position: 'relative' }}>
                    {isToday && <div style={{ position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.55rem', color: 'var(--cta)' }}>Hoy</div>}
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.55rem', color: 'var(--text-dim)' }}>
              {stats.weekly_revenue.map((dayData, i) => (
                <span key={i}>{dayData.day}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .dashboard-header { flex-direction: column !important; align-items: center !important; text-align: center; gap: 20px; }
          .dashboard-title { font-size: 1.8rem !important; }
          .refresh-btn { width: 100% !important; justify-content: center; }

          .stats-grid { 
            grid-template-columns: 1fr !important; 
            gap: 15px !important; 
          }
          .dashboard-main-grid {
            grid-template-columns: minmax(0, 1fr) !important;
            gap: 20px !important;
          }
          .activity-card, .agenda-card, .chart-card {
            padding: 20px !important;
          }
          .section-title { font-size: 1rem !important; }
          .hide-mobile { display: none !important; }
        }
      `}</style>
    </div>
  )
}

export default Dashboard
