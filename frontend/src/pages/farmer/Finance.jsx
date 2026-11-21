/**
 * AGRI SMART — Finance & Government Schemes  (Phase 9)
 * File: frontend/src/pages/farmer/Finance.jsx
 *
 * Complete farm financial management:
 * - Expense tracker with category breakdown
 * - Income recorder with crop sale details
 * - Profit / Loss dashboard
 * - Karnataka & Central Government scheme directory
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Wallet, TrendingUp, TrendingDown, Plus, Trash2, Loader2,
  RefreshCw, Info, ExternalLink, ChevronDown, AlertTriangle,
  PieChart, ShieldCheck, Calendar, Sprout, IndianRupee
} from 'lucide-react'
import api from '../../services/api'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const EXPENSE_CATEGORIES = ['Seed', 'Fertilizer', 'Pesticide', 'Labour', 'Machinery', 'Irrigation', 'Transport', 'Other']
const INCOME_SOURCES = ['Crop Sale', 'Government Subsidy', 'Other']
const SEASONS = ['Kharif 2026', 'Rabi 2026-27', 'Kharif 2025', 'Rabi 2025-26', 'Zaid 2026']
const SCHEME_CATEGORIES = ['All', 'Income Support', 'Crop Insurance', 'Credit & Loans', 'Farm Mechanization', 'Horticulture', 'Soil Health', 'Farm Infrastructure', 'Disaster Relief']

const CAT_COLORS = {
  Seed: '#4ade80', Fertilizer: '#60a5fa', Pesticide: '#f87171',
  Labour: '#fbbf24', Machinery: '#a78bfa', Irrigation: '#34d399',
  Transport: '#fb923c', Other: '#94a3b8',
}

function fmt(v) {
  return `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function SummaryCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className={`rounded-xl border p-4 ${color}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold opacity-75">{label}</span>
        <div className="w-8 h-8 rounded-lg bg-white/50 flex items-center justify-center">
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold">{fmt(value)}</p>
      {sub && <p className="text-xs opacity-70 mt-1">{sub}</p>}
    </div>
  )
}

function SchemeCard({ s }) {
  const [open, setOpen] = useState(false)
  const catColor = {
    'Income Support': 'bg-green-100 text-green-800',
    'Crop Insurance': 'bg-blue-100 text-blue-800',
    'Credit & Loans': 'bg-purple-100 text-purple-800',
    'Farm Mechanization': 'bg-amber-100 text-amber-800',
    'Horticulture': 'bg-pink-100 text-pink-800',
    'Soil Health': 'bg-teal-100 text-teal-800',
    'Farm Infrastructure': 'bg-orange-100 text-orange-800',
    'Disaster Relief': 'bg-red-100 text-red-800',
  }
  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-green-300 transition-all">
      <button className="w-full text-left p-4" onClick={() => setOpen(!open)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-bold text-gray-900 text-sm">{s.name}</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${catColor[s.category] || 'bg-gray-100 text-gray-700'}`}>
                {s.category}
              </span>
            </div>
            <p className="text-xs text-gray-600 font-medium">{s.full_name}</p>
            <p className="text-xs text-green-700 font-semibold mt-1 leading-relaxed">{s.benefit}</p>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 mt-1 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-2.5">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Who Can Apply</p>
            <p className="text-xs text-gray-700 leading-relaxed">{s.eligibility}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">How to Apply</p>
            <p className="text-xs text-gray-700 leading-relaxed">{s.how_to_apply}</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-800">{s.note}</p>
          </div>
          <div className="flex gap-2 pt-1">
            <a
              href={s.official_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-green-700 font-semibold hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Official Portal
            </a>
            <span className="text-gray-300">|</span>
            <span className="text-xs text-gray-500">{s.implementing_body}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Add Expense Form Modal
// ---------------------------------------------------------------------------
function AddExpenseModal({ onClose, onAdded }) {
  const [form, setForm] = useState({
    category: 'Seed', amount: '', description: '',
    expense_date: new Date().toISOString().split('T')[0], season: SEASONS[0],
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/finance/expenses', {
        ...form,
        amount: parseFloat(form.amount),
        expense_date: new Date(form.expense_date).toISOString(),
      })
      onAdded()
      onClose()
    } catch (err) {
      alert(err?.response?.data?.detail || 'Failed to save expense.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl p-5 w-full max-w-md shadow-2xl">
        <h3 className="font-bold text-gray-900 mb-4">Add Expense</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white outline-none">
                {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Amount (₹)</label>
              <input type="number" min="1" step="0.01" value={form.amount}
                onChange={e => setForm(f => ({...f, amount: e.target.value}))}
                required className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Date</label>
              <input type="date" value={form.expense_date}
                onChange={e => setForm(f => ({...f, expense_date: e.target.value}))}
                required className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Season</label>
              <select value={form.season} onChange={e => setForm(f => ({...f, season: e.target.value}))}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white outline-none">
                {SEASONS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Description (optional)</label>
            <input type="text" value={form.description}
              onChange={e => setForm(f => ({...f, description: e.target.value}))}
              maxLength={500} placeholder="e.g. Urea 50kg bags for paddy field"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none" />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-1.5">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Save Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Add Income Form Modal
// ---------------------------------------------------------------------------
function AddIncomeModal({ onClose, onAdded }) {
  const [form, setForm] = useState({
    source: 'Crop Sale', amount: '', commodity: '', quantity_quintal: '',
    selling_price_per_quintal: '', buyer_name: '', market_name: '',
    income_date: new Date().toISOString().split('T')[0], season: SEASONS[0], description: '',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/finance/income', {
        source: form.source,
        amount: parseFloat(form.amount),
        commodity: form.commodity || null,
        quantity_quintal: form.quantity_quintal ? parseFloat(form.quantity_quintal) : null,
        selling_price_per_quintal: form.selling_price_per_quintal ? parseFloat(form.selling_price_per_quintal) : null,
        buyer_name: form.buyer_name || null,
        market_name: form.market_name || null,
        income_date: new Date(form.income_date).toISOString(),
        season: form.season,
        description: form.description || null,
      })
      onAdded()
      onClose()
    } catch (err) {
      alert(err?.response?.data?.detail || 'Failed to save income.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl p-5 w-full max-w-md shadow-2xl my-4">
        <h3 className="font-bold text-gray-900 mb-4">Add Income Record</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Source</label>
              <select value={form.source} onChange={e => setForm(f => ({...f, source: e.target.value}))}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white outline-none">
                {INCOME_SOURCES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Total Amount (₹)</label>
              <input type="number" min="1" step="0.01" value={form.amount}
                onChange={e => setForm(f => ({...f, amount: e.target.value}))}
                required className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none" />
            </div>
          </div>
          {form.source === 'Crop Sale' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Crop Name</label>
                  <input type="text" value={form.commodity} onChange={e => setForm(f => ({...f, commodity: e.target.value}))}
                    placeholder="e.g. Ragi" className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Quantity (Quintals)</label>
                  <input type="number" step="0.1" value={form.quantity_quintal}
                    onChange={e => setForm(f => ({...f, quantity_quintal: e.target.value}))}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Price per Quintal (₹)</label>
                  <input type="number" step="0.01" value={form.selling_price_per_quintal}
                    onChange={e => setForm(f => ({...f, selling_price_per_quintal: e.target.value}))}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Market / Mandi</label>
                  <input type="text" value={form.market_name} onChange={e => setForm(f => ({...f, market_name: e.target.value}))}
                    placeholder="e.g. Mandya APMC" className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none" />
                </div>
              </div>
            </>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Date</label>
              <input type="date" value={form.income_date}
                onChange={e => setForm(f => ({...f, income_date: e.target.value}))}
                required className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Season</label>
              <select value={form.season} onChange={e => setForm(f => ({...f, season: e.target.value}))}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white outline-none">
                {SEASONS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-green-700 text-white rounded-xl text-sm font-semibold hover:bg-green-800 disabled:opacity-50 flex items-center justify-center gap-1.5">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Save Income
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Finance Page
// ---------------------------------------------------------------------------
export default function FinancePage() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [summary, setSummary]     = useState(null)
  const [expenses, setExpenses]   = useState([])
  const [incomes, setIncomes]     = useState([])
  const [schemes, setSchemes]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [season, setSeason]       = useState(SEASONS[0])
  const [schemeCategory, setSchemeCategory] = useState('All')
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [showAddIncome, setShowAddIncome]   = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [sumData, expData, incData] = await Promise.all([
        api.get('/finance/summary', { params: { season } }),
        api.get('/finance/expenses', { params: { season, limit: 100 } }),
        api.get('/finance/income', { params: { season, limit: 100 } }),
      ])
      setSummary(sumData)
      setExpenses(expData)
      setIncomes(incData)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [season])

  const loadSchemes = useCallback(async () => {
    try {
      const data = await api.get('/finance/schemes', {
        params: schemeCategory !== 'All' ? { category: schemeCategory } : {}
      })
      setSchemes(data.schemes || [])
    } catch {
      setSchemes([])
    }
  }, [schemeCategory])

  useEffect(() => { loadData() }, [loadData])
  useEffect(() => { if (activeTab === 'schemes') loadSchemes() }, [activeTab, loadSchemes])

  const deleteExpense = async (id) => {
    if (!confirm('Delete this expense record?')) return
    await api.delete(`/finance/expenses/${id}`)
    loadData()
  }

  const deleteIncome = async (id) => {
    if (!confirm('Delete this income record?')) return
    await api.delete(`/finance/income/${id}`)
    loadData()
  }

  const tabs = [
    { key: 'dashboard', label: '📊 P&L Dashboard' },
    { key: 'expenses',  label: '💸 Expenses' },
    { key: 'income',    label: '💰 Income' },
    { key: 'schemes',   label: '🏛️ Govt Schemes' },
  ]

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wallet className="w-6 h-6 text-green-700" />
            Farm Finance & Government Schemes
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Track expenses, record income, calculate profit and explore benefits</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={season} onChange={e => setSeason(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white outline-none">
            {SEASONS.map(s => <option key={s}>{s}</option>)}
          </select>
          <button onClick={loadData} className="p-2 border border-gray-200 rounded-xl hover:bg-gray-100 text-gray-500">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-1 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`pb-3 px-3 text-sm font-semibold whitespace-nowrap transition-all relative ${
              activeTab === t.key ? 'text-green-700 border-b-2 border-green-700' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-green-600" />
        </div>
      ) : (
        <>
          {/* ===== DASHBOARD ===== */}
          {activeTab === 'dashboard' && summary && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SummaryCard
                  icon={TrendingDown} label="Total Expenses"
                  value={summary.total_expenses}
                  color="bg-red-50 text-red-700 border-red-200"
                  sub={`${summary.total_expense_records} records`}
                />
                <SummaryCard
                  icon={TrendingUp} label="Total Income"
                  value={summary.total_income}
                  color="bg-green-50 text-green-700 border-green-200"
                  sub={`${summary.total_income_records} records`}
                />
                <SummaryCard
                  icon={summary.is_profitable ? TrendingUp : TrendingDown}
                  label="Net Profit / Loss"
                  value={Math.abs(summary.net_profit)}
                  color={summary.is_profitable ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-amber-50 text-amber-700 border-amber-300'}
                  sub={summary.is_profitable ? '✅ Profitable Season' : '⚠️ Loss — Review Costs'}
                />
              </div>

              {/* Expense Breakdown */}
              {Object.keys(summary.expense_by_category).length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-green-700" /> Expense Breakdown
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(summary.expense_by_category)
                      .sort((a, b) => b[1] - a[1])
                      .map(([cat, amt]) => {
                        const pct = summary.total_expenses > 0 ? (amt / summary.total_expenses) * 100 : 0
                        return (
                          <div key={cat} className="flex items-center gap-3">
                            <div className="w-20 text-xs font-semibold text-gray-700 shrink-0">{cat}</div>
                            <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: CAT_COLORS[cat] || '#94a3b8' }} />
                            </div>
                            <div className="w-28 text-right">
                              <span className="text-xs font-bold text-gray-800">{fmt(amt)}</span>
                              <span className="text-[10px] text-gray-400 ml-1">({pct.toFixed(0)}%)</span>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== EXPENSES ===== */}
          {activeTab === 'expenses' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={() => setShowAddExpense(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700">
                  <Plus className="w-4 h-4" /> Add Expense
                </button>
              </div>
              {expenses.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                  <Wallet className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500 text-sm">No expense records for {season}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {expenses.map(e => (
                    <div key={e.id} className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-3.5 hover:shadow-xs">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: (CAT_COLORS[e.category] || '#94a3b8') + '30' }}>
                        <IndianRupee className="w-4 h-4" style={{ color: CAT_COLORS[e.category] || '#94a3b8' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-900">{e.category}</span>
                          {e.season && <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{e.season}</span>}
                        </div>
                        {e.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{e.description}</p>}
                        <p className="text-[11px] text-gray-400">{new Date(e.expense_date).toLocaleDateString('en-IN')}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-red-600 text-sm">{fmt(e.amount)}</p>
                        <button onClick={() => deleteExpense(e.id)} className="text-gray-300 hover:text-red-500 mt-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== INCOME ===== */}
          {activeTab === 'income' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={() => setShowAddIncome(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-green-700 text-white rounded-xl text-sm font-semibold hover:bg-green-800">
                  <Plus className="w-4 h-4" /> Add Income
                </button>
              </div>
              {incomes.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                  <TrendingUp className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500 text-sm">No income records for {season}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {incomes.map(inc => (
                    <div key={inc.id} className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-3.5">
                      <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                        <Sprout className="w-4 h-4 text-green-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-gray-900">{inc.source}</span>
                          {inc.commodity && <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-semibold">{inc.commodity}</span>}
                        </div>
                        {inc.quantity_quintal && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {inc.quantity_quintal} Qtl @ ₹{inc.selling_price_per_quintal}/Qtl
                            {inc.market_name && ` · ${inc.market_name}`}
                          </p>
                        )}
                        <p className="text-[11px] text-gray-400">{new Date(inc.income_date).toLocaleDateString('en-IN')}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-green-600 text-sm">{fmt(inc.amount)}</p>
                        <button onClick={() => deleteIncome(inc.id)} className="text-gray-300 hover:text-red-500 mt-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== GOVERNMENT SCHEMES ===== */}
          {activeTab === 'schemes' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800">
                  <strong>Official Sources Only.</strong> All scheme information is from verified government portals.
                  AGRI SMART cannot confirm eligibility or approval. Always verify at the official link or with your District Agriculture Officer.
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {SCHEME_CATEGORIES.map(c => (
                  <button key={c} onClick={() => { setSchemeCategory(c); loadSchemes() }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${schemeCategory === c ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                    {c}
                  </button>
                ))}
              </div>
              <div className="space-y-3">
                {schemes.map(s => <SchemeCard key={s.id} s={s} />)}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showAddExpense && (
        <AddExpenseModal
          onClose={() => setShowAddExpense(false)}
          onAdded={loadData}
        />
      )}
      {showAddIncome && (
        <AddIncomeModal
          onClose={() => setShowAddIncome(false)}
          onAdded={loadData}
        />
      )}
    </div>
  )
}
