/**
 * AGRI SMART — Privacy Policy
 * File: frontend/src/pages/public/PrivacyPage.jsx
 */
import { Shield } from 'lucide-react'
export default function PrivacyPage() {
  return (
    <div className="page-container max-w-3xl py-16">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="w-8 h-8 text-primary-600" />
        <h1 className="text-3xl font-extrabold text-gray-900">Privacy Policy</h1>
      </div>
      <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
        <div className="card">
          <h2 className="font-bold text-gray-900 mb-2">What We Collect</h2>
          <p>We collect your name, mobile number, farm information, crop photographs you upload, and location details you provide. We do not collect payment information.</p>
        </div>
        <div className="card">
          <h2 className="font-bold text-gray-900 mb-2">How We Use It</h2>
          <p>Your data is used only to provide AGRI SMART services — weather, crop diagnosis, market prices, and expert consultations. We do not sell your data to third parties.</p>
        </div>
        <div className="card">
          <h2 className="font-bold text-gray-900 mb-2">Your Photographs</h2>
          <p>Crop photographs you upload are used only for AI diagnosis and expert review. They are stored securely and are not shared publicly without your permission.</p>
        </div>
        <div className="card">
          <h2 className="font-bold text-gray-900 mb-2">Data Security</h2>
          <p>Passwords are stored as one-way hashes (bcrypt). API communications use HTTPS. We perform regular security reviews.</p>
        </div>
        <p className="text-xs text-gray-400">Last updated: November 2024. This policy will be updated as the platform evolves.</p>
      </div>
    </div>
  )
}
