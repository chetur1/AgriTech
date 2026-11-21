/**
 * AGRI SMART — Authentication Context
 * File: frontend/src/context/AuthContext.jsx
 *
 * Manages the authenticated user state across the entire application.
 * - Stores the JWT token in localStorage (with expiry check)
 * - Provides login, logout, and register functions
 * - Exposes the current user and role to any component via useAuth()
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '../services/api'

const formatApiError = (err, fallback) => {
  const detail = err.response?.data?.detail
  if (!detail) return err.message || fallback
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail.map(d => (typeof d === 'string' ? d : d.msg || d.message || JSON.stringify(d))).join(', ')
  }
  if (typeof detail === 'object') {
    return detail.msg || detail.message || JSON.stringify(detail)
  }
  return String(detail)
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [token, setToken]     = useState(() => localStorage.getItem('agrismart_token'))
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  // -----------------------------------------------------------------
  // On mount — verify stored token and fetch current user profile
  // -----------------------------------------------------------------
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('agrismart_token')
      if (!storedToken) {
        setLoading(false)
        return
      }
      try {
        const profile = await authAPI.getProfile(storedToken)
        setUser(profile)
        setToken(storedToken)
      } catch {
        // Token expired or invalid — clear storage
        localStorage.removeItem('agrismart_token')
        setToken(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    initAuth()
  }, [])

  // -----------------------------------------------------------------
  // Login
  // -----------------------------------------------------------------
  const login = useCallback(async (credentials) => {
    setError(null)
    try {
      const { access_token, user: userData } = await authAPI.login(credentials)
      localStorage.setItem('agrismart_token', access_token)
      setToken(access_token)
      setUser(userData)
      return userData
    } catch (err) {
      const message = formatApiError(err, 'Login failed. Please try again.')
      setError(message)
      throw new Error(message)
    }
  }, [])

  // -----------------------------------------------------------------
  // Register
  // -----------------------------------------------------------------
  const register = useCallback(async (formData) => {
    setError(null)
    try {
      const { access_token, user: userData } = await authAPI.register(formData)
      localStorage.setItem('agrismart_token', access_token)
      setToken(access_token)
      setUser(userData)
      return userData
    } catch (err) {
      const message = formatApiError(err, 'Registration failed. Please try again.')
      setError(message)
      throw new Error(message)
    }
  }, [])

  // -----------------------------------------------------------------
  // Logout
  // -----------------------------------------------------------------
  const logout = useCallback(() => {
    localStorage.removeItem('agrismart_token')
    setToken(null)
    setUser(null)
  }, [])

  // -----------------------------------------------------------------
  // Update user data (e.g. after profile edit)
  // -----------------------------------------------------------------
  const updateUser = useCallback((updates) => {
    setUser(prev => prev ? { ...prev, ...updates } : null)
  }, [])

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!user,
    role: user?.role || null,
    login,
    logout,
    register,
    updateUser,
    clearError: () => setError(null),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/** Hook — use inside any component that needs auth state */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
