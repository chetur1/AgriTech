/**
 * AGRI SMART — Farmer Layout
 * File: frontend/src/layouts/FarmerLayout.jsx
 *
 * The shell for all farmer dashboard pages.
 * - Responsive sidebar on desktop
 * - Bottom navigation bar on mobile
 * - Top header with user info and notifications
 */

import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import {
  Leaf, LayoutDashboard, Sprout, Cloud, Camera,
  Droplets, TrendingUp, Wallet, Mic, Users,
  BarChart2, Bell, Settings, LogOut, User,
  ChevronRight, Menu, X
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { to: '/farmer/dashboard',    icon: LayoutDashboard, key: 'dashboard' },
  { to: '/farmer/farms',        icon: Leaf,             key: 'farms' },
  { to: '/farmer/crops',        icon: Sprout,           key: 'crops' },
  { to: '/farmer/weather',      icon: Cloud,            key: 'weather' },
  { to: '/farmer/ai-diagnosis', icon: Camera,           key: 'ai_diagnosis' },
  { to: '/farmer/soil',         icon: Droplets,         key: 'soil' },
  { to: '/farmer/market',       icon: TrendingUp,       key: 'market' },
  { to: '/farmer/finance',      icon: Wallet,           key: 'finance' },
  { to: '/farmer/voice',        icon: Mic,              key: 'voice' },
  { to: '/farmer/community',    icon: Users,            key: 'community' },
  { to: '/farmer/progress',     icon: BarChart2,        key: 'progress' },
]

export default function FarmerLayout() {
  const { user, logout } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-gray-100">
        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
          <Leaf className="w-4 h-4 text-white" />
        </div>
        <span className="text-lg font-bold text-primary-700">AGRI SMART</span>
      </div>

      {/* User card */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
            {user?.profile_photo_url
              ? <img src={user.profile_photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
              : <User className="w-5 h-5 text-primary-600" />
            }
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{user?.full_name}</p>
            <p className="text-xs text-gray-500">{user?.district}, {user?.state}</p>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-0.5">
        {navItems.map(({ to, icon: Icon, key }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              isActive ? 'nav-link-active' : 'nav-link'
            }
            onClick={() => setSidebarOpen(false)}
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span className="text-sm">{t(`nav.${key}`)}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 py-3 border-t border-gray-100 space-y-0.5">
        <NavLink to="/farmer/notifications" className={({isActive}) => isActive ? 'nav-link-active' : 'nav-link'}>
          <Bell className="w-5 h-5 shrink-0" />
          <span className="text-sm">{t('nav.notifications')}</span>
        </NavLink>
        <NavLink to="/farmer/settings" className={({isActive}) => isActive ? 'nav-link-active' : 'nav-link'}>
          <Settings className="w-5 h-5 shrink-0" />
          <span className="text-sm">{t('nav.settings')}</span>
        </NavLink>
        <button onClick={handleLogout} className="nav-link w-full text-red-500 hover:bg-red-50 hover:text-red-600">
          <LogOut className="w-5 h-5 shrink-0" />
          <span className="text-sm">{t('nav.logout')}</span>
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

      {/* Main Content Area */}
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
            <Leaf className="w-5 h-5 text-primary-600" />
            <span className="font-bold text-primary-700 text-base">AGRI SMART</span>
          </div>
          <NavLink to="/farmer/notifications" className="p-2 rounded-lg text-gray-600 hover:bg-gray-100">
            <Bell className="w-5 h-5" />
          </NavLink>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>

        {/* Mobile bottom nav (most-used 5 items) */}
        <nav className="lg:hidden flex items-center justify-around bg-white border-t border-gray-200 px-2 py-2 safe-bottom">
          {[
            { to: '/farmer/dashboard',    icon: LayoutDashboard },
            { to: '/farmer/crops',        icon: Sprout },
            { to: '/farmer/weather',      icon: Cloud },
            { to: '/farmer/ai-diagnosis', icon: Camera },
            { to: '/farmer/market',       icon: TrendingUp },
          ].map(({ to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 p-2 rounded-lg transition-colors ${
                  isActive ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'
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
