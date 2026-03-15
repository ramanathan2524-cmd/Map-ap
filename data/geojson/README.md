# GeoJSON Boundary Files

Place your GeoJSON files here. Expected file names:

| File                          | Level              | Source |
|-------------------------------|--------------------|--------|
| `state.geojson`               | State boundary     | OGISL / BHUVAN / Survey of India |
| `districts.geojson`           | District polygons  | Datameet India GeoJSON / OGISL   |
| `mp_constituencies.geojson`   | Lok Sabha          | ECI / Datameet                   |
| `mla_constituencies.geojson`  | Assembly segments  | ECI / OGISL                      |
| `mandals.geojson`             | Mandal polygons    | OGISL / AP GIS Portal            |
| `villages.geojson`            | Village polygons   | OGISL / Village-level census     |

## Recommended Sources

1. **Datameet India GeoJSON** — https://github.com/datameet/maps
   - Covers districts and parliamentary constituencies
   - Free, CC-BY license

2. **OGISL (AP Government GIS)** — https://gis.ap.gov.in
   - Official state GIS portal for AP boundary data

3. **ECI Delimitation Orders** — https://eci.gov.in
   - PDF-based delimitation orders (require digitization)

4. **BHUVAN (ISRO)** — https://bhuvan.nrsc.gov.in
   - High-resolution India boundary data

## Required GeoJSON Feature Properties

### districts.geojson
```json
{
  "properties": {
    "id": "optional-cuid",
    "name": "Visakhapatnam",
    "code": "VISAKHA",
    "total_voters": 3200000
  }
}
```

### mp_constituencies.geojson
```json
{
  "properties": {
    "name": "Visakhapatnam",
    "code": "AP_MP_01",
    "number": 1,
    "district_id": "<district-cuid>"
  }
}
```

### mla_constituencies.geojson
```json
{
  "properties": {
    "name": "Bheemunipatnam",
    "code": "AP_MLA_001",
    "number": 1,
    "mp_constituency_id": "<mp-cuid>",
    "district_id": "<district-cuid>"
  }
}
```

### mandals.geojson
```json
{
  "properties": {
    "name": "Bheemunipatnam",
    "code": "AP_MAN_001",
    "mla_constituency_id": "<mla-cuid>",
    "district_id": "<district-cuid>"
  }
}
```

## Import Command

After placing your GeoJSON files, run:

```bash
# From project root
cd backend
npm run ts-node ../scripts/importGeoJSON.ts -- --level=district --file=../data/geojson/districts.geojson
npm run ts-node ../scripts/importGeoJSON.ts -- --level=mp       --file=../data/geojson/mp_constituencies.geojson
npm run ts-node ../scripts/importGeoJSON.ts -- --level=mla      --file=../data/geojson/mla_constituencies.geojson
npm run ts-node ../scripts/importGeoJSON.ts -- --level=mandal   --file=../data/geojson/mandals.geojson
```
