/**
 * AGRI SMART — Consumer Marketplace (Farm Fresh Produce)
 * File: frontend/src/pages/consumer/Marketplace.jsx
 */

import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  Store, Leaf, MapPin, Clock, ShoppingBag,
  Search, Filter, CheckCircle
} from 'lucide-react'

export default function ConsumerMarketplace() {
  const { token } = useAuth()
  const [produce, setProduce] = useState([])
  const [filterText, setFilterText] = useState('')
  const [organicOnly, setOrganicOnly] = useState(false)
  const [showOrderModal, setShowOrderModal] = useState(null)
  const [orderForm, setOrderForm] = useState({ quantity: 5, address: '', notes: '' })
  const [orderPlaced, setOrderPlaced] = useState(false)

  useEffect(() => {
    const fetchProduce = async () => {
      try {
        let url = '/api/v1/consumer/marketplace?'
        if (filterText) url += `commodity=${encodeURIComponent(filterText)}&`
        if (organicOnly) url += `organic_only=true&`
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
        if (res.ok) setProduce(await res.json())
      } catch (err) { console.error(err) }
    }
    fetchProduce()
  }, [token, filterText, organicOnly])

  const handlePlaceOrder = async () => {
    if (!showOrderModal) return
    try {
      const res = await fetch('/api/v1/consumer/orders', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          produce_id: showOrderModal.id,
          commodity: showOrderModal.commodity,
          quantity_kg: orderForm.quantity,
          delivery_address: orderForm.address,
          notes: orderForm.notes,
        }),
      })
      if (res.ok) {
        setOrderPlaced(true)
        setTimeout(() => { setShowOrderModal(null); setOrderPlaced(false) }, 2500)
      }
    } catch (err) { console.error(err) }
  }

  return (
    <div className="page-container max-w-6xl mx-auto space-y-6">
      <div className="pb-2 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Store className="w-7 h-7 text-teal-600" />
          Farm Fresh Marketplace
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Buy directly from verified Karnataka farmers — fresh, traceable, and fair-priced.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search produce..." value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="text-sm border-none outline-none bg-transparent w-44" />
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer bg-white border border-gray-200 rounded-lg px-3 py-2">
          <input type="checkbox" checked={organicOnly} onChange={(e) => setOrganicOnly(e.target.checked)}
            className="text-teal-600 rounded focus:ring-teal-500" />
          <Leaf className="w-4 h-4 text-emerald-600" />
          Organic Only
        </label>
      </div>

      {/* Produce Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {produce.map((item) => (
          <div key={item.id} className="card bg-white border border-gray-200 p-5 space-y-3 hover:shadow-md transition">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">{item.commodity}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{item.farm_name} — {item.farmer_name}</p>
              </div>
              {item.is_organic && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <Leaf className="w-3 h-3" /> Organic
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-50 rounded p-2">
                <div className="text-gray-500">Price</div>
                <div className="font-bold text-teal-700 text-base">₹{item.price_per_kg}/kg</div>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <div className="text-gray-500">Available</div>
                <div className="font-bold text-gray-900">{item.available_kg} kg</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {item.district}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {item.freshness}</span>
            </div>

            <button
              onClick={() => {
                setShowOrderModal(item)
                setOrderForm({ quantity: 5, address: '', notes: '' })
              }}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white text-xs py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
            >
              <ShoppingBag className="w-3.5 h-3.5" /> Order Now
            </button>
          </div>
        ))}
      </div>

      {/* Order Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            {orderPlaced ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-gray-900">Order Placed!</h3>
                <p className="text-sm text-gray-500 mt-1">Your farm-fresh produce is being prepared.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b pb-3">
                  <h2 className="text-base font-bold text-gray-900">Place Order</h2>
                  <button onClick={() => setShowOrderModal(null)} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
                </div>
                <div className="bg-teal-50 rounded-lg p-3 text-xs">
                  <div className="font-bold text-gray-900">{showOrderModal.commodity}</div>
                  <div className="text-gray-600 mt-0.5">{showOrderModal.farm_name} — ₹{showOrderModal.price_per_kg}/kg</div>
                </div>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Quantity (kg)</label>
                    <input type="number" min="0.5" step="0.5" max={showOrderModal.available_kg}
                      value={orderForm.quantity}
                      onChange={(e) => setOrderForm({ ...orderForm, quantity: parseFloat(e.target.value) || 1 })}
                      className="w-full border-gray-300 rounded p-2 text-xs" />
                    <div className="text-xs text-teal-700 font-semibold mt-1">
                      Total: ₹{(orderForm.quantity * showOrderModal.price_per_kg).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Delivery Address *</label>
                    <textarea rows="2" placeholder="Your full delivery address"
                      value={orderForm.address}
                      onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })}
                      className="w-full border-gray-300 rounded p-2 text-xs" />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Notes (Optional)</label>
                    <input type="text" placeholder="Any special instructions..."
                      value={orderForm.notes}
                      onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                      className="w-full border-gray-300 rounded p-2 text-xs" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t">
                  <button onClick={() => setShowOrderModal(null)} className="px-4 py-2 border rounded text-xs font-semibold text-gray-600">Cancel</button>
                  <button onClick={handlePlaceOrder} disabled={!orderForm.address}
                    className="bg-teal-600 hover:bg-teal-700 text-white text-xs px-4 py-2 rounded-lg font-semibold flex items-center gap-1.5 disabled:opacity-50 transition">
                    <ShoppingBag className="w-3.5 h-3.5" /> Confirm Order
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
