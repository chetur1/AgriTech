/**
 * AGRI SMART — Crop Lifecycle Management & Activity Logging
 * File: frontend/src/pages/farmer/Crops.jsx
 */

import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Sprout, Plus, Calendar, Activity, ChevronRight,
  TrendingUp, AlertCircle, CheckCircle2, Filter,
  Trash2, Edit3, X, Clock, DollarSign, Layers
} from 'lucide-react'
import { cropAPI, farmAPI } from '../../services/api'
import LoadingScreen from '../../components/ui/LoadingScreen'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Crops' },
  { value: 'sown', label: 'Sown / Germinating' },
  { value: 'vegetative', label: 'Vegetative Growth' },
  { value: 'flowering', label: 'Flowering & Fruiting' },
  { value: 'maturity', label: 'Maturity' },
  { value: 'harvested', label: 'Harvested' },
  { value: 'failed', label: 'Failed' },
]

const ACTIVITY_TYPES = [
  { value: 'fertilizer', label: 'Fertilizer Application', color: 'bg-green-100 text-green-800' },
  { value: 'irrigation', label: 'Irrigation Event', color: 'bg-blue-100 text-blue-800' },
  { value: 'pesticide', label: 'Pest / Disease Spray', color: 'bg-amber-100 text-amber-800' },
  { value: 'weeding', label: 'Weeding / Intercultural', color: 'bg-purple-100 text-purple-800' },
  { value: 'harvesting', label: 'Harvesting Operation', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'other', label: 'Other Farm Work', color: 'bg-gray-100 text-gray-800' },
]

