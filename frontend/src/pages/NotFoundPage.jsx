/**
 * AGRI SMART — 404 Not Found Page
 * File: frontend/src/pages/NotFoundPage.jsx
 */
import { Link } from 'react-router-dom'
import { Leaf, Home } from 'lucide-react'
export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-primary-50 flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mb-6">
        <Leaf className="w-8 h-8 text-white" />
      </div>
      <h1 className="text-6xl font-extrabold text-primary-600 mb-4">404</h1>
      <h2 className="text-2xl font-bold text-gray-900 mb-3">Page Not Found</h2>
      <p className="text-gray-600 mb-8 max-w-sm">
        This page doesn't exist yet. It may be a planned feature coming in a future phase.
      </p>
      <Link to="/" className="btn-primary">
        <Home className="w-4 h-4" /> Go to Home
      </Link>
    </div>
  )
}
