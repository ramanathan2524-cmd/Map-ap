# API Reference

Base URL: `http://localhost:4000/api/v1`

Interactive docs (Swagger UI): `http://localhost:4000/api-docs`

---

## GEO Endpoints

All geo endpoints return a `GeoJSON FeatureCollection`.

### `GET /geo/state`
Returns the merged Andhra Pradesh state boundary.

### `GET /geo/districts`
Returns all district boundaries with election results.

**Query Parameters:**

| Param     | Type   | Description               |
|-----------|--------|---------------------------|
| `year`    | number | Election year (default: 2024) |

**Response:**
```json
{
  "success": true,
  "data": {
    "type": "FeatureCollection",
    "features": [{
      "type": "Feature",
      "geometry": { "type": "MultiPolygon", "coordinates": [...] },
      "properties": {
        "id": "clxyz123",
        "name": "Visakhapatnam",
        "level": "district",
        "total_voters": 3200000,
        "winning_party": "YSRCP",
        "margin": 42856,
        "party_results": [...]
      }
    }]
  }
}
```

### `GET /geo/mp-constituencies`
Returns all MP constituency boundaries.

### `GET /geo/mla-constituencies`
Returns all MLA constituency boundaries.

### `GET /geo/mandals`
Returns all mandal boundaries.

### `GET /geo/villages`
Returns village boundaries (limited to 5000 per request).

---

## Results Endpoints

### `GET /results/:level/:id`
Get election statistics for a specific region.

**Path params:** `level` = `district | mp_constituency | mla_constituency | mandal`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clxyz123",
    "level": "district",
    "winningParty": "YSRCP",
    "winningPartyColor": "#1565C0",
    "marginOfVictory": 42856,
    "totalVoters": 3200000,
    "totalVotesCast": 2304000,
    "voterTurnoutPercent": 72.0,
    "partyResults": [
      {
        "partyId": "p1",
        "partyCode": "YSRCP",
        "partyName": "YSR Congress Party",
        "color": "#1565C0",
        "votes": 980000,
        "voteSharePercent": 42.5,
        "candidateName": "V. Vijayasai Reddy"
      }
    ]
  }
}
```

### `GET /results/booths`
Get booth markers for a viewport bounding box.

**Query Parameters:**

| Param              | Type   | Required | Description                    |
|--------------------|--------|----------|--------------------------------|
| `north`            | number | No       | Bounding box north latitude    |
| `south`            | number | No       | Bounding box south latitude    |
| `east`             | number | No       | Bounding box east longitude    |
| `west`             | number | No       | Bounding box west longitude    |
| `districtId`       | string | No       | Filter by district             |
| `mpConstituencyId` | string | No       | Filter by MP constituency      |
| `mlaConstituencyId`| string | No       | Filter by MLA constituency     |
| `mandalId`         | string | No       | Filter by mandal               |
| `partyId`          | string | No       | Filter by winning party        |
| `page`             | number | No       | Page number (default: 1)       |
| `limit`            | number | No       | Max records (default: 500, max: 1000) |
| `year`             | number | No       | Election year (default: 2024)  |

### `GET /results/booths/:id`
Get full details for a single booth.

### `GET /results/party/:partyId`
Get all regions won by a specific party.

### `GET /results/summary/state`
Get state-level seat tally by party.

---

## Lookup Endpoints

### `GET /lookup/parties?year=2024`
Returns all parties that contested in the given election year.

### `GET /lookup/districts`
Returns all districts (id, name, code).

### `GET /lookup/mp-constituencies?districtId=xxx`
Returns MP constituencies (optionally filtered by district).

### `GET /lookup/mla-constituencies?mpId=xxx`
Returns MLA constituencies (optionally filtered by MP constituency).

### `GET /lookup/mandals?mlaId=xxx`
Returns mandals (optionally filtered by MLA constituency).

### `GET /lookup/villages?mandalId=xxx`
Returns villages within a mandal.

### `GET /lookup/search?q=Visakha`
Full-text search across districts, constituencies, mandals, and villages.

**Response:**
```json
{
  "success": true,
  "data": [
    { "type": "district",          "id": "clxyz1", "name": "Visakhapatnam" },
    { "type": "mp_constituency",   "id": "clxyz2", "name": "Visakhapatnam North" },
    { "type": "mla_constituency",  "id": "clxyz3", "name": "Visakha West" }
  ]
}
```