export default function CropsPage() {
  const [searchParams] = useSearchParams()
  const initialFarmId = searchParams.get('farm_id') || ''

  const [crops, setCrops] = useState([])
  const [farms, setFarms] = useState([])
  const [catalog, setCatalog] = useState([])
  const [selectedFarmFilter, setSelectedFarmFilter] = useState(initialFarmId)
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false)
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [selectedCrop, setSelectedCrop] = useState(null)
  const [cropDetail, setCropDetail] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // New Crop Form
  const [cropForm, setCropForm] = useState({
    farm_id: initialFarmId,
    crop_name: 'Ragi (Finger Millet)',
    variety: 'GPU-28',
    season: 'Kharif',
    area_acres: '2.0',
    sowing_date: new Date().toISOString().split('T')[0],
    expected_harvest_date: '',
    status: 'sown',
    target_yield_quintals: '15.0',
    notes: '',
  })

  // Activity Form
  const [activityForm, setActivityForm] = useState({
    activity_type: 'fertilizer',
    activity_date: new Date().toISOString().split('T')[0],
    title: '',
    description: '',
    quantity: '',
    quantity_unit: 'kg',
    cost: '0',
  })

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    fetchCrops()
  }, [selectedFarmFilter, selectedStatusFilter])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      const [farmsData, catalogData] = await Promise.all([
        farmAPI.list(),
        fetch('/api/v1/crops/catalog').then((res) => (res.ok ? res.json() : [])),
      ])
      setFarms(farmsData)
      setCatalog(catalogData)
      if (!cropForm.farm_id && farmsData.length > 0) {
        setCropForm((prev) => ({ ...prev, farm_id: farmsData[0].id }))
      }
    } catch (err) {
      console.error('Failed to load initial data:', err)
      setError('Could not load farms or crop database.')
    } finally {
      setLoading(false)
    }
  }

  const fetchCrops = async () => {
    try {
      const data = await cropAPI.list(selectedFarmFilter || undefined)
      let filtered = data
      if (selectedStatusFilter !== 'all') {
        filtered = data.filter((c) => c.status === selectedStatusFilter)
      }
      setCrops(filtered)
    } catch (err) {
      console.error('Failed to fetch crops:', err)
    }
  }

  const handleSelectCatalogItem = (item) => {
    const today = new Date(cropForm.sowing_date || new Date())
    const expected = new Date(today)
    expected.setDate(expected.getDate() + (item.duration_days || 120))

    setCropForm((prev) => ({
      ...prev,
      crop_name: item.name,
      variety: item.variety_examples?.[0] || '',
      season: item.season || 'Kharif',
      expected_harvest_date: expected.toISOString().split('T')[0],
    }))
  }

  const handleCreateCrop = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const payload = {
      ...cropForm,
      area_acres: parseFloat(cropForm.area_acres),
      target_yield_quintals: cropForm.target_yield_quintals
        ? parseFloat(cropForm.target_yield_quintals)
        : null,
      expected_harvest_date: cropForm.expected_harvest_date || null,
    }

    try {
      await cropAPI.create(payload)
      setSuccessMsg(`Crop "${payload.crop_name}" registered successfully!`)
      setShowAddModal(false)
      fetchCrops()
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (err) {
      console.error('Create crop error:', err)
      setError(err.response?.data?.detail || 'Failed to register crop.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenActivityModal = (crop) => {
    setSelectedCrop(crop)
    setActivityForm({
      activity_type: 'fertilizer',
      activity_date: new Date().toISOString().split('T')[0],
      title: '',
      description: '',
      quantity: '',
      quantity_unit: 'kg',
      cost: '0',
    })
    setShowActivityModal(true)
  }

  const handleSaveActivity = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    const payload = {
      ...activityForm,
      quantity: activityForm.quantity ? parseFloat(activityForm.quantity) : null,
      cost: parseFloat(activityForm.cost || 0),
    }

    try {
      await fetch(`/api/v1/crops/${selectedCrop.id}/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('agrismart_token')}`,
        },
        body: JSON.stringify(payload),
      })
      setSuccessMsg(`Activity logged for ${selectedCrop.crop_name}!`)
      setShowActivityModal(false)
      fetchCrops()
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (err) {
      console.error('Failed to save activity:', err)
      alert('Failed to log activity.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleViewHistory = async (crop) => {
    setSelectedCrop(crop)
    try {
      const res = await cropAPI.get(crop.id)
      setCropDetail(res)
      setShowHistoryModal(true)
    } catch (err) {
      console.error('Failed to get crop history:', err)
    }
  }

  const handleDeleteCrop = async (cropId, cropName) => {
    if (window.confirm(`Are you sure you want to remove "${cropName}"?`)) {
      try {
        await cropAPI.delete(cropId)
        setSuccessMsg(`Crop "${cropName}" removed.`)
        fetchCrops()
        setTimeout(() => setSuccessMsg(''), 4000)
      } catch (err) {
        console.error('Failed to delete crop:', err)
        setError('Failed to delete crop.')
      }
    }
  }

  // Calculate days elapsed and progress
  const calculateProgress = (sowingDateStr, harvestDateStr) => {
    if (!sowingDateStr) return { days: 0, percent: 0 }
    const sowing = new Date(sowingDateStr)
    const now = new Date()
    const diffTime = Math.max(0, now - sowing)
    const daysElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (!harvestDateStr) return { days: daysElapsed, percent: 50 }

    const harvest = new Date(harvestDateStr)
    const totalDuration = Math.max(1, Math.floor((harvest - sowing) / (1000 * 60 * 60 * 24)))
    const percent = Math.min(100, Math.round((daysElapsed / totalDuration) * 100))

    return { days: daysElapsed, totalDays: totalDuration, percent }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'sown':
        return <span className="badge-yellow">Sown / Germinating</span>
      case 'vegetative':
        return <span className="badge-blue">Vegetative</span>
      case 'flowering':
        return <span className="badge-green">Flowering / Fruiting</span>
      case 'maturity':
        return <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">Maturity</span>
      case 'harvested':
        return <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">Harvested</span>
      case 'failed':
        return <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">Failed</span>
      default:
        return <span className="badge-gray">{status}</span>
    }
  }

  if (loading && farms.length === 0) {
    return <LoadingScreen message="Loading crop management..." />
  }

  return (
    <div className="page-container space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Crop Management</h1>
            <span className="badge-green">Phase 3 Live</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Track crop growth stages, seasonal schedules, and farming activity records.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center justify-center gap-2"
          disabled={farms.length === 0}
        >
          <Plus className="w-4 h-4" />
          <span>Register New Crop</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* No farm warning banner */}
      {farms.length === 0 && (
        <div className="alert-warning flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <span className="text-sm">You must register at least one farm parcel before registering crops.</span>
          </div>
          <a href="/farmer/farms" className="text-xs font-bold text-amber-800 underline">
            Go to My Farms &rarr;
          </a>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Farm filter */}
        <div className="w-full sm:w-64">
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Filter by Farm</label>
          <select
            value={selectedFarmFilter}
            onChange={(e) => setSelectedFarmFilter(e.target.value)}
            className="input text-sm py-2"
          >
            <option value="">All Registered Farms ({farms.length})</option>
            {farms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.total_area} {f.area_unit})
              </option>
            ))}
          </select>
        </div>

        {/* Status filter tabs */}
        <div className="flex-1">
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Growth Stage Filter</label>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_OPTIONS.map((st) => (
              <button
                key={st.value}
                onClick={() => setSelectedStatusFilter(st.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  selectedStatusFilter === st.value
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Crops List */}
      {crops.length === 0 ? (
        <div className="card text-center py-16">
          <Sprout className="w-14 h-14 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-700 mb-1">No Crops Registered</h2>
          <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
            Register your crops to get tailored weather advisories, growth stage alerts, and track
            field operations.
          </p>
          {farms.length > 0 && (
            <button onClick={() => setShowAddModal(true)} className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>Plant Your First Crop</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {crops.map((crop) => {
            const { days, totalDays, percent } = calculateProgress(crop.sowing_date, crop.expected_harvest_date)
            return (
              <div key={crop.id} className="card hover:shadow-card-hover transition-all flex flex-col justify-between">
                <div>
                  {/* Top: Crop Name, Variety & Farm */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 leading-snug">{crop.crop_name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Variety: <span className="font-semibold text-gray-700">{crop.variety || 'Local'}</span>
                      </p>
                    </div>
                    {getStatusBadge(crop.status)}
                  </div>

                  {/* Badges row */}
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                      Farm: {crop.farm_name}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-50 text-green-700 border border-green-200">
                      {crop.area_acres} Acres
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-amber-50 text-amber-700 border border-amber-200">
                      Season: {crop.season}
                    </span>
                  </div>

                  {/* Growth Progress Bar */}
                  <div className="bg-gray-50 p-3 rounded-xl mb-4 border border-gray-100">
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="font-semibold text-gray-700">Growth Stage Timeline</span>
                      <span className="text-primary-700 font-bold">{percent}% elapsed</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden mb-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[11px] text-gray-500">
                      <span>Sown: {crop.sowing_date} (Day {days})</span>
                      <span>Target: {crop.expected_harvest_date || 'TBD'}</span>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-4">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <span className="text-gray-400 block text-[10px]">Expected Yield</span>
                      <span className="font-bold text-gray-800">
                        {crop.target_yield_quintals ? `${crop.target_yield_quintals} Quintals` : '—'}
                      </span>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <span className="text-gray-400 block text-[10px]">Logged Activities</span>
                      <span className="font-bold text-gray-800">{crop.activities_count || 0} operations</span>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleOpenActivityModal(crop)}
                    className="text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Log Activity
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleViewHistory(crop)}
                      className="text-xs font-medium text-gray-600 hover:text-gray-900 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      History ({crop.activities_count || 0})
                    </button>
                    <button
                      onClick={() => handleDeleteCrop(crop.id, crop.crop_name)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                      title="Delete Crop"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Register New Crop Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl my-8 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-100 text-green-700 flex items-center justify-center">
                  <Sprout className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Register New Crop</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCrop} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Quick Preset Selector */}
              {catalog.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block">
                    Quick Crop Presets (Auto-fills typical varieties & duration)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {catalog.map((cat) => (
                      <button
                        type="button"
                        key={cat.name}
                        onClick={() => handleSelectCatalogItem(cat)}
                        className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                          cropForm.crop_name === cat.name
                            ? 'bg-primary-100 border-primary-500 text-primary-800 font-semibold'
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Farm Selector */}
              <div>
                <label className="label">Target Farm Parcel *</label>
                <select
                  required
                  value={cropForm.farm_id}
                  onChange={(e) => setCropForm({ ...cropForm, farm_id: e.target.value })}
                  className="input"
                >
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.total_area} {f.area_unit} — {f.district})
                    </option>
                  ))}
                </select>
              </div>

              {/* Crop Name & Variety */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Crop Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ragi, Paddy, Cotton"
                    value={cropForm.crop_name}
                    onChange={(e) => setCropForm({ ...cropForm, crop_name: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Variety / Hybrid</label>
                  <input
                    type="text"
                    placeholder="e.g. GPU-28, Sona Masoori"
                    value={cropForm.variety}
                    onChange={(e) => setCropForm({ ...cropForm, variety: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              {/* Season & Area */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Cropping Season *</label>
                  <select
                    value={cropForm.season}
                    onChange={(e) => setCropForm({ ...cropForm, season: e.target.value })}
                    className="input"
                  >
                    <option value="Kharif">Kharif (Monsoon, Jun-Oct)</option>
                    <option value="Rabi">Rabi (Winter, Oct-Mar)</option>
                    <option value="Zaid / Summer">Zaid / Summer (Mar-Jun)</option>
                    <option value="Annual / Perennial">Annual / Perennial</option>
                  </select>
                </div>
                <div>
                  <label className="label">Area Sown (Acres) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    placeholder="e.g. 2.5"
                    value={cropForm.area_acres}
                    onChange={(e) => setCropForm({ ...cropForm, area_acres: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              {/* Sowing Date & Expected Harvest Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Sowing Date *</label>
                  <input
                    type="date"
                    required
                    value={cropForm.sowing_date}
                    onChange={(e) => setCropForm({ ...cropForm, sowing_date: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Expected Harvest Date</label>
                  <input
                    type="date"
                    value={cropForm.expected_harvest_date}
                    onChange={(e) => setCropForm({ ...cropForm, expected_harvest_date: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              {/* Target Yield & Initial Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Target Yield (Quintals)</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="e.g. 20"
                    value={cropForm.target_yield_quintals}
                    onChange={(e) => setCropForm({ ...cropForm, target_yield_quintals: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Current Status</label>
                  <select
                    value={cropForm.status}
                    onChange={(e) => setCropForm({ ...cropForm, status: e.target.value })}
                    className="input"
                  >
                    <option value="sown">Sown / Germinating</option>
                    <option value="vegetative">Vegetative Stage</option>
                    <option value="flowering">Flowering / Fruiting</option>
                    <option value="maturity">Maturity</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="label">Notes / Seed Treatment</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Treated seeds with Trichoderma before sowing..."
                  value={cropForm.notes}
                  onChange={(e) => setCropForm({ ...cropForm, notes: e.target.value })}
                  className="input"
                ></textarea>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Registering...' : 'Register Crop'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Activity Modal */}
      {showActivityModal && selectedCrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-8 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Log Farming Activity</h3>
                  <p className="text-xs text-gray-500">{selectedCrop.crop_name} ({selectedCrop.farm_name})</p>
                </div>
              </div>
              <button onClick={() => setShowActivityModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveActivity} className="p-5 space-y-4">
              {/* Activity Type */}
              <div>
                <label className="label">Operation Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  {ACTIVITY_TYPES.map((type) => (
                    <button
                      type="button"
                      key={type.value}
                      onClick={() => setActivityForm({ ...activityForm, activity_type: type.value })}
                      className={`p-2.5 rounded-lg text-xs font-semibold border text-left transition-colors ${
                        activityForm.activity_type === type.value
                          ? 'border-primary-600 bg-primary-50 text-primary-800 ring-1 ring-primary-600'
                          : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="label">Operation Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1st Dose Urea + Zinc, Drip 2 hours, Neem Oil Spray"
                    value={activityForm.title}
                    onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Date Performed *</label>
                  <input
                    type="date"
                    required
                    value={activityForm.activity_date}
                    onChange={(e) => setActivityForm({ ...activityForm, activity_date: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Cost Incurred (₹)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="e.g. 1200"
                    value={activityForm.cost}
                    onChange={(e) => setActivityForm({ ...activityForm, cost: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              {/* Quantity & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Quantity Applied (Optional)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 50"
                    value={activityForm.quantity}
                    onChange={(e) => setActivityForm({ ...activityForm, quantity: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Unit</label>
                  <select
                    value={activityForm.quantity_unit}
                    onChange={(e) => setActivityForm({ ...activityForm, quantity_unit: e.target.value })}
                    className="input"
                  >
                    <option value="kg">kg (Kilograms)</option>
                    <option value="liters">Liters / ml</option>
                    <option value="bags">Bags</option>
                    <option value="hours">Hours (Irrigation / Machinery)</option>
                    <option value="laborers">Laborers count</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="label">Observations / Notes</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Leaves looking healthier, soil moisture adequate..."
                  value={activityForm.description}
                  onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                  className="input"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowActivityModal(false)}
                  className="btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Record Activity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Activity History Drawer / Modal */}
      {showHistoryModal && cropDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl my-8 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{cropDetail.crop_name} — Activity Log</h3>
                <p className="text-xs text-gray-500">
                  Variety: {cropDetail.variety || 'Local'} &bull; Farm: {cropDetail.farm_name}
                </p>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 max-h-[70vh] overflow-y-auto space-y-4">
              {cropDetail.activities?.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <Activity className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">No operations logged for this crop yet.</p>
                  <p className="text-xs text-gray-400 mt-1">Use the "Log Activity" button on the card to record fertilizer, irrigation, or sprays.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cropDetail.activities.map((act) => (
                    <div key={act.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-primary-100 text-primary-800">
                            {act.activity_type}
                          </span>
                          <span className="text-xs text-gray-400">{act.activity_date}</span>
                        </div>
                        <h4 className="text-sm font-bold text-gray-800">{act.title}</h4>
                        {act.description && <p className="text-xs text-gray-600 mt-1">{act.description}</p>}
                        {act.quantity && (
                          <p className="text-xs text-gray-500 mt-1">
                            Applied: <span className="font-semibold">{act.quantity} {act.quantity_unit}</span>
                          </p>
                        )}
                      </div>
                      {act.cost > 0 && (
                        <div className="text-right shrink-0">
                          <span className="text-xs text-gray-400 block">Cost</span>
                          <span className="text-sm font-bold text-green-700">₹{act.cost.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Total operations: <strong>{cropDetail.activities?.length || 0}</strong>
              </span>
              <button onClick={() => setShowHistoryModal(false)} className="btn-secondary text-xs">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
