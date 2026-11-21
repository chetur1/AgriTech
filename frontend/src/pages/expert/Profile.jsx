/**
 * AGRI SMART — Expert Profile  (Phase 7)
 * File: frontend/src/pages/expert/Profile.jsx
 */

import { useState, useEffect } from 'react'
import { ShieldCheck, User, Award, Building2, Loader2, Clock, CheckCircle2, XCircle } from 'lucide-react'
import api from '../../services/api'

export default function ExpertProfile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/experts/profile')
      .then(d => setProfile(d))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false))
  }, [])

  const statusConfig = {
    pending:  { icon: Clock,         color: 'text-amber-600 bg-amber-100',  label: 'Pending Verification' },
    approved: { icon: CheckCircle2,  color: 'text-green-700 bg-green-100',  label: 'Verified Expert' },
    rejected: { icon: XCircle,       color: 'text-red-600 bg-red-100',      label: 'Rejected — Contact Admin' },
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <User className="w-6 h-6 text-green-700" /> My Expert Profile
      </h1>

      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-green-600" />
        </div>
      )}

      {!loading && !profile && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          Could not load profile. Please refresh.
        </div>
      )}

      {!loading && profile && (() => {
        const vs = profile.verification_status || 'pending'
        const cfg = statusConfig[vs] || statusConfig.pending
        const StatusIcon = cfg.icon
        return (
          <div className="space-y-4">
            {/* Verification Status Banner */}
            <div className={`flex items-center gap-3 rounded-xl p-4 border ${
              vs === 'approved' ? 'bg-green-50 border-green-200' :
              vs === 'rejected' ? 'bg-red-50 border-red-200' :
              'bg-amber-50 border-amber-200'
            }`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${cfg.color.split(' ')[1]}`}>
                <StatusIcon className={`w-5 h-5 ${cfg.color.split(' ')[0]}`} />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{cfg.label}</p>
                {vs === 'approved' && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Verified on {profile.verified_at ? new Date(profile.verified_at).toLocaleDateString('en-IN') : 'N/A'}
                  </p>
                )}
                {vs === 'pending' && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Your credentials are under review by our administrators.
                  </p>
                )}
                {vs === 'rejected' && profile.rejection_reason && (
                  <p className="text-xs text-red-600 mt-0.5">Reason: {profile.rejection_reason}</p>
                )}
              </div>
            </div>

            {/* Profile fields */}
            {[
              { icon: Award,     label: 'Qualifications',   value: profile.qualifications },
              { icon: ShieldCheck, label: 'Specialisation', value: profile.specialisation },
              { icon: Building2, label: 'Institution',      value: profile.institution },
              { icon: User,      label: 'Experience',       value: `${profile.experience_years} year${profile.experience_years !== 1 ? 's' : ''}` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3 bg-white rounded-xl border border-gray-200 p-4">
                <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-green-700" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">{label}</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">{value || 'Not specified'}</p>
                </div>
              </div>
            ))}

            <p className="text-xs text-gray-400 text-center">
              To update your credentials, please contact AGRI SMART administration.
            </p>
          </div>
        )
      })()}
    </div>
  )
}
