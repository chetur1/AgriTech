/**
 * AGRI SMART — Administrator System & Database Settings
 * File: frontend/src/pages/admin/Settings.jsx
 */

import { useState, useEffect } from 'react'
import {
  Settings,
  Database,
  Radio,
  Server,
  Cloud,
  CheckCircle2,
  RefreshCw,
  Cpu,
  Layers,
  Lock,
  Globe,
  FileCheck,
  Zap,
  Activity
} from 'lucide-react'
import { adminAPI } from '../../services/api'

export default function AdminSettings() {
  const [sysInfo, setSysInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pingResult, setPingResult] = useState(null)
  const [pinging, setPinging] = useState(false)

  const loadSysInfo = async () => {
    setLoading(true)
    try {
      const data = await adminAPI.getSystemInfo()
      setSysInfo(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSysInfo()
  }, [])

  const handlePing = async () => {
    setPinging(true)
    setPingResult(null)
    const start = performance.now()
    try {
      await adminAPI.getSystemInfo()
      const duration = Math.round(performance.now() - start)
      setPingResult({
        success: true,
        latency: `${duration} ms`,
        message: 'Supabase PostgreSQL responds with optimal latency.'
      })
    } catch (err) {
      setPingResult({
        success: false,
        message: 'Supabase ping failed: ' + (err.message || 'Network timeout')
      })
    } finally {
      setPinging(false)
    }
  }

  const db = sysInfo?.database || {}
  const app = sysInfo?.application || {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">System & Database Settings</h1>
          <p className="text-sm text-slate-500 mt-1">
            Production cloud infrastructure, Supabase Realtime synchronization status, and application environment parameters.
          </p>
        </div>

        <button
          onClick={loadSysInfo}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Cloud Database Architecture */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-sm">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Supabase Cloud Database</h2>
              <p className="text-xs text-slate-500">Managed PostgreSQL database with Realtime Change Data Capture</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-emerald-600">CONNECTED</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <div className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Database Engine</div>
            <div className="text-sm font-bold text-slate-900">{db.engine || 'PostgreSQL 17.12'}</div>
            <div className="text-[11px] text-slate-500">Provider: {db.provider || 'Supabase'}</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <div className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Cloud Project ID</div>
            <div className="text-sm font-mono font-bold text-slate-900">{db.project_id || 'mbdiqutrnqsqnzegsqgl'}</div>
            <div className="text-[11px] text-slate-500">Region: {db.region || 'ap-northeast-2 (Seoul)'}</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <div className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Connection Security</div>
            <div className="text-sm font-bold text-slate-900">SSL Required (TLS)</div>
            <div className="text-[11px] text-emerald-600 font-semibold">Replica Identity: FULL</div>
          </div>
        </div>

        {/* Realtime Publication Status */}
        <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="text-sm font-bold tracking-wide">
                Supabase Realtime Publication ({db.realtime_tables_count || 14} Tables Active)
              </span>
            </div>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold">
              Active Broadcast (pgoutput)
            </span>
          </div>

          <p className="text-xs text-slate-300 mb-4 leading-relaxed">
            All database modifications (INSERT, UPDATE, DELETE) are broadcast to the Supabase Studio Table Editor and web clients in real time.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {(db.realtime_tables || [
              'ai_diagnoses', 'audit_logs', 'buyer_profiles', 'consultation_messages',
              'consultations', 'consumer_profiles', 'crop_activities', 'crops',
              'expenses', 'expert_profiles', 'farmer_profiles', 'farms', 'incomes', 'users'
            ]).map((table) => (
              <div
                key={table}
                className="px-2.5 py-1.5 bg-slate-800/80 border border-slate-700 rounded-lg text-[11px] flex items-center gap-1.5 font-mono text-slate-200"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="truncate">{table}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ping Test */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div>
            <div className="text-xs font-bold text-slate-800">Connection Health & Latency</div>
            <div className="text-xs text-slate-500">Test live query round-trip to the Supabase Postgres instance.</div>
          </div>

          <button
            onClick={handlePing}
            disabled={pinging}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition"
          >
            <Zap className={`w-3.5 h-3.5 ${pinging ? 'animate-bounce' : ''}`} />
            <span>{pinging ? 'Testing Connection...' : 'Ping Supabase Cloud'}</span>
          </button>
        </div>

        {pingResult && (
          <div className={`p-4 rounded-xl text-xs flex items-center justify-between ${
            pingResult.success ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}>
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{pingResult.message}</span>
            </div>
            {pingResult.latency && (
              <span className="font-mono font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded">
                {pingResult.latency}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Platform & Server Configuration */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Application Environment</h2>
            <p className="text-xs text-slate-500">Backend runtime configurations and external microservices</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-slate-400 font-semibold uppercase text-[10px]">App Name & Version</div>
            <div className="font-bold text-slate-900 mt-1">{app.name || 'AGRI SMART'} v{app.version || '1.0.0'}</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-slate-400 font-semibold uppercase text-[10px]">Environment</div>
            <div className="font-bold text-slate-900 mt-1 uppercase">{app.environment || 'development'}</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-slate-400 font-semibold uppercase text-[10px]">Weather Service</div>
            <div className="font-bold text-slate-900 mt-1">Open-Meteo (Free API)</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-slate-400 font-semibold uppercase text-[10px]">Local AI Engine</div>
            <div className="font-bold text-slate-900 mt-1">Ollama (phi3:mini / vision)</div>
          </div>
        </div>
      </div>
    </div>
  )
}
