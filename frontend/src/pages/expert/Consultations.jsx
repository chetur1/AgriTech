/**
 * AGRI SMART — Expert Consultation Management  (Phase 7)
 * File: frontend/src/pages/expert/Consultations.jsx
 *
 * Dedicated consultation module for verified agricultural experts:
 * - Review open advisory requests from farmers
 * - Filter by category (Crop Disease, Soil Nutrition, Pest Control) and Urgency
 * - Interactive response thread with verified advice badge
 * - Standardized safety advisories & status updates
 */

import { useState, useEffect, useCallback } from 'react'
import {
  MessageSquare, User, Clock, AlertTriangle, CheckCircle2,
  Send, Loader2, RefreshCw, Filter, ShieldCheck, Tag,
  ChevronRight, ArrowLeft, Phone, MapPin, Sparkles
} from 'lucide-react'
import api, { consultationAPI } from '../../services/api'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function UrgencyBadge({ urgency }) {
  const map = {
    Emergency: 'bg-red-100 text-red-700 border-red-300 font-bold',
    High:      'bg-amber-100 text-amber-700 border-amber-300',
    Medium:    'bg-blue-100 text-blue-700 border-blue-300',
    Low:       'bg-gray-100 text-gray-700 border-gray-300',
  }
  return (
    <span className={`text-xs px-2.5 py-0.5 rounded-full border ${map[urgency] || map.Medium}`}>
      {urgency}
    </span>
  )
}

