/**
 * AGRI SMART — Expert Layout
 * File: frontend/src/layouts/ExpertLayout.jsx
 *
 * Shell for all expert dashboard pages.
 * - Full sidebar on desktop
 * - Mobile top bar + hamburger menu
 * - Expert verification badge in sidebar
 */

import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Leaf, LayoutDashboard, Camera, MessageSquare,
  BookOpen, User, LogOut, Menu, X, Bell,
  ShieldCheck, Users
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { to: '/expert/dashboard',         icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/expert/diagnosis-review',  icon: Camera,          label: 'Diagnosis Review' },
  { to: '/expert/consultations',     icon: MessageSquare,   label: 'Consultations' },
  { to: '/expert/farmers',           icon: Users,           label: 'Farmers' },
  { to: '/expert/knowledge',         icon: BookOpen,        label: 'Knowledge Base' },
  { to: '/expert/profile',           icon: User,            label: 'My Profile' },
]

export default function ExpertLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-green-100">
        <div className="w-8 h-8 bg-green-700 rounded-lg flex items-center justify-center">
          <Leaf className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="text-lg font-bold text-green-800">AGRI SMART</span>
          <p className="text-xs text-green-600 -mt-0.5">Expert Portal</p>
        </div>
      </div>

      {/* Expert profile card */}
      <div className="px-4 py-4 border-b border-green-100 bg-green-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-green-700" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 truncate">{user?.full_name}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-3 h-3 text-green-600" />
              <span className="text-xs text-green-700 font-medium">Agricultural Expert</span>
            </div>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              isActive ? 'nav-link-active' : 'nav-link'
            }
            onClick={() => setSidebarOpen(false)}
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span className="text-sm">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 py-3 border-t border-green-100 space-y-0.5">
        <button
          onClick={handleLogout}
          className="nav-link w-full text-red-500 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex flex-col w-72 bg-white shadow-xl">
            <button
              className="absolute top-4 right-4 p-1 text-gray-500 hover:text-gray-700"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Mobile Top Bar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-5 h-5 text-green-700" />
            <span className="font-bold text-green-800 text-base">Expert Portal</span>
          </div>
          <div className="p-2 rounded-lg text-gray-600">
            <Bell className="w-5 h-5" />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
