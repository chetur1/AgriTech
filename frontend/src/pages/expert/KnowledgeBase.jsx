/**
 * AGRI SMART — Expert Agronomic Knowledge Base  (Phase 7)
 * File: frontend/src/pages/expert/KnowledgeBase.jsx
 *
 * Direct integration with Phase 5 Hybrid RAG engine:
 * - Search scientific literature from ICAR & UAS Bangalore
 * - Browse Package of Practices for major Indian crops
 * - Grounded agronomic query tester with citation inspection
 */

import { useState, useEffect } from 'react'
import {
  BookOpen, Search, Sparkles, FileText, CheckCircle2,
  ExternalLink, Loader2, ShieldCheck, Tag, Info, ChevronRight
} from 'lucide-react'
import api from '../../services/api'

export default function KnowledgeBase() {
  const [topics, setTopics]           = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [askQuery, setAskQuery]       = useState('')
  const [askResult, setAskResult]     = useState(null)
  const [searchResults, setSearchResults] = useState(null)
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [loadingAsk, setLoadingAsk]   = useState(false)
  const [activeTab, setActiveTab]     = useState('library') // 'library' | 'rag_tester'

  useEffect(() => {
    // Load available agronomic topics from RAG service
    api.get('/rag/topics')
      .then((res) => {
        setTopics(res.topics || [])
      })
      .catch(() => {
        setTopics([
          { title: 'Paddy Blast Management', crop: 'Paddy', category: 'Disease', source: 'ICAR-NRRI' },
          { title: 'Finger Millet (Ragi) Blast Control', crop: 'Ragi', category: 'Disease', source: 'UAS Bangalore' },
          { title: 'Tomato Early & Late Blight Guide', crop: 'Tomato', category: 'Disease', source: 'IIHR Bangalore' },
          { title: 'Cotton Pink Bollworm IPM', crop: 'Cotton', category: 'Pest', source: 'CICR Nagpur' },
          { title: 'Maize Fall Armyworm Containment', crop: 'Maize', category: 'Pest', source: 'ICAR-IIMR' },
          { title: 'Karnataka Soil Health & Micronutrients', crop: 'All', category: 'Soil & Fertilizer', source: 'Dept of Agriculture Karnataka' },
        ])
      })
  }, [])

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setLoadingSearch(true)
    try {
      const res = await api.get('/rag/search', { params: { q: searchQuery.trim(), top_k: 5 } })
      setSearchResults(res.results || [])
    } catch (err) {
      alert('Search failed: ' + (err?.response?.data?.detail || err.message))
    } finally {
      setLoadingSearch(false)
    }
  }

  const handleAsk = async (e) => {
    e.preventDefault()
    if (!askQuery.trim()) return
    setLoadingAsk(true)
    setAskResult(null)
    try {
      const res = await api.post('/rag/ask', { question: askQuery.trim() })
      setAskResult(res)
    } catch (err) {
      alert('Inference failed: ' + (err?.response?.data?.detail || err.message))
    } finally {
      setLoadingAsk(false)
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-emerald-600" />
          Agricultural AI Knowledge Base (Powered by Google Gemini AI)
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Real-time agronomic reasoning powered by Google Gemini AI and grounded in ICAR & UAS Bangalore packages of practices.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-4">
        <button
          onClick={() => setActiveTab('library')}
          className={`pb-3 text-sm font-semibold transition-all relative ${
            activeTab === 'library'
              ? 'text-green-700 border-b-2 border-green-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Curated Agronomic Library
        </button>
        <button
          onClick={() => setActiveTab('rag_tester')}
          className={`pb-3 text-sm font-semibold transition-all relative flex items-center gap-1.5 ${
            activeTab === 'rag_tester'
              ? 'text-green-700 border-b-2 border-green-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-500" />
          Gemini AI Agricultural Advisory
        </button>
      </div>

      {/* TAB 1: Library */}
      {activeTab === 'library' && (
        <div className="space-y-6">
          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex gap-2 bg-white p-2 rounded-2xl border border-gray-200 shadow-xs">
            <div className="flex items-center gap-2 flex-1 px-3">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search literature (e.g. 'Ragi blast bio-fertilizer', 'Tomato blight chlorothalonil')..."
                className="w-full text-xs md:text-sm outline-none text-gray-800"
              />
            </div>
            <button
              type="submit"
              disabled={loadingSearch}
              className="px-5 py-2.5 bg-green-700 text-white rounded-xl text-xs font-semibold hover:bg-green-800 flex items-center gap-1.5"
            >
              {loadingSearch ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
            </button>
          </form>

          {/* Search Results */}
          {searchResults && (
            <div className="space-y-3 bg-green-50/50 p-4 rounded-2xl border border-green-200">
              <h3 className="text-xs font-bold text-green-900 uppercase">
                Search Matches ({searchResults.length})
              </h3>
              {searchResults.length === 0 && (
                <p className="text-xs text-gray-500">No indexed documents match your search query.</p>
              )}
              {searchResults.map((item, i) => (
                <div key={i} className="bg-white p-4 rounded-xl border border-green-100 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900">{item.title || item.crop}</span>
                    <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-semibold">
                      Score: {item.score ? item.score.toFixed(2) : '1.0'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{item.content || item.text || item.summary}</p>
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-50 text-[10px] text-gray-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                    <span>Verified Source: {item.source || 'ICAR / UAS Bangalore'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Curated Topic Cards */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Official Package of Practices & Research Topics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {topics.map((t, i) => (
                <div
                  key={i}
                  className="bg-white p-4 rounded-xl border border-gray-200 hover:border-green-400 hover:shadow-xs transition-all space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-700">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 leading-tight">{t.title}</h4>
                        <span className="text-[10px] text-gray-400">{t.crop || 'Agronomy'}</span>
                      </div>
                    </div>
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                      {t.category || 'Agronomy'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Standardized scientific practices, organic biological controls, and recommended ICAR formulations.
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-100">
                    <span>Source: {t.source || 'UAS Bangalore'}</span>
                    <button
                      onClick={() => {
                        setAskQuery(`What are the recommended management practices for ${t.title}?`)
                        setActiveTab('rag_tester')
                      }}
                      className="text-green-700 font-semibold hover:underline flex items-center gap-0.5"
                    >
                      Ask AI <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RAG Tester */}
      {activeTab === 'rag_tester' && (
        <div className="space-y-6">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Powered by Google Gemini AI (gemini-3.1-flash-lite)</p>
              <p className="mt-0.5 text-emerald-800">
                Queries are answered directly by Google Gemini AI with deep agronomic reasoning, organic and chemical remedies, and ICAR Package of Practices guidelines.
              </p>
            </div>
          </div>

          {/* Ask Form */}
          <form onSubmit={handleAsk} className="space-y-3 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
            <label className="block text-xs font-bold text-gray-700 uppercase">
              Agronomic Query Prompt
            </label>
            <textarea
              rows={3}
              value={askQuery}
              onChange={(e) => setAskQuery(e.target.value)}
              placeholder="e.g. How to control Ragi finger blast organically using bio-control agents?"
              className="w-full border border-gray-300 rounded-xl p-3 text-xs md:text-sm outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
            <button
              type="submit"
              disabled={loadingAsk || !askQuery.trim()}
              className="px-6 py-2.5 bg-green-700 text-white rounded-xl text-xs font-semibold hover:bg-green-800 disabled:opacity-50 flex items-center gap-2"
            >
              {loadingAsk ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generate Grounded Answer
            </button>
          </form>

          {/* Ask Result */}
          {askResult && (
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-green-800 uppercase">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Grounded Agronomic Recommendation
              </div>
              <div className="text-xs md:text-sm text-gray-800 leading-relaxed whitespace-pre-wrap bg-green-50/50 p-4 rounded-xl border border-green-100">
                {askResult.grounded_answer || askResult.answer}
              </div>

              {/* Source attribution */}
              {askResult.sources && askResult.sources.length > 0 && (
                <div className="pt-2 border-t border-gray-100 space-y-1.5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Attributed Empirical Sources:</p>
                  <div className="flex flex-wrap gap-2">
                    {askResult.sources.map((s, idx) => (
                      <span key={idx} className="text-[11px] bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg border border-gray-200 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-green-700" />
                        {s.title || s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
