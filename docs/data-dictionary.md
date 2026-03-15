# Data Dictionary

## Geographic Hierarchy

| Level              | Count (Approx.) | Description                              |
|--------------------|-----------------|------------------------------------------|
| State              | 1               | Andhra Pradesh                           |
| Districts          | 26              | Administrative districts (post-2022)     |
| MP Constituencies  | 25              | Lok Sabha seats                          |
| MLA Constituencies | 175             | AP Legislative Assembly segments         |
| Mandals            | ~664            | Revenue mandals                          |
| Villages           | ~28,000         | Revenue villages and urban wards         |
| Booths             | ~1,09,000       | Individual polling stations              |

---

## Table Schemas

### `districts`
| Column        | Type             | Description              |
|---------------|------------------|--------------------------|
| id            | TEXT (CUID)      | Primary key              |
| name          | TEXT             | District name            |
| code          | TEXT (UNIQUE)    | Short code               |
| total_voters  | INTEGER          | Total registered voters  |
| geom          | MULTIPOLYGON     | PostGIS geometry (SRID 4326) |
| created_at    | TIMESTAMP        |                          |
| updated_at    | TIMESTAMP        |                          |

### `mp_constituencies`
| Column        | Type       | Description                          |
|---------------|------------|--------------------------------------|
| id            | TEXT       | Primary key                          |
| name          | TEXT       | Constituency name                    |
| code          | TEXT       | Unique code (e.g. AP_MP_01)          |
| number        | INTEGER    | Constituency number per ECI          |
| district_id   | TEXT (FK)  | Parent district                      |
| total_voters  | INTEGER    |                                      |
| geom          | MULTIPOLYGON | PostGIS geometry                   |

### `mla_constituencies`
| Column                | Type       | Description              |
|-----------------------|------------|--------------------------|
| id                    | TEXT       | Primary key              |
| name                  | TEXT       |                          |
| code                  | TEXT       | Unique code (AP_MLA_001) |
| number                | INTEGER    | ECI segment number       |
| mp_constituency_id    | TEXT (FK)  | Parent MP constituency   |
| district_id           | TEXT (FK)  | Parent district          |
| total_voters          | INTEGER    |                          |
| geom                  | MULTIPOLYGON |                        |

### `mandals`
| Column               | Type       | Description              |
|----------------------|------------|--------------------------|
| id                   | TEXT       | Primary key              |
| name                 | TEXT       |                          |
| code                 | TEXT       | Unique code              |
| mla_constituency_id  | TEXT (FK)  |                          |
| district_id          | TEXT (FK)  |                          |
| total_voters         | INTEGER    |                          |
| geom                 | MULTIPOLYGON |                        |

### `villages`
| Column      | Type   | Description              |
|-------------|--------|--------------------------|
| id          | TEXT   | Primary key              |
| name        | TEXT   |                          |
| code        | TEXT   | Unique code              |
| mandal_id   | TEXT   |                          |
| district_id | TEXT   |                          |
| total_voters| INTEGER|                          |
| geom        | MULTIPOLYGON |                    |

### `booths`
| Column                 | Type    | Description                     |
|------------------------|---------|---------------------------------|
| id                     | TEXT    | Primary key                     |
| booth_number           | TEXT    | Booth number (e.g. "001")       |
| village_id             | TEXT FK |                                 |
| village_name           | TEXT    | Denormalized for performance    |
| mandal_id              | TEXT FK |                                 |
| mandal_name            | TEXT    |                                 |
| mla_constituency_id    | TEXT FK |                                 |
| mla_constituency_name  | TEXT    |                                 |
| mp_constituency_id     | TEXT FK |                                 |
| district_id            | TEXT FK |                                 |
| total_voters           | INTEGER |                                 |
| location               | POINT   | PostGIS POINT (lng, lat)        |

### `election_results`
| Column                | Type    | Description                              |
|-----------------------|---------|------------------------------------------|
| id                    | TEXT    | Primary key                              |
| region_id             | TEXT    | ID of the region (district/mla/etc.)     |
| region_level          | TEXT    | `district`, `mla_constituency`, etc.     |
| election_year         | INTEGER | 2024, 2019, 2014                         |
| election_type         | TEXT    | `assembly`, `general`, `local`           |
| winning_party         | TEXT    | Party abbreviation                       |
| winning_party_id      | TEXT FK |                                          |
| winning_candidate     | TEXT    |                                          |
| total_votes_cast      | INTEGER |                                          |
| total_voters          | INTEGER |                                          |
| voter_turnout_percent | FLOAT   |                                          |
| margin_of_victory     | INTEGER | Votes between 1st and 2nd place          |
| party_results         | JSONB   | Array of `PartyResult` objects           |

### `party_results` (JSONB array element)
```json
{
  "partyId": "clxyz",
  "partyCode": "YSRCP",
  "votes": 412000,
  "voteSharePercent": 43.2,
  "candidateName": "V. Vijayasai Reddy"
}
```

### `booth_results`
| Column                | Type    | Description                |
|-----------------------|---------|----------------------------|
| id                    | TEXT    | Primary key                |
| booth_id              | TEXT FK |                            |
| election_year         | INTEGER |                            |
| winning_party         | TEXT    |                            |
| winning_party_id      | TEXT FK |                            |
| total_votes_cast      | INTEGER |                            |
| voter_turnout_percent | FLOAT   |                            |
| party_results         | JSONB   | Array of `PartyResult`     |

---

## Party Color Codes

| Party | Full Name                  | Hex Color |
|-------|----------------------------|-----------|
| YSRCP | YSR Congress Party         | `#1565C0` |
| TDP   | Telugu Desam Party         | `#FFD600` |
| JSP   | Jana Sena Party            | `#E53935` |
| INC   | Indian National Congress   | `#00897B` |
| BJP   | Bharatiya Janata Party     | `#FF6D00` |
| CPI   | Communist Party of India   | `#B71C1C` |
| IND   | Independent                | `#9E9E9E` |
| OTH   | Others                     | `#757575` |
