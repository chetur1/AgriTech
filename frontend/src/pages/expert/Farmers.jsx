/**
 * AGRI SMART — Expert Farmers View  (Phase 7)
 * File: frontend/src/pages/expert/Farmers.jsx
 */

import { useState, useEffect } from 'react'
import { Users, Loader2, MapPin, AlertTriangle, CheckCircle2 } from 'lucide-react'
import api from '../../services/api'

export default function ExpertFarmers() {
  const [farmers, setFarmers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    api.get('/experts/farmers')
      .then(d => setFarmers(d))
      .catch(e => setError(e?.response?.data?.detail || 'Failed to load.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <Users className="w-6 h-6 text-green-700" /> Farmers
      </h1>
      <p className="text-sm text-gray-500">Farmers who have submitted AI diagnoses for expert review.</p>

      {loading && <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-green-600" /></div>}
      {error   && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>}

      {!loading && farmers.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p className="text-gray-500 text-sm">No farmers have submitted diagnoses yet.</p>
        </div>
      )}

      {!loading && farmers.map(f => (
        <div key={f.farmer_id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-11 h-11 bg-green-100 rounded-full flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-green-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm">{f.farmer_name}</p>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              {f.district && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="w-3 h-3" /> {f.district}{f.state && `, ${f.state}`}
                </span>
              )}
              <span className="text-xs text-gray-400">Mobile: {f.mobile}</span>
            </div>
            {f.last_submission && (
              <p className="text-xs text-gray-400 mt-0.5">
                Last submission: {new Date(f.last_submission).toLocaleDateString('en-IN')}
              </p>
            )}
          </div>
          <div className="text-right shrink-0 space-y-1">
            <div className="flex items-center gap-1 justify-end">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-semibold text-amber-700">{f.pending_diagnoses} pending</span>
            </div>
            <div className="flex items-center gap-1 justify-end">
              <CheckCircle2 className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs text-gray-500">{f.total_diagnoses} total</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
