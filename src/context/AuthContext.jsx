import React, { createContext, useState, useContext, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const res = await axios.get('http://127.0.0.1:8000/api/users/me/', {
            headers: { Authorization: `Bearer ${token}` }
          })
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
      const res = await axios.post('http://127.0.0.1:8000/api/token/', { username, password })
      localStorage.setItem('token', res.data.access)
      localStorage.setItem('refresh', res.data.refresh)
      
      // Fetch user profile after login
      const userRes = await axios.get('http://127.0.0.1:8000/api/users/me/', {
        headers: { Authorization: `Bearer ${res.data.access}` }
      })
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

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
