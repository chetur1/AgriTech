/**
 * AGRI SMART — Public Layout
 * File: frontend/src/layouts/PublicLayout.jsx
 *
 * Wraps all public-facing pages (landing, login, register, etc.)
 * Includes the top navigation bar and footer.
 */

import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Leaf, Menu, X } from 'lucide-react'
import { useState } from 'react'

const roleDashboard = {
  farmer: '/farmer/dashboard',
  expert: '/expert/dashboard',
  admin:  '/admin/dashboard',
}

export default function PublicLayout() {
  const { isAuthenticated, role, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleGoToDashboard = () => {
    navigate(roleDashboard[role] || '/')
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* ---- Top Navigation ---- */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center group-hover:bg-primary-700 transition-colors">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-primary-700">AGRI SMART</span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-6">
              <Link to="/features" className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors">Features</Link>
              <Link to="/about"    className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors">About</Link>
              <Link to="/contact"  className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors">Contact</Link>
            </div>

            {/* Auth buttons */}
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  <button onClick={handleGoToDashboard} className="btn-secondary py-2 px-4 text-sm">
                    My Dashboard
                  </button>
                  <button onClick={logout} className="btn-ghost py-2 px-4 text-sm">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn-secondary py-2 px-4 text-sm">Login</Link>
                  <Link to="/register" className="btn-primary py-2 px-4 text-sm">Register Free</Link>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 flex flex-col gap-3">
            <Link to="/features" className="text-sm font-medium text-gray-700 py-2" onClick={() => setMenuOpen(false)}>Features</Link>
            <Link to="/about"    className="text-sm font-medium text-gray-700 py-2" onClick={() => setMenuOpen(false)}>About</Link>
            <Link to="/contact"  className="text-sm font-medium text-gray-700 py-2" onClick={() => setMenuOpen(false)}>Contact</Link>
            <hr className="border-gray-200" />
            {isAuthenticated ? (
              <button onClick={() => { handleGoToDashboard(); setMenuOpen(false) }} className="btn-primary w-full">My Dashboard</button>
            ) : (
              <>
                <Link to="/login"    className="btn-secondary w-full text-center" onClick={() => setMenuOpen(false)}>Login</Link>
                <Link to="/register" className="btn-primary  w-full text-center" onClick={() => setMenuOpen(false)}>Register Free</Link>
              </>
            )}
          </div>
        )}
      </nav>

      {/* ---- Page Content ---- */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* ---- Footer ---- */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <Leaf className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold text-white">AGRI SMART</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed max-w-sm">
                Smart Farming. Better Decisions. Stronger Farmers.<br />
                Empowering Indian farmers with AI-driven agricultural intelligence.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/features" className="hover:text-primary-400 transition-colors">Features</Link></li>
                <li><Link to="/about"    className="hover:text-primary-400 transition-colors">About Us</Link></li>
                <li><Link to="/contact"  className="hover:text-primary-400 transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/privacy"  className="hover:text-primary-400 transition-colors">Privacy Policy</Link></li>
                <li><span className="text-gray-500 cursor-not-allowed">Terms of Service</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-6 text-center text-xs text-gray-500">
            © 2024 AGRI SMART. Built for Indian farmers with ❤️
          </div>
        </div>
      </footer>
    </div>
  )
}
