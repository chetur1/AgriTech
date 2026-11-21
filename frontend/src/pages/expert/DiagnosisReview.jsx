/**
 * AGRI SMART — Expert Diagnosis Review  (Phase 7)
 * File: frontend/src/pages/expert/DiagnosisReview.jsx
 *
 * Core expert module for reviewing AI-generated crop disease predictions.
 * - Lists all pending AI diagnoses
 * - Full detail modal with leaf photo, AI prediction, symptoms
 * - Review form: Approve / Correct / Reject with mandatory expert notes
 */

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  CheckCircle2, Edit3, XCircle, Loader2, RefreshCw,
  Leaf, AlertTriangle, ChevronRight, Filter, Eye,
  ShieldCheck, Calendar, User, MapPin
} from 'lucide-react'
import api from '../../services/api'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function SeverityBadge({ severity }) {
  const map = {
    Severe:   'bg-red-100 text-red-700 border-red-200',
    Moderate: 'bg-amber-100 text-amber-700 border-amber-200',
    Mild:     'bg-green-100 text-green-700 border-green-200',
  }
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${map[severity] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
      {severity}
    </span>
  )
}

function StatusBadge({ status }) {
  const map = {
    predicted:               'bg-blue-100 text-blue-700',
    pending_expert_review:   'bg-amber-100 text-amber-700',
    expert_approved:         'bg-green-100 text-green-700',
    expert_corrected:        'bg-purple-100 text-purple-700',
    expert_rejected:         'bg-red-100 text-red-700',
  }
  const labels = {
    predicted:               'AI Predicted',
    pending_expert_review:   'Pending Review',
    expert_approved:         'Approved',
    expert_corrected:        'Corrected',
    expert_rejected:         'Rejected',
  }
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[status] ?? 'bg-gray-100 text-gray-700'}`}>
      {labels[status] ?? status}
    </span>
  )
}

function ConfBar({ score }) {
  const pct = Math.round(score * 100)
  const color = pct >= 70 ? 'bg-green-500' : pct >= 45 ? 'bg-amber-500' : 'bg-red-400'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-8">{pct}%</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Detail + Review Modal
// ---------------------------------------------------------------------------
function ReviewModal({ diagnosisId, onClose, onReviewed }) {
  const [detail, setDetail]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [action, setAction]   = useState(null)   // 'approve' | 'correct' | 'reject'
  const [notes, setNotes]     = useState('')
  const [correctedDisease, setCorrectedDisease] = useState('')
  const [severityOverride, setSeverityOverride] = useState('')
  const [submitError, setSubmitError] = useState(null)
  const [submitSuccess, setSubmitSuccess] = useState(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const data = await api.get(`/experts/diagnoses/${diagnosisId}`)
        setDetail(data)
      } catch {
        setDetail(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [diagnosisId])

  const handleSubmit = async () => {
    if (!action) return setSubmitError('Please select an action.')
    if (notes.trim().length < 10) return setSubmitError('Expert notes must be at least 10 characters.')
    if (action === 'correct' && !correctedDisease.trim()) {
      return setSubmitError('Please enter the corrected disease name.')
    }
    setSubmitError(null)
    setSubmitting(true)
    try {
      const payload = {
        action,
        expert_notes: notes.trim(),
        corrected_disease: action === 'correct' ? correctedDisease.trim() : undefined,
        severity_override: severityOverride || undefined,
      }
      const res = await api.post(`/experts/diagnoses/${diagnosisId}/review`, payload)
      setSubmitSuccess(res.message)
      onReviewed && onReviewed()
    } catch (err) {
      const msg = err?.response?.data?.detail
      setSubmitError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-4 px-2">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl my-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-green-700" />
            <h2 className="font-bold text-gray-900">Diagnosis Review</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <XCircle className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-green-600" />
          </div>
        )}

        {!loading && !detail && (
          <div className="text-center py-16 text-red-500">
            Failed to load diagnosis details.
          </div>
        )}

        {!loading && detail && (
          <div className="p-5 space-y-5">

            {/* Success banner */}
            {submitSuccess && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-300 rounded-xl p-3 text-green-800 text-sm">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{submitSuccess}</span>
              </div>
            )}

            {/* Top row: Image + AI prediction */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Leaf photo */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Uploaded Leaf Photo</p>
                <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                  {detail.image_url ? (
                    <img
                      src={`http://localhost:8000${detail.image_url}`}
                      alt="Uploaded leaf"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Leaf className="w-12 h-12 text-gray-300" />
                    </div>
                  )}
                </div>
              </div>

              {/* AI Analysis */}
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">AI Prediction</p>
                  <p className="text-lg font-bold text-gray-900">{detail.predicted_disease}</p>
                  {detail.vernacular_name && (
                    <p className="text-sm text-gray-500 italic">{detail.vernacular_name}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <SeverityBadge severity={detail.severity} />
                  <StatusBadge status={detail.status} />
                  {detail.is_expert_verified && (
                    <span className="flex items-center gap-1 text-xs text-green-700 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">AI Confidence</p>
                  <ConfBar score={detail.confidence_score} />
                </div>

                {/* Farmer info */}
                <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Farmer</p>
                  <div className="flex items-center gap-1.5 text-sm text-gray-700">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    {detail.farmer_name}
                  </div>
                  {detail.farmer_district && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <MapPin className="w-3.5 h-3.5" />
                      {detail.farmer_district}{detail.farmer_state && `, ${detail.farmer_state}`}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Calendar className="w-3.5 h-3.5" />
                    Submitted: {new Date(detail.created_at).toLocaleDateString('en-IN')}
                  </div>
                  <p className="text-xs text-gray-500">
                    Crop: <span className="font-medium text-gray-700">{detail.crop_name}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Symptoms & Causes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                <p className="text-xs font-semibold text-amber-800 uppercase mb-2">Symptoms (AI)</p>
                <ul className="space-y-1">
                  {detail.symptoms?.map((s, i) => (
                    <li key={i} className="text-sm text-amber-900 flex items-start gap-1.5">
                      <span className="text-amber-500 mt-0.5">•</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                <p className="text-xs font-semibold text-red-800 uppercase mb-2">Possible Causes (AI)</p>
                <ul className="space-y-1">
                  {detail.possible_causes?.map((c, i) => (
                    <li key={i} className="text-sm text-red-900 flex items-start gap-1.5">
                      <span className="text-red-400 mt-0.5">•</span> {c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Previous expert review (if already reviewed) */}
            {detail.is_expert_verified && detail.expert_notes && (
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-4 h-4 text-green-700" />
                  <p className="text-xs font-semibold text-green-800 uppercase">Previous Expert Review</p>
                </div>
                {detail.expert_diagnosis_override && (
                  <p className="text-sm font-semibold text-green-900 mb-1">
                    Expert Diagnosis: {detail.expert_diagnosis_override}
                  </p>
                )}
                <p className="text-sm text-green-800">{detail.expert_notes}</p>
              </div>
            )}

            {/* ---- REVIEW FORM ---- */}
            {!submitSuccess && (
              <div className="border-t border-gray-200 pt-5 space-y-4">
                <p className="font-semibold text-gray-900">Your Professional Review</p>

                {/* Action buttons */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: 'approve', label: '✅ Approve', Icon: CheckCircle2, color: 'green' },
                    { key: 'correct', label: '✏️ Correct',  Icon: Edit3,         color: 'purple' },
                    { key: 'reject',  label: '❌ Reject',   Icon: XCircle,       color: 'red' },
                  ].map(({ key, label, Icon, color }) => {
                    const colorMap = {
                      green:  { base: 'border-gray-200 hover:border-green-400 hover:bg-green-50',   active: 'border-green-500 bg-green-50 text-green-700' },
                      purple: { base: 'border-gray-200 hover:border-purple-400 hover:bg-purple-50', active: 'border-purple-500 bg-purple-50 text-purple-700' },
                      red:    { base: 'border-gray-200 hover:border-red-400 hover:bg-red-50',       active: 'border-red-500 bg-red-50 text-red-700' },
                    }
                    const isActive = action === key
                    return (
                      <button
                        key={key}
                        onClick={() => setAction(key)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-sm font-semibold ${
                          isActive ? colorMap[color].active : `text-gray-600 ${colorMap[color].base}`
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        {label}
                      </button>
                    )
                  })}
                </div>

                {/* Corrected disease input */}
                {action === 'correct' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Corrected Disease Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={correctedDisease}
                      onChange={e => setCorrectedDisease(e.target.value)}
                      placeholder="e.g. Cercospora Leaf Spot"
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-green-400 outline-none"
                    />
                  </div>
                )}

                {/* Severity override */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Severity Override (optional)
                  </label>
                  <select
                    value={severityOverride}
                    onChange={e => setSeverityOverride(e.target.value)}
                    className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-green-400 outline-none bg-white"
                  >
                    <option value="">Keep AI assessment ({detail.severity})</option>
                    <option value="Mild">Mild</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Severe">Severe</option>
                  </select>
                </div>

                {/* Expert notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Professional Clinical Observations <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Provide your professional observations, field experience, recommended next steps, and any safety precautions. Minimum 10 characters required."
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-green-400 outline-none resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">{notes.length}/2000</p>
                </div>

                {submitError && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    {submitError}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !action}
                    className="flex-1 py-2.5 rounded-xl bg-green-700 text-white text-sm font-semibold hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    Submit Review
                  </button>
                </div>
              </div>
            )}

            {submitSuccess && (
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-green-700 text-white text-sm font-semibold hover:bg-green-800"
              >
                Close
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page — Diagnosis Review List
// ---------------------------------------------------------------------------
export default function DiagnosisReview() {
  const [searchParams] = useSearchParams()
  const [diagnoses, setDiagnoses] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [selectedId, setSelectedId] = useState(searchParams.get('id') || null)
  const [cropFilter, setCropFilter] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (cropFilter)     params.crop     = cropFilter
      if (severityFilter) params.severity = severityFilter
      const data = await api.get('/experts/pending-diagnoses', { params })
      setDiagnoses(data)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to load diagnoses.')
    } finally {
      setLoading(false)
    }
  }, [cropFilter, severityFilter])

  useEffect(() => { load() }, [load])

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Camera className="w-6 h-6 text-green-700" />
            Diagnosis Review
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            AI-generated crop disease predictions awaiting your expert evaluation
          </p>
        </div>
        <button
          onClick={load}
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-500"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
        <span>
          <strong>Expert Responsibility:</strong> AI predictions are machine-generated estimates.
          Your review directly affects what farmers see. Only issue verified recommendations based
          on your professional expertise. Never confirm a disease solely from a low-confidence prediction.
        </span>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={cropFilter}
            onChange={e => setCropFilter(e.target.value)}
            placeholder="Filter by crop..."
            className="text-sm outline-none w-32 bg-transparent"
          />
        </div>
        <select
          value={severityFilter}
          onChange={e => setSeverityFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white outline-none"
        >
          <option value="">All Severities</option>
          <option value="Severe">Severe</option>
          <option value="Moderate">Moderate</option>
          <option value="Mild">Mild</option>
        </select>
        <button
          onClick={load}
          className="px-4 py-2 bg-green-700 text-white text-sm font-medium rounded-xl hover:bg-green-800"
        >
          Apply
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-green-600" />
        </div>
      )}

      {/* Empty */}
      {!loading && !error && diagnoses.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-400" />
          <p className="font-semibold text-gray-900">No pending reviews</p>
          <p className="text-sm text-gray-500 mt-1">
            All AI diagnoses have been reviewed, or none match your filter.
          </p>
        </div>
      )}

      {/* List */}
      {!loading && diagnoses.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">{diagnoses.length} diagnosis{diagnoses.length !== 1 ? 'es' : ''} pending review</p>
          {diagnoses.map((d) => (
            <div
              key={d.id}
              className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-4 hover:border-green-300 hover:shadow-sm transition-all cursor-pointer"
              onClick={() => setSelectedId(d.id)}
            >
              {/* Thumbnail */}
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                {d.image_url ? (
                  <img
                    src={`http://localhost:8000${d.image_url}`}
                    alt={d.crop_name}
                    className="w-full h-full object-cover"
                    onError={e => { e.target.style.display='none' }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Leaf className="w-6 h-6 text-gray-300" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="font-semibold text-gray-900 text-sm truncate">{d.predicted_disease}</p>
                  <SeverityBadge severity={d.severity} />
                </div>
                <p className="text-xs text-gray-500">
                  {d.crop_name} · Farmer: {d.farmer_name}
                  {d.farmer_district && ` · ${d.farmer_district}`}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1">
                    <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${d.confidence_score >= 0.7 ? 'bg-green-500' : d.confidence_score >= 0.45 ? 'bg-amber-500' : 'bg-red-400'}`}
                        style={{ width: `${Math.round(d.confidence_score * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400">{Math.round(d.confidence_score * 100)}%</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(d.created_at).toLocaleDateString('en-IN')}
                  </span>
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedId && (
        <ReviewModal
          diagnosisId={selectedId}
          onClose={() => setSelectedId(null)}
          onReviewed={load}
        />
      )}
    </div>
  )
}
