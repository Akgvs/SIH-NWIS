# NWIS — Nearby Wells Intelligence System

> **eRTMAC-NWIS**: Proactive Drilling Risk Intelligence Powered by Offset Well History  
> Hackathon MVP for **Oil India Limited**

---

## Stack

| Layer      | Technology                                            |
|------------|-------------------------------------------------------|
| Frontend   | React 18 + Vite + Tailwind CSS + Leaflet + Recharts   |
| Backend    | Node.js + Express + ws (WebSockets)                   |
| Database   | PostgreSQL + PostGIS                                  |
| Spatial    | ST_DWithin, ST_Distance (no manual lat/lon arithmetic)|

---

## Quick Start

### 1. Prerequisites

- Node.js ≥ 20
- PostgreSQL ≥ 14 with PostGIS extension

```bash
# Install PostGIS (Ubuntu/Debian)
sudo apt install postgis postgresql-14-postgis-3

# Create database
psql -U postgres -c "CREATE DATABASE nwis_db;"
psql -U postgres -d nwis_db -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

### 2. Backend

```bash
cd backend

# Copy env and configure database credentials
cp .env.example .env
# Edit .env — set DATABASE_URL

# Install dependencies
npm install

# Apply schema
npm run schema

# Seed synthetic data (~15 wells, ~200 events, thousands of parameters)
npm run seed

# Start dev server
npm run dev
# → http://localhost:8000
# → ws://localhost:8000/ws/well/{id}
```

### 3. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server (Vite proxy handles /api and /ws)
npm run dev
# → http://localhost:5173
```

---

## Features

### Geospatial
- **PostGIS ST_DWithin** radius queries (5 / 10 / 25 / 50 km)
- **ST_Distance** for well-to-well distance in kilometres
- Interactive **Leaflet** map with dark tiles, coloured markers, radius circle

### Operations Dashboard
- Live KPI cards: Current Depth, Formation, ROP, Risk Level
- Real-time parameter telemetry (8 gauges with sparklines)
- Nearby wells table with Compare buttons

### Alert Engine (Deterministic — No AI)
Four rule-based rules run at every simulated depth step:

| Rule | Trigger |
|------|---------|
| Historical Proximity | Current depth within ±50m of historical event |
| Formation Risk | Formation has ≥3 historical events across nearby wells |
| Multi-Well Correlation | ≥2 wells experienced same event type near current depth |
| Parameter Threshold | Torque > 95 kN·m, ECD > 1.25 SG, ROP drops > 30% |

### Correlation Engine (Deterministic Scoring)
```
same formation          +50
depth diff ≤ 10m        +40
depth diff ≤ 25m        +25
depth diff ≤ 50m        +10
relative formation depth ≤ 20m  +30
relative formation depth ≤ 50m  +15
well distance < 5km     +20
well distance < 10km    +10
```

### Live Simulation
WebSocket endpoint: `ws://localhost:8000/ws/well/{id}`

Send `{ "action": "START" }` to begin simulation.  
At each depth step, the alert engine runs and pushes `ALERTS` messages.

```json
{ "type": "DRILLING_DATA", "data": { "depth": 2860, "rop": 11.2, ... } }
{ "type": "ALERTS", "depth": 2860, "alerts": [ ... ] }
```

### Source Document Traceability
```
Mud Loss @ 2862m
Source: OIL-103_DDR_20210320.pdf
Page: 17
```

---

## Pages

| Page | Path | Description |
|------|------|-------------|
| Dashboard | `/` | Main ops screen — map, live data, alerts |
| Nearby Wells | `/nearby` | Spatial radius query + map |
| Well Details | `/well?id=` | 5-tab well info page |
| Events Intelligence | `/events` | Filterable event timeline |
| Well Comparison | `/comparison?active=&offset=` | Side-by-side comparison |
| Alert Centre | `/alerts` | Manual alert engine query |
| Settings | `/settings` | Threshold configuration reference |

---

## Project Structure

```
nwis/
├── backend/
│   ├── src/
│   │   ├── index.js              ← Express + WebSocket server
│   │   ├── config.js             ← All settings from .env
│   │   ├── db/pool.js            ← pg connection pool + helpers
│   │   ├── routes/               ← REST API endpoints
│   │   ├── services/
│   │   │   ├── wellService.js    ← PostGIS queries
│   │   │   ├── correlationService.js ← Deterministic scoring engine
│   │   │   ├── alertService.js   ← 4-rule alert engine
│   │   │   └── ertmacService.js  ← MockERTMACDataProvider
│   │   └── seed/
│   │       ├── schema.sql        ← PostGIS schema
│   │       └── seedData.js       ← Synthetic data generator
│   └── package.json
└── frontend/
    └── src/
        ├── pages/                ← Dashboard, NearbyWells, etc.
        ├── components/           ← Map, AlertPanel, EventTimeline, etc.
        ├── services/api.js       ← REST client
        ├── services/websocket.js ← WebSocket client
        └── hooks/useRealtimeWell.js
```

---

## Future AI Integration Points

```
HistoricalCorrelationEngine (abstract)
        ↑
DeterministicCorrelationEngine  ← current
(future) MLCorrelationEngine

DocumentProcessor
  → currently: stores & links PDF references
  → future: OCR → NLP → LLM extraction → Knowledge Repository
```

---

> Synthetic data only. Not actual Oil India well data.
