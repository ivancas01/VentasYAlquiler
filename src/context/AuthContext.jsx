import React, { createContext, useState, useContext, useEffect } from 'react'
import api from '../api/axios'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const res = await api.get('/users/me/')
          setUser(res.data)
        } catch (err) {
          console.error("Token invalid or server error", err)
          localStorage.removeItem('token')
          localStorage.removeItem('refresh')
          setUser(null)
        }
      }
      setLoading(false)
    }
    initAuth()
  }, [])

  const login = async (username, password) => {
    try {
      const res = await api.post('/token/', { username, password })
      localStorage.setItem('token', res.data.access)
      localStorage.setItem('refresh', res.data.refresh)
      
      // Fetch user profile after login
      const userRes = await api.get('/users/me/')
      setUser(userRes.data)
      return true
    } catch (err) {
      console.error("Login failed", err)
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refresh')
    setUser(null)
  }

  const hasPermission = (permCodename) => {
    if (user?.is_superuser || user?.role === 'admin') return true
    if (!user?.groups_data) return false
    return user.groups_data.some(group => 
      group.permissions.some(p => p.codename === permCodename)
    )
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, hasPermission }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
