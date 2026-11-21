/**
 * AGRI SMART — Registration Page
 * File: frontend/src/pages/public/RegisterPage.jsx
 *
 * Supports farmer and expert registration.
 * Expert accounts are created with pending_verification status.
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { Leaf, Eye, EyeOff, AlertCircle, User, Briefcase } from 'lucide-react'

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
]

const LANGUAGES = [
  { code: 'kn', label: 'ಕನ್ನಡ — Kannada' },
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी — Hindi' },
  { code: 'te', label: 'తెలుగు — Telugu' },
  { code: 'ta', label: 'தமிழ் — Tamil' },
]

export default function RegisterPage() {
  const { register } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [role, setRole] = useState('farmer')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    full_name: '',
    mobile: '',
    password: '',
    confirm_password: '',
    preferred_language: 'en',
    state: '',
    district: '',
    village: '',
    // expert only
    email: '',
    qualifications: '',
    specialisation: '',
    institution: '',
  })

  const set = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }))

  const validate = () => {
    if (!form.full_name.trim()) return 'Full name is required.'
    if (!/^\d{10}$/.test(form.mobile)) return t('errors.invalid_mobile')
    if (form.password.length < 8) return t('errors.password_short')
    if (form.password !== form.confirm_password) return t('errors.passwords_mismatch')
    if (!form.state) return 'Please select your state.'
    if (role === 'expert' && !form.email) return 'Email is required for expert registration.'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const validationError = validate()
    if (validationError) { setError(validationError); return }

    setLoading(true)
    try {
      const payload = { ...form, role }
      delete payload.confirm_password
      const user = await register(payload)
      navigate(role === 'farmer' ? '/farmer/dashboard' : '/expert/dashboard', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white px-4 py-12">
      <div className="max-w-lg mx-auto">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-extrabold text-primary-700">AGRI SMART</span>
          </div>
          <p className="text-sm text-gray-500">Create your free account</p>
        </div>

        <div className="card shadow-lg border-0">
          {/* Role selector */}
          <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-xl">
            {[
              { value: 'farmer', label: t('auth.farmer'), icon: User },
              { value: 'expert', label: t('auth.expert'), icon: Briefcase },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setRole(value)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  role === value
                    ? 'bg-white text-primary-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {role === 'expert' && (
            <div className="alert-info mb-4 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Expert accounts require credential verification by an administrator before activation.
            </div>
          )}

          {error && (
            <div className="alert-error mb-4 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full name */}
            <div>
              <label className="form-label">{t('auth.full_name')} *</label>
              <input className="form-input" value={form.full_name} onChange={set('full_name')} placeholder="Your full name" />
            </div>

            {/* Mobile */}
            <div>
              <label className="form-label">{t('auth.mobile')} *</label>
              <input className="form-input" type="tel" inputMode="numeric" maxLength={10} value={form.mobile} onChange={set('mobile')} placeholder="10-digit mobile number" />
            </div>

            {/* Email — expert only */}
            {role === 'expert' && (
              <div>
                <label className="form-label">Email Address *</label>
                <input className="form-input" type="email" value={form.email} onChange={set('email')} placeholder="your@email.com" />
              </div>
            )}

            {/* Password */}
            <div>
              <label className="form-label">{t('auth.password')} *</label>
              <div className="relative">
                <input
                  className="form-input pr-11"
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="Min. 8 characters"
                />
                <button type="button" className="absolute inset-y-0 right-3 flex items-center text-gray-400" onClick={() => setShowPwd(!showPwd)} tabIndex={-1}>
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label className="form-label">Confirm Password *</label>
              <input className="form-input" type="password" value={form.confirm_password} onChange={set('confirm_password')} placeholder="Re-enter your password" />
            </div>

            {/* Language */}
            <div>
              <label className="form-label">{t('auth.language')}</label>
              <select className="form-input" value={form.preferred_language} onChange={set('preferred_language')}>
                {LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
            </div>

            {/* State */}
            <div>
              <label className="form-label">{t('auth.state')} *</label>
              <select className="form-input" value={form.state} onChange={set('state')}>
                <option value="">Select State</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* District */}
            <div>
              <label className="form-label">{t('auth.district')}</label>
              <input className="form-input" value={form.district} onChange={set('district')} placeholder="Your district" />
            </div>

            {/* Village */}
            <div>
              <label className="form-label">{t('auth.village')}</label>
              <input className="form-input" value={form.village} onChange={set('village')} placeholder="Your village / town" />
            </div>

            {/* Expert-specific fields */}
            {role === 'expert' && (
              <>
                <div>
                  <label className="form-label">Qualifications</label>
                  <input className="form-input" value={form.qualifications} onChange={set('qualifications')} placeholder="e.g. M.Sc. Agronomy" />
                </div>
                <div>
                  <label className="form-label">Agricultural Specialisation</label>
                  <input className="form-input" value={form.specialisation} onChange={set('specialisation')} placeholder="e.g. Crop Disease, Soil Science" />
                </div>
                <div>
                  <label className="form-label">Institution / Organisation</label>
                  <input className="form-input" value={form.institution} onChange={set('institution')} placeholder="Your employer or institution" />
                </div>
              </>
            )}

            <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
              {loading ? <span className="spinner" /> : null}
              {loading ? 'Creating account…' : `Register as ${role === 'farmer' ? 'Farmer' : 'Expert'}`}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-5">
            {t('auth.have_account')}{' '}
            <Link to="/login" className="text-primary-600 font-semibold hover:underline">{t('auth.login')}</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
