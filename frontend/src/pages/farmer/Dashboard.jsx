/**
 * AGRI SMART — Farmer Dashboard
 * File: frontend/src/pages/farmer/Dashboard.jsx
 *
 * The main landing screen for authenticated farmers.
 * Phase 3: Connected to live Farms and Crops management APIs.
 */

import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from 'react-i18next'
import {
  Leaf, Cloud, Camera, TrendingUp, Wallet, Bell,
  Sprout, Droplets, Plus, ChevronRight, AlertCircle, MapPin
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { farmAPI, cropAPI } from '../../services/api'

const quickActions = [
  { to: '/farmer/ai-diagnosis', icon: Camera,     label: 'Check Crop', color: 'bg-primary-100 text-primary-700' },
  { to: '/farmer/farms',        icon: Plus,        label: 'My Farms',   color: 'bg-blue-100   text-blue-700'    },
  { to: '/farmer/crops',        icon: Sprout,      label: 'Crops',      color: 'bg-green-100  text-green-700'   },
  { to: '/farmer/weather',      icon: Cloud,       label: 'Weather',    color: 'bg-sky-100    text-sky-700'     },
  { to: '/farmer/market',       icon: TrendingUp,  label: 'Prices',     color: 'bg-earth-100  text-earth-700'   },
  { to: '/farmer/soil',         icon: Droplets,    label: 'Soil',       color: 'bg-orange-100 text-orange-700'  },
]

export default function FarmerDashboard() {
  const { user } = useAuth()
  const { t } = useTranslation()

  const [farms, setFarms] = useState([])
  const [crops, setCrops] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [farmsData, cropsData] = await Promise.all([
          farmAPI.list(),
          cropAPI.list(),
        ])
        setFarms(farmsData || [])
        setCrops(cropsData || [])
      } catch (err) {
        console.error('Error fetching dashboard summary:', err)
      } finally {
        setLoading(false)
      }
    }
    loadDashboardData()
  }, [])

  const totalAcres = farms.reduce((acc, f) => acc + (f.total_area || 0), 0).toFixed(1)
  const activeCrops = crops.filter(c => !['harvested', 'failed'].includes(c.status))

  return (
    <div className="page-container space-y-6">

      {/* Welcome banner */}
      <div className="card bg-gradient-to-br from-primary-600 to-primary-700 text-white border-0">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-primary-200 text-sm mb-1">Good day 🌾</p>
            <h1 className="text-2xl font-bold mb-1">
              {t('dashboard.welcome', { name: user?.full_name?.split(' ')[0] || 'Farmer' })}
            </h1>
            <p className="text-primary-200 text-sm flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {user?.district ? `${user?.district}, ${user?.state}` : 'Karnataka, India'}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-1 bg-primary-500/50 px-3 py-1.5 rounded-full text-xs font-medium">
            <Leaf className="w-3.5 h-3.5" />
            Farmer
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="section-title mb-4">{t('dashboard.quick_actions')}</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {quickActions.map(({ to, icon: Icon, label, color }) => (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl border border-gray-100 hover:shadow-card-hover transition-shadow text-center"
            >
              <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-gray-700">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats row with live data */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link to="/farmer/farms" className="card text-center hover:border-primary-300 transition-colors">
          <Leaf className="w-6 h-6 text-primary-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{loading ? '...' : farms.length}</p>
          <p className="text-xs text-gray-500 mt-1">Farms ({totalAcres} Acres)</p>
        </Link>
        <Link to="/farmer/crops" className="card text-center hover:border-green-300 transition-colors">
          <Sprout className="w-6 h-6 text-green-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{loading ? '...' : activeCrops.length}</p>
          <p className="text-xs text-gray-500 mt-1">Active Crops</p>
        </Link>
        <div className="card text-center">
          <Wallet className="w-6 h-6 text-purple-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">₹0</p>
          <p className="text-xs text-gray-500 mt-1">Expenses (Month)</p>
        </div>
        <div className="card text-center">
          <Bell className="w-6 h-6 text-orange-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">0</p>
          <p className="text-xs text-gray-500 mt-1">Notifications</p>
        </div>
      </div>

      {/* Active Crops Quick View */}
      {crops.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sprout className="w-5 h-5 text-green-600" />
              <h2 className="font-bold text-gray-900 text-base">Your Active Crops</h2>
            </div>
            <Link to="/farmer/crops" className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-0.5">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {crops.slice(0, 3).map((crop) => (
              <div key={crop.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-sm text-gray-800">{crop.crop_name}</span>
                    <span className="badge-green text-[10px]">{crop.status}</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {crop.variety ? `Variety: ${crop.variety} • ` : ''}{crop.area_acres} Acres
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Farm: {crop.farm_name}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-gray-200/60 flex justify-between text-xs text-gray-500">
                  <span>Sown: {crop.sowing_date}</span>
                  <Link to="/farmer/crops" className="text-primary-600 font-semibold hover:underline">
                    Manage &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modules grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* Weather card */}
        <Link to="/farmer/weather" className="card-hover">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Cloud className="w-5 h-5 text-sky-600" />
              <span className="font-semibold text-gray-900 text-sm">{t('dashboard.weather_summary')}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-xs text-gray-500">
            Open-Meteo 7-day hyper-local agricultural weather forecast, rain alerts, and irrigation guide.
          </p>
        </Link>

        {/* AI Diagnosis card */}
        <Link to="/farmer/ai-diagnosis" className="card-hover">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary-600" />
              <span className="font-semibold text-gray-900 text-sm">AI Crop Disease Doctor</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-xs text-gray-500">
            Upload leaf photograph to detect crop disease, symptoms, causes, and safe organic remedies.
          </p>
        </Link>

        {/* Market card */}
        <Link to="/farmer/market" className="card-hover">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-earth-600" />
              <span className="font-semibold text-gray-900 text-sm">Market Prices & Mandis</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-xs text-gray-500">
            Compare commodity rates across APMC mandis in Karnataka to maximize selling revenue.
          </p>
        </Link>

      </div>

      {/* If no farms, show CTA */}
      {farms.length === 0 && !loading && (
        <div className="card bg-primary-50 border-primary-100 text-center py-8">
          <Leaf className="w-10 h-10 text-primary-400 mx-auto mb-3" />
          <h3 className="font-bold text-primary-900 mb-2">Add Your First Farm</h3>
          <p className="text-sm text-primary-700 mb-4 max-w-md mx-auto">
            Register your land details to unlock crop growth tracking, hyper-local weather alerts, and yield forecasts.
          </p>
          <Link to="/farmer/farms" className="btn-primary">
            <Plus className="w-4 h-4" /> Add Farm
          </Link>
        </div>
      )}

    </div>
  )
}
