/**
 * AGRI SMART — Consumer Preferences Profile
 * File: frontend/src/pages/consumer/Profile.jsx
 */

import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Heart, Save, CheckCircle, Leaf } from 'lucide-react'

export default function ConsumerProfile() {
  const { token } = useAuth()
  const [form, setForm] = useState({
    delivery_address: '',
    preferred_commodities: '',
    is_organic_preferred: false,
    household_size: 4,
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/v1/consumer/profile', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) setForm(await res.json())
      } catch (err) { console.error(err) }
    }
    fetchProfile()
  }, [token])

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/v1/consumer/profile', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000) }
    } catch (err) { console.error(err) }
  }

  const set = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }))

  return (
    <div className="page-container max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Heart className="w-7 h-7 text-teal-600" />
            My Preferences
          </h1>
          <p className="text-sm text-gray-600 mt-1">Set your food preferences and delivery details for personalized recommendations.</p>
        </div>
        {saved && (
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1">
            <CheckCircle className="w-4 h-4" /> Saved
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="card bg-white border border-gray-200 p-6 space-y-4">
        <div>
          <label className="form-label">Default Delivery Address</label>
          <textarea className="form-input" rows="2" placeholder="Your full home address for produce delivery"
            value={form.delivery_address || ''} onChange={set('delivery_address')} />
        </div>

        <div>
          <label className="form-label">Preferred Commodities (comma-separated)</label>
          <input className="form-input" placeholder="Rice, Ragi Flour, Groundnut Oil, Tomatoes, Coconut"
            value={form.preferred_commodities || ''} onChange={set('preferred_commodities')} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Household Size</label>
            <input type="number" className="form-input" min="1" max="20"
              value={form.household_size || 4}
              onChange={(e) => setForm({ ...form, household_size: parseInt(e.target.value) || 4 })} />
          </div>
          <div className="flex items-center gap-3 pt-5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox"
                checked={form.is_organic_preferred || false}
                onChange={(e) => setForm({ ...form, is_organic_preferred: e.target.checked })}
                className="text-teal-600 rounded focus:ring-teal-500 w-5 h-5" />
              <span className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                <Leaf className="w-4 h-4 text-emerald-600" /> Prefer Organic Produce
              </span>
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t">
          <button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white text-xs px-5 py-2 rounded-lg font-semibold flex items-center gap-2 transition">
            <Save className="w-4 h-4" /> Save Preferences
          </button>
        </div>
      </form>
    </div>
  )
}
