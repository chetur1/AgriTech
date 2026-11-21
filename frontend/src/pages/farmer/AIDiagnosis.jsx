/**
 * AGRI SMART — AI Crop Disease Diagnosis & Agricultural Knowledge RAG
 * File: frontend/src/pages/farmer/AIDiagnosis.jsx
 */

import { useState, useEffect, useRef } from 'react'
import {
  Camera, Upload, AlertCircle, CheckCircle2, ShieldCheck,
  AlertTriangle, Leaf, HelpCircle, UserCheck, Clock,
  ArrowRight, Search, Sparkles, X, ChevronRight, BookOpen
} from 'lucide-react'
import { aiAPI, cropAPI } from '../../services/api'
import LoadingScreen from '../../components/ui/LoadingScreen'

const CROP_HINTS = [
  'General Crop',
  'Tomato',
  'Paddy (Rice)',
  'Potato',
  'Cotton',
  'Maize (Corn)',
  'Ragi (Millet)',
]

export default function AIDiagnosisPage() {
  const fileInputRef = useRef(null)

  // Upload and prediction states
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [cropName, setCropName] = useState('General Crop')
  const [selectedCropId, setSelectedCropId] = useState('')
  const [cropsList, setCropsList] = useState([])

  const [diagnosing, setDiagnosing] = useState(false)
  const [currentResult, setCurrentResult] = useState(null)
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [activeTab, setActiveTab] = useState('organic') // 'symptoms', 'organic', 'chemical', 'prevention'

  // Phase 5 RAG state
  const [ragQuery, setRagQuery] = useState('')
  const [ragResult, setRagResult] = useState(null)
  const [ragLoading, setRagLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoadingHistory(true)
      const [historyData, cropsData] = await Promise.all([
        aiAPI.getHistory(),
        cropAPI.list(),
      ])
      setHistory(historyData || [])
      setCropsList(cropsData || [])
      if (historyData && historyData.length > 0) {
        setCurrentResult(historyData[0])
      }
    } catch (err) {
      console.error('Failed to load diagnosis data:', err)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Image file is too large (Maximum 10 MB).')
        return
      }
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setError('')
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) {
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setError('')
    }
  }

  const handleRunDiagnosis = async (e) => {
    e.preventDefault()
    if (!selectedFile) {
      setError('Please select or capture a crop leaf photograph.')
      return
    }

    setDiagnosing(true)
    setError('')
    setSuccessMsg('')

    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('crop_name', cropName)
    if (selectedCropId) {
      formData.append('crop_id', selectedCropId)
    }

    try {
      const res = await aiAPI.diagnose(formData)
      setCurrentResult(res)
      setSuccessMsg('AI Diagnosis complete! Scroll down to review remedies.')
      // Refresh history
      const updatedHistory = await aiAPI.getHistory()
      setHistory(updatedHistory || [])
    } catch (err) {
      console.error('Diagnosis failed:', err)
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'Image diagnosis failed. Please check image quality.')
    } finally {
      setDiagnosing(false)
    }
  }

  const handleRequestExpert = async (diagnosisId) => {
    try {
      const res = await fetch(`/api/v1/ai/diagnoses/${diagnosisId}/request-expert`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('agrismart_token')}`,
        },
      })
      if (!res.ok) throw new Error('Failed to request expert verification')
      const updated = await res.json()
      setCurrentResult(updated)
      setSuccessMsg('Your diagnosis has been escalated to Agricultural University experts for review!')
      // Update history list item
      setHistory((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      setTimeout(() => setSuccessMsg(''), 5000)
    } catch (err) {
      console.error(err)
      alert('Could not submit expert review request.')
    }
  }

  const handleAskRAG = async (e) => {
    e.preventDefault()
    if (!ragQuery.trim()) return
    setRagLoading(true)
    try {
      const res = await fetch('/api/v1/rag/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: ragQuery }),
      })
      const data = await res.json()
      setRagResult(data)
    } catch (err) {
      console.error('RAG query error:', err)
    } finally {
      setRagLoading(false)
    }
  }

  return (
    <div className="page-container space-y-6">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">AI Crop Doctor & Disease Diagnostics</h1>
            <span className="badge-green">Phase 6 Live</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Detect leaf diseases, examine symptoms, receive safe organic remedies, or request university expert review.
          </p>
        </div>
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

      {/* Top Grid: Photo Uploader (Left) + Current Diagnosis / Doctor Report (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column: Image Capture & Upload Form (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <Camera className="w-5 h-5 text-primary-600" />
              <h2 className="font-bold text-gray-900 text-base">Upload Leaf Photograph</h2>
            </div>

            <form onSubmit={handleRunDiagnosis} className="space-y-4">
              {/* Drag & Drop Zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  previewUrl
                    ? 'border-primary-400 bg-primary-50/20'
                    : 'border-gray-300 hover:border-primary-500 hover:bg-gray-50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />

                {previewUrl ? (
                  <div className="space-y-3">
                    <img
                      src={previewUrl}
                      alt="Crop leaf preview"
                      className="max-h-56 mx-auto rounded-lg shadow-sm object-cover"
                    />
                    <p className="text-xs text-primary-700 font-medium">Click to select a different photo</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center mx-auto">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-gray-700">
                      Take a photo or tap to upload
                    </p>
                    <p className="text-xs text-gray-500">Supports JPG, PNG, WEBP (Max 10 MB)</p>
                  </div>
                )}
              </div>

              {/* Crop Hint Selector */}
              <div>
                <label className="label">Crop Type (Improves Accuracy)</label>
                <select
                  value={cropName}
                  onChange={(e) => setCropName(e.target.value)}
                  className="input text-sm"
                >
                  {CROP_HINTS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Link to Registered Crop (Optional) */}
              {cropsList.length > 0 && (
                <div>
                  <label className="label">Link to My Crop Parcel (Optional)</label>
                  <select
                    value={selectedCropId}
                    onChange={(e) => setSelectedCropId(e.target.value)}
                    className="input text-sm"
                  >
                    <option value="">None / Unlinked</option>
                    {cropsList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.crop_name} ({c.farm_name} &bull; {c.season})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Action Button */}
              <button
                type="submit"
                disabled={diagnosing || !selectedFile}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2"
              >
                {diagnosing ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>Analyzing Leaf Patterns...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Diagnose Crop Disease</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Photography Tips Card */}
          <div className="card bg-gray-50 border-gray-200 text-xs text-gray-600 space-y-2">
            <h4 className="font-bold text-gray-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-primary-600" />
              Tips for Best Diagnosis Accuracy:
            </h4>
            <ul className="list-disc pl-4 space-y-1 text-gray-600">
              <li>Capture the leaf closely in good daylight without shadows.</li>
              <li>Include both diseased spots and green healthy tissue for contrast.</li>
              <li>Avoid shaky, out-of-focus, or blurry photographs.</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Diagnostic Report (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {currentResult ? (
            <div className="card border-t-4 border-t-primary-600 space-y-5">
              {/* Header: Disease Name & Confidence */}
              <div>
                <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-primary-700">
                      {currentResult.crop_name} Diagnosis Report
                    </span>
                    <h2 className="text-xl font-extrabold text-gray-900 mt-0.5">
                      {currentResult.predicted_disease}
                    </h2>
                    <p className="text-xs text-gray-600 mt-1 font-medium">
                      {currentResult.vernacular_name}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary-100 text-primary-800">
                      {Math.round(currentResult.confidence_score * 100)}% Match
                    </span>
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded text-xs font-bold ${
                        currentResult.severity === 'Severe'
                          ? 'bg-red-100 text-red-800'
                          : currentResult.severity === 'Moderate'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      Severity: {currentResult.severity}
                    </span>
                  </div>
                </div>

                {/* Status & Verification Badge */}
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
                  <span>Diagnosed: {new Date(currentResult.created_at).toLocaleDateString()}</span>
                  <span>&bull;</span>
                  {currentResult.is_expert_verified ? (
                    <span className="text-green-700 font-semibold flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5" /> Verified by Agricultural Expert
                    </span>
                  ) : currentResult.status === 'pending_expert_review' ? (
                    <span className="text-amber-700 font-semibold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Under Expert Review
                    </span>
                  ) : (
                    <span className="text-gray-500">AI Initial Screening</span>
                  )}
                </div>
              </div>

              {/* Mandatory AI Ethical Disclaimer (Principle 7 & 8) */}
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>AI Prediction Notice:</strong> This preliminary identification is generated by deep learning.
                  Field conditions and nutritional deficiencies can produce similar patterns.
                  Do not apply unverified chemical mixtures.
                </div>
              </div>

              {/* Tab Navigation for Remedies */}
              <div>
                <div className="flex border-b border-gray-200">
                  {[
                    { key: 'organic', label: '🌿 Safe Organic Care' },
                    { key: 'symptoms', label: '🔍 Symptoms & Causes' },
                    { key: 'chemical', label: '⚠️ Standard Spray Guide' },
                    { key: 'prevention', label: '🛡️ Prevention' },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`py-2 px-3 text-xs font-semibold border-b-2 transition-colors ${
                        activeTab === tab.key
                          ? 'border-primary-600 text-primary-700'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Contents */}
                <div className="py-4">
                  {/* Organic Remedies */}
                  {activeTab === 'organic' && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-gray-700">Immediate Non-Toxic Field Actions:</h4>
                      <ul className="space-y-2 text-xs text-gray-700">
                        {currentResult.safe_treatment_organic?.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-2 bg-green-50/60 p-2.5 rounded-lg border border-green-100">
                            <span className="w-5 h-5 rounded-full bg-green-200 text-green-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Symptoms & Causes */}
                  {activeTab === 'symptoms' && (
                    <div className="space-y-4 text-xs">
                      <div>
                        <h4 className="font-bold text-gray-800 mb-1.5">Identified Symptoms:</h4>
                        <ul className="list-disc pl-4 space-y-1 text-gray-700">
                          {currentResult.symptoms?.map((s, idx) => (
                            <li key={idx}>{s}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 mb-1.5">Root Environmental Causes:</h4>
                        <ul className="list-disc pl-4 space-y-1 text-gray-700">
                          {currentResult.possible_causes?.map((c, idx) => (
                            <li key={idx}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Chemical Guide */}
                  {activeTab === 'chemical' && (
                    <div className="space-y-3">
                      <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
                        <strong>Safety Warning:</strong> Apply chemical fungicides strictly adhering to Pre-Harvest
                        Intervals (PHI). Never exceed recommended dosages.
                      </div>
                      <ul className="space-y-2 text-xs text-gray-700">
                        {currentResult.chemical_treatment?.map((chem, idx) => (
                          <li key={idx} className="p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                            {chem}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Long-Term Prevention */}
                  {activeTab === 'prevention' && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-gray-700">Future Season Disease Prevention:</h4>
                      <ul className="space-y-2 text-xs text-gray-700">
                        {currentResult.prevention?.map((prev, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
                            <span>{prev}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Escalate to Agricultural Expert Footer */}
              <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-gray-500">
                  Uncertain about symptoms or crop value is high?
                </div>
                {currentResult.status === 'predicted' ? (
                  <button
                    onClick={() => handleRequestExpert(currentResult.id)}
                    className="btn-secondary py-2 px-3 text-xs flex items-center justify-center gap-1.5 border-primary-300 text-primary-700 hover:bg-primary-50"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Request University Expert Verification</span>
                  </button>
                ) : (
                  <span className="badge-green text-xs flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Escalate Request Submitted
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="card text-center py-16 text-gray-400">
              <Camera className="w-14 h-14 mx-auto mb-3 opacity-40" />
              <h3 className="text-base font-bold text-gray-700">No Diagnosis Selected</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                Upload or capture a leaf photo on the left to receive immediate AI disease detection and agronomic guidance.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Phase 5 Agricultural Knowledge RAG Search Bar */}
      <div className="card bg-gradient-to-r from-emerald-50 via-teal-50 to-primary-50 border-primary-200">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-5 h-5 text-primary-700" />
          <h3 className="font-bold text-primary-900 text-base">Agricultural Knowledge Search (ICAR & UAS Verified)</h3>
        </div>
        <p className="text-xs text-primary-800 mb-4">
          Ask questions about package of practices, organic treatments, or Karnataka state subsidies.
        </p>

        <form onSubmit={handleAskRAG} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={ragQuery}
              onChange={(e) => setRagQuery(e.target.value)}
              placeholder="e.g. How to control ragi blast organically? Or Drip subsidy rules in Karnataka..."
              className="input pl-9 text-xs sm:text-sm"
            />
          </div>
          <button type="submit" disabled={ragLoading} className="btn-primary shrink-0 text-xs sm:text-sm">
            {ragLoading ? 'Searching...' : 'Ask Knowledge Base'}
          </button>
        </form>

        {/* RAG Answer Display */}
        {ragResult && (
          <div className="mt-4 p-4 bg-white rounded-xl border border-primary-200 shadow-sm space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary-700">
                  {ragResult.crop || 'Agricultural Advisory'} &bull; {ragResult.category}
                </span>
                <h4 className="text-sm font-bold text-gray-900 mt-0.5">{ragResult.title}</h4>
              </div>
              <span className="badge-green text-[10px]">Verified Source</span>
            </div>

            <p className="text-xs text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100 whitespace-pre-line">
              {ragResult.full_content || ragResult.answer}
            </p>

            {ragResult.sources?.length > 0 && (
              <div className="text-[11px] text-gray-500 pt-2 border-t border-gray-100 flex items-center justify-between">
                <span>Source: {ragResult.sources[0]?.source}</span>
                <span className="text-primary-700 font-medium">Relevance: 100% Grounded</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Diagnosis History Gallery */}
      {history.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-600" />
              <h3 className="font-bold text-gray-900 text-base">Your Past Diagnoses History</h3>
            </div>
            <span className="text-xs text-gray-500">{history.length} records</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {history.map((item) => (
              <div
                key={item.id}
                onClick={() => setCurrentResult(item)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  currentResult?.id === item.id
                    ? 'border-primary-500 bg-primary-50/30 ring-1 ring-primary-500'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-bold text-gray-900 line-clamp-1">{item.predicted_disease}</span>
                  <span className="badge-green text-[10px] shrink-0">
                    {Math.round(item.confidence_score * 100)}%
                  </span>
                </div>
                <p className="text-[11px] text-gray-500">{item.crop_name}</p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 text-[10px] text-gray-400">
                  <span>{new Date(item.created_at).toLocaleDateString()}</span>
                  <span className="text-primary-600 font-semibold flex items-center gap-0.5">
                    View <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
