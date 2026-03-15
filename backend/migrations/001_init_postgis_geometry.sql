-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: 001_init_postgis_geometry
-- Adds PostGIS geometry columns and spatial indexes to all geo tables
-- Run AFTER prisma migrate creates the base tables
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- ── Add geometry columns ──────────────────────────────────────────────────────

-- Districts — MultiPolygon
SELECT AddGeometryColumn('districts', 'geom', 4326, 'MULTIPOLYGON', 2);
ALTER TABLE districts ALTER COLUMN geom SET NOT NULL;

-- MP Constituencies — MultiPolygon
SELECT AddGeometryColumn('mp_constituencies', 'geom', 4326, 'MULTIPOLYGON', 2);
ALTER TABLE mp_constituencies ALTER COLUMN geom SET NOT NULL;

-- MLA Constituencies — MultiPolygon
SELECT AddGeometryColumn('mla_constituencies', 'geom', 4326, 'MULTIPOLYGON', 2);
ALTER TABLE mla_constituencies ALTER COLUMN geom SET NOT NULL;

-- Mandals — MultiPolygon
SELECT AddGeometryColumn('mandals', 'geom', 4326, 'MULTIPOLYGON', 2);
ALTER TABLE mandals ALTER COLUMN geom SET NOT NULL;

-- Villages — MultiPolygon (or Polygon)
SELECT AddGeometryColumn('villages', 'geom', 4326, 'MULTIPOLYGON', 2);

-- Booths — Point
SELECT AddGeometryColumn('booths', 'location', 4326, 'POINT', 2);
ALTER TABLE booths ALTER COLUMN location SET NOT NULL;

-- ── Spatial indexes ───────────────────────────────────────────────────────────
CREATE INDEX idx_districts_geom          ON districts           USING GIST (geom);
CREATE INDEX idx_mp_constituencies_geom  ON mp_constituencies   USING GIST (geom);
CREATE INDEX idx_mla_constituencies_geom ON mla_constituencies  USING GIST (geom);
CREATE INDEX idx_mandals_geom            ON mandals             USING GIST (geom);
CREATE INDEX idx_villages_geom           ON villages            USING GIST (geom);
CREATE INDEX idx_booths_location         ON booths              USING GIST (location);

-- ── Performance indexes ───────────────────────────────────────────────────────
CREATE INDEX idx_election_results_region       ON election_results (region_id, region_level, election_year);
CREATE INDEX idx_election_results_party        ON election_results (winning_party_id, election_year);
CREATE INDEX idx_election_results_level_year   ON election_results (region_level, election_year);
CREATE INDEX idx_election_results_district     ON election_results (district_id, election_year);
CREATE INDEX idx_election_results_mp           ON election_results (mp_constituency_id, election_year);
CREATE INDEX idx_election_results_mla          ON election_results (mla_constituency_id, election_year);

CREATE INDEX idx_booth_results_booth_year ON booth_results (booth_id, election_year);
CREATE INDEX idx_booth_results_party      ON booth_results (winning_party_id, election_year);

CREATE INDEX idx_booths_district    ON booths (district_id);
CREATE INDEX idx_booths_mp          ON booths (mp_constituency_id);
CREATE INDEX idx_booths_mla         ON booths (mla_constituency_id);
CREATE INDEX idx_booths_mandal      ON booths (mandal_id);
CREATE INDEX idx_booths_village     ON booths (village_id);

-- ── Full-text search indexes ──────────────────────────────────────────────────
CREATE INDEX idx_districts_name_fts      ON districts           USING GIN (to_tsvector('english', name));
CREATE INDEX idx_mp_const_name_fts       ON mp_constituencies   USING GIN (to_tsvector('english', name));
CREATE INDEX idx_mla_const_name_fts      ON mla_constituencies  USING GIN (to_tsvector('english', name));
CREATE INDEX idx_mandals_name_fts        ON mandals             USING GIN (to_tsvector('english', name));
CREATE INDEX idx_villages_name_fts       ON villages            USING GIN (to_tsvector('english', name));

-- ── Helper view: state summary ────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_state_summary AS
SELECT
  er.election_year,
  er.winning_party,
  p.name                                                       AS party_name,
  p.color                                                      AS party_color,
  COUNT(*) FILTER (WHERE er.region_level = 'mla_constituency') AS mla_seats,
  COUNT(*) FILTER (WHERE er.region_level = 'mp_constituency')  AS mp_seats,
  SUM(er.total_voters) FILTER (WHERE er.region_level = 'mla_constituency') AS total_voters
FROM election_results er
LEFT JOIN parties p ON p.id = er.winning_party_id
WHERE er.region_level IN ('mla_constituency', 'mp_constituency')
GROUP BY er.election_year, er.winning_party, p.name, p.color
ORDER BY er.election_year DESC, mla_seats DESC;
