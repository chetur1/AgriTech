/**
 * AGRI SMART — Axios API Client
 * File: frontend/src/services/api.js
 *
 * Central HTTP client for all backend communication.
 * - Automatically attaches the JWT token to every request
 * - Handles 401 (session expired) gracefully
 * - Provides typed service modules for each backend module
 */

import axios from 'axios'

// ---------------------------------------------------------------------------
// Base Axios instance
// ---------------------------------------------------------------------------

const api = axios.create({
  baseURL: '/api/v1',       // proxied to http://localhost:8000/api/v1 by Vite
  timeout: 30000,           // 30 second timeout
  headers: { 'Content-Type': 'application/json' },
})

// ---------------------------------------------------------------------------
// Request interceptor — attach JWT token
// ---------------------------------------------------------------------------

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('agrismart_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// ---------------------------------------------------------------------------
// Response interceptor — handle auth errors
// ---------------------------------------------------------------------------

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Session expired — clear token and redirect to login
      localStorage.removeItem('agrismart_token')
      window.location.href = '/login?expired=1'
    }
    return Promise.reject(error)
  },
)

// ---------------------------------------------------------------------------
// Auth API
// ---------------------------------------------------------------------------

export const authAPI = {
  login: (credentials) =>
    api.post('/auth/login', credentials),

  register: (data) =>
    api.post('/auth/register', data),

  getProfile: (token) =>
    api.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  logout: () =>
    api.post('/auth/logout'),

  refreshToken: () =>
    api.post('/auth/refresh'),
}

// ---------------------------------------------------------------------------
// Weather API
// ---------------------------------------------------------------------------

export const weatherAPI = {
  getCurrent: (lat, lon) =>
    api.get('/weather/current', { params: { lat, lon } }),

  getForecast: (lat, lon) =>
    api.get('/weather/forecast', { params: { lat, lon } }),

  getAlerts: (lat, lon) =>
    api.get('/weather/alerts', { params: { lat, lon } }),
}

// ---------------------------------------------------------------------------
// Farm API
// ---------------------------------------------------------------------------

export const farmAPI = {
  list: ()            => api.get('/farms'),
  get: (id)           => api.get(`/farms/${id}`),
  create: (data)      => api.post('/farms', data),
  update: (id, data)  => api.patch(`/farms/${id}`, data),
  delete: (id)        => api.delete(`/farms/${id}`),
}

// ---------------------------------------------------------------------------
// Crop API
// ---------------------------------------------------------------------------

export const cropAPI = {
  list: (farmId)      => api.get('/crops', { params: { farm_id: farmId } }),
  get: (id)           => api.get(`/crops/${id}`),
  create: (data)      => api.post('/crops', data),
  update: (id, data)  => api.patch(`/crops/${id}`, data),
  delete: (id)        => api.delete(`/crops/${id}`),
}

// ---------------------------------------------------------------------------
// AI Diagnosis API
// ---------------------------------------------------------------------------

export const aiAPI = {
  diagnose: (formData) =>
    api.post('/ai/diagnose', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getHistory: () => api.get('/ai/diagnoses'),

  getDiagnosis: (id) => api.get(`/ai/diagnoses/${id}`),
}

// ---------------------------------------------------------------------------
// Market API
// ---------------------------------------------------------------------------

export const marketAPI = {
  getPrices: (params) => api.get('/market/prices', { params }),
  getCommodities: ()  => api.get('/market/commodities'),
  getMarkets: (district) => api.get('/market/markets', { params: { district } }),
}

// ---------------------------------------------------------------------------
// Expert Portal API  (Phase 7)
// ---------------------------------------------------------------------------

export const expertAPI = {
  getDashboard:       ()        => api.get('/experts/dashboard'),
  getPendingDiagnoses:(params)  => api.get('/experts/pending-diagnoses', { params }),
  getDiagnosis:       (id)      => api.get(`/experts/diagnoses/${id}`),
  submitReview:       (id, data)=> api.post(`/experts/diagnoses/${id}/review`, data),
  getFarmers:         ()        => api.get('/experts/farmers'),
  getProfile:         ()        => api.get('/experts/profile'),
}

// ---------------------------------------------------------------------------
// Finance API
// ---------------------------------------------------------------------------

export const financeAPI = {
  getExpenses: (params) => api.get('/finance/expenses', { params }),
  addExpense: (data)    => api.post('/finance/expenses', data),
  getIncome: (params)   => api.get('/finance/income', { params }),
  addIncome: (data)     => api.post('/finance/income', data),
  getSummary: (params)  => api.get('/finance/summary', { params }),
}

// ---------------------------------------------------------------------------
// Consultation API
// ---------------------------------------------------------------------------

export const consultationAPI = {
  list: ()          => api.get('/consultations'),
  get: (id)         => api.get(`/consultations/${id}`),
  create: (data)    => api.post('/consultations', data),
  respond: (id, d)  => api.post(`/consultations/${id}/respond`, d),
}

// ---------------------------------------------------------------------------
// Notifications API
// ---------------------------------------------------------------------------

export const notificationAPI = {
  list: ()          => api.get('/notifications'),
  markRead: (id)    => api.patch(`/notifications/${id}/read`),
  markAllRead: ()   => api.patch('/notifications/read-all'),
}

export default api
