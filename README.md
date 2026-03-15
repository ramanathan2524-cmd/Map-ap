# 🗺️ AP Election Map — Getting Started

Interactive political map for Andhra Pradesh — from State down to booth level.

---

## ✅ Prerequisites

Install these before starting:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | v20+ | https://nodejs.org |
| Docker Desktop | latest | https://www.docker.com/products/docker-desktop |
| Git | any | https://git-scm.com |

---

## 🚀 Start the App (Step by Step)

### Step 1 — Extract & Enter the project

```bash
cd ap-election-map
```

### Step 2 — Start the Database (Docker)

```bash
docker-compose up postgres redis -d
```

Wait ~10 seconds. Verify both containers are running:
```bash
docker-compose ps
```

### Step 3 — Install dependencies

```bash
cd backend && npm install && cd ../frontend && npm install && cd ..
```

### Step 4 — Set up environment files

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```
Default values work out of the box — no changes needed for local dev.

### Step 5 — Set up the database

```bash
cd backend

# Create all tables
npx prisma migrate dev --name init
npx prisma generate

# Apply PostGIS geometry columns
docker exec -i ap_map_postgres psql -U postgres -d ap_election_map \
  < migrations/001_init_postgis_geometry.sql

# Load sample data (parties, constituencies, booths, results)
npx ts-node src/scripts/seed.ts

cd ..
```

### Step 6 — Start the Backend API

Open a **new terminal**:
```bash
cd ap-election-map/backend
npm run dev
```
Expected output:
```
✅ PostgreSQL connected
🚀 AP Election Map API running on http://localhost:4000
```

### Step 7 — Start the Frontend

Open **another new terminal**:
```bash
cd ap-election-map/frontend
npm run dev
```
Expected output:
```
➜  Local:   http://localhost:3000/
```

### Step 8 — Open the App

👉 **http://localhost:3000**

---

## 🗺️ How to Use the Map

| Action | What happens |
|--------|-------------|
| **Zoom in** | Reveals Districts → MP → MLA → Mandals → Booths progressively |
| **Click a region** | Opens stats panel with vote breakdown |
| **Left panel** | Filter by Party, District, Constituency, Mandal |
| **Breadcrumb (top-left)** | Navigate back up the hierarchy |
| **Zoom indicator (bottom-right)** | Shows current visible level |
| **Legend (bottom-left)** | Party color codes |

---

## 🔑 Key URLs

| URL | Description |
|-----|-------------|
| http://localhost:3000 | Frontend map |
| http://localhost:4000/health | API health check |
| http://localhost:4000/api-docs | Swagger API docs |

---

## 🛑 Stopping

```bash
# Ctrl+C in both terminal windows, then:
docker-compose down
```

---

## ⚠️ Troubleshooting

**Cannot connect to database**
```bash
docker-compose restart postgres
docker exec ap_map_postgres pg_isready -U postgres
```

**Port already in use**
```bash
lsof -ti:3000 | xargs kill -9   # free port 3000
lsof -ti:4000 | xargs kill -9   # free port 4000
```

**Map shows grey / no colors**
```bash
cd backend && npx ts-node src/scripts/seed.ts
```

**Prisma client error**
```bash
cd backend && npx prisma generate
```

---

## 📂 Adding Real Data

Place `.geojson` boundary files in `data/geojson/` then:
```bash
cd backend
npx ts-node ../scripts/importGeoJSON.ts -- --level=district --file=../data/geojson/districts.geojson
npx ts-node ../scripts/importGeoJSON.ts -- --level=mla      --file=../data/geojson/mla_constituencies.geojson
```
See `data/geojson/README.md` for recommended data sources.

---

## 🐳 All-in-One Docker

```bash
docker-compose up --build -d
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npx ts-node src/scripts/seed.ts
# Open http://localhost:3000
```

---

## 📚 Documentation

| File | Contents |
|------|----------|
| `docs/architecture.md` | System design & data flow |
| `docs/api-reference.md` | Full REST API reference |
| `docs/data-dictionary.md` | DB schema and field descriptions |
| `docs/data-pipeline.md` | Import GeoJSON and CSV results |
| `docs/deployment.md` | Production deployment guide |

---

# Original Project Details

A data-driven election intelligence platform for visualizing and analyzing political performance across Andhra Pradesh — from State level down to individual polling booths.

---

## 📐 Architecture Overview

```
ap-election-map/
├── frontend/          # React + Leaflet map application
├── backend/           # Node.js + Express + PostGIS API
├── shared/            # Shared TypeScript types & constants
├── data/              # GeoJSON boundary files & sample datasets
├── docker/            # Docker & docker-compose configuration
├── scripts/           # DevOps and data pipeline scripts
└── docs/              # Architecture, API reference, data dictionary
```

---

## 🗂️ Geographic Hierarchy

```
Andhra Pradesh (State)
  └── Districts (13)
        └── Parliamentary Constituencies / MP (25)
              └── Assembly Constituencies / MLA (175)
                    └── Mandals (~664)
                          └── Villages (~28,000)
                                └── Booths (~1,09,000)
```

---

## 🛠️ Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | React 18, Leaflet / MapLibre GL JS  |
| State Mgmt  | Zustand                             |
| Styling     | Tailwind CSS + CSS Modules          |
| Backend     | Node.js, Express, TypeScript        |
| Database    | PostgreSQL 15 + PostGIS 3.3         |
| ORM         | Prisma                              |
| Cache       | Redis                               |
| Tiles       | Martin (vector tile server)         |
| DevOps      | Docker, docker-compose              |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 15 with PostGIS extension

### 1. Clone and install

```bash
git clone https://github.com/your-org/ap-election-map.git
cd ap-election-map

# Install root workspace dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..

# Install backend dependencies
cd backend && npm install && cd ..
```

### 2. Environment setup

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit both files with your credentials
```

### 3. Start with Docker (recommended)

```bash
docker-compose up -d
```

### 4. Run database migrations & seed

```bash
cd backend
npm run migrate
npm run seed
```

### 5. Start development servers

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

The app will be running at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **API Docs**: http://localhost:4000/api-docs

---

## 📦 Data Pipeline

See [docs/data-pipeline.md](docs/data-pipeline.md) for instructions on:
- Importing GeoJSON boundary files
- Loading booth-level election results
- Running spatial indexing

---

## 📚 Documentation

- [Architecture Overview](docs/architecture.md)
- [API Reference](docs/api-reference.md)
- [Data Dictionary](docs/data-dictionary.md)
- [Data Pipeline](docs/data-pipeline.md)
- [Deployment Guide](docs/deployment.md)

---

## 🧪 Testing

```bash
# Frontend unit tests
cd frontend && npm test

# Backend unit + integration tests
cd backend && npm test

# E2E tests (Playwright)
npm run test:e2e
```

---

## 📄 License

MIT © Your Organization
