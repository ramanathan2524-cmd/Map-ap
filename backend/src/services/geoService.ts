import { prisma } from "../config/database";
import { AppError } from "../utils/errors";
import { buildGeoJSON } from "../utils/geoUtils";
import { PARTY_COLORS } from "@shared/constants";
import type { MapFilters } from "@shared/types";

export class GeoService {
  // ── State ────────────────────────────────────────────────────────────────
  async getStateBoundary() {
    const result = await prisma.$queryRaw<any[]>`
      SELECT
        'ap' AS id,
        'Andhra Pradesh' AS name,
        'state' AS level,
        ST_AsGeoJSON(ST_Union(geom))::json AS geometry
      FROM districts
    `;
    return buildGeoJSON(result.map((r) => ({
      ...r,
      geometry: r.geometry,
    })));
  }

  // ── Districts ────────────────────────────────────────────────────────────
  async getDistricts(filters: MapFilters = {}) {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT
        d.id,
        d.name,
        d.code,
        'district'          AS level,
        d.total_voters,
        er.winning_party,
        er.margin_of_victory AS margin,
        er.party_results,
        ST_AsGeoJSON(d.geom)::json AS geometry
      FROM districts d
      LEFT JOIN election_results er
        ON er.region_id = d.id AND er.region_level = 'district'
        AND er.election_year = 2024
      ORDER BY d.name
    `;
    return buildGeoJSON(rows);
  }

  // ── MP Constituencies ────────────────────────────────────────────────────
  async getMPConstituencies(filters: MapFilters = {}) {
    const whereClause = filters.districtId
      ? `WHERE mp.district_id = ${filters.districtId}`
      : "";

    const rows = await prisma.$queryRaw<any[]>`
      SELECT
        mp.id,
        mp.name,
        mp.code,
        mp.number,
        'mp_constituency'   AS level,
        mp.district_id      AS parent_id,
        mp.total_voters,
        er.winning_party,
        er.margin_of_victory AS margin,
        er.party_results,
        ST_AsGeoJSON(mp.geom)::json AS geometry
      FROM mp_constituencies mp
      LEFT JOIN election_results er
        ON er.region_id = mp.id AND er.region_level = 'mp_constituency'
        AND er.election_year = 2024
      ORDER BY mp.number
    `;
    return buildGeoJSON(rows);
  }

  // ── MLA Constituencies ───────────────────────────────────────────────────
  async getMLAConstituencies(filters: MapFilters = {}) {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT
        mla.id,
        mla.name,
        mla.code,
        mla.number,
        'mla_constituency'     AS level,
        mla.mp_constituency_id AS parent_id,
        mla.total_voters,
        er.winning_party,
        er.margin_of_victory   AS margin,
        er.party_results,
        ST_AsGeoJSON(mla.geom)::json AS geometry
      FROM mla_constituencies mla
      LEFT JOIN election_results er
        ON er.region_id = mla.id AND er.region_level = 'mla_constituency'
        AND er.election_year = 2024
      ORDER BY mla.number
    `;
    return buildGeoJSON(rows);
  }

  // ── Mandals ──────────────────────────────────────────────────────────────
  async getMandals(filters: MapFilters = {}) {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT
        m.id,
        m.name,
        m.code,
        'mandal'               AS level,
        m.mla_constituency_id  AS parent_id,
        m.total_voters,
        er.winning_party,
        er.margin_of_victory   AS margin,
        er.party_results,
        ST_AsGeoJSON(m.geom)::json AS geometry
      FROM mandals m
      LEFT JOIN election_results er
        ON er.region_id = m.id AND er.region_level = 'mandal'
        AND er.election_year = 2024
      ORDER BY m.name
    `;
    return buildGeoJSON(rows);
  }

  // ── Villages ─────────────────────────────────────────────────────────────
  async getVillages(filters: MapFilters = {}) {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT
        v.id,
        v.name,
        v.code,
        'village'     AS level,
        v.mandal_id   AS parent_id,
        v.total_voters,
        ST_AsGeoJSON(v.geom)::json AS geometry
      FROM villages v
      ORDER BY v.name
      LIMIT 5000
    `;
    return buildGeoJSON(rows);
  }

  // ── Single region lookups ─────────────────────────────────────────────────
  async getDistrictById(id: string) {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT d.id, d.name, 'district' AS level,
             ST_AsGeoJSON(d.geom)::json AS geometry
      FROM districts d WHERE d.id = ${id}
    `;
    if (!rows.length) throw new AppError("District not found", 404);
    return buildGeoJSON(rows);
  }

  async getMPById(id: string) {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT mp.id, mp.name, 'mp_constituency' AS level,
             ST_AsGeoJSON(mp.geom)::json AS geometry
      FROM mp_constituencies mp WHERE mp.id = ${id}
    `;
    if (!rows.length) throw new AppError("MP Constituency not found", 404);
    return buildGeoJSON(rows);
  }

  async getMLAById(id: string) {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT mla.id, mla.name, 'mla_constituency' AS level,
             ST_AsGeoJSON(mla.geom)::json AS geometry
      FROM mla_constituencies mla WHERE mla.id = ${id}
    `;
    if (!rows.length) throw new AppError("MLA Constituency not found", 404);
    return buildGeoJSON(rows);
  }

  async getMandalById(id: string) {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT m.id, m.name, 'mandal' AS level,
             ST_AsGeoJSON(m.geom)::json AS geometry
      FROM mandals m WHERE m.id = ${id}
    `;
    if (!rows.length) throw new AppError("Mandal not found", 404);
    return buildGeoJSON(rows);
  }
}
