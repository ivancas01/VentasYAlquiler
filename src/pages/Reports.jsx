import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { TrendingUp, Users, ShoppingCart, Calendar } from 'lucide-react'

const Reports = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      const token = localStorage.getItem('token')
      try {
        const res = await axios.get('http://192.168.1.17:8000/api/analytics/', {
          headers: { Authorization: `Bearer ${token}` }
        })
        setData(res.data)
      } catch (err) {
        console.error("Error fetching analytics", err)
      }
      setLoading(false)
    }
    fetchAnalytics()
  }, [])

  if (loading) return <div style={{ padding: '200px', textAlign: 'center', color: 'var(--cta)' }}>CARGANDO ANALÍTICAS...</div>
  if (!data) return <div style={{ padding: '200px', textAlign: 'center', color: 'var(--text-dim)' }}>NO HAY DATOS DISPONIBLES.</div>

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card" style={{ padding: '10px', border: '1px solid var(--cta)', background: 'var(--primary)' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--cta)', fontWeight: 'bold', marginBottom: '5px' }}>{label}</p>
          <p style={{ fontSize: '0.9rem', color: 'white' }}>${payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fade-in" style={{ width: '100%', margin: '0' }}>
      <div className="admin-header">
        <div className="admin-title-section">
          <h2 className="urban-font gold-text admin-title" style={{ fontSize: '1.8rem', marginBottom: '5px' }}>
            <TrendingUp size={30} /> REPORTES
          </h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Análisis de rendimiento, ventas y alquileres</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="reports-stack">
        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--cta)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Ventas Totales</p>
          <h3 className="gold-text" style={{ fontSize: '1.6rem' }}>${data.daily_sales.reduce((acc, curr) => acc + parseFloat(curr.total), 0).toFixed(2)}</h3>
        </div>
        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Ingresos Alquiler</p>
          <h3 style={{ fontSize: '1.6rem', color: 'white' }}>${data.daily_rentals.reduce((acc, curr) => acc + parseFloat(curr.total), 0).toFixed(2)}</h3>
        </div>
      </div>

      <div className="reports-stack" style={{ marginTop: '30px' }}>
        {/* Trend Chart */}
        <div className="glass-card" style={{ padding: '25px' }}>
          <h4 className="urban-font report-section-title" style={{ color: 'var(--cta)' }}>Tendencia de Ventas</h4>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.daily_sales}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="var(--text-dim)" fontSize={10} />
                <YAxis stroke="var(--text-dim)" fontSize={10} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="total" stroke="var(--cta)" strokeWidth={3} dot={{ r: 3, fill: 'var(--cta)' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rental Chart */}
        <div className="glass-card" style={{ padding: '25px' }}>
          <h4 className="urban-font report-section-title" style={{ color: 'white' }}>Tendencia de Alquileres</h4>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.daily_rentals}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="var(--text-dim)" fontSize={10} />
                <YAxis stroke="var(--text-dim)" fontSize={10} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="total" stroke="white" strokeWidth={3} dot={{ r: 3, fill: 'white' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Sellers */}
        <div className="glass-card" style={{ padding: '25px' }}>
          <h4 className="urban-font report-section-title" style={{ color: 'var(--cta)' }}>Top Vendedores</h4>
          <div style={{ height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.top_sales_staff}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="username" stroke="var(--text-dim)" fontSize={10} />
                <YAxis stroke="var(--text-dim)" fontSize={10} />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                <Bar dataKey="sales_count" fill="var(--cta)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Renters */}
        <div className="glass-card" style={{ padding: '25px' }}>
          <h4 className="urban-font report-section-title" style={{ color: 'white' }}>Top Alquiladores</h4>
          <div style={{ height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.top_rental_staff}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="username" stroke="var(--text-dim)" fontSize={10} />
                <YAxis stroke="var(--text-dim)" fontSize={10} />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                <Bar dataKey="rentals_count" fill="white" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <style>{`
        .reports-stack {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }

        .report-section-title {
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 25px;
        }

        @media (max-width: 1024px) {
          .admin-header {
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
            gap: 15px !important;
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

export default Reports
