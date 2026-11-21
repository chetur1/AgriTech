/**
 * AGRI SMART — Buyer Business Profile
 * File: frontend/src/pages/buyer/Profile.jsx
 */

import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Building2, Save, CheckCircle, AlertCircle } from 'lucide-react'

export default function BuyerProfile() {
  const { token } = useAuth()
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({})
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/v1/buyer/profile', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setProfile(data)
          setForm(data)
        }
      } catch (err) { console.error(err) }
    }
    fetchProfile()
  }, [token])

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch('/api/v1/buyer/profile', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000) }
      else { const d = await res.json(); setError(d.detail || 'Save failed') }
    } catch (err) { setError(err.message) }
  }

  const set = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }))

  return (
    <div className="page-container max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-7 h-7 text-amber-600" />
            Business Profile
          </h1>
          <p className="text-sm text-gray-600 mt-1">Keep your business details updated for farmer trust and priority matching.</p>
        </div>
        {saved && (
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1">
            <CheckCircle className="w-4 h-4" /> Saved
          </span>
        )}
      </div>

      {error && (
        <div className="alert-error text-sm"><AlertCircle className="w-4 h-4 shrink-0" /> {error}</div>
      )}

      <form onSubmit={handleSave} className="card bg-white border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Business Name *</label>
            <input className="form-input" value={form.business_name || ''} onChange={set('business_name')} />
          </div>
          <div>
            <label className="form-label">Business Type</label>
            <select className="form-input" value={form.business_type || 'Trader'} onChange={set('business_type')}>
              <option>Trader</option>
              <option>Wholesaler</option>
              <option>Miller</option>
              <option>Processor</option>
              <option>Exporter</option>
              <option>FPO (Farmer Producer Organisation)</option>
            </select>
          </div>
          <div>
            <label className="form-label">GST Number</label>
            <input className="form-input" placeholder="22AAAAA0000A1Z5" value={form.gst_number || ''} onChange={set('gst_number')} />
          </div>
          <div>
            <label className="form-label">APMC License Number</label>
            <input className="form-input" value={form.license_number || ''} onChange={set('license_number')} />
          </div>
        </div>
        <div>
          <label className="form-label">Commodities of Interest (comma-separated)</label>
          <input className="form-input" placeholder="Ragi, Paddy, Groundnut, Maize" value={form.commodities_of_interest || ''} onChange={set('commodities_of_interest')} />
        </div>
        <div>
          <label className="form-label">Preferred Districts (comma-separated)</label>
          <input className="form-input" placeholder="Mandya, Mysuru, Hassan" value={form.preferred_districts || ''} onChange={set('preferred_districts')} />
        </div>
        <div>
          <label className="form-label">Warehouse / Collection Address</label>
          <textarea className="form-input" rows="2" value={form.warehouse_address || ''} onChange={set('warehouse_address')} />
        </div>

        <div className="flex justify-end pt-3 border-t">
          <button type="submit" className="btn-primary text-xs px-5 py-2 flex items-center gap-2">
            <Save className="w-4 h-4" /> Save Profile
          </button>
        </div>
      </form>
    </div>
  )
}
