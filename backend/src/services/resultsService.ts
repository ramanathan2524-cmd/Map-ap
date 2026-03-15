import { prisma } from "../config/database";
import { AppError } from "../utils/errors";
import { PARTY_COLORS, PARTY_NAMES } from "@shared/constants";
import type { GeoLevel } from "@shared/types";

interface BoothParams {
  bbox?: { north: number; south: number; east: number; west: number };
  districtId?: string;
  mpConstituencyId?: string;
  mlaConstituencyId?: string;
  mandalId?: string;
  villageId?: string;
  partyId?: string;
  page: number;
  limit: number;
  year: number;
}

export class ResultsService {
  // ── Region stats ──────────────────────────────────────────────────────────
  async getRegionStats(regionId: string, level: GeoLevel, year: number) {
    const result = await prisma.$queryRaw<any[]>`
      SELECT
        r.region_id         AS id,
        r.region_level      AS level,
        r.winning_party,
        r.margin_of_victory AS margin_of_victory,
        r.total_voters,
        r.total_votes_cast,
        r.voter_turnout_percent,
        r.party_results
      FROM election_results r
      WHERE r.region_id = ${regionId}
        AND r.region_level = ${level}
        AND r.election_year = ${year}
      LIMIT 1
    `;

    if (!result.length) throw new AppError("No results found for this region", 404);

    const row = result[0];
    return this._formatRegion(row);
  }

  // ── Booths ────────────────────────────────────────────────────────────────
  async getBooths(params: BoothParams) {
    const {
      bbox, districtId, mpConstituencyId, mlaConstituencyId,
      mandalId, villageId, partyId, page, limit, year,
    } = params;

    const offset = (page - 1) * limit;

    // Build WHERE clauses
    const conditions: string[] = [`br.election_year = ${year}`];

    if (bbox) {
      conditions.push(`
        ST_Within(
          b.location,
          ST_MakeEnvelope(${bbox.west}, ${bbox.south}, ${bbox.east}, ${bbox.north}, 4326)
        )
      `);
    }
    if (districtId)         conditions.push(`b.district_id = '${districtId}'`);
    if (mpConstituencyId)   conditions.push(`b.mp_constituency_id = '${mpConstituencyId}'`);
    if (mlaConstituencyId)  conditions.push(`b.mla_constituency_id = '${mlaConstituencyId}'`);
    if (mandalId)           conditions.push(`b.mandal_id = '${mandalId}'`);
    if (villageId)          conditions.push(`b.village_id = '${villageId}'`);
    if (partyId)            conditions.push(`br.winning_party_id = '${partyId}'`);

    const whereSQL = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const rows = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        b.id,
        b.booth_number,
        b.village_id,
        b.village_name,
        b.mandal_id,
        b.mandal_name,
        b.mla_constituency_id,
        b.mla_constituency_name,
        b.mp_constituency_id,
        b.district_id,
        ST_Y(b.location::geometry) AS latitude,
        ST_X(b.location::geometry) AS longitude,
        b.total_voters,
        br.total_votes_cast,
        br.voter_turnout_percent,
        br.winning_party,
        br.party_results
      FROM booths b
      JOIN booth_results br ON br.booth_id = b.id
      ${whereSQL}
      ORDER BY b.booth_number
      LIMIT ${limit} OFFSET ${offset}
    `);

    const countRows = await prisma.$queryRawUnsafe<any[]>(`
      SELECT COUNT(*)::int AS total
      FROM booths b
      JOIN booth_results br ON br.booth_id = b.id
      ${whereSQL}
    `);

    const total = countRows[0]?.total ?? 0;
    const data = rows.map((r) => this._formatBooth(r));

    return { data, total };
  }

  // ── Single booth ──────────────────────────────────────────────────────────
  async getBoothDetail(boothId: string, year: number) {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT
        b.id, b.booth_number,
        b.village_id, b.village_name,
        b.mandal_id, b.mandal_name,
        b.mla_constituency_id, b.mla_constituency_name,
        b.mp_constituency_id, b.district_id,
        ST_Y(b.location::geometry) AS latitude,
        ST_X(b.location::geometry) AS longitude,
        b.total_voters,
        br.total_votes_cast,
        br.voter_turnout_percent,
        br.winning_party,
        br.party_results
      FROM booths b
      JOIN booth_results br ON br.booth_id = b.id AND br.election_year = ${year}
      WHERE b.id = ${boothId}
      LIMIT 1
    `;

    if (!rows.length) throw new AppError("Booth not found", 404);
    return this._formatBooth(rows[0]);
  }

