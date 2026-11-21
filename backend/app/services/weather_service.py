"""
AGRI SMART — Weather Service (Open-Meteo Integration)
File: backend/app/services/weather_service.py

Hyper-local agricultural weather forecasting and agronomic advisories.
Uses Open-Meteo API — free, highly accurate, and requires no API key.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
import httpx

# Karnataka district default coordinates for quick lookup
KARNATAKA_COORDS = {
    "mandya": {"lat": 12.524, "lon": 76.897, "name": "Mandya"},
    "bengaluru urban": {"lat": 12.9716, "lon": 77.5946, "name": "Bengaluru Urban"},
    "bengaluru rural": {"lat": 13.2287, "lon": 77.5794, "name": "Bengaluru Rural"},
    "mysuru": {"lat": 12.2958, "lon": 76.6394, "name": "Mysuru"},
    "hassan": {"lat": 13.0033, "lon": 76.1004, "name": "Hassan"},
    "belagavi": {"lat": 15.8497, "lon": 74.4977, "name": "Belagavi"},
    "dharwad": {"lat": 15.4589, "lon": 75.0078, "name": "Dharwad"},
    "ballari": {"lat": 15.1394, "lon": 76.9214, "name": "Ballari"},
    "kalaburagi": {"lat": 17.3297, "lon": 76.8343, "name": "Kalaburagi"},
    "shivamogga": {"lat": 13.9299, "lon": 75.5681, "name": "Shivamogga"},
    "tumakuru": {"lat": 13.3392, "lon": 77.1015, "name": "Tumakuru"},
    "kolar": {"lat": 13.1367, "lon": 78.1291, "name": "Kolar"},
    "chikkaballapur": {"lat": 13.4355, "lon": 77.7275, "name": "Chikkaballapur"},
    "udupi": {"lat": 13.3409, "lon": 74.7421, "name": "Udupi"},
    "dakshina kannada": {"lat": 12.8703, "lon": 74.8806, "name": "Dakshina Kannada"},
}

WMO_CODES = {
    0: {"label": "Clear Sky", "icon": "sun", "color": "text-amber-500"},
    1: {"label": "Mainly Clear", "icon": "sun-cloud", "color": "text-amber-400"},
    2: {"label": "Partly Cloudy", "icon": "cloud-sun", "color": "text-sky-500"},
    3: {"label": "Overcast", "icon": "cloud", "color": "text-gray-500"},
    45: {"label": "Foggy", "icon": "cloud-fog", "color": "text-gray-400"},
    48: {"label": "Depositing Rime Fog", "icon": "cloud-fog", "color": "text-gray-400"},
    51: {"label": "Light Drizzle", "icon": "cloud-drizzle", "color": "text-blue-400"},
    53: {"label": "Moderate Drizzle", "icon": "cloud-drizzle", "color": "text-blue-500"},
    55: {"label": "Dense Drizzle", "icon": "cloud-drizzle", "color": "text-blue-600"},
    61: {"label": "Slight Rain", "icon": "cloud-rain", "color": "text-blue-500"},
    63: {"label": "Moderate Rain", "icon": "cloud-rain", "color": "text-blue-600"},
    65: {"label": "Heavy Rain", "icon": "cloud-rain-heavy", "color": "text-indigo-600"},
    71: {"label": "Slight Snow", "icon": "cloud-snow", "color": "text-sky-200"},
    80: {"label": "Slight Rain Showers", "icon": "cloud-rain", "color": "text-blue-500"},
    81: {"label": "Moderate Showers", "icon": "cloud-rain", "color": "text-blue-600"},
    82: {"label": "Violent Rain Showers", "icon": "cloud-rain-heavy", "color": "text-purple-600"},
    95: {"label": "Thunderstorm", "icon": "cloud-lightning", "color": "text-purple-600"},
    96: {"label": "Thunderstorm with Hail", "icon": "cloud-lightning", "color": "text-red-600"},
    99: {"label": "Severe Thunderstorm with Hail", "icon": "cloud-lightning", "color": "text-red-700"},
}


class WeatherService:
    BASE_URL = "https://api.open-meteo.com/v1/forecast"

    @classmethod
    async def get_forecast(cls, lat: float, lon: float) -> Dict[str, Any]:
        """
        Fetch real-time weather and 7-day forecast from Open-Meteo.
        """
        params = {
            "latitude": lat,
            "longitude": lon,
            "current": [
                "temperature_2m",
                "relative_humidity_2m",
                "apparent_temperature",
                "precipitation",
                "rain",
                "weather_code",
                "wind_speed_10m",
                "wind_direction_10m",
            ],
            "hourly": [
                "temperature_2m",
                "relative_humidity_2m",
                "precipitation_probability",
                "precipitation",
                "weather_code",
            ],
            "daily": [
                "weather_code",
                "temperature_2m_max",
                "temperature_2m_min",
                "precipitation_sum",
                "precipitation_probability_max",
                "wind_speed_10m_max",
            ],
            "timezone": "Asia/Kolkata",
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(cls.BASE_URL, params=params)
                res.raise_for_status()
                data = res.json()
        except Exception as e:
            # Fallback response if external API is unreachable or network blocked
            return cls._get_fallback_weather(lat, lon, str(e))

        return cls._format_weather_response(data, lat, lon)

    @classmethod
    def _format_weather_response(cls, data: Dict[str, Any], lat: float, lon: float) -> Dict[str, Any]:
        current = data.get("current", {})
        daily = data.get("daily", {})
        hourly = data.get("hourly", {})

        weather_code = current.get("weather_code", 0)
        code_info = WMO_CODES.get(weather_code, {"label": "Partly Cloudy", "icon": "cloud-sun", "color": "text-sky-500"})

        temp = current.get("temperature_2m", 28.0)
        humidity = current.get("relative_humidity_2m", 65.0)
        wind_speed = current.get("wind_speed_10m", 12.0)
        rain_current = current.get("rain", 0.0)

        # Build 7-day forecast array
        daily_forecast = []
        times = daily.get("time", [])
        codes = daily.get("weather_code", [])
        max_temps = daily.get("temperature_2m_max", [])
        min_temps = daily.get("temperature_2m_min", [])
        precip_sums = daily.get("precipitation_sum", [])
        precip_probs = daily.get("precipitation_probability_max", [])
        wind_maxs = daily.get("wind_speed_10m_max", [])

        total_rain_next_48h = 0.0
        for i in range(min(7, len(times))):
            w_code = codes[i] if i < len(codes) else 0
            w_info = WMO_CODES.get(w_code, {"label": "Clear", "icon": "sun", "color": "text-amber-500"})
            p_sum = precip_sums[i] if i < len(precip_sums) else 0.0
            if i < 2:
                total_rain_next_48h += p_sum

            daily_forecast.append({
                "date": times[i],
                "day_name": datetime.strptime(times[i], "%Y-%m-%d").strftime("%a"),
                "weather_code": w_code,
                "label": w_info["label"],
                "icon": w_info["icon"],
                "temp_max": max_temps[i] if i < len(max_temps) else temp + 3,
                "temp_min": min_temps[i] if i < len(min_temps) else temp - 5,
                "precipitation_mm": p_sum,
                "precipitation_probability": precip_probs[i] if i < len(precip_probs) else 0,
                "wind_speed_kmh": wind_maxs[i] if i < len(wind_maxs) else wind_speed,
            })

        # Next 24 hours sample
        hourly_samples = []
        h_times = hourly.get("time", [])[:24]
        h_temps = hourly.get("temperature_2m", [])[:24]
        h_probs = hourly.get("precipitation_probability", [])[:24]
        h_codes = hourly.get("weather_code", [])[:24]

        for i in range(len(h_times)):
            hourly_samples.append({
                "time": h_times[i].split("T")[1][:5],
                "temp": h_temps[i] if i < len(h_temps) else temp,
                "rain_prob": h_probs[i] if i < len(h_probs) else 0,
                "code": h_codes[i] if i < len(h_codes) else 0,
            })

        # Generate Agronomic Advisories
        advisories = cls._generate_agronomic_advisories(
            temp=temp,
            humidity=humidity,
            wind_speed=wind_speed,
            rain_48h=total_rain_next_48h,
            weather_code=weather_code,
        )

        return {
            "status": "live",
            "source": "Open-Meteo Weather API",
            "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S IST"),
            "coordinates": {"latitude": lat, "longitude": lon},
            "current": {
                "temperature": round(temp, 1),
                "apparent_temperature": round(current.get("apparent_temperature", temp), 1),
                "humidity": round(humidity, 0),
                "wind_speed": round(wind_speed, 1),
                "wind_direction": current.get("wind_direction_10m", 0),
                "precipitation_mm": round(rain_current, 1),
                "weather_code": weather_code,
                "condition": code_info["label"],
                "icon": code_info["icon"],
            },
            "forecast_7days": daily_forecast,
            "hourly_24h": hourly_samples,
            "advisories": advisories,
        }

    @classmethod
    def _generate_agronomic_advisories(
        cls, temp: float, humidity: float, wind_speed: float, rain_48h: float, weather_code: int
    ) -> Dict[str, Any]:
        """
        Produce rules-based agricultural guidance based on meteorological inputs.
        """
        # 1. Chemical / Pesticide Spray Window
        can_spray = True
        spray_reasons = []
        if wind_speed > 20:
            can_spray = False
            spray_reasons.append(f"High wind speed ({wind_speed} km/h) creates significant spray drift risk.")
        if rain_48h > 5 or weather_code in [61, 63, 65, 80, 81, 82, 95, 96, 99]:
            can_spray = False
            spray_reasons.append("Rainfall expected within 24-48 hours will wash away applied chemicals.")
        if temp > 35:
            spray_reasons.append("High temperatures increase chemical phytotoxicity. Prefer early morning (6:30 - 8:30 AM) spraying.")

        # 2. Irrigation Advice
        if rain_48h >= 15:
            irrigation_status = "HOLD"
            irrigation_msg = f"Hold irrigation: Substantial rainfall ({round(rain_48h, 1)} mm) forecast in the next 48 hours."
        elif rain_48h >= 5:
            irrigation_status = "REDUCE"
            irrigation_msg = "Light showers expected: Reduce irrigation volume by 40-50% to prevent root waterlogging."
        else:
            if temp > 33:
                irrigation_status = "IRRIGATE"
                irrigation_msg = "Dry & hot conditions: Maintain soil moisture through drip or evening furrow irrigation."
            else:
                irrigation_status = "NORMAL"
                irrigation_msg = "Normal irrigation schedule can be followed according to crop growth stage."

        # 3. Severe Weather Alerts
        alerts = []
        if weather_code in [95, 96, 99]:
            alerts.append({
                "type": "THUNDERSTORM_ALERT",
                "severity": "high",
                "title": "Severe Thunderstorm Warning",
                "message": "Strong gusts and lightning likely. Avoid staying in open fields or near tall trees.",
            })
        if rain_48h > 40:
            alerts.append({
                "type": "HEAVY_RAIN_ALERT",
                "severity": "high",
                "title": "Heavy Rainfall & Waterlogging Alert",
                "message": "Clear drainage channels to avoid root rot in pulse, vegetable, and cotton crops.",
            })
        if temp > 38:
            alerts.append({
                "type": "HEATWAVE_ALERT",
                "severity": "medium",
                "title": "Heatwave Advisory",
                "message": "Extreme daytime heat. Mulch soil to conserve root moisture and irrigate in late evenings.",
            })

        return {
            "spraying": {
                "recommended": can_spray,
                "status": "Optimal Window" if can_spray else "Unfavorable Window",
                "reasons": spray_reasons if spray_reasons else ["Low wind and dry weather ensure maximum pesticide efficacy."],
            },
            "irrigation": {
                "action": irrigation_status,
                "guidance": irrigation_msg,
                "expected_rain_48h_mm": round(rain_48h, 1),
            },
            "alerts": alerts,
        }

    @classmethod
    def _get_fallback_weather(cls, lat: float, lon: float, error_detail: str) -> Dict[str, Any]:
        """
        Clear fallback representation when external service is offline,
        as explicitly instructed in Core Principle 8 & Module 2 guidelines.
        """
        return {
            "status": "unavailable",
            "source": "Open-Meteo Weather API",
            "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S IST"),
            "coordinates": {"latitude": lat, "longitude": lon},
            "error_message": "Live meteorological server is currently unreachable. Real-time weather cannot be retrieved.",
            "current": None,
            "forecast_7days": [],
            "hourly_24h": [],
            "advisories": {
                "spraying": {"recommended": False, "status": "Data Unavailable", "reasons": ["Weather data currently offline."]},
                "irrigation": {"action": "OBSERVE_FIELD", "guidance": "Check physical soil moisture with finger probe before irrigating."},
                "alerts": [],
            },
        }
