/**
 * AGRI SMART — Expert Verification Portal
 * File: frontend/src/pages/admin/ExpertVerification.jsx
 */

import { useState, useEffect } from 'react'
import {
  ShieldCheck,
  ShieldAlert,
  Check,
  X,
  Award,
  BookOpen,
  Building,
  Clock,
  RefreshCw,
  AlertCircle,
  FileText,
  User,
  CheckCircle2
} from 'lucide-react'
import { adminAPI } from '../../services/api'

export default function ExpertVerification() {
  const [pendingExperts, setPendingExperts] = useState([])
  const [allExperts, setAllExperts] = useState([])
  const [viewTab, setViewTab] = useState('pending') // 'pending' | 'all'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)
  const [rejectingId, setRejectingId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [pending, all] = await Promise.all([
        adminAPI.getPendingExperts(),
        adminAPI.getUsers({ role: 'expert' }),
      ])
      setPendingExperts(Array.isArray(pending) ? pending : [])
      setAllExperts(Array.isArray(all) ? all : [])
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load experts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleVerify = async (expertId, approve, reason = '') => {
    setActionLoading(expertId)
    try {
      await adminAPI.verifyExpert(expertId, {
        status: approve ? 'approved' : 'rejected',
        rejection_reason: approve ? null : (reason || 'Credentials could not be verified.'),
      })
      setRejectingId(null)
      setRejectReason('')
      await loadData()
    } catch (err) {
      alert(err.response?.data?.detail || err.message || 'Verification update failed')
    } finally {
      setActionLoading(null)
    }
  }

  const displayedList = viewTab === 'pending'
    ? pendingExperts
    : allExperts

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Expert Credential Verification</h1>
          <p className="text-sm text-slate-500 mt-1">
            Review academic qualifications and institutional credentials of agricultural specialists before approving advisory access.
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setViewTab('pending')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            viewTab === 'pending'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Pending Applications</span>
          <span className="px-2 py-0.5 text-xs font-black rounded-full bg-white/20 text-white">
            {pendingExperts.length}
          </span>
        </button>

        <button
          onClick={() => setViewTab('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            viewTab === 'all'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>All Registered Experts ({allExperts.length})</span>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-20 text-center text-sm text-slate-500 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-slate-200/80">
          <RefreshCw className="w-6 h-6 animate-spin text-primary-600" />
          <span>Loading expert verification queue...</span>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm">
          {error}
        </div>
      ) : displayedList.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-slate-200/80 p-6 flex flex-col items-center justify-center gap-2">
          <CheckCircle2 className="w-12 h-12 text-emerald-500" />
          <h3 className="font-bold text-slate-900 text-base">All Caught Up!</h3>
          <p className="text-sm text-slate-400 max-w-sm">
            {viewTab === 'pending'
              ? 'There are no pending agricultural expert applications awaiting verification.'
              : 'No expert accounts registered yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {displayedList.map((expert) => {
            const profile = expert.expert_profile || {}
            const isPending = profile.verification_status === 'pending'
            const isApproved = profile.verification_status === 'approved'
            const isRejected = profile.verification_status === 'rejected'

            return (
              <div
                key={expert.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition"
              >
                <div>
                  {/* Top: Status badge & Name */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-base shadow-sm">
                        {expert.full_name ? expert.full_name[0].toUpperCase() : 'E'}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{expert.full_name}</h3>
                        <p className="text-xs text-slate-400">{expert.email || expert.mobile}</p>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 text-xs font-bold rounded-full capitalize ${
                        isApproved
                          ? 'bg-emerald-100 text-emerald-800'
                          : isPending
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {profile.verification_status || 'Pending'}
                    </span>
                  </div>

                  {/* Credentials Grid */}
                  <div className="space-y-2.5 text-xs bg-slate-50 p-4 rounded-xl mb-4">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Award className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="font-medium text-slate-400">Qualifications:</span>
                      <span className="font-bold text-slate-800">{profile.qualifications || 'B.Sc Agriculture'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-700">
                      <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span className="font-medium text-slate-400">Specialisation:</span>
                      <span className="font-bold text-slate-800">{profile.specialisation || 'Crop Science & Agronomy'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-700">
                      <Building className="w-4 h-4 text-slate-500 shrink-0" />
                      <span className="font-medium text-slate-400">Institution:</span>
                      <span className="font-bold text-slate-800">{profile.institution || 'State Agricultural University'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-700">
                      <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                      <span className="font-medium text-slate-400">Experience:</span>
                      <span className="font-bold text-slate-800">{profile.experience_years || 1} Years</span>
                    </div>
                  </div>

                  {profile.rejection_reason && (
                    <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-700 mb-4">
                      <span className="font-bold">Rejection Note:</span> {profile.rejection_reason}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-slate-100">
                  {rejectingId === expert.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Reason for rejection (sent to applicant)..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setRejectingId(null)
                            setRejectReason('')
                          }}
                          className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleVerify(expert.id, false, rejectReason)}
                          disabled={actionLoading === expert.id}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold"
                        >
                          Confirm Rejection
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] text-slate-400">
                        Registered {new Date(expert.created_at).toLocaleDateString()}
                      </span>

                      <div className="flex gap-2">
                        {isPending && (
                          <button
                            onClick={() => setRejectingId(expert.id)}
                            disabled={actionLoading === expert.id}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        )}

                        {(!isApproved || isPending) && (
                          <button
                            onClick={() => handleVerify(expert.id, true)}
                            disabled={actionLoading === expert.id}
                            className="flex items-center gap-1 px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve & Verify</span>
                          </button>
                        )}

                        {isApproved && (
                          <button
                            onClick={() => setRejectingId(expert.id)}
                            disabled={actionLoading === expert.id}
                            className="text-xs text-slate-400 hover:text-rose-600 underline"
                          >
                            Revoke Verification
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