  // ── Party performance ─────────────────────────────────────────────────────
  async getPartyPerformance(partyId: string, year: number) {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT
        er.region_id, er.region_level, er.winning_party,
        er.total_voters, er.party_results
      FROM election_results er
      WHERE er.election_year = ${year}
        AND er.winning_party_id = ${partyId}
      ORDER BY er.region_level, er.region_id
    `;
    return rows.map((r) => this._formatRegion(r));
  }

  // ── State summary ─────────────────────────────────────────────────────────
  async getStateSummary(year: number) {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT
        winning_party,
        COUNT(*) FILTER (WHERE region_level = 'mla_constituency') AS mla_seats,
        COUNT(*) FILTER (WHERE region_level = 'mp_constituency')  AS mp_seats,
        SUM(total_voters)                                          AS total_voters
      FROM election_results
      WHERE election_year = ${year}
        AND region_level IN ('mla_constituency', 'mp_constituency')
      GROUP BY winning_party
      ORDER BY mla_seats DESC
    `;

    return rows.map((r) => ({
      party: r.winning_party,
      color: PARTY_COLORS[r.winning_party] ?? PARTY_COLORS.OTH,
      name: PARTY_NAMES[r.winning_party] ?? r.winning_party,
      mlaSeats: Number(r.mla_seats),
      mpSeats: Number(r.mp_seats),
    }));
  }

  // ── Private formatters ────────────────────────────────────────────────────
  private _formatRegion(row: any) {
    return {
      id: row.id ?? row.region_id,
      level: row.level ?? row.region_level,
      winningParty: row.winning_party,
      winningPartyColor: PARTY_COLORS[row.winning_party] ?? PARTY_COLORS.OTH,
      marginOfVictory: row.margin_of_victory ?? 0,
      totalVoters: Number(row.total_voters ?? 0),
      totalVotesCast: Number(row.total_votes_cast ?? 0),
      voterTurnoutPercent: Number(row.voter_turnout_percent ?? 0),
      partyResults: this._parsePartyResults(row.party_results),
    };
  }

  private _formatBooth(row: any) {
    return {
      id: row.id,
      boothNumber: row.booth_number,
      villageId: row.village_id,
      villageName: row.village_name,
      mandalId: row.mandal_id,
      mandalName: row.mandal_name,
      mlaConstituencyId: row.mla_constituency_id,
      mlaConstituencyName: row.mla_constituency_name,
      mpConstituencyId: row.mp_constituency_id,
      districtId: row.district_id,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      totalVoters: Number(row.total_voters ?? 0),
      totalVotesCast: Number(row.total_votes_cast ?? 0),
      voterTurnoutPercent: Number(row.voter_turnout_percent ?? 0),
      winningParty: row.winning_party,
      partyResults: this._parsePartyResults(row.party_results),
    };
  }

  private _parsePartyResults(raw: any): any[] {
    const arr = typeof raw === "string" ? JSON.parse(raw) : (raw ?? []);
    return arr.map((p: any) => ({
      ...p,
      color: PARTY_COLORS[p.partyCode] ?? PARTY_COLORS.OTH,
      partyName: PARTY_NAMES[p.partyCode] ?? p.partyCode,
    }));
  }
}
