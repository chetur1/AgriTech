import { User } from 'lucide-react'
export default function ProfilePage() {
  return (
    <div className="page-container">
      <div className="flex items-center gap-3 mb-6">
        <User className="w-7 h-7 text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <span className="ml-auto badge-yellow">Phase 2</span>
      </div>
      <div className="card text-center py-16">
        <User className="w-14 h-14 text-gray-300 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-gray-700 mb-2">My Profile</h2>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          This module will be built in Phase 2. The routing and layout are ready.
          Stay tuned for the full implementation.
        </p>
      </div>
    </div>
  )
}
