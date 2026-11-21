/**
 * AGRI SMART — Contact Page
 * File: frontend/src/pages/public/ContactPage.jsx
 */
import { Mail, Phone, MapPin } from 'lucide-react'
export default function ContactPage() {
  return (
    <div className="page-container max-w-3xl py-16">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Contact Us</h1>
        <p className="text-gray-600">We are here to help farmers and agricultural experts.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="card space-y-5">
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <MapPin className="w-5 h-5 text-primary-600" />
            <span>Karnataka, India</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <Mail className="w-5 h-5 text-primary-600" />
            <span>hello@agrismart.in <span className="text-xs text-gray-400">(planned)</span></span>
          </div>
        </div>
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4 text-sm">Send a Message</h3>
          <div className="space-y-3">
            <input className="form-input text-sm" placeholder="Your name" />
            <input className="form-input text-sm" placeholder="Mobile or email" />
            <textarea className="form-input text-sm h-24 resize-none" placeholder="Your message"></textarea>
            <button className="btn-primary w-full text-sm">
              Send Message <span className="text-xs opacity-70">(coming soon)</span>
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-3">Contact form integration is a planned feature.</p>
        </div>
      </div>
    </div>
  )
}
