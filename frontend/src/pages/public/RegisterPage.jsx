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
import { Leaf, Eye, EyeOff, AlertCircle, User, Briefcase, ShoppingCart, Heart } from 'lucide-react'

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
    preferred_language: 'kn',
    state: 'Karnataka',
    district: '',
    village: '',
    // expert only
    email: '',
    qualifications: '',
    specialisation: '',
    institution: '',
    // broker only
    business_name: '',
    business_type: 'Trader',
    gst_number: '',
    license_number: '',
    // consumer only
    delivery_address: '',
    preferred_commodities: '',
    is_organic_preferred: false,
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

      // Remove empty optional strings so Pydantic doesn't fail on email="" or nulls
      Object.keys(payload).forEach(k => {
        if (typeof payload[k] === 'string' && !payload[k].trim()) {
          delete payload[k]
        }
      })

      const user = await register(payload)
      const dest =
        role === 'farmer' ? '/farmer/dashboard'
        : role === 'expert' ? '/expert/dashboard'
        : (role === 'broker' || role === 'buyer') ? '/buyer/dashboard'
        : '/consumer/dashboard'
      navigate(dest, { replace: true })
    } catch (err) {
      setError(typeof err === 'string' ? err : err.message || 'Registration failed')
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6 p-1 bg-gray-100 rounded-xl">
            {[
              { value: 'farmer', label: 'Farmer', icon: User },
              { value: 'expert', label: 'Expert', icon: Briefcase },
              { value: 'broker', label: 'Broker', icon: ShoppingCart },
              { value: 'consumer', label: 'Consumer', icon: Heart },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setRole(value)}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  role === value
                    ? 'bg-white text-primary-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
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

            {/* Broker-specific fields */}
            {role === 'broker' && (
              <>
                <div>
                  <label className="form-label">Business / Agency Name *</label>
                  <input className="form-input" value={form.business_name} onChange={set('business_name')} placeholder="e.g. Mandya Agri Traders" required />
                </div>
                <div>
                  <label className="form-label">Business Type</label>
                  <select className="form-input" value={form.business_type} onChange={set('business_type')}>
                    <option value="Trader">Trader / Commission Agent</option>
                    <option value="Wholesaler">Wholesaler</option>
                    <option value="Miller">Miller / Processor</option>
                    <option value="Exporter">Exporter</option>
                    <option value="FPO">Farmer Producer Organisation (FPO)</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">APMC License / GST (Optional)</label>
                  <input className="form-input" value={form.license_number} onChange={set('license_number')} placeholder="APMC license or GSTIN" />
                </div>
              </>
            )}

            {/* Consumer-specific fields */}
            {role === 'consumer' && (
              <>
                <div>
                  <label className="form-label">Delivery Address *</label>
                  <textarea rows="2" className="form-input" value={form.delivery_address} onChange={set('delivery_address')} placeholder="Your delivery address for farm fresh orders" required />
                </div>
                <div>
                  <label className="form-label">Produce Preferences</label>
                  <input className="form-input" value={form.preferred_commodities} onChange={set('preferred_commodities')} placeholder="e.g. Ragi, Rice, Cold-Pressed Oil, Vegetables" />
                </div>
              </>
            )}

            <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
              {loading ? <span className="spinner" /> : null}
              {loading ? 'Creating account…' : `Register as ${role === 'farmer' ? 'Farmer' : role === 'expert' ? 'Expert' : role === 'broker' ? 'Broker / Trader' : 'Consumer'}`}
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
