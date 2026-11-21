/**
 * AGRI SMART — Market & Mandi Intelligence  (Phase 8)
 * File: frontend/src/pages/farmer/Market.jsx
 *
 * Comprehensive market intelligence for farmers:
 * 1. Live Mandi Prices from AGMARKNET via data.gov.in (Core Principle 8: Never fabricate prices)
 * 2. MSP (Minimum Support Price) Safety-Net Benchmarks for Karnataka crops
 * 3. Interactive Transport Cost & Net Revenue Realization Calculator (Mandi Distance vs Profit)
 * 4. Planned Harvest Produce Listing / Buyer Connection inquiry recorder
 */

import { useState, useEffect, useCallback } from 'react'
import {
  TrendingUp, TrendingDown, Minus, RefreshCw, Loader2,
  AlertTriangle, Info, MapPin, ShoppingCart, Building2,
  Calendar, ChevronDown, Search, Calculator, ShieldCheck,
  Truck, ArrowRight, CheckCircle2, DollarSign
} from 'lucide-react'
import { marketAPI } from '../../services/api'

// ---------------------------------------------------------------------------
// Reference Data & MSP (Minimum Support Price 2024-25 in ₹/Quintal)
// ---------------------------------------------------------------------------
const DEFAULT_COMMODITIES = [
  'Ragi', 'Paddy', 'Tomato', 'Cotton', 'Maize',
  'Groundnut', 'Sugarcane', 'Onion', 'Potato',
  'Jowar', 'Wheat', 'Sunflower', 'Areca Nut', 'Coconut', 'Banana',
]

const KARNATAKA_DISTRICTS = [
  '', 'Bangalore Rural', 'Bangalore Urban', 'Mandya', 'Mysuru',
  'Tumakuru', 'Davangere', 'Haveri', 'Dharwad', 'Belagavi',
  'Vijayapura', 'Kalaburagi', 'Raichur', 'Chitradurga', 'Chikkamagaluru',
  'Hassan', 'Shivamogga', 'Uttara Kannada', 'Kodagu', 'Udupi',
  'Dakshina Kannada', 'Kolar', 'Chikkaballapur', 'Ramanagara',
  'Bidar', 'Koppal', 'Gadag', 'Bagalkot', 'Yadgir', 'Vijayanagara', 'Ballari',
]

// Government of India MSP Benchmarks (₹ per Quintal for 2024–25 season)
const MSP_BENCHMARKS = {
  Ragi: 4290,
  Paddy: 2300,
  Maize: 2225,
  Cotton: 7121,
  Groundnut: 6783,
  Jowar: 3371,
  Sunflower: 7280,
  Wheat: 2275,
}

