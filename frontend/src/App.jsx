/**
 * AGRI SMART — App Router
 * File: frontend/src/App.jsx
 *
 * Defines all application routes. Each role gets its own layout.
 * Public routes are accessible without authentication.
 * Protected routes check authentication and role before rendering.
 */

import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'

// Layouts
import PublicLayout from './layouts/PublicLayout'
import FarmerLayout from './layouts/FarmerLayout'
import ExpertLayout from './layouts/ExpertLayout'
import AdminLayout from './layouts/AdminLayout'

// Guards
import ProtectedRoute from './components/auth/ProtectedRoute'

// --- Public Pages ---
import LandingPage from './pages/public/LandingPage'
import LoginPage from './pages/public/LoginPage'
import RegisterPage from './pages/public/RegisterPage'
import AboutPage from './pages/public/AboutPage'
import FeaturesPage from './pages/public/FeaturesPage'
import ContactPage from './pages/public/ContactPage'
import PrivacyPage from './pages/public/PrivacyPage'

// --- Farmer Pages ---
import FarmerDashboard from './pages/farmer/Dashboard'
import FarmerProfile from './pages/farmer/Profile'
import FarmsPage from './pages/farmer/Farms'
import CropsPage from './pages/farmer/Crops'
import WeatherPage from './pages/farmer/Weather'
import AIDiagnosisPage from './pages/farmer/AIDiagnosis'
import SoilPage from './pages/farmer/Soil'
import MarketPage from './pages/farmer/Market'
import FinancePage from './pages/farmer/Finance'
import VoicePage from './pages/farmer/Voice'
import CommunityPage from './pages/farmer/Community'
import ProgressPage from './pages/farmer/Progress'
import NotificationsPage from './pages/farmer/Notifications'
import SettingsPage from './pages/farmer/Settings'

// --- Expert Pages ---
import ExpertDashboard from './pages/expert/Dashboard'
import DiagnosisReview from './pages/expert/DiagnosisReview'
import Consultations from './pages/expert/Consultations'
import KnowledgeBase from './pages/expert/KnowledgeBase'
import ExpertProfile from './pages/expert/Profile'
import ExpertFarmers from './pages/expert/Farmers'

// --- Admin Pages ---
import AdminDashboard from './pages/admin/Dashboard'
import UserManagement from './pages/admin/UserManagement'
import ExpertVerification from './pages/admin/ExpertVerification'
import AuditLogs from './pages/admin/AuditLogs'
import AdminSettings from './pages/admin/Settings'

// Not found
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Routes>

          {/* ========== PUBLIC ROUTES ========== */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
          </Route>

          {/* ========== FARMER ROUTES ========== */}
          <Route element={<ProtectedRoute role="farmer" />}>
            <Route element={<FarmerLayout />}>
              <Route path="/farmer" element={<Navigate to="/farmer/dashboard" replace />} />
              <Route path="/farmer/dashboard" element={<FarmerDashboard />} />
              <Route path="/farmer/profile" element={<FarmerProfile />} />
              <Route path="/farmer/farms" element={<FarmsPage />} />
              <Route path="/farmer/crops" element={<CropsPage />} />
              <Route path="/farmer/weather" element={<WeatherPage />} />
              <Route path="/farmer/ai-diagnosis" element={<AIDiagnosisPage />} />
              <Route path="/farmer/soil" element={<SoilPage />} />
              <Route path="/farmer/market" element={<MarketPage />} />
              <Route path="/farmer/finance" element={<FinancePage />} />
              <Route path="/farmer/voice" element={<VoicePage />} />
              <Route path="/farmer/community" element={<CommunityPage />} />
              <Route path="/farmer/progress" element={<ProgressPage />} />
              <Route path="/farmer/notifications" element={<NotificationsPage />} />
              <Route path="/farmer/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          {/* ========== EXPERT ROUTES ========== */}
          <Route element={<ProtectedRoute role="expert" />}>
            <Route element={<ExpertLayout />}>
              <Route path="/expert" element={<Navigate to="/expert/dashboard" replace />} />
              <Route path="/expert/dashboard" element={<ExpertDashboard />} />
              <Route path="/expert/diagnosis-review" element={<DiagnosisReview />} />
              <Route path="/expert/consultations" element={<Consultations />} />
              <Route path="/expert/farmers" element={<ExpertFarmers />} />
              <Route path="/expert/knowledge" element={<KnowledgeBase />} />
              <Route path="/expert/profile" element={<ExpertProfile />} />
            </Route>
          </Route>

          {/* ========== ADMIN ROUTES ========== */}
          <Route element={<ProtectedRoute role="admin" />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<UserManagement />} />
              <Route path="/admin/expert-verification" element={<ExpertVerification />} />
              <Route path="/admin/audit-logs" element={<AuditLogs />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
            </Route>
          </Route>

          {/* ========== CATCH-ALL ========== */}
          <Route path="*" element={<NotFoundPage />} />

        </Routes>
      </NotificationProvider>
    </AuthProvider>
  )
}
