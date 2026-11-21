/**
 * AGRI SMART — Notification Context
 * File: frontend/src/context/NotificationContext.jsx
 *
 * Provides a simple toast/notification system.
 * Usage: const { notify } = useNotification()
 *        notify.success('Farm saved!')
 *        notify.error('Something went wrong')
 */

import { createContext, useContext, useState, useCallback } from 'react'

const NotificationContext = createContext(null)

let notificationId = 0

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])

  const addNotification = useCallback((type, message, duration = 4000) => {
    const id = ++notificationId
    setNotifications(prev => [...prev, { id, type, message }])
    if (duration > 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id))
      }, duration)
    }
    return id
  }, [])

  const dismiss = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const notify = {
    success: (msg, dur) => addNotification('success', msg, dur),
    error:   (msg, dur) => addNotification('error', msg, dur),
    warning: (msg, dur) => addNotification('warning', msg, dur),
    info:    (msg, dur) => addNotification('info', msg, dur),
  }

  return (
    <NotificationContext.Provider value={{ notifications, notify, dismiss }}>
      {children}
      <ToastContainer notifications={notifications} onDismiss={dismiss} />
    </NotificationContext.Provider>
  )
}

function ToastContainer({ notifications, onDismiss }) {
  if (!notifications.length) return null

  const colourMap = {
    success: 'bg-primary-600',
    error:   'bg-red-600',
    warning: 'bg-earth-500',
    info:    'bg-blue-600',
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {notifications.map(n => (
        <div
          key={n.id}
          className={`${colourMap[n.type]} text-white px-4 py-3 rounded-xl shadow-lg
                      flex items-center justify-between gap-3 animate-fade-in`}
        >
          <span className="text-sm font-medium">{n.message}</span>
          <button
            onClick={() => onDismiss(n.id)}
            className="shrink-0 text-white/80 hover:text-white text-lg leading-none"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}

export function useNotification() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotification must be used inside <NotificationProvider>')
  return ctx
}
