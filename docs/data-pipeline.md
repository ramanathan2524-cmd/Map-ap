# Data Pipeline Guide

## Overview

The pipeline has three stages:
1. **Boundary Import** — Load GeoJSON/Shapefile boundaries into PostGIS
2. **Election Results Import** — Load CSV/Excel results per constituency/booth
3. **Aggregation** — Roll up booth results to mandal → MLA → MP → District

---

## Stage 1: Boundary Data

### Obtaining GeoJSON Boundaries

The recommended sources, in order of preference:

1. **Datameet India** — https://github.com/datameet/maps
   - `india-constituencies/` — Lok Sabha and Vidhan Sabha boundaries
   - `india-districts/` — District boundaries

2. **AP OGISL** — https://gis.ap.gov.in
   - Official state GIS portal; provides Mandal and Village boundaries

3. **BHUVAN ISRO** — https://bhuvan.nrsc.gov.in

### Converting Shapefiles to GeoJSON

```bash
# Install ogr2ogr (part of GDAL)
brew install gdal          # macOS
apt install gdal-bin       # Ubuntu

# Convert shapefile to GeoJSON (WGS84)
ogr2ogr \
  -f GeoJSON \
  -t_srs EPSG:4326 \
  ./data/geojson/districts.geojson \
  ./raw/AP_Districts.shp

# Simplify large files for web performance
ogr2ogr \
  -f GeoJSON \
  -t_srs EPSG:4326 \
  -simplify 0.001 \
  ./data/geojson/mandals_simplified.geojson \
  ./raw/AP_Mandals.shp
```

### Importing into PostGIS

```bash
# Start Docker stack
docker-compose up -d postgres

# Run the import script per level
cd backend

npx ts-node ../scripts/importGeoJSON.ts -- --level=district --file=../data/geojson/districts.geojson
npx ts-node ../scripts/importGeoJSON.ts -- --level=mp       --file=../data/geojson/mp_constituencies.geojson
npx ts-node ../scripts/importGeoJSON.ts -- --level=mla      --file=../data/geojson/mla_constituencies.geojson
npx ts-node ../scripts/importGeoJSON.ts -- --level=mandal   --file=../data/geojson/mandals.geojson
npx ts-node ../scripts/importGeoJSON.ts -- --level=village  --file=../data/geojson/villages.geojson

# Or use shp2pgsql for direct shapefile import (faster for large files)
shp2pgsql -s 4326 -a ./raw/AP_Districts.shp public.districts | psql $DATABASE_URL
```

---

## Stage 2: Election Results Import

### Expected CSV Format (Booth Level)

```csv
booth_number,village,mandal,mla_constituency,mp_constituency,district,total_voters,YSRCP_votes,TDP_votes,JSP_votes,INC_votes,BJP_votes,winning_party
001,Madhurawada,Bheemunipatnam,Bheemunipatnam,Visakhapatnam,Visakhapatnam,950,412,318,142,54,0,YSRCP
002,Kommadi,Bheemunipatnam,Bheemunipatnam,Visakhapatnam,Visakhapatnam,1120,367,489,178,0,56,TDP
```

### Importing Results

```bash
# Import booth-level results from CSV
cd backend
npx ts-node src/scripts/importResults.ts \
  --file=../data/results/ap_2024_booth_results.csv \
  --year=2024
```

---

## Stage 3: Aggregation

After importing booth results, run the aggregation to roll up to higher levels:

```sql
-- Aggregate booth results to mandal level
INSERT INTO election_results (region_id, region_level, election_year, ...)
SELECT
  b.mandal_id                  AS region_id,
  'mandal'                     AS region_level,
  br.election_year,
  SUM(CASE WHEN p.abbreviation = 'YSRCP' THEN /* votes */ ELSE 0 END) AS ysrcp_votes,
  ...
FROM booth_results br
JOIN booths b ON b.id = br.booth_id
GROUP BY b.mandal_id, br.election_year;
```

Or use the provided aggregation script:

```bash
cd backend
npx ts-node src/scripts/aggregateResults.ts --year=2024
```

---

## Booth Coordinate Sources

For booth latitude/longitude coordinates:

1. **ECI Polling Station Database** — Available via RTI request from your district Collector
2. **SVEEP Portal** — https://sveep.eci.gov.in — voter search can reveal booth locations
3. **Field Mapping** — Assign coordinates by matching booth addresses to Google Maps
4. **Google Maps API** — Geocode booth addresses in bulk using the Places API

### Geocoding Script

```bash
cd backend
npx ts-node src/scripts/geocodeBooths.ts \
  --input=../data/booths_without_coords.csv \
  --output=../data/booths_with_coords.csv
```

---

## Validation

After import, validate data integrity:

```sql
-- Check for booths missing coordinates
SELECT COUNT(*) FROM booths WHERE location IS NULL;

-- Check for regions missing geometry
SELECT COUNT(*) FROM districts WHERE geom IS NULL;

-- Check for election results coverage
SELECT region_level, COUNT(*) FROM election_results
WHERE election_year = 2024
GROUP BY region_level;

-- Verify spatial integrity
SELECT name FROM districts
WHERE NOT ST_IsValid(geom);
```
