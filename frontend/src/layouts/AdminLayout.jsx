/**
 * AGRI SMART — Admin Layout (placeholder for Phase 11)
 * File: frontend/src/layouts/AdminLayout.jsx
 */
import { Outlet } from 'react-router-dom'
export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gray-900 text-white px-6 py-4 font-bold text-lg">
        AGRI SMART — Admin Panel
      </div>
      <main className="page-container"><Outlet /></main>
    </div>
  )
}
