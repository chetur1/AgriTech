/**
 * AGRI SMART — Protected Route Component
 * File: frontend/src/components/auth/ProtectedRoute.jsx
 *
 * Wraps role-restricted sections of the app.
 * - Unauthenticated users → redirect to /login
 * - Wrong role → redirect to their correct dashboard
 * - Correct role → render children
 */

import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import LoadingScreen from '../ui/LoadingScreen'

const roleDashboard = {
  farmer: '/farmer/dashboard',
  expert: '/expert/dashboard',
  admin:  '/admin/dashboard',
}

export default function ProtectedRoute({ role }) {
  const { isAuthenticated, role: userRole, loading } = useAuth()
  const location = useLocation()

  // Still checking stored token
  if (loading) return <LoadingScreen />

  // Not logged in → go to login, remember where they were trying to go
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Logged in but wrong role → redirect to their dashboard
  if (role && userRole !== role) {
    return <Navigate to={roleDashboard[userRole] || '/'} replace />
  }

  return <Outlet />
}
