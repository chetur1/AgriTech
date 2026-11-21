/**
 * AGRI SMART — Farm Management Page
 * File: frontend/src/pages/farmer/Farms.jsx
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Leaf, Plus, MapPin, Droplets, Compass, Trash2, Edit3,
  Search, AlertCircle, CheckCircle2, Sprout, ChevronRight, X
} from 'lucide-react'
import { farmAPI } from '../../services/api'
import LoadingScreen from '../../components/ui/LoadingScreen'

const SOIL_OPTIONS = [
  'Red Sandy Loam',
  'Red Loamy Soil',
  'Black Cotton Soil',
  'Clay Loam',
  'Alluvial Soil',
  'Laterite Soil',
  'Sandy Soil',
  'Other',
]

const WATER_SOURCES = [
  'Borewell',
  'Canal',
  'Open Well',
  'Farm Pond',
  'River / Stream',
  'Rainfed only',
  'Other',
]

const IRRIGATION_TYPES = [
  'Drip Irrigation',
  'Sprinkler System',
  'Flood / Basin',
  'Furrow Irrigation',
  'Rainfed',
  'Other',
]

const KARNATAKA_DISTRICTS = [
  'Bagalkot', 'Ballari (Bellary)', 'Belagavi (Belgaum)', 'Bengaluru Rural',
  'Bengaluru Urban', 'Bidar', 'Chamarajanagar', 'Chikkaballapur',
  'Chikkamagaluru', 'Chitradurga', 'Dakshina Kannada', 'Davanagere',
  'Dharwad', 'Gadag', 'Hassan', 'Haveri', 'Kalaburagi (Gulbarga)',
  'Kodagu', 'Kolar', 'Koppal', 'Mandya', 'Mysuru (Mysore)',
  'Raichur', 'Ramanagara', 'Shivamogga (Shimoga)', 'Tumakuru (Tumkur)',
  'Udupi', 'Uttara Kannada', 'Vijayapura (Bijapur)', 'Yadgir',
]

export default function FarmsPage() {
  const [farms, setFarms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingFarm, setEditingFarm] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    state: 'Karnataka',
    district: 'Mandya',
    taluk: '',
    village: '',
    survey_number: '',
    total_area: '',
    area_unit: 'acres',
    soil_type: 'Red Sandy Loam',
    water_source: 'Borewell',
    irrigation_type: 'Drip Irrigation',
    ownership_type: 'Owned',
    latitude: '',
    longitude: '',
    notes: '',
  })

  useEffect(() => {
    fetchFarms()
  }, [])

  const fetchFarms = async () => {
    try {
      setLoading(true)
      const data = await farmAPI.list()
      setFarms(data)
    } catch (err) {
      console.error('Failed to fetch farms:', err)
      setError('Could not load your farms. Please ensure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenAddModal = () => {
    setEditingFarm(null)
    setFormData({
      name: '',
      state: 'Karnataka',
      district: 'Mandya',
      taluk: '',
      village: '',
      survey_number: '',
      total_area: '',
      area_unit: 'acres',
      soil_type: 'Red Sandy Loam',
      water_source: 'Borewell',
      irrigation_type: 'Drip Irrigation',
      ownership_type: 'Owned',
      latitude: '',
      longitude: '',
      notes: '',
    })
    setShowAddModal(true)
  }

  const handleOpenEditModal = (farm) => {
    setEditingFarm(farm)
    setFormData({
      name: farm.name || '',
      state: farm.state || 'Karnataka',
      district: farm.district || 'Mandya',
      taluk: farm.taluk || '',
      village: farm.village || '',
      survey_number: farm.survey_number || '',
      total_area: farm.total_area?.toString() || '',
      area_unit: farm.area_unit || 'acres',
      soil_type: farm.soil_type || 'Red Sandy Loam',
      water_source: farm.water_source || 'Borewell',
      irrigation_type: farm.irrigation_type || 'Drip Irrigation',
      ownership_type: farm.ownership_type || 'Owned',
      latitude: farm.latitude?.toString() || '',
      longitude: farm.longitude?.toString() || '',
      notes: farm.notes || '',
    })
    setShowAddModal(true)
  }

  const detectLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData((prev) => ({
            ...prev,
            latitude: pos.coords.latitude.toFixed(6),
            longitude: pos.coords.longitude.toFixed(6),
          }))
          setSuccessMsg('GPS coordinates captured from device!')
          setTimeout(() => setSuccessMsg(''), 3000)
        },
        (err) => {
          console.warn('Geolocation failed:', err)
          alert('Could not access device GPS. You may enter coordinates manually or leave them blank.')
        }
      )
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const payload = {
      ...formData,
      total_area: parseFloat(formData.total_area),
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
    }

    try {
      if (editingFarm) {
        await farmAPI.update(editingFarm.id, payload)
        setSuccessMsg(`Farm "${payload.name}" updated successfully!`)
      } else {
        await farmAPI.create(payload)
        setSuccessMsg(`Farm "${payload.name}" registered successfully!`)
      }
      setShowAddModal(false)
      fetchFarms()
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (err) {
      console.error('Save farm error:', err)
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'Failed to save farm details.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (farmId, farmName) => {
    if (window.confirm(`Are you sure you want to delete "${farmName}"? All associated crops and activity logs will also be permanently removed.`)) {
      try {
        await farmAPI.delete(farmId)
        setSuccessMsg(`Farm "${farmName}" removed.`)
        fetchFarms()
        setTimeout(() => setSuccessMsg(''), 4000)
      } catch (err) {
        console.error('Delete farm error:', err)
        setError('Failed to delete farm.')
      }
    }
  }

  // Filtered farms
  const filteredFarms = farms.filter((f) => {
    const q = searchQuery.toLowerCase()
    return (
      f.name?.toLowerCase().includes(q) ||
      f.district?.toLowerCase().includes(q) ||
      f.village?.toLowerCase().includes(q) ||
      f.soil_type?.toLowerCase().includes(q)
    )
  })

  // Aggregated metrics
  const totalLand = farms.reduce((acc, f) => acc + (f.total_area || 0), 0).toFixed(1)
  const totalActiveCrops = farms.reduce((acc, f) => acc + (f.active_crops_count || 0), 0)

  if (loading && farms.length === 0) {
    return <LoadingScreen message="Loading registered farms..." />
  }

  return (
    <div className="page-container space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">My Farms</h1>
            <span className="badge-green">Phase 3 Live</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Manage your land parcels, soil profiles, and water resources.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Farm</span>
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

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card border-l-4 border-l-primary-500">
          <p className="text-xs text-gray-500 font-medium">Registered Parcels</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{farms.length}</p>
          <p className="text-xs text-primary-600 mt-1 flex items-center gap-1">
            <Leaf className="w-3 h-3" /> Land assets
          </p>
        </div>
        <div className="card border-l-4 border-l-green-500">
          <p className="text-xs text-gray-500 font-medium">Total Cultivated Area</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalLand} <span className="text-sm font-normal text-gray-500">Acres</span></p>
          <p className="text-xs text-green-600 mt-1">Under management</p>
        </div>
        <div className="card border-l-4 border-l-emerald-500">
          <p className="text-xs text-gray-500 font-medium">Active Crops</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalActiveCrops}</p>
          <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
            <Sprout className="w-3 h-3" /> Sown & Growing
          </p>
        </div>
        <div className="card border-l-4 border-l-blue-500">
          <p className="text-xs text-gray-500 font-medium">State / Region</p>
          <p className="text-xl font-bold text-gray-900 mt-1">Karnataka</p>
          <p className="text-xs text-blue-600 mt-1">South Zone Agriculture</p>
        </div>
      </div>

      {/* Search & Filter bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search farm by name, district, or soil type..."
            className="input pl-9 text-sm"
          />
        </div>
      </div>

      {/* Farm Cards Grid */}
      {filteredFarms.length === 0 ? (
        <div className="card text-center py-16">
          <Leaf className="w-14 h-14 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-700 mb-1">No Farms Found</h2>
          <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
            {searchQuery
              ? 'No farms match your search criteria. Try a different query.'
              : 'You have not registered any farm parcels yet. Add your first field to start tracking crops and weather.'}
          </p>
          {!searchQuery && (
            <button onClick={handleOpenAddModal} className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>Add Your First Farm</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredFarms.map((farm) => (
            <div
              key={farm.id}
              className="card hover:shadow-card-hover transition-all flex flex-col justify-between border-t-4 border-t-primary-600"
            >
              <div>
                {/* Header with Title and Actions */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 leading-snug">{farm.name}</h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>{farm.village ? `${farm.village}, ` : ''}{farm.district}, {farm.state}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(farm)}
                      className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit Farm"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(farm.id, farm.name)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Farm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Survey & Area Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-200">
                    {farm.total_area} {farm.area_unit || 'acres'}
                  </span>
                  {farm.survey_number && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs text-gray-600 bg-gray-100">
                      Survey: #{farm.survey_number}
                    </span>
                  )}
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs text-gray-600 bg-gray-100">
                    {farm.ownership_type}
                  </span>
                </div>

                {/* Farm Characteristics Details */}
                <div className="space-y-2 text-xs text-gray-600 bg-gray-50 p-3 rounded-lg mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Soil Type:</span>
                    <span className="font-medium text-gray-800">{farm.soil_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Water Source:</span>
                    <span className="font-medium text-gray-800">{farm.water_source}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Irrigation:</span>
                    <span className="font-medium text-gray-800">{farm.irrigation_type}</span>
                  </div>
                  {farm.notes && (
                    <p className="text-gray-500 italic pt-1 border-t border-gray-200 line-clamp-2">
                      "{farm.notes}"
                    </p>
                  )}
                </div>
              </div>

              {/* Bottom Card Footer */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                  <Sprout className="w-3.5 h-3.5 text-primary-600" />
                  {farm.active_crops_count || 0} active crops
                </span>
                <Link
                  to={`/farmer/crops?farm_id=${farm.id}`}
                  className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-0.5"
                >
                  Manage Crops <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Farm Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl my-8 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center">
                  <Leaf className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  {editingFarm ? 'Edit Farm Parcel' : 'Register New Farm Parcel'}
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Farm Name */}
              <div>
                <label className="label">Farm / Land Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kaveri River Field, Hosa Hola"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                />
              </div>

              {/* Area & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Total Area *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    required
                    placeholder="e.g. 4.5"
                    value={formData.total_area}
                    onChange={(e) => setFormData({ ...formData, total_area: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Measurement Unit</label>
                  <select
                    value={formData.area_unit}
                    onChange={(e) => setFormData({ ...formData, area_unit: e.target.value })}
                    className="input"
                  >
                    <option value="acres">Acres</option>
                    <option value="guntas">Guntas (1/40 acre)</option>
                    <option value="hectares">Hectares</option>
                  </select>
                </div>
              </div>

              {/* District & Taluk */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">District (Karnataka) *</label>
                  <select
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="input"
                  >
                    {KARNATAKA_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Taluk / Block</label>
                  <input
                    type="text"
                    placeholder="e.g. Maddur, Channapatna"
                    value={formData.taluk}
                    onChange={(e) => setFormData({ ...formData, taluk: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              {/* Village & Survey Number */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Village / Locality</label>
                  <input
                    type="text"
                    placeholder="e.g. Shivapura"
                    value={formData.village}
                    onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Survey Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 142/2A"
                    value={formData.survey_number}
                    onChange={(e) => setFormData({ ...formData, survey_number: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              {/* Soil Type & Water Source */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Soil Type</label>
                  <select
                    value={formData.soil_type}
                    onChange={(e) => setFormData({ ...formData, soil_type: e.target.value })}
                    className="input"
                  >
                    {SOIL_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Primary Water Source</label>
                  <select
                    value={formData.water_source}
                    onChange={(e) => setFormData({ ...formData, water_source: e.target.value })}
                    className="input"
                  >
                    {WATER_SOURCES.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Irrigation & Ownership */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Irrigation System</label>
                  <select
                    value={formData.irrigation_type}
                    onChange={(e) => setFormData({ ...formData, irrigation_type: e.target.value })}
                    className="input"
                  >
                    {IRRIGATION_TYPES.map((i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Ownership Type</label>
                  <select
                    value={formData.ownership_type}
                    onChange={(e) => setFormData({ ...formData, ownership_type: e.target.value })}
                    className="input"
                  >
                    <option value="Owned">Owned</option>
                    <option value="Leased">Leased</option>
                    <option value="Sharecropped">Sharecropped</option>
                  </select>
                </div>
              </div>

              {/* GPS Coordinates */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="label mb-0">GPS Coordinates (Optional for weather accuracy)</label>
                  <button
                    type="button"
                    onClick={detectLocation}
                    className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    <Compass className="w-3.5 h-3.5" /> Auto-detect GPS
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="Latitude (e.g. 12.5843)"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    className="input text-xs"
                  />
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="Longitude (e.g. 77.0422)"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    className="input text-xs"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="label">Notes / Land Remarks</label>
                <textarea
                  rows="2"
                  placeholder="Any special remarks regarding slope, previous crops, fencing, or borewell depth..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input"
                ></textarea>
              </div>

              {/* Form Footer */}
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
                  {submitting ? 'Saving...' : editingFarm ? 'Save Changes' : 'Register Farm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
