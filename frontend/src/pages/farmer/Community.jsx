/**
 * AGRI SMART — Community Forum  (Phase 10)
 * File: frontend/src/pages/farmer/Community.jsx
 *
 * Peer-to-peer farmer knowledge sharing + expert Q&A.
 * - Browse, search, and post agricultural questions
 * - Reply to posts; expert replies show verification badge
 * - Report harmful or incorrect advice
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Users, Search, Plus, MessageSquare, ThumbsUp,
  ShieldCheck, Flag, Loader2, RefreshCw, ChevronRight,
  ArrowLeft, Send, AlertTriangle, Tag
} from 'lucide-react'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'

const CATEGORIES = ['All', 'Disease Help', 'Pest Control', 'Soil & Fertilizer', 'Market Prices', 'Weather', 'Government Schemes', 'General']

function CategoryBadge({ category }) {
  const colors = {
    'Disease Help': 'bg-red-100 text-red-700',
    'Pest Control': 'bg-amber-100 text-amber-700',
    'Soil & Fertilizer': 'bg-teal-100 text-teal-800',
    'Market Prices': 'bg-blue-100 text-blue-800',
    'Weather': 'bg-sky-100 text-sky-800',
    'Government Schemes': 'bg-purple-100 text-purple-800',
    'General': 'bg-gray-100 text-gray-700',
  }
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${colors[category] || colors.General}`}>
      {category}
    </span>
  )
}

function RoleBadge({ role, is_expert_verified }) {
  if (is_expert_verified || role === 'expert') {
    return (
      <span className="flex items-center gap-0.5 text-[10px] bg-green-100 text-green-800 font-bold px-1.5 py-0.5 rounded-full border border-green-200">
        <ShieldCheck className="w-3 h-3" /> Expert Verified
      </span>
    )
  }
  if (role === 'admin') {
    return <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded-full">Admin</span>
  }
  return <span className="text-[10px] text-gray-400 font-medium">Farmer</span>
}

// ---------------------------------------------------------------------------
// New Post Modal
// ---------------------------------------------------------------------------
function NewPostModal({ onClose, onPosted }) {
  const [form, setForm] = useState({ title: '', body: '', category: 'General', tags: '' })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/community/', {
        title: form.title.trim(),
        body: form.body.trim(),
        category: form.category,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      })
      onPosted()
      onClose()
    } catch (err) {
      alert(err?.response?.data?.detail || 'Failed to post.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl p-5 w-full max-w-lg shadow-2xl">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-green-700" /> Share Knowledge or Ask a Question
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Title / Question <span className="text-red-500">*</span></label>
            <input type="text" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))}
              required minLength={5} maxLength={200}
              placeholder="e.g. How to control Ragi blast without expensive chemicals?"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Details <span className="text-red-500">*</span></label>
            <textarea rows={4} value={form.body} onChange={e => setForm(f => ({...f, body: e.target.value}))}
              required minLength={10} maxLength={5000}
              placeholder="Describe your problem, field conditions, crops grown, what you have already tried..."
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-400 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white outline-none">
                {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Tags (comma-separated)</label>
              <input type="text" value={form.tags} onChange={e => setForm(f => ({...f, tags: e.target.value}))}
                placeholder="ragi, blast, karnataka"
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-green-700 text-white rounded-xl text-sm font-semibold hover:bg-green-800 disabled:opacity-50 flex items-center justify-center gap-1.5">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Post
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Post Detail View
// ---------------------------------------------------------------------------
function PostDetail({ postId, onBack }) {
  const { user } = useAuth()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [reported, setReported] = useState(false)

  const loadPost = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get(`/community/${postId}`)
      setPost(data)
    } catch { setPost(null) }
    finally { setLoading(false) }
  }, [postId])

  useEffect(() => { loadPost() }, [loadPost])

  const handleReply = async (e) => {
    e.preventDefault()
    if (!replyText.trim() || submitting) return
    setSubmitting(true)
    try {
      await api.post(`/community/${postId}/replies`, { body: replyText.trim() })
      setReplyText('')
      loadPost()
    } catch (err) {
      alert(err?.response?.data?.detail || 'Failed to post reply.')
    } finally { setSubmitting(false) }
  }

  const handleReport = async () => {
    if (!confirm('Report this post as containing incorrect or harmful agricultural advice?')) return
    try {
      await api.post(`/community/${postId}/report`)
      setReported(true)
    } catch {}
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-green-600" /></div>
  if (!post) return <div className="text-center py-12 text-red-500">Post not found.</div>

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-green-700">
        <ArrowLeft className="w-4 h-4" /> Back to Community
      </button>

      {/* Post Body */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <CategoryBadge category={post.category} />
              {post.is_reported && (
                <span className="text-[10px] bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full border border-red-200">⚠️ Reported</span>
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900 leading-tight">{post.title}</h2>
          </div>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">{post.body}</p>
        {post.tags?.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Tag className="w-3.5 h-3.5 text-gray-400" />
            {post.tags.map(t => (
              <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t}</span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="font-semibold text-gray-700">{post.author_name}</span>
            <RoleBadge role={post.author_role} is_expert_verified={post.is_expert_verified} />
            {post.author_district && <span className="text-gray-400">· {post.author_district}</span>}
            <span className="text-gray-400">· {new Date(post.created_at).toLocaleDateString('en-IN')}</span>
          </div>
          {!reported && !post.is_reported && (
            <button onClick={handleReport} className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500">
              <Flag className="w-3.5 h-3.5" /> Report
            </button>
          )}
          {(reported || post.is_reported) && <span className="text-xs text-red-500 font-medium">Reported</span>}
        </div>
      </div>

      {/* Replies */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-700">{post.replies?.length || 0} Replies</h3>
        {post.replies?.map(reply => (
          <div key={reply.id} className={`p-4 rounded-xl border ${reply.is_expert_verified ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xs font-bold text-gray-900">{reply.author_name}</span>
              <RoleBadge role={reply.author_role} is_expert_verified={reply.is_expert_verified} />
              <span className="text-[11px] text-gray-400">{new Date(reply.created_at).toLocaleDateString('en-IN')}</span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{reply.body}</p>
          </div>
        ))}
      </div>

      {/* Add Reply */}
      {user && (
        <form onSubmit={handleReply} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <label className="block text-xs font-semibold text-gray-600">Share your experience or advice</label>
          <textarea rows={3} value={replyText} onChange={e => setReplyText(e.target.value)}
            placeholder="Provide helpful, accurate agricultural advice based on your experience..."
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-400 resize-none" />
          <div className="flex justify-end">
            <button type="submit" disabled={submitting || !replyText.trim()}
              className="px-5 py-2 bg-green-700 text-white rounded-xl text-sm font-semibold hover:bg-green-800 disabled:opacity-50 flex items-center gap-1.5">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Post Reply
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Community Page
// ---------------------------------------------------------------------------
export default function CommunityPage() {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [selectedPostId, setSelectedPostId] = useState(null)
  const [showNewPost, setShowNewPost] = useState(false)

  const loadPosts = useCallback(async () => {
    setLoading(true)
    try {
      const params = { limit: 50 }
      if (search.trim()) params.search = search.trim()
      if (category !== 'All') params.category = category
      const data = await api.get('/community/', { params })
      setPosts(data)
    } catch { setPosts([]) }
    finally { setLoading(false) }
  }, [search, category])

  useEffect(() => { loadPosts() }, [loadPosts])

  if (selectedPostId) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto">
        <PostDetail postId={selectedPostId} onBack={() => { setSelectedPostId(null); loadPosts() }} />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-green-700" /> Farmer Community & Expert Q&A
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Share knowledge, ask questions, and learn from experienced farmers and agricultural experts</p>
        </div>
        {user && (
          <button onClick={() => setShowNewPost(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-green-700 text-white rounded-xl text-sm font-semibold hover:bg-green-800 shrink-0">
            <Plus className="w-4 h-4" /> Post
          </button>
        )}
      </div>

      {/* Guidelines Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800">
          <strong>Community Guidelines:</strong> Share verified agricultural knowledge. Do not post incorrect pesticide dosages or unverified chemical recommendations. Use the Report button for harmful advice. Expert-verified replies are marked with a green badge.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 flex-1 min-w-48">
          <Search className="w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search discussions..."
            className="w-full text-sm outline-none bg-transparent" />
        </div>
        <button onClick={loadPosts} className="p-2 border border-gray-200 rounded-xl hover:bg-gray-100 text-gray-500">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${category === c ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            {c}
          </button>
        ))}
      </div>

      {/* Posts List */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-green-600" /></div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <MessageSquare className="w-10 h-10 mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500 text-sm">No discussions yet. Be the first to share your knowledge!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <div key={post.id} onClick={() => setSelectedPostId(post.id)}
              className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:border-green-300 hover:shadow-sm transition-all">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <CategoryBadge category={post.category} />
                    {post.is_reported && <span className="text-[10px] text-red-500 font-medium">⚠️ Reported</span>}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1">{post.title}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2">{post.body}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <span className="font-medium">{post.author_name}</span>
                      <RoleBadge role={post.author_role} is_expert_verified={post.is_expert_verified} />
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {post.reply_count} replies
                    </div>
                    <span className="text-xs text-gray-400">{new Date(post.created_at).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 mt-1" />
              </div>
            </div>
          ))}
        </div>
      )}

      {showNewPost && (
        <NewPostModal onClose={() => setShowNewPost(false)} onPosted={loadPosts} />
      )}
    </div>
  )
}
