/**
 * AGRI SMART — Professional Landing Page
 * File: frontend/src/pages/public/LandingPage.jsx
 *
 * Hero section, features overview, how-it-works, and CTA.
 */

import { Link } from 'react-router-dom'
import {
  Leaf, Cloud, Camera, TrendingUp, Wallet, Mic,
  Shield, Globe, Smartphone, ChevronRight,
  Sprout, Droplets, Users, Star
} from 'lucide-react'

const features = [
  {
    icon: Camera,
    color: 'bg-green-100 text-green-700',
    title: 'AI Crop Diagnosis',
    desc: 'Upload a photo of your crop. Get instant disease detection, confidence scores, and safe treatment guidance.',
  },
  {
    icon: Cloud,
    color: 'bg-sky-100 text-sky-700',
    title: 'Weather Intelligence',
    desc: '7-day forecasts, severe weather alerts, and AI-powered irrigation recommendations.',
  },
  {
    icon: TrendingUp,
    color: 'bg-earth-100 text-earth-700',
    title: 'Market Prices',
    desc: 'Real mandi prices, commodity comparisons, and best-time-to-sell guidance.',
  },
  {
    icon: Wallet,
    color: 'bg-purple-100 text-purple-700',
    title: 'Finance & Schemes',
    desc: 'Track expenses, income, and profit. Discover government subsidies you are eligible for.',
  },
  {
    icon: Mic,
    color: 'bg-orange-100 text-orange-700',
    title: 'Voice in Your Language',
    desc: 'Speak in Kannada, Hindi, Telugu, Tamil, or English. Get spoken answers.',
  },
  {
    icon: Users,
    color: 'bg-pink-100 text-pink-700',
    title: 'Expert Consultations',
    desc: 'Ask verified agricultural experts. Get reviewed diagnoses and professional advice.',
  },
]

const steps = [
  { step: '01', title: 'Register Free', desc: 'Create your farmer profile in your language in under 2 minutes.' },
  { step: '02', title: 'Add Your Farm', desc: 'Register your land, soil type, water source, and active crops.' },
  { step: '03', title: 'Get Smart Advice', desc: 'Receive weather alerts, crop health checks, and market prices daily.' },
  { step: '04', title: 'Grow & Prosper', desc: 'Make better decisions. Track progress. Consult experts. Earn more.' },
]

const languages = [
  { code: 'kn', name: 'ಕನ್ನಡ', label: 'Kannada' },
  { code: 'hi', name: 'हिंदी', label: 'Hindi' },
  { code: 'te', name: 'తెలుగు', label: 'Telugu' },
  { code: 'ta', name: 'தமிழ்', label: 'Tamil' },
  { code: 'en', name: 'English', label: 'English' },
]

