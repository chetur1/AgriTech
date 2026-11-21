/**
 * AGRI SMART — Login Page
 * File: frontend/src/pages/public/LoginPage.jsx
 */

import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { Leaf, Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState({ mobile: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const sessionExpired = new URLSearchParams(location.search).get('expired') === '1'

  const roleDashboard = {
    farmer: '/farmer/dashboard',
    expert: '/expert/dashboard',
    admin: '/admin/dashboard',
    broker: '/buyer/dashboard',
    buyer: '/buyer/dashboard',
    consumer: '/consumer/dashboard',
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.mobile || !form.password) {
      setError('Please enter your mobile number and password.')
      return
    }

    setLoading(true)
    try {
      const user = await login({ mobile: form.mobile, password: form.password })
      const dest = location.state?.from?.pathname || roleDashboard[user.role] || '/'
      navigate(dest, { replace: true })
    } catch (err) {
      setError(err.message || t('errors.login_failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-extrabold text-primary-700">AGRI SMART</span>
          </div>
          <p className="text-sm text-gray-500">Smart Farming Intelligence Platform</p>
        </div>

        <div className="card shadow-lg border-0">
          <h1 className="text-xl font-bold text-gray-900 mb-6">{t('auth.login')}</h1>

          {/* Session expired alert */}
          {sessionExpired && (
            <div className="alert-warning mb-4 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {t('errors.session_expired')}
            </div>
          )}

          {/* Error alert */}
          {error && (
            <div className="alert-error mb-4 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Mobile / Email / Name */}
            <div>
              <label className="form-label">{t('auth.mobile')} / Name / Email</label>
              <input
                type="text"
                className="form-input"
                placeholder="Mobile number, name, or email"
                value={form.mobile}
                onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))}
                autoComplete="username"
              />
            </div>

            {/* Password */}
            <div>
              <label className="form-label">{t('auth.password')}</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  className="form-input pr-11"
                  placeholder="Your password"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPwd(!showPwd)}
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
              {loading ? <span className="spinner" /> : null}
              {loading ? 'Logging in…' : t('auth.login')}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-5">
            {t('auth.no_account')}{' '}
            <Link to="/register" className="text-primary-600 font-semibold hover:underline">
              {t('auth.register')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
