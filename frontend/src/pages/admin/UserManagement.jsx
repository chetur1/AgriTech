/**
 * AGRI SMART — User Management
 * File: frontend/src/pages/admin/UserManagement.jsx
 */

import { useState, useEffect } from 'react'
import {
  Users,
  Search,
  Filter,
  UserCheck,
  UserX,
  Eye,
  Shield,
  Sprout,
  ShoppingBag,
  HeartHandshake,
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Phone,
  Mail
} from 'lucide-react'
import { adminAPI } from '../../services/api'

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (roleFilter !== 'all') params.role = roleFilter
      if (statusFilter !== 'all') params.status_filter = statusFilter
      if (search.trim()) params.search = search.trim()

      const data = await adminAPI.getUsers(params)
      setUsers(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [roleFilter, statusFilter])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    fetchUsers()
  }

  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === 'active' ? 'suspended' : 'active'
    const confirmMsg = `Are you sure you want to ${nextStatus === 'suspended' ? 'SUSPEND' : 'ACTIVATE'} user ${user.full_name}?`
    if (!window.confirm(confirmMsg)) return

    setActionLoading(true)
    try {
      await adminAPI.updateUserStatus(user.id, {
        status: nextStatus,
        reason: `Admin requested status change to ${nextStatus}`,
      })
      await fetchUsers()
      if (selectedUser?.id === user.id) {
        setSelectedUser((prev) => prev ? { ...prev, status: nextStatus, is_active: nextStatus === 'active' } : null)
      }
    } catch (err) {
      alert(err.response?.data?.detail || err.message || 'Failed to update user status')
    } finally {
      setActionLoading(false)
    }
  }

  const roleTabs = [
    { id: 'all', label: 'All Roles' },
    { id: 'farmer', label: 'Farmers' },
    { id: 'expert', label: 'Experts' },
    { id: 'broker', label: 'Brokers & Traders' },
    { id: 'consumer', label: 'Consumers' },
    { id: 'admin', label: 'Admins' },
  ]

  const getRoleIcon = (role) => {
    switch (role) {
      case 'farmer': return <Sprout className="w-3.5 h-3.5 text-emerald-600" />
      case 'expert': return <Shield className="w-3.5 h-3.5 text-blue-600" />
      case 'buyer':
      case 'broker': return <ShoppingBag className="w-3.5 h-3.5 text-purple-600" />
      case 'consumer':
      case 'service_provider': return <HeartHandshake className="w-3.5 h-3.5 text-pink-600" />
      case 'admin': return <Shield className="w-3.5 h-3.5 text-amber-600" />
      default: return <Users className="w-3.5 h-3.5 text-slate-600" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">User Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Directory of all farmers, agricultural experts, brokers, consumers, and platform admins.
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        {/* Role Tabs */}
        <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-100">
          {roleTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setRoleFilter(t.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                roleFilter === t.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search Input & Status Filter */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by full name, mobile number, district, or state..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending_verification">Pending Verification</option>
              <option value="suspended">Suspended</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl shadow-sm transition"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Displaying {users.length} Account{users.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-slate-500 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-primary-600" />
            <span>Loading users list...</span>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-sm text-rose-600">{error}</div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-400">
            No users matched your search filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">User</th>
                  <th className="px-4 py-3.5">Role</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Location</th>
                  <th className="px-4 py-3.5">Registered</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* User info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-sm shrink-0 border border-slate-200">
                          {u.full_name ? u.full_name[0].toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{u.full_name}</div>
                          <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {u.mobile}
                            </span>
                            {u.email && (
                              <span className="flex items-center gap-1">
                                • <Mail className="w-3 h-3" />
                                {u.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold capitalize">
                        {getRoleIcon(u.role)}
                        <span>{u.role}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                          u.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : u.status === 'pending_verification'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            u.status === 'active'
                              ? 'bg-emerald-500'
                              : u.status === 'pending_verification'
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                        />
                        <span className="capitalize">{u.status?.replace('_', ' ')}</span>
                      </span>
                    </td>

                    {/* Location */}
                    <td className="px-4 py-4 text-xs">
                      {u.district || u.state ? (
                        <div className="flex items-center gap-1 text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{[u.village, u.district, u.state].filter(Boolean).join(', ')}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Not specified</span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-4 text-xs text-slate-500">
                      {new Date(u.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedUser(u)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                          title="View Profile Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleToggleStatus(u)}
                            disabled={actionLoading}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                              u.status === 'active'
                                ? 'text-rose-600 hover:bg-rose-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            {u.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg">
                {selectedUser.full_name ? selectedUser.full_name[0].toUpperCase() : 'U'}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedUser.full_name}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-700 capitalize">
                    {selectedUser.role}
                  </span>
                  <span className="text-xs text-slate-400">ID: {selectedUser.id.slice(0, 8)}...</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-2">
                <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Account Details</div>
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-slate-400">Mobile:</span> <span className="font-semibold text-slate-700">{selectedUser.mobile}</span></div>
                  <div><span className="text-slate-400">Email:</span> <span className="font-semibold text-slate-700">{selectedUser.email || 'None'}</span></div>
                  <div><span className="text-slate-400">Language:</span> <span className="font-semibold text-slate-700">{selectedUser.preferred_language?.toUpperCase()}</span></div>
                  <div><span className="text-slate-400">Status:</span> <span className="font-semibold text-slate-700 capitalize">{selectedUser.status}</span></div>
                </div>
              </div>

              {/* Farmer Profile Specifics */}
              {selectedUser.farmer_profile && (
                <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl space-y-2">
                  <div className="font-bold text-emerald-800 uppercase tracking-wider text-[10px]">Farmer Profile</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="text-slate-400">Total Land:</span> <span className="font-semibold text-slate-700">{selectedUser.farmer_profile.total_land_acres} Acres</span></div>
                    <div><span className="text-slate-400">Experience:</span> <span className="font-semibold text-slate-700">{selectedUser.farmer_profile.experience_years} Years</span></div>
                    <div className="col-span-2"><span className="text-slate-400">Primary Crops:</span> <span className="font-semibold text-slate-700">{selectedUser.farmer_profile.primary_crops || 'Not set'}</span></div>
                  </div>
                </div>
              )}

              {/* Expert Profile Specifics */}
              {selectedUser.expert_profile && (
                <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl space-y-2">
                  <div className="font-bold text-blue-800 uppercase tracking-wider text-[10px]">Expert Profile</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="text-slate-400">Qualifications:</span> <span className="font-semibold text-slate-700">{selectedUser.expert_profile.qualifications}</span></div>
                    <div><span className="text-slate-400">Specialisation:</span> <span className="font-semibold text-slate-700">{selectedUser.expert_profile.specialisation}</span></div>
                    <div><span className="text-slate-400">Institution:</span> <span className="font-semibold text-slate-700">{selectedUser.expert_profile.institution}</span></div>
                    <div><span className="text-slate-400">Verification:</span> <span className="font-semibold text-slate-700 capitalize">{selectedUser.expert_profile.verification_status}</span></div>
                  </div>
                </div>
              )}

              {/* Buyer / Broker Profile Specifics */}
              {selectedUser.buyer_profile && (
                <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-xl space-y-2">
                  <div className="font-bold text-purple-800 uppercase tracking-wider text-[10px]">Broker / Buyer Profile</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="text-slate-400">Business Name:</span> <span className="font-semibold text-slate-700">{selectedUser.buyer_profile.business_name}</span></div>
                    <div><span className="text-slate-400">Type:</span> <span className="font-semibold text-slate-700">{selectedUser.buyer_profile.business_type}</span></div>
                    <div><span className="text-slate-400">GST:</span> <span className="font-semibold text-slate-700">{selectedUser.buyer_profile.gst_number || 'N/A'}</span></div>
                    <div><span className="text-slate-400">License:</span> <span className="font-semibold text-slate-700">{selectedUser.buyer_profile.license_number || 'N/A'}</span></div>
                    <div className="col-span-2"><span className="text-slate-400">Commodities:</span> <span className="font-semibold text-slate-700">{selectedUser.buyer_profile.commodities_of_interest || 'All Produce'}</span></div>
                  </div>
                </div>
              )}

              {/* Consumer Profile Specifics */}
              {selectedUser.consumer_profile && (
                <div className="p-3 bg-pink-50/60 border border-pink-100 rounded-xl space-y-2">
                  <div className="font-bold text-pink-800 uppercase tracking-wider text-[10px]">Consumer Profile</div>
                  <div className="space-y-1">
                    <div><span className="text-slate-400">Address:</span> <span className="font-semibold text-slate-700">{selectedUser.consumer_profile.delivery_address || 'Not specified'}</span></div>
                    <div><span className="text-slate-400">Preferred:</span> <span className="font-semibold text-slate-700">{selectedUser.consumer_profile.preferred_commodities || 'Fresh Vegetables & Grains'}</span></div>
                    <div><span className="text-slate-400">Organic Preference:</span> <span className="font-semibold text-slate-700">{selectedUser.consumer_profile.is_organic_preferred ? 'Yes' : 'No'}</span></div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
