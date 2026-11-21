/**
 * AGRI SMART — Buyer Dashboard
 * File: frontend/src/pages/buyer/Dashboard.jsx
 */

import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { authAPI } from '../../services/api'
import {
  LayoutDashboard, ShoppingCart, FileText, Search,
  CheckCircle, Clock, TrendingUp, AlertCircle,
  ArrowRight, Package, Building2
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function BuyerDashboard() {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch('/api/v1/buyer/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) setStats(await res.json())
      } catch (err) {
        console.error('Dashboard fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [token])

  const quickActions = [
    { label: 'Browse Farmer Produce', icon: Search, path: '/buyer/produce', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { label: 'My Purchase Enquiries', icon: FileText, path: '/buyer/enquiries', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { label: 'Business Profile', icon: Building2, path: '/buyer/profile', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  ]

  return (
    <div className="page-container max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ShoppingCart className="w-7 h-7 text-amber-600" />
          Buyer Dashboard
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Welcome back, <strong>{user?.full_name}</strong>! Browse farmer produce listings and manage your purchase enquiries.
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card bg-white border border-gray-200 p-4">
          <div className="text-xs text-gray-500 font-medium">Total Enquiries</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{stats?.total_enquiries || 0}</div>
          <div className="text-xs text-gray-400 mt-1">All time enquiries</div>
        </div>
        <div className="card bg-white border border-gray-200 p-4">
          <div className="text-xs text-gray-500 font-medium">Pending Response</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{stats?.pending_enquiries || 0}</div>
          <div className="text-xs text-amber-500 mt-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Awaiting farmer reply</div>
        </div>
        <div className="card bg-white border border-gray-200 p-4">
          <div className="text-xs text-gray-500 font-medium">Accepted Deals</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{stats?.accepted_enquiries || 0}</div>
          <div className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Ready for pickup</div>
        </div>
        <div className="card bg-white border border-gray-200 p-4">
          <div className="text-xs text-gray-500 font-medium">Commodities Tracked</div>
          <div className="text-2xl font-bold text-blue-700 mt-1">{stats?.commodities_tracked || 0}</div>
          <div className="text-xs text-blue-500 mt-1">In your watchlist</div>
        </div>
      </div>

      {/* Verification Banner */}
      {stats && !stats.is_verified && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-bold text-amber-900">Business Verification Pending</div>
            <p className="text-xs text-amber-800 mt-1">
              Complete your GST/license details in your Business Profile so farmers can trust your enquiries.
              Verified buyers get priority responses from farmers.
            </p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-base font-bold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              className={`card border p-4 flex items-center gap-3 hover:shadow-md transition ${action.color}`}
            >
              <action.icon className="w-6 h-6 shrink-0" />
              <span className="text-sm font-semibold flex-1 text-left">{action.label}</span>
              <ArrowRight className="w-4 h-4 opacity-50" />
            </button>
          ))}
        </div>
      </div>

      {/* Market Insights */}
      <div className="card bg-white border border-gray-200 p-5">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5 text-amber-600" />
          Karnataka Agricultural Market Snapshot
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {[
            { commodity: 'Ragi (Finger Millet)', price: '₹3,578/Qtl', change: '+2.1%', up: true },
            { commodity: 'Paddy (Sona Masuri)', price: '₹2,183/Qtl', change: '-0.4%', up: false },
            { commodity: 'Groundnut', price: '₹5,420/Qtl', change: '+3.8%', up: true },
            { commodity: 'Maize (Hybrid)', price: '₹2,050/Qtl', change: '+1.2%', up: true },
          ].map((item) => (
            <div key={item.commodity} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div className="font-semibold text-gray-800">{item.commodity}</div>
              <div className="font-bold text-gray-900 mt-1">{item.price}</div>
              <div className={`mt-0.5 font-semibold ${item.up ? 'text-emerald-600' : 'text-red-500'}`}>
                {item.change}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-gray-400 mt-2">Source: AGMARKNET Karnataka — indicative reference prices only. Verify before transacting.</p>
      </div>
    </div>
  )
}