function StatusBadge({ status }) {
  const map = {
    open:        'bg-red-50 text-red-700 border-red-200',
    assigned:    'bg-blue-50 text-blue-700 border-blue-200',
    in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
    answered:    'bg-green-50 text-green-700 border-green-200',
    closed:      'bg-gray-100 text-gray-600 border-gray-200',
  }
  const labels = {
    open:        'Open / Unassigned',
    assigned:    'Assigned',
    in_progress: 'Discussion Active',
    answered:    'Expert Replied',
    closed:      'Resolved & Closed',
  }
  return (
    <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${map[status] || map.open}`}>
      {labels[status] || status}
    </span>
  )
}

export default function Consultations() {
  const [consultations, setConsultations] = useState([])
  const [selectedId, setSelectedId]       = useState(null)
  const [selectedCase, setSelectedCase]   = useState(null)
  const [loading, setLoading]             = useState(true)
  const [caseLoading, setCaseLoading]     = useState(false)
  const [replyText, setReplyText]         = useState('')
  const [submitting, setSubmitting]       = useState(false)
  const [filterStatus, setFilterStatus]   = useState('')
  const [error, setError]                 = useState(null)

  const loadList = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await consultationAPI.list()
      setConsultations(data || [])
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to load consultations.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadList()
  }, [loadList])

  const openThread = async (id) => {
    setSelectedId(id)
    setCaseLoading(true)
    try {
      const data = await consultationAPI.get(id)
      setSelectedCase(data)
    } catch {
      setSelectedCase(null)
    } finally {
      setCaseLoading(false)
    }
  }

  const handleSendReply = async (e) => {
    e.preventDefault()
    if (!replyText.trim() || submitting || !selectedId) return

    setSubmitting(true)
    try {
      await consultationAPI.respond(selectedId, { message: replyText.trim() })
      setReplyText('')
      // Refresh current thread
      const updated = await consultationAPI.get(selectedId)
      setSelectedCase(updated)
      loadList()
    } catch (err) {
      alert(err?.response?.data?.detail || 'Failed to submit response.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusChange = async (newStatus) => {
    if (!selectedId) return
    try {
      await api.patch(`/consultations/${selectedId}/status`, { status: newStatus })
      const updated = await consultationAPI.get(selectedId)
      setSelectedCase(updated)
      loadList()
    } catch (err) {
      alert(err?.response?.data?.detail || 'Status update failed.')
    }
  }

  const applyTemplate = (text) => {
    setReplyText((prev) => (prev ? `${prev}\n\n${text}` : text))
  }

  const filtered = consultations.filter((c) => {
    if (filterStatus && c.status !== filterStatus) return false
    return true
  })

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-green-700" />
            Farmer Consultations & Advisory
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Provide expert-verified diagnosis and agronomic guidance to registered farmers
          </p>
        </div>
        <button
          onClick={loadList}
          className="p-2 border border-gray-200 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main split view */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: List */}
        <div className={`lg:col-span-5 space-y-3 ${selectedId ? 'hidden lg:block' : 'block'}`}>
          {/* Filters */}
          <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-gray-200">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs bg-transparent outline-none flex-1 font-medium text-gray-700"
            >
              <option value="">All Consultations</option>
              <option value="open">Open / Unanswered</option>
              <option value="answered">Answered by Expert</option>
              <option value="closed">Closed / Resolved</option>
            </select>
            <span className="text-xs text-gray-400 font-semibold">{filtered.length}</span>
          </div>

          {loading && (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-green-600" />
            </div>
          )}

          {!loading && error && (
            <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-xl text-xs">
              {error}
            </div>
          )}

          {!loading && filtered.length === 0 && !error && (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400">
              <CheckCircle2 className="w-10 h-10 mx-auto text-green-500 mb-2 opacity-60" />
              <p className="font-medium text-gray-700 text-sm">No Consultations Found</p>
              <p className="text-xs mt-1">Farmer inquiries will appear here as they are submitted.</p>
            </div>
          )}

          {!loading &&
            filtered.map((c) => {
              const isSelected = c.id === selectedId
              return (
                <div
                  key={c.id}
                  onClick={() => openThread(c.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-green-50 border-green-500 shadow-sm'
                      : 'bg-white border-gray-200 hover:border-green-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-xs font-semibold text-gray-800 line-clamp-1">{c.subject}</span>
                    <UrgencyBadge urgency={c.urgency} />
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2 mb-2.5">{c.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-medium text-gray-700">{c.farmer_name}</span>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                </div>
              )
            })}
        </div>

        {/* Right Column: Case Discussion Thread */}
        <div className={`lg:col-span-7 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col min-h-[580px] ${!selectedId ? 'hidden lg:flex items-center justify-center text-gray-400 p-12 text-center' : 'flex'}`}>
          {!selectedId && (
            <div>
              <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="font-semibold text-gray-700 text-sm">Select a consultation to view</p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                Read the farmer's agricultural case, inspect symptoms, and compose verified recommendations.
              </p>
            </div>
          )}

          {selectedId && caseLoading && (
            <div className="m-auto py-16 flex flex-col items-center">
              <Loader2 className="w-8 h-8 animate-spin text-green-600 mb-2" />
              <p className="text-xs text-gray-500">Loading consultation thread…</p>
            </div>
          )}

          {selectedId && !caseLoading && selectedCase && (
            <>
              {/* Thread Header */}
              <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={() => setSelectedId(null)}
                    className="lg:hidden p-1.5 text-gray-500 hover:bg-gray-200 rounded-lg"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-gray-900 truncate">{selectedCase.subject}</h2>
                      <UrgencyBadge urgency={selectedCase.urgency} />
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">Category: {selectedCase.category}</p>
                  </div>
                  {/* Status Dropdown */}
                  <select
                    value={selectedCase.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="text-xs bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 font-semibold text-gray-700 outline-none"
                  >
                    <option value="open">Mark: Open</option>
                    <option value="in_progress">Mark: In Progress</option>
                    <option value="answered">Mark: Answered</option>
                    <option value="closed">Mark: Closed</option>
                  </select>
                </div>

                {/* Farmer Info Bar */}
                <div className="bg-white p-3 rounded-xl border border-gray-200 flex items-center justify-between text-xs flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center font-bold text-green-700">
                      {selectedCase.farmer_name?.[0] || 'F'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{selectedCase.farmer_name}</p>
                      {selectedCase.farmer_district && (
                        <p className="text-gray-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {selectedCase.farmer_district}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-gray-400">
                    <p>Submitted: {new Date(selectedCase.created_at).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>
              </div>

              {/* Message Feed */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[380px] bg-slate-50/50">
                {selectedCase.messages?.map((msg) => {
                  const isExp = msg.sender_role === 'expert' || msg.is_expert_verified
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isExp ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span className="text-xs font-semibold text-gray-700">{msg.sender_name}</span>
                        {isExp && (
                          <span className="flex items-center gap-0.5 text-[10px] bg-green-100 text-green-800 font-bold px-1.5 py-0.2 rounded-full border border-green-200">
                            <ShieldCheck className="w-3 h-3 text-green-700" /> Expert Verified
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div
                        className={`p-3.5 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                          isExp
                            ? 'bg-green-700 text-white rounded-br-none shadow-xs'
                            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-xs'
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Advisory Response Box */}
              <div className="p-4 border-t border-gray-200 bg-white space-y-3">
                {/* Quick Templates */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs text-gray-600">
                  <span className="text-gray-400 font-semibold shrink-0">Templates:</span>
                  <button
                    type="button"
                    onClick={() => applyTemplate('Recommendation: Spray Neem oil (Azadirachtin 10,000 ppm) at 3 ml/litre in cool evening hours.')}
                    className="px-2.5 py-1 bg-gray-100 hover:bg-green-100 hover:text-green-800 rounded-lg shrink-0 border border-gray-200"
                  >
                    🌿 Organic Neem Spray
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate('Clinical Note: Isolate infected plants immediately to prevent spore dispersion.')}
                    className="px-2.5 py-1 bg-gray-100 hover:bg-green-100 hover:text-green-800 rounded-lg shrink-0 border border-gray-200"
                  >
                    🛡️ Isolate Crop
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate('Caution: Ensure 14 days waiting period before harvesting following chemical fungicide application.')}
                    className="px-2.5 py-1 bg-gray-100 hover:bg-amber-100 hover:text-amber-800 rounded-lg shrink-0 border border-gray-200"
                  >
                    ⚠️ Pre-Harvest Warning
                  </button>
                </div>

                <form onSubmit={handleSendReply} className="flex gap-2">
                  <textarea
                    rows={3}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Provide professional, actionable agronomic advice. Remember to include safe dosage and weather-dependent timing..."
                    className="flex-1 border border-gray-300 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  />
                  <button
                    type="submit"
                    disabled={submitting || !replyText.trim()}
                    className="self-end px-4 py-3 bg-green-700 text-white rounded-xl text-xs font-semibold hover:bg-green-800 disabled:opacity-50 flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Send
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
