# 🌱 AGRI SMART (ಕೃಷಿ ಸ್ಮಾರ್ಟ್)
### Smart Farming. Better Decisions. Stronger Farmers.
> *"Don't make farmers understand technology. Make technology understand farmers."*

AGRI SMART is a production-oriented, full-stack agricultural intelligence platform engineered for Indian agriculture (prioritizing Karnataka while architected for pan-India deployment). It guides farmers throughout the agricultural lifecycle—from soil testing and crop selection to disease diagnosis, climate resilience, finance, and market selling.

---

## 🚀 Key Architectural Pillars

1. **Role-Based Access Control (RBAC):** Common authentication with isolated portals for **Farmers**, **Agricultural Experts**, and **Platform Administrators**.
2. **AI & Expert-in-the-Loop:** Neural network disease detection paired with a human expert verification workflow. AI outputs are clearly labelled as predictions; only verified experts can issue certified advisories.
3. **Zero Data Fabrication Guarantee:** Live weather, market prices, and government schemes are retrieved from verified public providers (Open-Meteo, AGMARKNET, data.gov.in, official ministry portals). If a live feed is unavailable, the UI transparently reports it as unavailable.
4. **Multilingual & Voice-First:** Native support for 5 regional languages (**Kannada, English, Hindi, Telugu, Tamil**) with Speech-to-Text and Text-to-Speech via Web Speech API.
5. **Offline-First PWA:** Built as an installable Progressive Web App with service worker caching for rural low-connectivity areas.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons, i18next, Vite PWA |
| **Backend** | Python 3.14 / 3.11, FastAPI, Pydantic v2, Uvicorn |
| **Database** | SQLite (Development) → PostgreSQL 16 (Production) via SQLAlchemy 2.0 |
| **Authentication** | JWT (python-jose) + Native Passlib/Bcrypt (Bcrypt 5.0 compatible) |
| **AI / ML & Vision** | PyTorch, MobileNetV3 / EfficientNet, PIL / OpenCV |
| **RAG Knowledge Base** | TF-IDF / Cosine Vector Space with ICAR / UAS Bangalore agronomic literature |
| **Containerization** | Docker, Docker Compose, Nginx Multi-stage proxy |

---

## 📱 Complete System Modules (12 Phases)

### 🌾 Farmer Portal (`/farmer/*`)
- **Dashboard (`/farmer/dashboard`):** Overview of active crops, today's tasks, live weather preview, disease alerts, mandi price highlights, and income/expense widget.
- **Weather & Climate (`/farmer/weather`):** 7-day hourly forecast, rainfall probability, severe storm/frost warnings, irrigation adjustments.
- **Farms & Crops (`/farmer/farms`, `/farmer/crops`):** Farm boundaries, soil type, irrigation sources, sowing-to-harvest calendar, activity logging (spraying, weeding, fertilizer).
- **AI Crop Intelligence (`/farmer/ai-diagnosis`):** Photo upload / camera capture, AI leaf disease classification, severity scoring, confidence rating, safe cultural and biological remedies, and request expert review.
- **Soil & Irrigation (`/farmer/soil`):** Soil health card entry (pH, N, P, K, Organic Carbon), fertilizer balance calculator, rainfall-credited daily water requirement estimator.
- **Market & Mandi (`/farmer/market`):** AGMARKNET mandi prices across Karnataka APMCs, MSP reference benchmarks, transport cost vs. profit calculator, produce listing registry.
- **Finance & Schemes (`/farmer/finance`):** Farm P&L ledger (Seed, Fertilizer, Labour, Equipment expenses vs Crop sale income), government subsidy directory (PM-KISAN, PMFBY, KCC, RKVY, SMAM).
- **Voice Assistant (`/farmer/voice`):** Hands-free Kannada/English/Hindi/Telugu/Tamil voice commands for weather queries, crop questions, and symptom advice.
- **Community Forum (`/farmer/community`):** Peer-to-peer farmer knowledge sharing with agronomist-verified answers and harmful content reporting.
- **Farm Progress (`/farmer/progress`):** Phenological stage tracking, harvest yield records (Qtl/Acre), CSV farm report export.
- **Notifications (`/farmer/notifications`):** Real-time weather advisories, expert consultation updates, scheme application alerts.
- **Settings (`/farmer/settings`):** Immediate language switching, SMS alert triggers, offline PWA cache manager.

