/**
 * AGRI SMART — Consumer Layout
 * File: frontend/src/layouts/ConsumerLayout.jsx
 *
 * Shell layout for all consumer dashboard pages with responsive sidebar.
 */

import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Leaf, LayoutDashboard, Store, Package, UserCircle,
  LogOut, User, Menu, X, Heart
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { to: '/consumer/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/consumer/marketplace', icon: Store,            label: 'Farm Fresh Market' },
  { to: '/consumer/orders',      icon: Package,          label: 'My Orders' },
  { to: '/consumer/profile',     icon: UserCircle,       label: 'My Preferences' },
]

export default function ConsumerLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/') }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-5 border-b border-gray-100">
        <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
          <Heart className="w-4 h-4 text-white" />
        </div>
        <span className="text-lg font-bold text-teal-700">AGRI SMART</span>
        <span className="text-xs bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full font-semibold ml-auto">Consumer</span>
      </div>

      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-teal-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{user?.full_name}</p>
            <p className="text-xs text-gray-500">{user?.district}, {user?.state}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => isActive ? 'nav-link-active' : 'nav-link'}
            onClick={() => setSidebarOpen(false)}
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span className="text-sm">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-gray-100 space-y-0.5">
        <button onClick={handleLogout} className="nav-link w-full text-red-500 hover:bg-red-50 hover:text-red-600">
          <LogOut className="w-5 h-5 shrink-0" />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 shrink-0">
        <SidebarContent />
      </aside>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex flex-col w-72 bg-white shadow-xl">
            <button className="absolute top-4 right-4 p-1 text-gray-500" onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg text-gray-600 hover:bg-gray-100">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1.5">
            <Heart className="w-5 h-5 text-teal-600" />
            <span className="font-bold text-teal-700 text-base">Consumer Portal</span>
          </div>
          <div className="w-9" />
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>

        <nav className="lg:hidden flex items-center justify-around bg-white border-t border-gray-200 px-2 py-2 safe-bottom">
          {navItems.map(({ to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 p-2 rounded-lg transition-colors ${
                  isActive ? 'text-teal-600' : 'text-gray-400 hover:text-gray-600'
                }`
              }
            >
              <Icon className="w-6 h-6" />
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
