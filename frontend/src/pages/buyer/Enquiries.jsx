/**
 * AGRI SMART — Buyer Enquiries
 * File: frontend/src/pages/buyer/Enquiries.jsx
 */

import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { FileText, Clock, CheckCircle, XCircle } from 'lucide-react'

export default function BuyerEnquiries() {
  const { token } = useAuth()
  const [enquiries, setEnquiries] = useState([])

  useEffect(() => {
    const fetchEnquiries = async () => {
      try {
        const res = await fetch('/api/v1/buyer/enquiries', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) setEnquiries(await res.json())
      } catch (err) { console.error(err) }
    }
    fetchEnquiries()
  }, [token])

  const getStatusBadge = (st) => {
    switch (st) {
      case 'accepted': return <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Accepted</span>
      case 'rejected': return <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"><XCircle className="w-3 h-3" /> Declined</span>
      case 'completed': return <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-semibold">Completed</span>
      default: return <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>
    }
  }

  return (
    <div className="page-container max-w-5xl mx-auto space-y-6">
      <div className="pb-2 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-7 h-7 text-amber-600" />
          Purchase Enquiries
        </h1>
        <p className="text-sm text-gray-600 mt-1">Track all enquiries you have sent to farmers.</p>
      </div>

      {enquiries.length === 0 ? (
        <div className="card text-center py-16 bg-white border border-gray-200">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-700">No Enquiries Yet</h3>
          <p className="text-xs text-gray-500 mt-1">Browse produce listings and send your first purchase enquiry.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {enquiries.map((e) => (
            <div key={e.id} className="card bg-white border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-gray-900">{e.commodity}</h3>
                  {getStatusBadge(e.status)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {e.quantity_quintal} Qtl @ ₹{e.offered_price_per_quintal}/Qtl
                  {e.delivery_location && ` • Delivery: ${e.delivery_location}`}
                </p>
                {e.message && <p className="text-xs text-gray-400 mt-1 italic">"{e.message}"</p>}
              </div>
              <div className="text-right text-xs text-gray-400 shrink-0">
                <div className="font-semibold text-gray-700">₹{(e.quantity_quintal * e.offered_price_per_quintal).toLocaleString()}</div>
                <div>{new Date(e.created_at).toLocaleDateString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
