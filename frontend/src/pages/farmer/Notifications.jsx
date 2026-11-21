/**
 * AGRI SMART — Farmer Notifications & Real-Time Alerts
 * File: frontend/src/pages/farmer/Notifications.jsx
 *
 * Implements Module 1 notification centre:
 * - Real-time severe weather alerts
 * - Expert consultation replies & verification notices
 * - Pest & disease advisories
 * - Government scheme deadline reminders
 * - Filter by category, mark as read, clear all
 */

import { useState } from 'react'
import {
  Bell,
  CloudRain,
  UserCheck,
  AlertTriangle,
  FileText,
  Check,
  CheckCheck,
  Trash2,
  Calendar,
  Volume2,
  ExternalLink
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    category: 'weather',
    title: 'Heavy Rainfall Alert (Mandya & Mysuru)',
    message: 'IMD warning: 45-60mm precipitation predicted over the next 36 hours. Ensure adequate field drainage in ragi & tomato plots.',
    timestamp: '2 hours ago',
    isRead: false,
    severity: 'high',
    link: '/farmer/weather'
  },
  {
    id: 'notif-2',
    category: 'expert',
    title: 'Dr. Suresh Kumar verified your diagnosis',
    message: 'Expert confirmation received for Ragi Blast case #AI-9402: "Verified as Pyricularia grisea. Apply Tricyclazole 75% WP @ 0.6g/L."',
    timestamp: '4 hours ago',
    isRead: false,
    severity: 'medium',
    link: '/farmer/ai-diagnosis'
  },
  {
    id: 'notif-3',
    category: 'scheme',
    title: 'PM-KUSUM Solar Pump Subsidy Enrollment Open',
    message: 'Karnataka Component B applications open for 7.5 HP standalone solar agriculture pumps. 60% total government subsidy.',
    timestamp: '1 day ago',
    isRead: true,
    severity: 'info',
    link: '/farmer/finance'
  },
  {
    id: 'notif-4',
    category: 'activity',
    title: 'Scheduled Activity Reminder: Second Split Nitrogen',
    message: 'Farm: North Plot. Recommended: 25 kg/acre Urea application 30 days after transplanting.',
    timestamp: '2 days ago',
    isRead: true,
    severity: 'info',
    link: '/farmer/crops'
  }
]

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS)
  const [activeFilter, setActiveFilter] = useState('all') // all | unread | weather | expert | scheme
  const navigate = useNavigate()

  const markAsRead = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n))
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })))
  }

  const clearAll = () => {
    setNotifications([])
  }

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'unread') return !n.isRead
    if (activeFilter === 'weather') return n.category === 'weather'
    if (activeFilter === 'expert') return n.category === 'expert'
    if (activeFilter === 'scheme') return n.category === 'scheme'
    return true
  })

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div className="page-container max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-7 h-7 text-emerald-600" />
            Alerts & Notifications
            {unreadCount > 0 && (
              <span className="ml-2 text-xs bg-red-500 text-white font-bold px-2 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Weather hazards, agronomist advice, and official agricultural advisories
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 px-3 py-1.5 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="text-xs font-semibold text-gray-500 hover:text-red-600 flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-red-50 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2 text-xs">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1.5 rounded-full font-semibold transition ${
            activeFilter === 'all'
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setActiveFilter('unread')}
          className={`px-3 py-1.5 rounded-full font-semibold transition ${
            activeFilter === 'unread'
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Unread ({unreadCount})
        </button>
        <button
          onClick={() => setActiveFilter('weather')}
          className={`px-3 py-1.5 rounded-full font-semibold transition ${
            activeFilter === 'weather'
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Weather Alerts
        </button>
        <button
          onClick={() => setActiveFilter('expert')}
          className={`px-3 py-1.5 rounded-full font-semibold transition ${
            activeFilter === 'expert'
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Expert Responses
        </button>
        <button
          onClick={() => setActiveFilter('scheme')}
          className={`px-3 py-1.5 rounded-full font-semibold transition ${
            activeFilter === 'scheme'
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Government Schemes
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="card text-center py-16 bg-white border border-gray-200">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-700">No notifications in this view</h3>
            <p className="text-xs text-gray-500 mt-1">You are up to date with all farming advisories.</p>
          </div>
        ) : (
          filteredNotifications.map((n) => {
            let Icon = Bell
            let iconColor = 'text-gray-500 bg-gray-100'
            if (n.category === 'weather') {
              Icon = CloudRain
              iconColor = 'text-blue-600 bg-blue-100'
            } else if (n.category === 'expert') {
              Icon = UserCheck
              iconColor = 'text-emerald-600 bg-emerald-100'
            } else if (n.category === 'scheme') {
              Icon = FileText
              iconColor = 'text-purple-600 bg-purple-100'
            }

            return (
              <div
                key={n.id}
                className={`card border p-4 transition-all flex items-start gap-3.5 bg-white ${
                  !n.isRead ? 'border-emerald-300 bg-emerald-50/20 shadow-sm' : 'border-gray-200 opacity-90'
                }`}
              >
                <div className={`p-2.5 rounded-xl shrink-0 ${iconColor}`}>
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={`text-sm font-bold ${!n.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                      {n.title}
                    </h3>
                    <span className="text-[11px] text-gray-400 shrink-0">{n.timestamp}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    {n.message}
                  </p>

                  <div className="flex items-center gap-3 mt-3 pt-2 border-t border-gray-100">
                    {n.link && (
                      <button
                        onClick={() => navigate(n.link)}
                        className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                      >
                        View Details <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                    {!n.isRead && (
                      <button
                        onClick={() => markAsRead(n.id)}
                        className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
