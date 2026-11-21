/**
 * AGRI SMART — Consumer Dashboard
 * File: frontend/src/pages/consumer/Dashboard.jsx
 */

import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  Heart, Store, Package, TrendingUp, Leaf,
  ArrowRight, ShoppingBag, CheckCircle, Clock
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function ConsumerDashboard() {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch('/api/v1/consumer/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) setStats(await res.json())
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    fetchDashboard()
  }, [token])

  const quickActions = [
    { label: 'Browse Farm Fresh Produce', icon: Store, path: '/consumer/marketplace', color: 'bg-teal-50 text-teal-700 border-teal-200' },
    { label: 'Track My Orders', icon: Package, path: '/consumer/orders', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { label: 'My Preferences', icon: Heart, path: '/consumer/profile', color: 'bg-pink-50 text-pink-700 border-pink-200' },
  ]

  return (
    <div className="page-container max-w-6xl mx-auto space-y-6">
      <div className="pb-2 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Heart className="w-7 h-7 text-teal-600" />
          Consumer Dashboard
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Welcome, <strong>{user?.full_name}</strong>! Get fresh farm produce delivered directly from Karnataka farmers.
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card bg-white border border-gray-200 p-4">
          <div className="text-xs text-gray-500 font-medium">Total Orders</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{stats?.total_orders || 0}</div>
        </div>
        <div className="card bg-white border border-gray-200 p-4">
          <div className="text-xs text-gray-500 font-medium">In Progress</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{stats?.pending_orders || 0}</div>
          <div className="text-xs text-amber-500 mt-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Being prepared</div>
        </div>
        <div className="card bg-white border border-gray-200 p-4">
          <div className="text-xs text-gray-500 font-medium">Delivered</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{stats?.delivered_orders || 0}</div>
          <div className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Successfully received</div>
        </div>
        <div className="card bg-white border border-gray-200 p-4">
          <div className="text-xs text-gray-500 font-medium">Total Spent</div>
          <div className="text-2xl font-bold text-teal-700 mt-1">₹{(stats?.total_spent || 0).toLocaleString()}</div>
        </div>
      </div>

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

      {/* Why Buy Direct */}
      <div className="card bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 p-5">
        <h2 className="text-base font-bold text-teal-900 flex items-center gap-2 mb-3">
          <Leaf className="w-5 h-5 text-teal-600" />
          Why Buy Direct From Farmers?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { title: 'Fresher Produce', desc: 'Harvested within days, not weeks. No cold storage middlemen.' },
            { title: 'Fair Farmer Prices', desc: 'Farmers earn 30-50% more when you buy direct — no commission agents.' },
            { title: 'Know Your Source', desc: 'Every listing shows the farm name, district, and harvest date.' },
          ].map((item) => (
            <div key={item.title} className="bg-white/60 rounded-lg p-3 text-xs">
              <div className="font-bold text-teal-900">{item.title}</div>
              <div className="text-teal-800 mt-1">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
