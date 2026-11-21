/**
 * AGRI SMART — Buyer Browse Produce
 * File: frontend/src/pages/buyer/Produce.jsx
 */

import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  Search, MapPin, Award, Leaf, ShoppingCart,
  Filter, Send, CheckCircle, Package
} from 'lucide-react'

export default function BuyerProduce() {
  const { token } = useAuth()
  const [produce, setProduce] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterCommodity, setFilterCommodity] = useState('')
  const [filterDistrict, setFilterDistrict] = useState('')
  const [showEnquiryModal, setShowEnquiryModal] = useState(null) // produce item
  const [enquiryForm, setEnquiryForm] = useState({ quantity: 10, price: 0, message: '', delivery: '' })
  const [enquirySent, setEnquirySent] = useState(false)

  useEffect(() => {
    const fetchProduce = async () => {
      try {
        let url = '/api/v1/buyer/produce?'
        if (filterCommodity) url += `commodity=${encodeURIComponent(filterCommodity)}&`
        if (filterDistrict) url += `district=${encodeURIComponent(filterDistrict)}&`
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
        if (res.ok) setProduce(await res.json())
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    fetchProduce()
  }, [token, filterCommodity, filterDistrict])

  const handleSendEnquiry = async () => {
    if (!showEnquiryModal) return
    try {
      const res = await fetch('/api/v1/buyer/enquiry', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          produce_id: showEnquiryModal.id,
          commodity: showEnquiryModal.commodity,
          quantity_quintal: enquiryForm.quantity,
          offered_price_per_quintal: enquiryForm.price || showEnquiryModal.expected_price_per_quintal,
          message: enquiryForm.message,
          delivery_location: enquiryForm.delivery,
        }),
      })
      if (res.ok) {
        setEnquirySent(true)
        setTimeout(() => { setShowEnquiryModal(null); setEnquirySent(false) }, 2000)
      }
    } catch (err) { console.error(err) }
  }

  return (
    <div className="page-container max-w-6xl mx-auto space-y-6">
      <div className="pb-2 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Package className="w-7 h-7 text-amber-600" />
          Available Farm Produce
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Browse verified farmer produce listings across Karnataka. Send purchase enquiries directly.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Filter by commodity..."
            value={filterCommodity}
            onChange={(e) => setFilterCommodity(e.target.value)}
            className="text-sm border-none outline-none bg-transparent w-40"
          />
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
          <MapPin className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Filter by district..."
            value={filterDistrict}
            onChange={(e) => setFilterDistrict(e.target.value)}
            className="text-sm border-none outline-none bg-transparent w-36"
          />
        </div>
      </div>

      {/* Produce Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {produce.map((item) => (
          <div key={item.id} className="card bg-white border border-gray-200 p-5 space-y-3 hover:shadow-md transition">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">{item.commodity}</h3>
                <p className="text-xs text-gray-500 mt-0.5">By {item.farmer_name}</p>
              </div>
              {item.is_organic && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <Leaf className="w-3 h-3" /> Organic
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-50 rounded p-2">
                <div className="text-gray-500">Available</div>
                <div className="font-bold text-gray-900">{item.quantity_quintal} Qtl</div>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <div className="text-gray-500">Expected Price</div>
                <div className="font-bold text-gray-900">₹{item.expected_price_per_quintal}/Qtl</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {item.district}, {item.state}</span>
              <span className="flex items-center gap-1"><Award className="w-3 h-3" /> {item.quality_grade}</span>
            </div>

            <button
              onClick={() => {
                setShowEnquiryModal(item)
                setEnquiryForm({ quantity: Math.min(10, item.quantity_quintal), price: item.expected_price_per_quintal, message: '', delivery: '' })
              }}
              className="w-full btn-primary text-xs py-2 flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              Send Purchase Enquiry
            </button>
          </div>
        ))}
      </div>

      {/* Enquiry Modal */}
      {showEnquiryModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            {enquirySent ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-gray-900">Enquiry Sent!</h3>
                <p className="text-sm text-gray-500 mt-1">The farmer will respond to your enquiry soon.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b pb-3">
                  <h2 className="text-base font-bold text-gray-900">Purchase Enquiry</h2>
                  <button onClick={() => setShowEnquiryModal(null)} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 text-xs">
                  <div className="font-bold text-gray-900">{showEnquiryModal.commodity}</div>
                  <div className="text-gray-600 mt-0.5">By {showEnquiryModal.farmer_name} — {showEnquiryModal.district}</div>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Quantity (Quintals)</label>
                      <input type="number" min="0.5" step="0.5" value={enquiryForm.quantity}
                        onChange={(e) => setEnquiryForm({ ...enquiryForm, quantity: parseFloat(e.target.value) || 1 })}
                        className="w-full border-gray-300 rounded p-2 text-xs" />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Your Offered Price (₹/Qtl)</label>
                      <input type="number" min="100" value={enquiryForm.price}
                        onChange={(e) => setEnquiryForm({ ...enquiryForm, price: parseFloat(e.target.value) || 0 })}
                        className="w-full border-gray-300 rounded p-2 text-xs" />
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Delivery Location</label>
                    <input type="text" placeholder="Your warehouse / market address"
                      value={enquiryForm.delivery}
                      onChange={(e) => setEnquiryForm({ ...enquiryForm, delivery: e.target.value })}
                      className="w-full border-gray-300 rounded p-2 text-xs" />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Message to Farmer (Optional)</label>
                    <textarea rows="2" placeholder="Any special requirements..." value={enquiryForm.message}
                      onChange={(e) => setEnquiryForm({ ...enquiryForm, message: e.target.value })}
                      className="w-full border-gray-300 rounded p-2 text-xs" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t">
                  <button onClick={() => setShowEnquiryModal(null)} className="px-4 py-2 border rounded text-xs font-semibold text-gray-600">Cancel</button>
                  <button onClick={handleSendEnquiry} className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5" /> Send Enquiry
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
