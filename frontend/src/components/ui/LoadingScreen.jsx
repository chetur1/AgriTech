/**
 * AGRI SMART — Loading Screen
 * File: frontend/src/components/ui/LoadingScreen.jsx
 */

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-primary-50 flex flex-col items-center justify-center gap-4">
      {/* Brand mark */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
          <span className="text-white font-bold text-lg">🌾</span>
        </div>
        <span className="text-2xl font-bold text-primary-700">AGRI SMART</span>
      </div>

      {/* Spinner */}
      <div className="spinner h-8 w-8 border-primary-600" />

      <p className="text-sm text-gray-500">Loading…</p>
    </div>
  )
}
