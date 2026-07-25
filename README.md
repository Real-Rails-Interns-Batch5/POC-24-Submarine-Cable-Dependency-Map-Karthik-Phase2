# Submarine Cable Dependency Map

A Real Rails Global Infrastructure Intelligence Dashboard designed to visualize submarine cable networks, analyze ownership concentration, evaluate infrastructure resilience, and simulate network disruptions.

## Overview

The Submarine Cable Dependency Map transforms complex subsea infrastructure data into an interactive intelligence platform for exploring global cable connectivity, landing point ecosystems, ownership influence, and operational risk.

Built as part of the Real Rails Intelligence Library, the platform combines geospatial infrastructure visualization with backend-powered intelligence services to provide a comprehensive view of critical internet infrastructure.

## Features

### Infrastructure Intelligence

* Global submarine cable network visualization
* Landing point connectivity analysis
* Regional infrastructure coverage assessment
* Network health monitoring
* Infrastructure resilience scoring

### Ownership Analytics

* Cable ownership concentration analysis
* Hyperscaler influence monitoring
* Regional ownership breakdowns
* Recharts-powered intelligence visualizations

### Failure Simulation

* Cable disruption simulation
* Capacity loss assessment
* Alternative route recommendations
* Risk narrative generation
* Resilience impact analysis

### Operational Dashboard

* Real Rails 70/30 intelligence layout
* Unified Intelligence Sidebar
* Infrastructure KPI monitoring
* Dynamic filtering and exploration
* Infrastructure intelligence reporting

---

## Technology Stack

### Frontend

* Next.js 14
* TypeScript
* React
* Tailwind CSS
* Leaflet
* React Leaflet
* Recharts

### Backend

* FastAPI
* Python
* Pydantic
* Uvicorn

### Data Layer

* GeoJSON Infrastructure Pipeline
* Cached JSON Data Services
* Simulation Engine
* Intelligence Services

---

## Architecture

Frontend (Next.js)
↓
API Layer (lib/api.ts)
↓
FastAPI Backend
↓
Intelligence Services
↓
Infrastructure Data Store

### Backend Services

#### Network API

* Network overview metrics
* Infrastructure assessment
* Health monitoring

#### Cable API

* Cable intelligence
* Landing point data
* Regional filtering

#### Ownership API

* Ownership concentration
* Country intelligence
* Ownership analytics

#### Simulation API

* Cable cut simulation
* Impact assessment
* Scenario history

---

## Running Locally

### Frontend

```bash
npm install
npm run dev
```

Frontend runs on:

```bash
http://localhost:3000
```

### Backend

Install dependencies:

```bash
pip install -r backend/requirements.txt
```

Run backend:

```bash
python run.py
```

or

```bash
python -m uvicorn backend.main:app --reload
```

Backend runs on:

```bash
http://127.0.0.1:8000
```

Swagger Documentation:

```bash
http://127.0.0.1:8000/docs
```

---

## Environment Variables

Create `.env.local`

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

No API keys are required.

No Mapbox tokens are required.

The application uses Leaflet with open map tiles.

---

## Real Rails Compliance

The platform follows the Real Rails design system:

* Obsidian Theme (#030712)
* Strict 70/30 Intelligence Layout
* Unified Intelligence Sidebar
* Infrastructure-first terminology
* Recharts analytics
* GeoJSON-based mapping architecture
* Operational intelligence workflows

---

## Current Status

Phase 1 fully operational.

The platform includes:

* Global cable visualization
* Landing point intelligence
* Ownership concentration analytics
* Infrastructure resilience assessment
* Failure simulation workflows
* FastAPI backend services
* Frontend-backend integration
* Operational intelligence dashboards

---

## Deployment on Render

This project includes a pre-configured Render Blueprint (`render.yaml`) for 1-click deployment on [Render.com](https://render.com).

### Deployment Steps:
1. Push your repository to GitHub.
2. Log in to Render.com and select **New + -> Blueprint**.
3. Connect your GitHub repository. Render will automatically detect `render.yaml` and configure both the `submarine-cable-backend` and `submarine-cable-frontend` Docker services in the `oregon` region.
4. Click **Apply**.

> [!NOTE]
> **Free-Tier Cold Starts**: Render free-tier instances automatically spin down after 15 minutes of inactivity. When accessing the app after spin-down, the initial page load or API request may take **30–60 seconds** while the instances spin up. This is normal free-tier behavior and not a deployment bug.

---

## Future Improvements

* Advanced infrastructure risk modeling
* Real-world cable datasets
* Historical outage analysis
* Infrastructure event monitoring
* Enhanced route intelligence
* Deployment and cloud hosting
* Persistent simulation history

---

## Author

**Karthik L**

Real Rails Intelligence Library — POC #24

Global Infrastructure Rail
