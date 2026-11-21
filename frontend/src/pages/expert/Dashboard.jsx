/**
 * AGRI SMART — Expert Dashboard  (Phase 7)
 * File: frontend/src/pages/expert/Dashboard.jsx
 *
 * Overview dashboard for verified agricultural experts:
 * - Stats: Pending Reviews, Verified This Month, Farmers, All-Time Reviews
 * - Recent pending diagnoses with quick-action links
 * - Navigation cards to core expert modules
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck, Camera, MessageSquare, BookOpen,
  Users, Clock, CheckCircle2, AlertTriangle,
  ArrowRight, Loader2, RefreshCw, Leaf
} from 'lucide-react'
import api from '../../services/api'

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------
function StatCard({ icon: Icon, label, value, color, loading }) {
  const colors = {
    green:  'bg-green-50 text-green-700 border-green-200',
    amber:  'bg-amber-50 text-amber-700 border-amber-200',
    blue:   'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  }
  return (
    <div className={`rounded-xl border p-5 ${colors[color]}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium opacity-80">{label}</span>
        <div className="w-9 h-9 rounded-lg bg-white/60 flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {loading
        ? <div className="h-8 w-16 bg-current/10 rounded animate-pulse" />
        : <p className="text-3xl font-bold">{value ?? 0}</p>
      }
    </div>
  )
}

// ---------------------------------------------------------------------------
// Severity badge
// ---------------------------------------------------------------------------
function SeverityBadge({ severity }) {
  const map = {
    Severe:   'bg-red-100 text-red-700',
    Moderate: 'bg-amber-100 text-amber-700',
    Mild:     'bg-green-100 text-green-700',
  }
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[severity] ?? 'bg-gray-100 text-gray-600'}`}>
      {severity}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Module navigation card
// ---------------------------------------------------------------------------
function ModuleCard({ to, icon: Icon, title, desc, badge }) {
  return (
    <Link
      to={to}
      className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-green-400 hover:shadow-md transition-all group"
    >
      <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-green-200 transition-colors">
        <Icon className="w-5 h-5 text-green-700" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-gray-900 text-sm">{title}</p>
          {badge != null && badge > 0 && (
            <span className="text-xs bg-red-500 text-white rounded-full px-1.5 py-0.5 font-bold">{badge}</span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-green-600 mt-0.5 shrink-0" />
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Main Dashboard
// ---------------------------------------------------------------------------
export default function ExpertDashboard() {
  const [stats, setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.get('/experts/dashboard')
      setStats(data)
    } catch (err) {
      const msg = err?.response?.data?.detail
      if (typeof msg === 'string' && msg.includes('pending verification')) {
        setError('pending')
      } else {
        setError(err?.response?.data?.detail || 'Failed to load dashboard. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // Pending verification state
  if (!loading && error === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md text-center bg-white rounded-2xl border border-amber-200 p-8 shadow-sm">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Verification Pending</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Your expert credentials are currently under review by our administrators.
            You will receive access once your qualifications have been verified.
          </p>
          <p className="mt-4 text-xs text-gray-400">
            Typical verification time: 1–2 business days. Contact support if you have been
            waiting longer than 3 days.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-green-700" />
            <h1 className="text-2xl font-bold text-gray-900">
              {loading ? 'Loading…' : `Welcome, ${stats?.expert_name?.split(' ')[0]}`}
            </h1>
          </div>
          {!loading && stats && (
            <p className="text-sm text-gray-500 mt-1">
              {stats.specialisation} · {stats.institution}
            </p>
          )}
        </div>
        <button
          onClick={load}
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-500"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Error state (non-pending) */}
      {error && error !== 'pending' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={AlertTriangle} label="Pending Reviews"      value={stats?.total_pending_reviews}             color="amber"  loading={loading} />
        <StatCard icon={CheckCircle2} label="Verified This Month"   value={stats?.total_verified_this_month}         color="green"  loading={loading} />
        <StatCard icon={Users}        label="Farmers Tracked"        value={stats?.total_assigned_farmers}            color="blue"   loading={loading} />
        <StatCard icon={ShieldCheck}  label="All-Time Reviews"       value={stats?.total_diagnoses_reviewed_all_time} color="purple" loading={loading} />
      </div>

      {/* Recent Pending Diagnoses */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            <h2 className="font-semibold text-gray-900">Awaiting Your Review</h2>
          </div>
          <Link
            to="/expert/diagnosis-review"
            className="text-sm text-green-700 hover:text-green-800 font-medium flex items-center gap-1"
          >
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-green-600" />
          </div>
        )}

        {!loading && (!stats?.recent_pending || stats.recent_pending.length === 0) && (
          <div className="text-center py-10 text-gray-400">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-green-400" />
            <p className="text-sm font-medium">All caught up!</p>
            <p className="text-xs mt-1">No pending diagnoses at the moment.</p>
          </div>
        )}

        {!loading && stats?.recent_pending?.map((d) => (
          <Link
            key={d.id}
            to={`/expert/diagnosis-review?id=${d.id}`}
            className="flex items-center gap-4 px-5 py-3.5 border-b border-gray-50 hover:bg-green-50 transition-colors last:border-0"
          >
            {/* Leaf image thumbnail */}
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
              {d.image_url ? (
                <img
                  src={`http://localhost:8000${d.image_url}`}
                  alt={d.crop_name}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = 'none' }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Leaf className="w-5 h-5 text-gray-400" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-gray-900 text-sm truncate">{d.predicted_disease}</p>
                <SeverityBadge severity={d.severity} />
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {d.crop_name} · Farmer: {d.farmer_name}
                {d.farmer_district && ` · ${d.farmer_district}`}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Confidence: {Math.round(d.confidence_score * 100)}%
              </p>
            </div>

            {/* CTA */}
            <div className="shrink-0">
              <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2.5 py-1 rounded-full">
                Review
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Module Cards */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Expert Modules
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ModuleCard
            to="/expert/diagnosis-review"
            icon={Camera}
            title="Diagnosis Review"
            desc="Approve, correct, or reject AI crop disease predictions"
            badge={stats?.total_pending_reviews}
          />
          <ModuleCard
            to="/expert/consultations"
            icon={MessageSquare}
            title="Consultations"
            desc="Answer farmer questions and manage consultation requests"
          />
          <ModuleCard
            to="/expert/farmers"
            icon={Users}
            title="Farmer Management"
            desc="View all farmers who have submitted diagnoses"
          />
          <ModuleCard
            to="/expert/knowledge"
            icon={BookOpen}
            title="Knowledge Base"
            desc="Browse and contribute to the agricultural knowledge library"
          />
        </div>
      </div>

    </div>
  )
}
