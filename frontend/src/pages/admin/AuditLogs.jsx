/**
 * AGRI SMART — Audit & Security Logs
 * File: frontend/src/pages/admin/AuditLogs.jsx
 */

import { useState, useEffect } from 'react'
import {
  Activity,
  Search,
  Filter,
  Shield,
  Clock,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Download,
  Terminal,
  Database
} from 'lucide-react'
import { adminAPI } from '../../services/api'

export default function AuditLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionFilter, setActionFilter] = useState('all')
  const [search, setSearch] = useState('')

  const fetchLogs = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (actionFilter !== 'all') params.action = actionFilter
      if (search.trim()) params.search = search.trim()

      const data = await adminAPI.getAuditLogs(params)
      setLogs(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [actionFilter])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    fetchLogs()
  }

  const exportCSV = () => {
    if (!logs.length) return
    const headers = ['ID', 'Action', 'Resource Type', 'Resource ID', 'Details', 'IP Address', 'Timestamp']
    const rows = logs.map(l => [
      l.id,
      l.action,
      l.resource_type || '',
      l.resource_id || '',
      `"${(l.details || '').replace(/"/g, '""')}"`,
      l.ip_address || '',
      l.created_at,
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `agrismart_audit_logs_${new Date().toISOString().slice(0,10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getActionBadge = (action) => {
    if (action.includes('FAIL') || action.includes('REJECT') || action.includes('SUSPEND')) {
      return 'bg-rose-100 text-rose-800 border-rose-200'
    }
    if (action.includes('SUCCESS') || action.includes('APPROV') || action.includes('REGISTER')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    }
    if (action.includes('VERIF') || action.includes('CHANGE')) {
      return 'bg-amber-100 text-amber-800 border-amber-200'
    }
    return 'bg-slate-100 text-slate-700 border-slate-200'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Security & Audit Logs</h1>
          <p className="text-sm text-slate-500 mt-1">
            Immutable telemetry tracking logins, verifications, administrative status changes, and data modifications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            disabled={!logs.length}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-sm font-semibold rounded-xl transition"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={fetchLogs}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl shadow-sm transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by action keyword, details, or IP address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </form>

        <div className="flex gap-2">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Actions</option>
            <option value="USER_REGISTER">User Registrations</option>
            <option value="LOGIN_SUCCESS">Successful Logins</option>
            <option value="LOGIN_FAILED">Failed Logins</option>
            <option value="EXPERT_VERIFICATION">Expert Verifications</option>
            <option value="USER_STATUS_CHANGE">User Status Updates</option>
          </select>

          <button
            onClick={fetchLogs}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl shadow-sm transition"
          >
            Filter
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              {logs.length} Audit Events Logged in Supabase
            </span>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-sm text-slate-500 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-primary-600" />
            <span>Fetching audit logs from Supabase cloud database...</span>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-sm text-rose-600">{error}</div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center text-sm text-slate-400">
            No audit records matched your search filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-4 py-3.5">Action</th>
                  <th className="px-6 py-3.5">Event Details</th>
                  <th className="px-4 py-3.5">Resource</th>
                  <th className="px-4 py-3.5">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Timestamp */}
                    <td className="px-6 py-3.5 whitespace-nowrap text-slate-500">
                      <div className="flex items-center gap-1.5 font-sans">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(log.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>

                    {/* Details */}
                    <td className="px-6 py-3.5 font-sans text-slate-800 max-w-md break-words">
                      {log.details || '—'}
                    </td>

                    {/* Resource */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-500">
                      {log.resource_type ? (
                        <span>
                          {log.resource_type}
                          {log.resource_id && (
                            <span className="text-[10px] text-slate-400 ml-1">
                              ({log.resource_id.slice(0, 8)}...)
                            </span>
                          )}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    {/* IP */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-400">
                      {log.ip_address || '127.0.0.1'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
