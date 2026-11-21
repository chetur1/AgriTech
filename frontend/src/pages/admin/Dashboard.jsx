/**
 * AGRI SMART — Administrator Dashboard
 * File: frontend/src/pages/admin/Dashboard.jsx
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  UserCheck,
  ShieldAlert,
  Sprout,
  Activity,
  Layers,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Clock,
  Shield,
  ShoppingBag,
  HeartHandshake,
  CheckCircle2,
  AlertTriangle,
  Database
} from 'lucide-react'
import { adminAPI } from '../../services/api'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchStats = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await adminAPI.getStats()
      setStats(data)
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load admin statistics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="w-8 h-8 text-primary-600 animate-spin" />
        <span className="text-sm font-medium text-slate-500">Loading admin analytics from Supabase...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700">
        <div className="flex items-center gap-3 mb-2 font-bold text-lg">
          <AlertTriangle className="w-5 h-5 text-rose-600" />
          <span>Error Loading Dashboard</span>
        </div>
        <p className="text-sm mb-4">{error}</p>
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-rose-600 text-white text-sm font-semibold rounded-xl hover:bg-rose-700 transition"
        >
          Try Again
        </button>
      </div>
    )
  }

  const { summary, roles_breakdown, recent_users, recent_audits } = stats || {}

  const roleCards = [
    {
      role: 'Farmers',
      count: roles_breakdown?.farmer || 0,
      icon: Sprout,
      color: 'from-emerald-500 to-teal-600',
      badge: 'Producers',
      desc: 'Active farm holdings',
    },
    {
      role: 'Experts',
      count: roles_breakdown?.expert || 0,
      icon: ShieldCheck,
      color: 'from-blue-500 to-indigo-600',
      badge: summary?.pending_verifications > 0 ? `${summary.pending_verifications} Pending` : 'Verified',
      badgeColor: summary?.pending_verifications > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800',
      desc: 'Agronomists & Advisors',
    },
    {
      role: 'Brokers & Traders',
      count: roles_breakdown?.buyer || 0,
      icon: ShoppingBag,
      color: 'from-purple-500 to-violet-600',
      badge: 'Marketplace',
      desc: 'B2B produce buyers',
    },
    {
      role: 'Consumers',
      count: roles_breakdown?.consumer || 0,
      icon: HeartHandshake,
      color: 'from-pink-500 to-rose-600',
      badge: 'Farm to Fork',
      desc: 'Direct buyers & households',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Top Banner & Refresh */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Platform Overview</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time management metrics, user verifications, and security telemetry.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchStats}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          {summary?.pending_verifications > 0 && (
            <Link
              to="/admin/expert-verification"
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl shadow-sm transition"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Verify {summary.pending_verifications} Expert{summary.pending_verifications > 1 ? 's' : ''}</span>
            </Link>
          )}
        </div>
      </div>

      {/* Role Distribution Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {roleCards.map((rc) => {
          const Icon = rc.icon
          return (
            <div
              key={rc.role}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${rc.color} flex items-center justify-center text-white shadow-sm`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${rc.badgeColor || 'bg-slate-100 text-slate-700'}`}>
                  {rc.badge}
                </span>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 mb-1">{rc.count}</div>
              <div className="text-sm font-bold text-slate-700">{rc.role}</div>
              <div className="text-xs text-slate-400 mt-0.5">{rc.desc}</div>
            </div>
          )
        })}
      </div>

      {/* Platform Activity Metric Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Registered</div>
          <div className="text-2xl font-black text-slate-900">{summary?.total_users || 0} Users</div>
          <div className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{summary?.active_users || 0} active</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Agricultural Base</div>
          <div className="text-2xl font-black text-slate-900">{summary?.total_farms || 0} Farms</div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            Across {summary?.total_crops || 0} crop cycles
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Advisory Services</div>
          <div className="text-2xl font-black text-slate-900">{summary?.total_consultations || 0} Cases</div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            {summary?.total_diagnoses || 0} AI Diagnoses processed
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Security Telemetry</div>
          <div className="text-2xl font-black text-slate-900">{summary?.total_audits || 0} Events</div>
          <div className="text-xs text-indigo-600 font-medium mt-1 flex items-center gap-1">
            <Database className="w-3.5 h-3.5" />
            <span>Supabase Cloud Audit</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Users & Recent Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Registrations */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-600" />
              <h2 className="text-base font-bold text-slate-900">Recent Registrations</h2>
            </div>
            <Link
              to="/admin/users"
              className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {recent_users && recent_users.length > 0 ? (
              recent_users.map((u) => (
                <div key={u.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm shrink-0">
                      {u.full_name ? u.full_name[0].toUpperCase() : 'U'}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-800 truncate">{u.full_name}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-2">
                        <span>{u.mobile}</span>
                        {u.district && <span>• {u.district}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-slate-100 text-slate-700 uppercase">
                      {u.role}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        u.status === 'active'
                          ? 'bg-emerald-500'
                          : u.status === 'pending_verification'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-sm text-slate-400">No users found.</div>
            )}
          </div>
        </div>

        {/* Recent Audit Logs */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">Security Audit Feed</h2>
            </div>
            <Link
              to="/admin/audit-logs"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>Full Log</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3 flex-1">
            {recent_audits && recent_audits.length > 0 ? (
              recent_audits.map((a) => (
                <div key={a.id} className="p-3 bg-slate-50/80 rounded-xl text-xs border border-slate-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] px-2 py-0.5 bg-slate-200 rounded">
                      {a.action}
                    </span>
                    <span className="text-slate-400 text-[10px]">
                      {new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-slate-600 font-medium truncate mt-1">
                    {a.details || `${a.action} on ${a.resource_type || 'platform'}`}
                  </div>
                  {a.ip_address && (
                    <div className="text-[10px] text-slate-400 mt-1">
                      IP: {a.ip_address}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-sm text-slate-400">No audit logs recorded yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