### 🔬 Agricultural Expert Portal (`/expert/*`)
- **Expert Overview (`/expert/dashboard`):** Case queue metrics, pending AI diagnosis verifications, active farmer consultations.
- **Diagnosis Review (`/expert/diagnoses`):** Review farmer-submitted crop photos, accept/correct/reject AI labels, add chemical/biological recommendations.
- **Consultation Hub (`/expert/consultations`):** Direct threaded communication with farmers, quick-response agronomy templates.
- **Knowledge Base (`/expert/knowledge`):** UAS Bangalore package of practices reference library and grounded RAG tester.
- **Farmer Directory (`/expert/farmers`):** View registered farmers in the expert's assigned district/jurisdiction.

### 🛡 Administrator Portal (`/admin/*`)
- **Platform Analytics (`/admin/dashboard`):** User statistics, diagnosis volume, system health.
- **User Management (`/admin/users`):** View and manage farmer and expert accounts.
- **Expert Credential Verification (`/admin/experts`):** Review degree certificates, institution affiliations, and approve/reject pending expert applications.
- **Audit Logs (`/admin/audit-logs`):** Immutable log of all administrative actions, logins, and status updates.

---

## 🔑 Pre-Seeded Test Credentials

| Role | Mobile / Email | Password | Status |
|---|---|---|---|
| **Administrator** | `9999999999` / `admin@agrismart.in` | `Admin@AgriSmart2024` | Active |
| **Farmer (Basavaraj Patil)** | `9865432109` | `Farmer@1234` | Active |
| **Expert (Dr. Suresh Kumar)** | `9876500001` | `Expert@1234` | Verified & Approved |

---

## 💻 Local Windows Development Setup

### 1. Backend Setup
```powershell
cd C:\AgriTech\AGRI_SMART\backend

# Create virtual environment (Python 3.11 or 3.14)
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install dependencies (use --only-binary=:all: on Python 3.14)
pip install -r requirements.txt --only-binary=:all:

# Initialize database schema and admin account
python app/database/init_db.py

# Start FastAPI server
uvicorn app.main:app --host 127.0.0.1 --port 8000
```
- Interactive Swagger API docs: `http://127.0.0.1:8000/api/docs`
- Root health status: `http://127.0.0.1:8000/api/health`

### 2. Frontend Setup
```powershell
cd C:\AgriTech\AGRI_SMART\frontend

# Install Node dependencies
npm install

# Start Vite dev server
npm run dev

# Or build production PWA bundle
npm run build
```
- Access application in browser: `http://localhost:5173`

---

## 🐳 Production Deployment via Docker Compose

Run the entire four-tier stack (Frontend Nginx + FastAPI + PostgreSQL 16 + Redis 7) with a single command:

```bash
docker compose up -d --build
```

- Application Web UI: `http://localhost`
- Backend API Gateway: `http://localhost/api/`
- API Documentation: `http://localhost/api/docs`

To stop the services:
```bash
docker compose down
```

---

## 📜 Ethical Agricultural AI Policy

1. **No Hallucinated Diagnoses:** AI confidence below 75% triggers an automatic advisory recommending consultation with a local agricultural extension officer.
2. **Safe Chemical Dosage:** Dosage rates strictly follow ICAR / CIBRC approved recommendations; no fabricated chemical quantities.
3. **Protected Farmer Data:** Location coordinates are truncated to village/taluk level to preserve privacy; phone numbers are never shared publicly.
