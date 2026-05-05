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
        const res = await axios.get('http://127.0.0.1:8000/api/analytics/', {
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
    <div className="fade-in" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <h2 className="urban-font gold-text" style={{ fontSize: '2.5rem', marginBottom: '50px', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <TrendingUp size={40} /> Reportes
      </h2>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', marginBottom: '40px' }}>
        <div className="glass-card" style={{ padding: '30px', borderLeft: '4px solid var(--cta)' }}>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Ventas Totales</p>
          <h3 className="gold-text" style={{ fontSize: '2.2rem' }}>${data.daily_sales.reduce((acc, curr) => acc + parseFloat(curr.total), 0).toFixed(2)}</h3>
        </div>
        <div className="glass-card" style={{ padding: '30px', borderLeft: '4px solid white' }}>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Ingresos Alquiler</p>
          <h3 style={{ fontSize: '2.2rem', color: 'white' }}>${data.daily_rentals.reduce((acc, curr) => acc + parseFloat(curr.total), 0).toFixed(2)}</h3>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
        {/* Trend Chart */}
        <div className="glass-card" style={{ padding: '40px' }}>
          <h4 className="urban-font" style={{ marginBottom: '30px', fontSize: '1rem', color: 'var(--cta)' }}>Tendencia de Ventas</h4>
          <div style={{ height: '350px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.daily_sales}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="var(--text-dim)" fontSize={12} />
                <YAxis stroke="var(--text-dim)" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="total" stroke="var(--cta)" strokeWidth={4} dot={{ r: 4, fill: 'var(--cta)' }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rental Chart */}
        <div className="glass-card" style={{ padding: '40px' }}>
          <h4 className="urban-font" style={{ marginBottom: '30px', fontSize: '1rem', color: 'white' }}>Tendencia de Alquileres</h4>
          <div style={{ height: '350px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.daily_rentals}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="var(--text-dim)" fontSize={12} />
                <YAxis stroke="var(--text-dim)" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="total" stroke="white" strokeWidth={4} dot={{ r: 4, fill: 'white' }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* Top Sellers */}
        <div className="glass-card" style={{ padding: '40px' }}>
          <h4 className="urban-font" style={{ marginBottom: '30px', fontSize: '1rem', color: 'var(--cta)' }}>Top Vendedores</h4>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.top_sales_staff}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="username" stroke="var(--text-dim)" fontSize={12} />
                <YAxis stroke="var(--text-dim)" fontSize={12} />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                <Bar dataKey="sales_count" fill="var(--cta)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Renters */}
        <div className="glass-card" style={{ padding: '40px' }}>
          <h4 className="urban-font" style={{ marginBottom: '30px', fontSize: '1rem', color: 'white' }}>Top Alquiladores</h4>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.top_rental_staff}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="username" stroke="var(--text-dim)" fontSize={12} />
                <YAxis stroke="var(--text-dim)" fontSize={12} />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                <Bar dataKey="rentals_count" fill="white" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reports
