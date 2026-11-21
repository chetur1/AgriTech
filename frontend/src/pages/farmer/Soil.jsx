/**
 * AGRI SMART — Soil, Water and Irrigation Management
 * File: frontend/src/pages/farmer/Soil.jsx
 *
 * Implements Module 5:
 * - Soil test records (pH, N, P, K, Organic Carbon, EC)
 * - Soil Health Card interpretation & nutrient rating
 * - Crop suitability guidance for Indian/Karnataka soils
 * - Water requirement estimator & smart irrigation scheduler
 * - Strict adherence: Never pretend to measure soil properties from ordinary photographs
 */

import { useState } from 'react'
import {
  Droplets,
  Layers,
  FlaskConical,
  CheckCircle,
  AlertTriangle,
  Info,
  Calendar,
  CloudRain,
  Plus,
  Trash2,
  Sparkles,
  ChevronRight,
  ShieldCheck
} from 'lucide-react'

// Common soil types in Karnataka & South India
const SOIL_TYPES = [
  { id: 'red_loam', name: 'Red Loamy Soil (ಕೆಂಪು ಮಣ್ಣು)', ph_range: '6.0 - 7.5', crops: 'Ragi, Groundnut, Maize, Pulses, Mango' },
  { id: 'black_cotton', name: 'Black Cotton Soil (ಕಪ್ಪು ಮಣ್ಣು)', ph_range: '7.5 - 8.5', crops: 'Cotton, Sugarcane, Jowar, Sunflower, Bengal Gram' },
  { id: 'laterite', name: 'Laterite Soil (ಜಂಬಿಟ್ಟಿಗೆ ಮಣ್ಣು)', ph_range: '4.5 - 6.0', crops: 'Arecanut, Coconut, Cashew, Pepper, Coffee' },
  { id: 'alluvial', name: 'Alluvial River Basin Soil', ph_range: '6.5 - 7.8', crops: 'Paddy, Sugarcane, Banana, Vegetables' },
  { id: 'sandy_loam', name: 'Sandy Loam Soil', ph_range: '6.0 - 7.0', crops: 'Vegetables, Onion, Potato, Tomato, Melons' },
]

