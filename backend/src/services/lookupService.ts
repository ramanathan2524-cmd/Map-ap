import { prisma } from "../config/database";

export class LookupService {
  async getParties(year: number) {
    return prisma.$queryRaw<any[]>`
      SELECT DISTINCT
        p.id, p.name, p.abbreviation AS "abbreviation",
        p.color, p.logo_url AS "logoUrl"
      FROM parties p
      JOIN election_results er ON er.winning_party_id = p.id
        AND er.election_year = ${year}
      ORDER BY p.name
    `;
  }

  async getDistricts() {
    return prisma.$queryRaw<any[]>`
      SELECT id, name, code
      FROM districts
      ORDER BY name
    `;
  }

  async getMPConstituencies(districtId?: string) {
    if (districtId) {
      return prisma.$queryRaw<any[]>`
        SELECT id, name, code, number, district_id AS "districtId"
        FROM mp_constituencies
        WHERE district_id = ${districtId}
        ORDER BY number
      `;
    }
    return prisma.$queryRaw<any[]>`
      SELECT id, name, code, number, district_id AS "districtId"
      FROM mp_constituencies
      ORDER BY number
    `;
  }

  async getMLAConstituencies(mpId?: string) {
    if (mpId) {
      return prisma.$queryRaw<any[]>`
        SELECT id, name, code, number, mp_constituency_id AS "mpConstituencyId"
        FROM mla_constituencies
        WHERE mp_constituency_id = ${mpId}
        ORDER BY number
      `;
    }
    return prisma.$queryRaw<any[]>`
      SELECT id, name, code, number, mp_constituency_id AS "mpConstituencyId"
      FROM mla_constituencies
      ORDER BY number
    `;
  }

  async getMandals(mlaId?: string) {
    if (mlaId) {
      return prisma.$queryRaw<any[]>`
        SELECT id, name, code, mla_constituency_id AS "mlaConstituencyId"
        FROM mandals
        WHERE mla_constituency_id = ${mlaId}
        ORDER BY name
      `;
    }
    return prisma.$queryRaw<any[]>`
      SELECT id, name, code, mla_constituency_id AS "mlaConstituencyId"
      FROM mandals
      ORDER BY name
      LIMIT 500
    `;
  }

  async getVillages(mandalId?: string) {
    if (!mandalId) return [];
    return prisma.$queryRaw<any[]>`
      SELECT id, name, code, mandal_id AS "mandalId"
      FROM villages
      WHERE mandal_id = ${mandalId}
      ORDER BY name
    `;
  }

  async search(query: string) {
    const q = `%${query}%`;
    const results = await prisma.$queryRaw<any[]>`
      SELECT 'district' AS type, id, name FROM districts
        WHERE name ILIKE ${q}
      UNION ALL
      SELECT 'mp_constituency', id, name FROM mp_constituencies
        WHERE name ILIKE ${q}
      UNION ALL
      SELECT 'mla_constituency', id, name FROM mla_constituencies
        WHERE name ILIKE ${q}
      UNION ALL
      SELECT 'mandal', id, name FROM mandals
        WHERE name ILIKE ${q}
      UNION ALL
      SELECT 'village', id, name FROM villages
        WHERE name ILIKE ${q}
      ORDER BY name
      LIMIT 20
    `;
    return results;
  }
}