// ---------------------------------------------------------------------------
// Price Card Component
// ---------------------------------------------------------------------------
function PriceCard({ record, msp }) {
  const modal = record.modal_price
  const max = record.max_price
  const min = record.min_price

  const trend = modal && max && min
    ? modal > (min + max) / 2 ? 'up' : modal < (min + max) / 2 ? 'down' : 'flat'
    : 'flat'

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-500' : 'text-gray-400'

  const fmt = (v) => v != null ? `₹${Number(v).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—'

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm hover:border-green-300 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-green-700 shrink-0" />
            <p className="font-semibold text-gray-900 text-sm leading-tight">{record.market || 'Unknown Market'}</p>
          </div>
          {record.district && (
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-gray-400" />
              <p className="text-xs text-gray-500">{record.district}, {record.state}</p>
            </div>
          )}
          {record.variety && record.variety !== record.commodity && (
            <p className="text-xs text-gray-400 mt-0.5">Variety: {record.variety}</p>
          )}
        </div>
        <TrendIcon className={`w-5 h-5 shrink-0 mt-0.5 ${trendColor}`} />
      </div>

      <div className="grid grid-cols-3 gap-2 mt-2">
        {[
          { label: 'Min', value: fmt(min), color: 'text-blue-700 bg-blue-50' },
          { label: 'Modal', value: fmt(modal), color: 'text-green-700 bg-green-50', large: true },
          { label: 'Max', value: fmt(max), color: 'text-purple-700 bg-purple-50' },
        ].map(({ label, value, color, large }) => (
          <div key={label} className={`rounded-lg p-2 text-center ${color}`}>
            <p className="text-xs font-medium opacity-70">{label}</p>
            <p className={`font-bold ${large ? 'text-base' : 'text-sm'}`}>{value}</p>
          </div>
        ))}
      </div>

      {msp && modal && (
        <div className="mt-2.5 flex items-center justify-between text-[11px] bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
          <span className="text-gray-500">vs MSP (₹{msp}):</span>
          <span className={`font-bold ${modal >= msp ? 'text-green-700' : 'text-amber-700'}`}>
            {modal >= msp ? `+₹${Math.round(modal - msp)} Above MSP` : `-₹${Math.round(msp - modal)} Below MSP`}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
        <span className="text-xs text-gray-400">{record.unit}</span>
        {record.arrival_date && (
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Calendar className="w-3 h-3" />
            {record.arrival_date}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Market Page
// ---------------------------------------------------------------------------
export default function Market() {
  const [commodity, setCommodity] = useState('Ragi')
  const [district, setDistrict] = useState('')
  const [commodities, setCommodities] = useState(DEFAULT_COMMODITIES)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [autoLoad, setAutoLoad] = useState(false)

  // Calculator State
  const [calcQuantity, setCalcQuantity] = useState(25) // quintals
  const [calcDistance, setCalcDistance] = useState(35) // km
  const [calcCostPerKm, setCalcCostPerKm] = useState(20) // ₹/km
  const [calcMandiPrice, setCalcMandiPrice] = useState(3800) // ₹/quintal

  // Produce Listing State
  const [listings, setListings] = useState([
    { id: 1, crop: 'Ragi', quantity: 40, harvestDate: '2026-12-10', targetPrice: 4200, status: 'Active' },
    { id: 2, crop: 'Paddy (Sona Masoori)', quantity: 80, harvestDate: '2026-12-25', targetPrice: 2450, status: 'Active' },
  ])
  const [showAddListing, setShowAddListing] = useState(false)
  const [newCrop, setNewCrop] = useState('Tomato')
  const [newQty, setNewQty] = useState(30)
  const [newTarget, setNewTarget] = useState(1800)

  // Load commodities from API
  useEffect(() => {
    marketAPI.getCommodities()
      .then(d => { if (d?.commodities?.length) setCommodities(d.commodities) })
      .catch(() => {})
  }, [])

  const fetchPrices = useCallback(async () => {
    setLoading(true)
    setResult(null)
    try {
      const data = await marketAPI.getPrices({
        commodity,
        state: 'Karnataka',
        district: district || undefined,
        limit: 30,
      })
      setResult(data)
      // Auto-set calculator price if modal price exists
      if (data?.records?.[0]?.modal_price) {
        setCalcMandiPrice(data.records[0].modal_price)
      } else if (MSP_BENCHMARKS[commodity]) {
        setCalcMandiPrice(MSP_BENCHMARKS[commodity])
      }
    } catch (err) {
      setResult({
        status: 'error',
        commodity,
        fetched_at: new Date().toISOString(),
        records: [],
        message: err?.response?.data?.detail || 'Network error. Please check your connection.',
      })
    } finally {
      setLoading(false)
    }
  }, [commodity, district])

  useEffect(() => {
    if (!autoLoad) {
      setAutoLoad(true)
      fetchPrices()
    }
  }, [autoLoad, fetchPrices])

  const handleAddListing = (e) => {
    e.preventDefault()
    setListings([
      ...listings,
      {
        id: Date.now(),
        crop: newCrop,
        quantity: Number(newQty),
        harvestDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
        targetPrice: Number(newTarget),
        status: 'Active',
      },
    ])
    setShowAddListing(false)
  }

  // Calculator Computations
  const grossRevenue = calcQuantity * calcMandiPrice
  const transportCost = calcDistance * calcCostPerKm * 2 // Round-trip transport
  const apmcHandling = grossRevenue * 0.015 // ~1.5% APMC cess & handling
  const netProfit = grossRevenue - transportCost - apmcHandling

  const mspValue = MSP_BENCHMARKS[commodity]

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-green-700" />
          Mandi Market & Selling Intelligence
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Live agricultural commodity prices from APMC mandis, transport profit calculator, and MSP benchmarks
        </p>
      </div>

      {/* MSP Announcement Banner */}
      {mspValue && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2 text-green-900">
            <ShieldCheck className="w-5 h-5 text-green-700 shrink-0" />
            <div>
              <span className="font-bold">Official Govt MSP (2024–25):</span> {commodity} safety floor is{' '}
              <span className="font-extrabold text-sm text-green-800">₹{mspValue.toLocaleString('en-IN')} / Quintal</span>
            </div>
          </div>
          <span className="text-green-700 font-medium">Verify you receive at or above MSP at official procurement centres.</span>
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-800 leading-relaxed">
          <strong>Data Source:</strong> AGMARKNET via data.gov.in (Government of India). Prices are
          sourced directly from registered APMC mandi sessions. Verify current prices at your local mandi before
          selling. AGRI SMART strictly adheres to verified official data and never creates artificial prices.
        </p>
      </div>

      {/* Search Controls */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Commodity <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={commodity}
                onChange={e => setCommodity(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-green-400 outline-none appearance-none pr-8"
              >
                {commodities.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              District (optional)
            </label>
            <div className="relative">
              <select
                value={district}
                onChange={e => setDistrict(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-green-400 outline-none appearance-none pr-8"
              >
                {KARNATAKA_DISTRICTS.map(d => (
                  <option key={d} value={d}>{d || 'All Karnataka Districts'}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <button
          onClick={fetchPrices}
          disabled={loading}
          className="w-full md:w-auto px-6 py-2.5 bg-green-700 text-white text-sm font-semibold rounded-xl hover:bg-green-800 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Fetching…</>
            : <><Search className="w-4 h-4" /> Get Live Mandi Prices</>
          }
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Fetching live APMC market data from AGMARKNET…</p>
        </div>
      )}

      {/* Result Section */}
      {!loading && result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${result.status === 'success' ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="text-xs text-gray-500">Source: <strong>AGMARKNET / data.gov.in</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">
                Fetched: {result.fetched_at ? new Date(result.fetched_at).toLocaleString('en-IN') : '—'}
              </span>
              <button onClick={fetchPrices} className="p-1 hover:bg-gray-100 rounded-lg" title="Refresh">
                <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>
          </div>

          {result.status !== 'success' && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
              <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">Live Mandi Data Currently Unavailable</h3>
              <p className="text-xs md:text-sm text-gray-600 leading-relaxed max-w-lg mx-auto">
                {result.message || 'The government AGMARKNET portal is currently refreshing or no auctions were reported today for this commodity.'}
              </p>
              <div className="mt-4 bg-white rounded-xl border border-amber-200 p-3 max-w-md mx-auto">
                <p className="text-xs text-gray-500">
                  <strong>Zero-Fabrication Policy:</strong> AGRI SMART never invents fake prices.
                  Please consult your local Taluk APMC office or check back during market trading hours (10:00 AM – 4:00 PM).
                </p>
              </div>
            </div>
          )}

          {result.status === 'success' && result.records.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {result.records.map((r, i) => (
                <PriceCard key={i} record={r} msp={mspValue} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* SECTION 2: Transport Cost & Net Realization Calculator */}
      {/* =================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-green-700" />
            <h2 className="font-bold text-gray-900 text-base">Transport & Net Selling Revenue Calculator</h2>
          </div>
          <span className="text-xs text-gray-400">Evaluate Mandi Profitability</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Quantity to Sell (Quintals)
            </label>
            <input
              type="number"
              min="1"
              value={calcQuantity}
              onChange={(e) => setCalcQuantity(Number(e.target.value) || 0)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Expected Price (₹ / Quintal)
            </label>
            <input
              type="number"
              min="1"
              value={calcMandiPrice}
              onChange={(e) => setCalcMandiPrice(Number(e.target.value) || 0)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              One-Way Distance to Mandi (km)
            </label>
            <input
              type="number"
              min="0"
              value={calcDistance}
              onChange={(e) => setCalcDistance(Number(e.target.value) || 0)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Transport Cost (₹ / km)
            </label>
            <input
              type="number"
              min="5"
              value={calcCostPerKm}
              onChange={(e) => setCalcCostPerKm(Number(e.target.value) || 0)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
        </div>

        {/* Calculation summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 text-center">
            <span className="text-[11px] text-gray-500 font-medium">Gross Produce Value</span>
            <p className="text-base font-bold text-gray-800 mt-0.5">₹{Math.round(grossRevenue).toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-red-50 rounded-xl p-3 border border-red-200 text-center">
            <span className="text-[11px] text-red-600 font-medium">Est. Transport Cost</span>
            <p className="text-base font-bold text-red-700 mt-0.5">₹{Math.round(transportCost).toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 text-center">
            <span className="text-[11px] text-amber-700 font-medium">Mandi Handling & Cess (1.5%)</span>
            <p className="text-base font-bold text-amber-800 mt-0.5">₹{Math.round(apmcHandling).toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-3 border border-green-300 text-center">
            <span className="text-[11px] text-green-700 font-bold">Net Realized In-Hand Income</span>
            <p className="text-lg font-extrabold text-green-800 mt-0.5">₹{Math.round(netProfit).toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* SECTION 3: Produce Selling Registry (Future Buyer Connections) */}
      {/* =================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900 text-base">Produce Selling Registry & Buyer Inquiry</h2>
            <p className="text-xs text-gray-500">Pre-list upcoming harvest produce to connect with verified APMC buyers</p>
          </div>
          <button
            onClick={() => setShowAddListing(!showAddListing)}
            className="px-3 py-1.5 bg-green-700 text-white rounded-xl text-xs font-semibold hover:bg-green-800 transition-all"
          >
            {showAddListing ? 'Close' : '+ List Harvest'}
          </button>
        </div>

        {showAddListing && (
          <form onSubmit={handleAddListing} className="bg-green-50/50 p-4 rounded-xl border border-green-200 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Crop</label>
                <input
                  type="text"
                  value={newCrop}
                  onChange={(e) => setNewCrop(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs bg-white outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Estimated Quantity (Quintals)</label>
                <input
                  type="number"
                  value={newQty}
                  onChange={(e) => setNewQty(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs bg-white outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Target Price (₹ / Quintal)</label>
                <input
                  type="number"
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs bg-white outline-none"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-green-700 text-white rounded-xl text-xs font-semibold hover:bg-green-800"
            >
              Save Produce Listing
            </button>
          </form>
        )}

        <div className="space-y-2">
          {listings.map((l) => (
            <div
              key={l.id}
              className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-xs flex-wrap gap-2"
            >
              <div>
                <p className="font-bold text-gray-800">{l.crop}</p>
                <p className="text-gray-500 text-[11px]">Est. Harvest: {l.harvestDate}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-semibold text-gray-700">{l.quantity} Quintals</span>
                <span className="font-bold text-green-700">₹{l.targetPrice.toLocaleString('en-IN')}/Qtl</span>
                <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium text-[10px]">
                  {l.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
