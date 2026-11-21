/**
 * AGRI SMART — About Page
 * File: frontend/src/pages/public/AboutPage.jsx
 */
import { Leaf, Target, Eye } from 'lucide-react'
export default function AboutPage() {
  return (
    <div className="page-container max-w-4xl py-16">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
          <Leaf className="w-3.5 h-3.5" /> Our Story
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">About AGRI SMART</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Don't make farmers understand technology. Make technology understand farmers.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="card">
          <Eye className="w-8 h-8 text-primary-600 mb-3" />
          <h3 className="font-bold text-gray-900 mb-2">Our Vision</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            Help farmers make better decisions throughout the agricultural lifecycle — from land
            preparation and crop selection to disease management, harvesting, and market selling.
          </p>
        </div>
        <div className="card">
          <Target className="w-8 h-8 text-primary-600 mb-3" />
          <h3 className="font-bold text-gray-900 mb-2">Our Mission</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            Build a scalable, multilingual agricultural intelligence platform that serves farmers
            across India, starting with Karnataka — with no paid API keys required to start.
          </p>
        </div>
      </div>
      <div className="card bg-primary-50 border-primary-100 text-center">
        <p className="text-primary-800 font-medium">
          AGRI SMART is built by CS engineering students with a mission to become a real
          agricultural technology startup serving millions of Indian farmers.
        </p>
      </div>
    </div>
  )
}
