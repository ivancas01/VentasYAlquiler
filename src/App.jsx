import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import axios from 'axios'
import { AuthProvider } from './context/AuthContext'
import { SiteProvider } from './context/SiteContext'
import Navbar from './components/shared/Navbar'
import Footer from './components/shared/Footer'
import AdminLayout from './components/shared/AdminLayout'
import LandingPage from './pages/LandingPage'
import Catalog from './pages/Catalog'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AdminPOS from './pages/AdminPOS'
import Reports from './pages/Reports'
import Inventory from './pages/Inventory'
import Customers from './pages/Customers'
import CMS from './pages/CMS'
import Transactions from './pages/Transactions'
import Movements from './pages/Movements'
import Notifications from './pages/Notifications'
import Staff from './pages/Staff'
import CashRegister from './pages/CashRegister'
import About from './pages/About'
import Contact from './pages/Contact'
import { ShoppingCart, Package, BarChart3, Users, History, ArrowRight } from 'lucide-react'

// Main App component with route-based layout
const AppContent = () => {
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')

  return (
    <>
      {!isAdmin && <Navbar />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/login" element={<Login />} />
        
        {/* Admin Routes wrapped in AdminLayout */}
        <Route path="/admin" element={<AdminLayout><Dashboard /></AdminLayout>} />
        <Route path="/admin/pos" element={<AdminLayout><AdminPOS /></AdminLayout>} />
        <Route path="/admin/staff" element={<AdminLayout><Staff /></AdminLayout>} />
        <Route path="/admin/reports" element={<AdminLayout><Reports /></AdminLayout>} />
        <Route path="/admin/inventory" element={<AdminLayout><Inventory /></AdminLayout>} />
        <Route path="/admin/cms" element={<AdminLayout><CMS /></AdminLayout>} />
        <Route path="/admin/customers" element={<AdminLayout><Customers /></AdminLayout>} />
        <Route path="/admin/transactions" element={<AdminLayout><Transactions /></AdminLayout>} />
        <Route path="/admin/movements" element={<AdminLayout><Movements /></AdminLayout>} />
        <Route path="/admin/cash" element={<AdminLayout><CashRegister /></AdminLayout>} />
        <Route path="/admin/notifications" element={<AdminLayout><Notifications /></AdminLayout>} />
      </Routes>
      {!isAdmin && <Footer />}
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <SiteProvider>
        <Router>
          <AppContent />
        </Router>
      </SiteProvider>
    </AuthProvider>
  )
}

export default App