export default function LandingPage() {
  return (
    <div className="bg-white">

      {/* ================================================================
          HERO SECTION
          ================================================================ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-earth-50">
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #16a34a 1px, transparent 0)', backgroundSize: '32px 32px' }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Text */}
            <div>
              <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
                <Leaf className="w-3.5 h-3.5" />
                Made for Indian Farmers
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
                Smart Farming.<br />
                <span className="text-primary-600">Better Decisions.</span><br />
                Stronger Farmers.
              </h1>

              <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-lg">
                AGRI SMART puts AI-powered crop diagnosis, live weather, real market prices,
                and expert consultations in every farmer's hands — in their own language.
              </p>

              {/* Language badges */}
              <div className="flex flex-wrap gap-2 mb-8">
                {languages.map(l => (
                  <span key={l.code} className="bg-white border border-gray-200 text-gray-700 text-sm px-3 py-1 rounded-full font-medium shadow-sm">
                    {l.name}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap gap-4">
                <Link to="/register" className="btn-primary text-base px-6 py-3.5 shadow-lg shadow-primary-200">
                  Start for Free
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <Link to="/features" className="btn-secondary text-base px-6 py-3.5">
                  Explore Features
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex items-center gap-6 mt-10 text-sm text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-primary-500" />
                  <span>Secure & Private</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-primary-500" />
                  <span>Works on Mobile</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-earth-500" />
                  <span>Free to Use</span>
                </div>
              </div>
            </div>

            {/* Hero visual — dashboard preview card */}
            <div className="hidden lg:block">
              <div className="relative">
                {/* Main card */}
                <div className="card shadow-xl border-0 p-6 max-w-sm mx-auto">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <Sprout className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Ravi Kumar</p>
                      <p className="text-xs text-gray-500">Raichur, Karnataka</p>
                    </div>
                    <span className="ml-auto badge-green">Active</span>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-primary-50 rounded-xl p-3 flex items-center gap-3">
                      <Camera className="w-5 h-5 text-primary-600 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-primary-800">AI Diagnosis Ready</p>
                        <p className="text-xs text-primary-600">Tomato leaf blight — 87% confidence</p>
                      </div>
                    </div>
                    <div className="bg-sky-50 rounded-xl p-3 flex items-center gap-3">
                      <Cloud className="w-5 h-5 text-sky-600 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-sky-800">Weather Alert</p>
                        <p className="text-xs text-sky-600">Rain expected tomorrow — delay irrigation</p>
                      </div>
                    </div>
                    <div className="bg-earth-50 rounded-xl p-3 flex items-center gap-3">
                      <TrendingUp className="w-5 h-5 text-earth-600 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-earth-800">Tomato Price Today</p>
                        <p className="text-xs text-earth-600">₹1,850 / quintal — Bengaluru</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating accent cards */}
                <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg p-3 border border-gray-100 w-32">
                  <p className="text-xs font-bold text-gray-900">5 Languages</p>
                  <p className="text-xs text-gray-500 mt-0.5">Voice support</p>
                </div>
                <div className="absolute -bottom-4 -left-4 bg-primary-600 rounded-xl shadow-lg p-3 w-36">
                  <p className="text-xs font-bold text-white">Expert Verified</p>
                  <p className="text-xs text-primary-200 mt-0.5">Trusted advice</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          FEATURES GRID
          ================================================================ */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Everything a Farmer Needs
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              One platform for the complete agricultural lifecycle — from soil to sale.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(f => (
              <div key={f.title} className="card-hover group">
                <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-4`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          HOW IT WORKS
          ================================================================ */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              How AGRI SMART Works
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              Get started in minutes. No technical knowledge required.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((s, i) => (
              <div key={s.step} className="text-center">
                <div className="w-14 h-14 bg-primary-600 text-white rounded-2xl flex items-center justify-center text-xl font-extrabold mx-auto mb-4">
                  {s.step}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-600">{s.desc}</p>
                {i < steps.length - 1 && (
                  <ChevronRight className="hidden lg:block mx-auto mt-4 text-gray-300 w-5 h-5" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          DISCLAIMER SECTION
          ================================================================ */}
      <section className="py-10 bg-amber-50 border-y border-amber-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-start justify-center gap-3">
            <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 leading-relaxed text-left">
              <strong>Honest AI:</strong> AGRI SMART clearly labels AI-generated predictions separately from
              expert-verified advice. We never fabricate live weather, market prices, or subsidy approvals.
              All agricultural guidance includes its source and limitations.
            </p>
          </div>
        </div>
      </section>

      {/* ================================================================
          CTA SECTION
          ================================================================ */}
      <section className="py-24 bg-gradient-to-br from-primary-600 to-primary-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Join Thousands of Smart Farmers
          </h2>
          <p className="text-primary-200 text-lg mb-10 max-w-2xl mx-auto">
            Free registration. No credit card. Start using AI-powered farming intelligence today.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/register"
              className="bg-white text-primary-700 font-bold px-8 py-4 rounded-xl hover:bg-primary-50 transition-colors shadow-lg shadow-primary-900/20 flex items-center gap-2"
            >
              Register as Farmer
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              to="/register"
              className="bg-primary-700 border border-primary-500 text-white font-bold px-8 py-4 rounded-xl hover:bg-primary-600 transition-colors flex items-center gap-2"
            >
              Join as Expert
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
