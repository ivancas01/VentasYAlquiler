import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import axios from 'axios'
import { AuthProvider } from './context/AuthContext'
import { SiteProvider } from './context/SiteContext'
import Navbar from './components/shared/Navbar'
import Footer from './components/shared/Footer'
import AdminLayout from './components/shared/AdminLayout'
import ProtectedRoute from './components/shared/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import Catalog from './pages/Catalog'

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

        
        {/* Admin Routes wrapped in AdminLayout and ProtectedRoute */}
        <Route path="/admin" element={<ProtectedRoute><AdminLayout><Dashboard /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/pos" element={<ProtectedRoute><AdminLayout><AdminPOS /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/staff" element={<ProtectedRoute><AdminLayout><Staff /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute><AdminLayout><Reports /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/inventory" element={<ProtectedRoute><AdminLayout><Inventory /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/cms" element={<ProtectedRoute><AdminLayout><CMS /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/customers" element={<ProtectedRoute><AdminLayout><Customers /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/transactions" element={<ProtectedRoute><AdminLayout><Transactions /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/movements" element={<ProtectedRoute><AdminLayout><Movements /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/cash" element={<ProtectedRoute><AdminLayout><CashRegister /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/notifications" element={<ProtectedRoute><AdminLayout><Notifications /></AdminLayout></ProtectedRoute>} />
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
