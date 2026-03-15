# Architecture Overview

## System Design

```
┌─────────────────────────────────────────────────────────────────────┐
│                        User's Browser                               │
│                                                                     │
│  ┌──────────┐  ┌──────────────────────────────┐  ┌─────────────┐  │
│  │  Filter  │  │      Leaflet Map Canvas       │  │   Sidebar   │  │
│  │  Panel   │  │  (GeoJSON layers + markers)   │  │  (Results)  │  │
│  └────┬─────┘  └──────────────┬───────────────┘  └──────┬──────┘  │
│       │                       │                          │         │
│  ┌────▼───────────────────────▼──────────────────────────▼──────┐  │
│  │                    React + Zustand Store                      │  │
│  │              @tanstack/react-query (data fetching)            │  │
│  └──────────────────────────┬────────────────────────────────────┘  │
└─────────────────────────────┼───────────────────────────────────────┘
                              │ HTTP/REST
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Node.js / Express API                           │
│                                                                     │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐                 │
│  │  /geo/*  │  │  /results/*  │  │  /lookup/*   │                 │
│  └────┬─────┘  └──────┬───────┘  └──────┬───────┘                 │
│       │               │                  │                         │
│  ┌────▼───────────────▼──────────────────▼──────┐                 │
│  │           Redis Cache (optional)              │                 │
│  └────┬───────────────────────────────────────────┘                │
│       │                                                             │
│  ┌────▼────────────────────────────────────────┐                  │
│  │         Prisma ORM + Raw SQL                │                  │
│  └────┬────────────────────────────────────────┘                  │
└───────┼─────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────┐
│     PostgreSQL 15 + PostGIS 3.3           │
│                                           │
│  ┌──────────────────────────────────────┐ │
│  │  Tables (with geometry columns):     │ │
│  │  • districts         (MULTIPOLYGON)  │ │
│  │  • mp_constituencies (MULTIPOLYGON)  │ │
│  │  • mla_constituencies(MULTIPOLYGON)  │ │
│  │  • mandals           (MULTIPOLYGON)  │ │
│  │  • villages          (MULTIPOLYGON)  │ │
│  │  • booths            (POINT)         │ │
│  │  • election_results  (JSONB results) │ │
│  │  • booth_results     (JSONB results) │ │
│  └──────────────────────────────────────┘ │
│                                           │
│  ┌──────────────────────────────────────┐ │
│  │  Spatial Indexes (GIST):             │ │
│  │  All geometry columns indexed        │ │
│  └──────────────────────────────────────┘ │
└───────────────────────────────────────────┘
        │
        ▼ (optional — vector tiles)
┌─────────────────────────────────┐
│   Martin Vector Tile Server     │
│   Serves MVT tiles on :3001     │
│   Used for high-zoom layers     │
└─────────────────────────────────┘
```

## Data Flow

### Map Load (State Level, Zoom 7)
1. Frontend loads, Zustand initializes with `currentLevel = "state"`
2. `GeoLayer` renders — only `district` layer is enabled at zoom 7
3. React Query fetches `/api/v1/geo/districts` (cached 30min)
4. Backend queries PostGIS: `SELECT ST_AsGeoJSON(geom) FROM districts JOIN election_results …`
5. GeoJSON returned, Leaflet renders colored polygons
6. Party colors applied from `winning_party` field

### Drill Down (Click District → Zoom to MP Level)
1. User clicks district polygon
2. `GeoLayer.onClick` fires → `setSelectedRegion(region)` + `pushBreadcrumb(…)`
3. Map flies to district bounds
4. Zoom increases → `ZoomTracker` detects new level → `setCurrentLevel("mp_constituency")`
5. `GeoLayer` now enables `mp_constituency` layer, disables `district` layer
6. React Query fetches `/api/v1/geo/mp-constituencies?districtId=xxx`
7. Sidebar opens with district statistics

### Booth Display (Zoom ≥ 15)
1. `currentZoom >= 15` → `BoothLayer` renders
2. React Query fetches `/api/v1/results/booths?bbox=…&limit=500`
3. Backend queries: `SELECT ST_Y(location), ST_X(location), … FROM booths WHERE ST_Within(location, bbox)`
4. Markers rendered with party-colored icons
5. Click → popup with full booth breakdown

## Caching Strategy

| Endpoint               | Redis TTL | Rationale                          |
|------------------------|-----------|------------------------------------|
| `/geo/districts`       | 30 min    | Boundaries never change            |
| `/geo/mp-*`            | 30 min    | Boundaries never change            |
| `/geo/mla-*`           | 30 min    | Boundaries never change            |
| `/results/:level/:id`  | 15 min    | Results static post-election       |
| `/results/booths`      | 5 min     | Bbox-specific, many cache keys     |
| `/lookup/*`            | 60 min    | Dropdown values rarely change      |

## Performance Optimizations

1. **PostGIS ST_Simplify** — reduce polygon complexity at lower zoom levels
2. **Bbox filtering** — booths only loaded for visible viewport
3. **React Query staleTime** — prevents redundant API calls
4. **Canvas renderer** — Leaflet `preferCanvas: true` for faster rendering
5. **Manual chunk splitting** — Leaflet/Recharts in separate bundles
6. **GIST spatial indexes** — fast bbox and point-in-polygon queries
7. **Martin vector tiles** — optionally replace GeoJSON with MVT for very large datasets
