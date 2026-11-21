/**
 * AGRI SMART — Consumer Orders
 * File: frontend/src/pages/consumer/Orders.jsx
 */

import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Package, Clock, CheckCircle, Truck, ShoppingBag } from 'lucide-react'

export default function ConsumerOrders() {
  const { token } = useAuth()
  const [orders, setOrders] = useState([])

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/v1/consumer/orders', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) setOrders(await res.json())
      } catch (err) { console.error(err) }
    }
    fetchOrders()
  }, [token])

  const getStatusBadge = (st) => {
    switch (st) {
      case 'confirmed': return <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Confirmed</span>
      case 'dispatched': return <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"><Truck className="w-3 h-3" /> Dispatched</span>
      case 'delivered': return <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Delivered</span>
      case 'cancelled': return <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">Cancelled</span>
      default: return <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"><Clock className="w-3 h-3" /> Placed</span>
    }
  }

  return (
    <div className="page-container max-w-5xl mx-auto space-y-6">
      <div className="pb-2 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Package className="w-7 h-7 text-teal-600" />
          My Orders
        </h1>
        <p className="text-sm text-gray-600 mt-1">Track all your farm-fresh produce orders.</p>
      </div>

      {orders.length === 0 ? (
        <div className="card text-center py-16 bg-white border border-gray-200">
          <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-700">No Orders Yet</h3>
          <p className="text-xs text-gray-500 mt-1">Visit the Farm Fresh Marketplace to place your first order!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="card bg-white border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-gray-900">{o.commodity}</h3>
                  {getStatusBadge(o.status)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {o.quantity_kg} kg @ ₹{o.price_per_kg}/kg • Delivery: {o.delivery_address}
                </p>
                {o.notes && <p className="text-xs text-gray-400 mt-1 italic">"{o.notes}"</p>}
              </div>
              <div className="text-right text-xs text-gray-400 shrink-0">
                <div className="font-bold text-teal-700 text-base">₹{o.total_amount.toLocaleString()}</div>
                <div>{new Date(o.created_at).toLocaleDateString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