export default function SoilPage() {
  const [activeTab, setActiveTab] = useState('tests') // tests | irrigation | suitability
  
  // Soil test records state
  const [soilTests, setSoilTests] = useState([
    {
      id: 'st-01',
      date: '2026-02-15',
      lab: 'Krishi Vigyan Kendra (KVK) Mandya',
      farmName: 'North Plot (Ragi)',
      soilType: 'Red Loamy Soil (ಕೆಂಪು ಮಣ್ಣು)',
      ph: 6.8,
      ec: 0.42,
      nitrogen: 210, // kg/ha (Low <280, Med 280-560, High >560)
      phosphorus: 18.5, // kg/ha (Low <10, Med 10-25, High >25)
      potassium: 290, // kg/ha (Low <110, Med 110-280, High >280)
      organicCarbon: 0.58, // % (Low <0.5, Med 0.5-0.75, High >0.75)
    }
  ])

  // New soil test form modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [newTest, setNewTest] = useState({
    date: new Date().toISOString().split('T')[0],
    lab: '',
    farmName: 'North Plot',
    soilType: 'Red Loamy Soil (ಕೆಂಪು ಮಣ್ಣು)',
    ph: 6.5,
    ec: 0.35,
    nitrogen: 240,
    phosphorus: 15,
    potassium: 220,
    organicCarbon: 0.6,
  })

  // Irrigation Calculator state
  const [cropType, setCropType] = useState('Ragi (Finger Millet)')
  const [irrigationMethod, setIrrigationMethod] = useState('drip')
  const [cropAreaAcres, setCropAreaAcres] = useState(2.5)
  const [growthStage, setGrowthStage] = useState('vegetative')
  const [recentRainMm, setRecentRainMm] = useState(12)

  // Calculate NPK Rating
  const getRating = (val, low, med) => {
    if (val < low) return { text: 'Deficient (Low)', color: 'text-red-600 bg-red-50 border-red-200' }
    if (val <= med) return { text: 'Optimal (Medium)', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' }
    return { text: 'Sufficient (High)', color: 'text-blue-700 bg-blue-50 border-blue-200' }
  }

  const handleAddTest = (e) => {
    e.preventDefault()
    const testRecord = {
      ...newTest,
      id: `st-${Date.now()}`,
      ph: parseFloat(newTest.ph),
      ec: parseFloat(newTest.ec),
      nitrogen: parseFloat(newTest.nitrogen),
      phosphorus: parseFloat(newTest.phosphorus),
      potassium: parseFloat(newTest.potassium),
      organicCarbon: parseFloat(newTest.organicCarbon),
    }
    setSoilTests([testRecord, ...soilTests])
    setShowAddModal(false)
  }

  // Irrigation requirement formula
  // Base daily crop water need in liters per acre
  const baseWaterNeeds = {
    'Ragi (Finger Millet)': 12000,
    'Paddy (Rice)': 35000,
    'Sugarcane': 28000,
    'Maize': 15000,
    'Groundnut': 14000,
    'Tomato': 16000,
  }

  const stageMultiplier = {
    seedling: 0.6,
    vegetative: 1.0,
    flowering: 1.3,
    maturity: 0.7,
  }

  const methodEfficiency = {
    flood: 0.60,
    furrow: 0.70,
    sprinkler: 0.82,
    drip: 0.92,
  }

  const baseNeed = (baseWaterNeeds[cropType] || 15000) * (stageMultiplier[growthStage] || 1.0) * cropAreaAcres
  const efficiency = methodEfficiency[irrigationMethod] || 0.85
  // 1 mm rain on 1 acre = ~4046 liters
  const rainCreditLiters = recentRainMm * 4046 * cropAreaAcres
  const netDailyRequirement = Math.max(0, Math.round((baseNeed - (rainCreditLiters / 3)) / efficiency))
  const pumpHours = Math.round((netDailyRequirement / 3600) * 10) / 10 // assuming standard 1 HP pump (~3600 L/hr)

  return (
    <div className="page-container max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Droplets className="w-7 h-7 text-emerald-600" />
            Soil, Water & Irrigation Intelligence
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Certified soil test records, nutrient health analysis, and science-grounded irrigation scheduling
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2 text-sm px-4 py-2"
          >
            <Plus className="w-4 h-4" />
            Add Soil Health Card
          </button>
        </div>
      </div>

      {/* Trust Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs md:text-sm text-amber-800 flex items-start gap-2.5">
        <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Agricultural Integrity Guarantee: </span>
          AGRI SMART never pretends to measure pH or chemical nutrient levels from ordinary mobile photos. 
          Real soil management requires government lab or certified Soil Health Card (SHC) testing.
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="flex border-b border-gray-200 gap-2">
        <button
          onClick={() => setActiveTab('tests')}
          className={`py-2 px-4 text-sm font-semibold rounded-t-lg border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'tests'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <FlaskConical className="w-4 h-4" />
          Soil Health Cards ({soilTests.length})
        </button>
        <button
          onClick={() => setActiveTab('irrigation')}
          className={`py-2 px-4 text-sm font-semibold rounded-t-lg border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'irrigation'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Droplets className="w-4 h-4" />
          Irrigation Scheduler
        </button>
        <button
          onClick={() => setActiveTab('suitability')}
          className={`py-2 px-4 text-sm font-semibold rounded-t-lg border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'suitability'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          Soil Types & Crop Suitability
        </button>
      </div>

      {/* TAB 1: SOIL HEALTH CARDS */}
      {activeTab === 'tests' && (
        <div className="space-y-6">
          {soilTests.map((test) => {
            const nRating = getRating(test.nitrogen, 280, 560)
            const pRating = getRating(test.phosphorus, 10, 25)
            const kRating = getRating(test.potassium, 110, 280)
            const ocRating = getRating(test.organicCarbon, 0.5, 0.75)

            return (
              <div key={test.id} className="card border border-gray-200 shadow-sm p-6 space-y-5 bg-white">
                <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-gray-100 gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="badge-green font-semibold">{test.farmName}</span>
                      <span className="text-xs text-gray-500">Tested: {test.date}</span>
                    </div>
                    <h2 className="text-base font-bold text-gray-800 mt-1">
                      {test.soilType}
                    </h2>
                    <p className="text-xs text-gray-500">Testing Lab: {test.lab || 'Government Approved Laboratory'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs text-gray-400">Soil Reaction</div>
                      <div className="text-sm font-bold text-emerald-700">
                        pH {test.ph} ({test.ph < 6.5 ? 'Acidic' : test.ph > 7.5 ? 'Alkaline' : 'Neutral'})
                      </div>
                    </div>
                    <button
                      onClick={() => setSoilTests(soilTests.filter(t => t.id !== test.id))}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded transition"
                      title="Delete Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Key Chemical Indicators Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Nitrogen */}
                  <div className="p-3.5 rounded-lg border border-gray-100 bg-gray-50">
                    <div className="text-xs text-gray-500 font-medium">Available Nitrogen (N)</div>
                    <div className="text-lg font-bold text-gray-900 mt-1">{test.nitrogen} <span className="text-xs font-normal">kg/ha</span></div>
                    <div className={`mt-2 inline-block px-2 py-0.5 rounded text-xs border font-medium ${nRating.color}`}>
                      {nRating.text}
                    </div>
                  </div>

                  {/* Phosphorus */}
                  <div className="p-3.5 rounded-lg border border-gray-100 bg-gray-50">
                    <div className="text-xs text-gray-500 font-medium">Phosphorus (P₂O₅)</div>
                    <div className="text-lg font-bold text-gray-900 mt-1">{test.phosphorus} <span className="text-xs font-normal">kg/ha</span></div>
                    <div className={`mt-2 inline-block px-2 py-0.5 rounded text-xs border font-medium ${pRating.color}`}>
                      {pRating.text}
                    </div>
                  </div>

                  {/* Potassium */}
                  <div className="p-3.5 rounded-lg border border-gray-100 bg-gray-50">
                    <div className="text-xs text-gray-500 font-medium">Potassium (K₂O)</div>
                    <div className="text-lg font-bold text-gray-900 mt-1">{test.potassium} <span className="text-xs font-normal">kg/ha</span></div>
                    <div className={`mt-2 inline-block px-2 py-0.5 rounded text-xs border font-medium ${kRating.color}`}>
                      {kRating.text}
                    </div>
                  </div>

                  {/* Organic Carbon */}
                  <div className="p-3.5 rounded-lg border border-gray-100 bg-gray-50">
                    <div className="text-xs text-gray-500 font-medium">Organic Carbon (OC)</div>
                    <div className="text-lg font-bold text-gray-900 mt-1">{test.organicCarbon}%</div>
                    <div className={`mt-2 inline-block px-2 py-0.5 rounded text-xs border font-medium ${ocRating.color}`}>
                      {ocRating.text}
                    </div>
                  </div>
                </div>

                {/* Practical Soil Improvement Advice */}
                <div className="bg-emerald-50/70 border border-emerald-100 rounded-lg p-4 space-y-2">
                  <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    Agronomist Soil Amendment Recommendations
                  </div>
                  <ul className="text-xs text-emerald-900 space-y-1 list-disc list-inside">
                    {test.nitrogen < 280 && (
                      <li>Apply 25 kg/acre Urea split into two doses or incorporate Farm Yard Manure (FYM) 5 tonnes/acre.</li>
                    )}
                    {test.phosphorus < 15 && (
                      <li>Apply Single Super Phosphate (SSP) or DAP at sowing to correct low phosphorus.</li>
                    )}
                    {test.ph < 6.0 && (
                      <li>Acidic soil detected: Broadcast agricultural lime (200-250 kg/acre) before harrowing to raise pH.</li>
                    )}
                    {test.organicCarbon < 0.6 && (
                      <li>Organic carbon is low: Grow green manure crops like Sunhemp or Dhaincha and incorporate before flowering.</li>
                    )}
                    <li>Maintain balanced N:P:K ratio (typically 4:2:1 for cereal crops like Ragi and Paddy).</li>
                  </ul>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* TAB 2: IRRIGATION SCHEDULER */}
      {activeTab === 'irrigation' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls */}
          <div className="card border border-gray-200 p-5 space-y-4 bg-white lg:col-span-1">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <Droplets className="w-5 h-5 text-emerald-600" />
              Field Parameters
            </h2>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Crop</label>
              <select
                value={cropType}
                onChange={(e) => setCropType(e.target.value)}
                className="w-full text-sm border-gray-300 rounded-md shadow-sm p-2"
              >
                {Object.keys(baseWaterNeeds).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Plot Area (Acres)</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={cropAreaAcres}
                onChange={(e) => setCropAreaAcres(parseFloat(e.target.value) || 1)}
                className="w-full text-sm border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Growth Stage</label>
              <select
                value={growthStage}
                onChange={(e) => setGrowthStage(e.target.value)}
                className="w-full text-sm border-gray-300 rounded-md shadow-sm p-2"
              >
                <option value="seedling">Seedling / Germination</option>
                <option value="vegetative">Active Vegetative</option>
                <option value="flowering">Flowering / Grain Filling (Peak)</option>
                <option value="maturity">Maturity / Pre-harvest</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Irrigation Method</label>
              <select
                value={irrigationMethod}
                onChange={(e) => setIrrigationMethod(e.target.value)}
                className="w-full text-sm border-gray-300 rounded-md shadow-sm p-2"
              >
                <option value="drip">Drip Irrigation (92% Efficiency)</option>
                <option value="sprinkler">Sprinkler System (82% Efficiency)</option>
                <option value="furrow">Furrow Irrigation (70% Efficiency)</option>
                <option value="flood">Flood Irrigation (60% Efficiency)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Recent Rainfall in Past 48h (mm)
              </label>
              <input
                type="number"
                min="0"
                value={recentRainMm}
                onChange={(e) => setRecentRainMm(parseFloat(e.target.value) || 0)}
                className="w-full text-sm border-gray-300 rounded-md shadow-sm p-2"
              />
              <p className="text-xs text-gray-400 mt-1">From local automatic weather station</p>
            </div>
          </div>

          {/* Results Output */}
          <div className="card border border-gray-200 p-6 space-y-5 bg-white lg:col-span-2">
            <h2 className="text-base font-bold text-gray-800 flex items-center justify-between">
              <span>Irrigation Schedule Recommendation</span>
              <span className="badge-green text-xs">Dynamic Climate-Adjusted</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center">
                <div className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Net Water Needed Today</div>
                <div className="text-3xl font-extrabold text-emerald-900 mt-2">
                  {netDailyRequirement.toLocaleString()}
                </div>
                <div className="text-xs text-emerald-700 mt-1">Liters for {cropAreaAcres} acres</div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-center">
                <div className="text-xs font-bold text-blue-800 uppercase tracking-wide">Pumping Duration (Est.)</div>
                <div className="text-3xl font-extrabold text-blue-900 mt-2">
                  {pumpHours} <span className="text-base font-medium">Hours</span>
                </div>
                <div className="text-xs text-blue-700 mt-1">Based on standard 1HP pump rate</div>
              </div>
            </div>

            {/* Weather Rain credit banner */}
            {recentRainMm > 0 && (
              <div className="bg-blue-50/70 border border-blue-100 rounded-lg p-3 text-xs text-blue-900 flex items-center gap-2">
                <CloudRain className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  <strong>Rainfall Credit Applied:</strong> {recentRainMm} mm of recent rain saved approximately{' '}
                  {Math.round(rainCreditLiters / 3).toLocaleString()} liters of groundwater today!
                </span>
              </div>
            )}

            {/* Smart Irrigation Tips */}
            <div className="border border-gray-100 rounded-lg p-4 bg-gray-50 space-y-2">
              <div className="text-xs font-bold text-gray-700">Best Watering Practice:</div>
              <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                <li>Run irrigation in the early morning (6:00 AM – 9:00 AM) or late evening (after 5:30 PM) to avoid solar evaporative loss.</li>
                <li>At flowering stage, maintain adequate soil moisture — moisture stress at this stage can reduce grain formation by 30-40%.</li>
                <li>Avoid flood irrigation where possible; drip systems reduce water consumption by 40-50% and weed infestation by 60%.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SOIL TYPES & SUITABILITY */}
      {activeTab === 'suitability' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SOIL_TYPES.map((soil) => (
            <div key={soil.id} className="card border border-gray-200 p-5 bg-white space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{soil.name}</h3>
                  <div className="text-xs text-emerald-700 font-semibold mt-0.5">Optimal pH: {soil.ph_range}</div>
                </div>
                <Layers className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase">Best Suitable Crops:</div>
                <p className="text-xs text-gray-800 mt-1">{soil.crops}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: ADD SOIL HEALTH CARD */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-gray-900">Add Soil Health Card Data</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
            </div>

            <form onSubmit={handleAddTest} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Testing Laboratory / Source</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KVK Mandya / Soil Testing Lab UAS Bangalore"
                  value={newTest.lab}
                  onChange={(e) => setNewTest({ ...newTest, lab: e.target.value })}
                  className="w-full border-gray-300 rounded p-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Test Date</label>
                  <input
                    type="date"
                    required
                    value={newTest.date}
                    onChange={(e) => setNewTest({ ...newTest, date: e.target.value })}
                    className="w-full border-gray-300 rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Farm Plot</label>
                  <input
                    type="text"
                    required
                    value={newTest.farmName}
                    onChange={(e) => setNewTest({ ...newTest, farmName: e.target.value })}
                    className="w-full border-gray-300 rounded p-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Soil Type</label>
                <select
                  value={newTest.soilType}
                  onChange={(e) => setNewTest({ ...newTest, soilType: e.target.value })}
                  className="w-full border-gray-300 rounded p-2 text-xs"
                >
                  {SOIL_TYPES.map(st => (
                    <option key={st.id} value={st.name}>{st.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Soil pH (0 - 14)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="3"
                    max="10"
                    required
                    value={newTest.ph}
                    onChange={(e) => setNewTest({ ...newTest, ph: e.target.value })}
                    className="w-full border-gray-300 rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">EC (dS/m)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={newTest.ec}
                    onChange={(e) => setNewTest({ ...newTest, ec: e.target.value })}
                    className="w-full border-gray-300 rounded p-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">N (kg/ha)</label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={newTest.nitrogen}
                    onChange={(e) => setNewTest({ ...newTest, nitrogen: e.target.value })}
                    className="w-full border-gray-300 rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">P₂O₅ (kg/ha)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={newTest.phosphorus}
                    onChange={(e) => setNewTest({ ...newTest, phosphorus: e.target.value })}
                    className="w-full border-gray-300 rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">K₂O (kg/ha)</label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={newTest.potassium}
                    onChange={(e) => setNewTest({ ...newTest, potassium: e.target.value })}
                    className="w-full border-gray-300 rounded p-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Organic Carbon (%)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.1"
                  max="5"
                  required
                  value={newTest.organicCarbon}
                  onChange={(e) => setNewTest({ ...newTest, organicCarbon: e.target.value })}
                  className="w-full border-gray-300 rounded p-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs px-4 py-2"
                >
                  Save Soil Health Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
