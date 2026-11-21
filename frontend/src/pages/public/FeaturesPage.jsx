/**
 * AGRI SMART — Features Page
 * File: frontend/src/pages/public/FeaturesPage.jsx
 */
import { Link } from 'react-router-dom'
import { Camera, Cloud, TrendingUp, Wallet, Mic, Users, Sprout, Droplets, BarChart2, ChevronRight } from 'lucide-react'

const features = [
  { icon: Camera,    title: 'AI Crop Diagnosis',          desc: 'Upload crop photos for instant disease detection with confidence scores and expert review.' },
  { icon: Cloud,     title: 'Weather Intelligence',        desc: '7-day forecasts, rainfall alerts, and AI irrigation recommendations.' },
  { icon: Sprout,    title: 'Farm & Crop Management',     desc: 'Register multiple farms, track crops, activities, fertilisers, and harvest records.' },
  { icon: Droplets,  title: 'Soil & Irrigation',          desc: 'Soil test records, nutrient analysis, water scheduling, and usage history.' },
  { icon: TrendingUp,'title': 'Market Intelligence',      desc: 'Live mandi prices, historical charts, and best-time-to-sell guidance.' },
  { icon: Wallet,    title: 'Finance & Schemes',           desc: 'Expense/income tracking, profit-loss reports, and government scheme discovery.' },
  { icon: Mic,       title: 'Voice in 5 Languages',       desc: 'Speak and listen in Kannada, Hindi, Telugu, Tamil, or English.' },
  { icon: Users,     title: 'Expert Consultations',       desc: 'Ask verified agricultural experts. Get reviewed diagnoses and advice.' },
  { icon: BarChart2, title: 'Farm Progress & Reports',    desc: 'Weekly photos, yield tracking, activity history, and downloadable reports.' },
]

export default function FeaturesPage() {
  return (
    <div className="page-container py-16">
      <div className="text-center mb-14">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Platform Features</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">Everything a modern farmer needs in one intelligent platform.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {features.map(f => (
          <div key={f.title} className="card">
            <f.icon className="w-8 h-8 text-primary-600 mb-3" />
            <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
            <p className="text-sm text-gray-600">{f.desc}</p>
          </div>
        ))}
      </div>
      <div className="text-center">
        <Link to="/register" className="btn-primary text-base px-8 py-4">
          Start for Free <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
