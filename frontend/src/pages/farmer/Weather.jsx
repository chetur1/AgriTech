/**
 * AGRI SMART — Weather & Climate Intelligence Page
 * File: frontend/src/pages/farmer/Weather.jsx
 */

import { useState, useEffect } from 'react'
import {
  Cloud, Sun, CloudRain, Wind, Droplets, Compass,
  AlertTriangle, CheckCircle2, RefreshCw, MapPin,
  Calendar, ShieldAlert, Sparkles, ChevronDown
} from 'lucide-react'
import { farmAPI } from '../../services/api'
import LoadingScreen from '../../components/ui/LoadingScreen'

const DISTRICTS = [
  'Mandya', 'Bengaluru Urban', 'Bengaluru Rural', 'Mysuru', 'Hassan',
  'Belagavi', 'Dharwad', 'Ballari', 'Kalaburagi', 'Shivamogga',
  'Tumakuru', 'Kolar', 'Chikkaballapur', 'Udupi', 'Dakshina Kannada'
]

export default function WeatherPage() {
  const [weather, setWeather] = useState(null)
  const [farms, setFarms] = useState([])
  const [selectedFarmId, setSelectedFarmId] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('Mandya')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadFarmsAndWeather() {
      try {
        const farmsData = await farmAPI.list()
        setFarms(farmsData || [])
        if (farmsData && farmsData.length > 0) {
          setSelectedFarmId(farmsData[0].id)
          await fetchWeatherForFarm(farmsData[0].id)
        } else {
          await fetchWeatherForDistrict('Mandya')
        }
      } catch (err) {
        console.error('Initial weather load error:', err)
        await fetchWeatherForDistrict('Mandya')
      } finally {
        setLoading(false)
      }
    }
    loadFarmsAndWeather()
  }, [])

  const fetchWeatherForFarm = async (farmId) => {
    setRefreshing(true)
    setError('')
    try {
      const res = await fetch(`/api/v1/weather/farm/${farmId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('agrismart_token')}`
        }
      })
      if (!res.ok) throw new Error('Failed to fetch farm weather')
      const data = await res.json()
      setWeather(data)
    } catch (err) {
      console.error('Farm weather error:', err)
      setError('Could not retrieve hyper-local weather for this farm.')
    } finally {
      setRefreshing(false)
    }
  }

  const fetchWeatherForDistrict = async (dist) => {
    setRefreshing(true)
    setError('')
    try {
      const res = await fetch(`/api/v1/weather/forecast?district=${encodeURIComponent(dist)}`)
      if (!res.ok) throw new Error('Failed to fetch district weather')
      const data = await res.json()
      setWeather(data)
    } catch (err) {
      console.error('District weather error:', err)
      setError('Could not retrieve meteorological data.')
    } finally {
      setRefreshing(false)
    }
  }

  const handleFarmSelect = (e) => {
    const val = e.target.value
    setSelectedFarmId(val)
    if (val) {
      fetchWeatherForFarm(val)
    }
  }

  const handleDistrictSelect = (e) => {
    const dist = e.target.value
    setSelectedDistrict(dist)
    setSelectedFarmId('')
    fetchWeatherForDistrict(dist)
  }

  const handleUseGPS = () => {
    if ('geolocation' in navigator) {
      setRefreshing(true)
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude
          const lon = pos.coords.longitude
          try {
            const res = await fetch(`/api/v1/weather/forecast?lat=${lat}&lon=${lon}`)
            const data = await res.json()
            setWeather(data)
            setSelectedFarmId('')
            setSelectedDistrict(`GPS (${lat.toFixed(2)}, ${lon.toFixed(2)})`)
          } catch (err) {
            alert('Failed to fetch weather for your GPS position.')
          } finally {
            setRefreshing(false)
          }
        },
        () => {
          alert('GPS location permission denied.')
          setRefreshing(false)
        }
      )
    }
  }

  if (loading && !weather) {
    return <LoadingScreen message="Loading live weather intelligence..." />
  }

  const current = weather?.current
  const advisories = weather?.advisories
  const forecast = weather?.forecast_7days || []
  const hourly = weather?.hourly_24h || []

  return (
    <div className="page-container space-y-6">

      {/* Top Header & Selectors */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Weather & Climate Intelligence</h1>
            <span className="badge-green">Phase 4 Live</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Hyper-local forecasts, spraying windows, and weather-based irrigation advisories.
          </p>
        </div>

        {/* Location Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {farms.length > 0 && (
            <div className="relative">
              <select
                value={selectedFarmId}
                onChange={handleFarmSelect}
                className="input py-1.5 text-xs font-semibold pl-3 pr-8"
              >
                <option value="">Select Registered Farm</option>
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>
                    🚜 {f.name} ({f.district})
                  </option>
                ))}
              </select>
            </div>
          )}

          <select
            value={selectedDistrict}
            onChange={handleDistrictSelect}
            className="input py-1.5 text-xs pl-3 pr-8"
          >
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>
                📍 {d} District
              </option>
            ))}
          </select>

          <button
            onClick={handleUseGPS}
            className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1 shrink-0"
            title="Use Device GPS"
          >
            <Compass className="w-3.5 h-3.5 text-primary-600" />
            <span className="hidden sm:inline">My GPS</span>
          </button>

          <button
            onClick={() => {
              if (selectedFarmId) fetchWeatherForFarm(selectedFarmId)
              else fetchWeatherForDistrict(selectedDistrict)
            }}
            disabled={refreshing}
            className="p-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-gray-600 transition-colors"
            title="Refresh Weather"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-primary-600' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="alert-error flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Hero Current Conditions Card */}
      {current && (
        <div className="card bg-gradient-to-br from-emerald-800 via-primary-700 to-teal-800 text-white border-0 shadow-lg p-6 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-primary-200 text-xs font-medium mb-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>
                  {weather.farm_name ? `${weather.farm_name} • ${weather.farm_district}` : selectedDistrict} (Karnataka)
                </span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-6xl font-extrabold tracking-tight">{current.temperature}°</span>
                <span className="text-2xl font-light text-primary-200">C</span>
                <span className="text-lg font-medium text-primary-100 ml-2">{current.condition}</span>
              </div>
              <p className="text-xs text-primary-200 mt-1">
                Feels like <strong>{current.apparent_temperature}°C</strong> &bull; Humidity: <strong>{current.humidity}%</strong>
              </p>
            </div>

            {/* Weather Metrics Pill Grid */}
            <div className="grid grid-cols-3 gap-3 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/15">
              <div className="text-center">
                <Wind className="w-5 h-5 text-primary-200 mx-auto mb-1" />
                <span className="text-xs text-primary-200 block">Wind Speed</span>
                <span className="text-sm font-bold">{current.wind_speed} <span className="text-[10px] font-normal">km/h</span></span>
              </div>
              <div className="text-center">
                <Droplets className="w-5 h-5 text-primary-200 mx-auto mb-1" />
                <span className="text-xs text-primary-200 block">Humidity</span>
                <span className="text-sm font-bold">{current.humidity}%</span>
              </div>
              <div className="text-center">
                <CloudRain className="w-5 h-5 text-primary-200 mx-auto mb-1" />
                <span className="text-xs text-primary-200 block">Rain (Today)</span>
                <span className="text-sm font-bold">{current.precipitation_mm} <span className="text-[10px] font-normal">mm</span></span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-primary-200 gap-1">
            <span>Provider: {weather.source}</span>
            <span>Recorded at: {weather.last_updated}</span>
          </div>
        </div>
      )}

      {/* Severe Weather Alerts if any */}
      {advisories?.alerts && advisories.alerts.length > 0 && (
        <div className="space-y-3">
          {advisories.alerts.map((al, idx) => (
            <div key={idx} className="p-4 bg-red-50 border-l-4 border-l-red-600 rounded-r-xl flex items-start gap-3">
              <ShieldAlert className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-red-900">{al.title}</h4>
                <p className="text-xs text-red-700 mt-1">{al.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Agronomic Action Advisories: Spraying & Irrigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Spraying Advisory Card */}
        <div className="card border-l-4 border-l-primary-600 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary-600" />
                <h3 className="font-bold text-gray-900 text-sm">Chemical & Pesticide Spray Window</h3>
              </div>
              <span className={advisories?.spraying?.recommended ? 'badge-green' : 'badge-yellow'}>
                {advisories?.spraying?.status || 'Analyzing'}
              </span>
            </div>
            <p className="text-xs text-gray-600 mb-3">
              Based on wind velocity, precipitation forecast, and solar intensity:
            </p>
            <ul className="space-y-1.5 text-xs text-gray-700">
              {advisories?.spraying?.reasons?.map((reason, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-600 shrink-0 mt-1.5"></span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-[11px] text-gray-400 mt-4 pt-2 border-t border-gray-100">
            Advisory rule: Avoid spraying when wind &gt; 20 km/h or rain is expected within 24 hours.
          </p>
        </div>

        {/* Irrigation Advisory Card */}
        <div className="card border-l-4 border-l-blue-600 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Droplets className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900 text-sm">Weather-Based Irrigation Guide</h3>
              </div>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                advisories?.irrigation?.action === 'HOLD'
                  ? 'bg-amber-100 text-amber-800'
                  : advisories?.irrigation?.action === 'REDUCE'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                Action: {advisories?.irrigation?.action}
              </span>
            </div>
            <p className="text-xs font-medium text-gray-800 mb-2">
              {advisories?.irrigation?.guidance}
            </p>
            <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-900 space-y-1">
              <div className="flex justify-between">
                <span>Forecasted 48-Hour Rainfall:</span>
                <strong>{advisories?.irrigation?.expected_rain_48h_mm} mm</strong>
              </div>
              <div className="flex justify-between">
                <span>Recommended Method:</span>
                <strong>Drip / Precision Tubing</strong>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-4 pt-2 border-t border-gray-100">
            Prevents root waterlogging, saves electricity, and maintains optimal soil aeration.
          </p>
        </div>
      </div>

      {/* 7-Day Agricultural Forecast */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-600" />
            <h2 className="font-bold text-gray-900 text-base">7-Day Farming Weather Forecast</h2>
          </div>
          <span className="text-xs text-gray-500">Karnataka Agro-Climatic Zone</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
          {forecast.map((day, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border text-center transition-all ${
                idx === 0
                  ? 'bg-primary-50/50 border-primary-200 ring-1 ring-primary-300'
                  : 'bg-gray-50 border-gray-100 hover:bg-gray-100/70'
              }`}
            >
              <p className="text-xs font-bold text-gray-700">{idx === 0 ? 'Today' : day.day_name}</p>
              <p className="text-[10px] text-gray-400 mb-2">{day.date.slice(5)}</p>

              <div className="my-2">
                <CloudRain className="w-6 h-6 mx-auto text-primary-600" />
              </div>

              <p className="text-xs font-bold text-gray-800">
                {Math.round(day.temp_max)}° <span className="text-gray-400 font-normal">/ {Math.round(day.temp_min)}°</span>
              </p>
              <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">{day.label}</p>

              {/* Rain chance pill */}
              <div className="mt-2 pt-2 border-t border-gray-200/60 flex items-center justify-center gap-1 text-[10px] text-blue-600 font-medium">
                <Droplets className="w-3 h-3" />
                <span>{day.precipitation_probability}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hourly 24-Hour Timeline */}
      {hourly.length > 0 && (
        <div className="card">
          <h3 className="font-bold text-gray-900 text-sm mb-3">24-Hour Temperature & Rain Probability</h3>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
            {hourly.map((h, i) => (
              <div key={i} className="flex-shrink-0 text-center p-2.5 bg-gray-50 rounded-lg min-w-[70px] border border-gray-100">
                <span className="text-xs text-gray-500 font-medium block">{h.time}</span>
                <span className="text-sm font-bold text-gray-800 my-1 block">{Math.round(h.temp)}°</span>
                <span className="text-[10px] text-blue-600 font-semibold block">{h.rain_prob}% rain</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Educational Agricultural Callout */}
      <div className="card bg-earth-50 border-earth-100 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-earth-700 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-bold text-earth-900">Why Weather Intelligence Protects Farm Profits</h4>
          <p className="text-xs text-earth-700 mt-1 leading-relaxed">
            Pesticide sprays applied in wind speeds above 20 km/h suffer up to 40% drift loss. Similarly, pausing
            irrigation when rainfall is forecast within 48 hours conserves pumping electricity, protects fertilizer
            from leaching into deep subsoil, and prevents root rot.
          </p>
        </div>
      </div>

    </div>
  )
}
