import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import api from './api/axios'
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
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/catalog" element={<Catalog />} />

        {/* Admin Routes with nested layout and protection */}
        <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="pos" element={<AdminPOS />} />
          <Route path="staff" element={<Staff />} />
          <Route path="reports" element={<Reports />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="cms" element={<CMS />} />
          <Route path="customers" element={<Customers />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="movements" element={<Movements />} />
          <Route path="cash" element={<CashRegister />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>
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
