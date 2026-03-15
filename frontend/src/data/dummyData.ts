// ─────────────────────────────────────────────────────────────────────────────
// Synthetic data for AP Election Map
// Generates GeoJSON polygons + election results for all levels without backend
// ─────────────────────────────────────────────────────────────────────────────

import { PARTY_COLORS, PARTY_NAMES } from "@shared/constants";
import { AP_DISTRICT_SHAPES } from "./districtShapes";

// ── Types ────────────────────────────────────────────────────────────────────
type Bounds = [number, number, number, number]; // [west, south, east, north]

interface Region {
  id: string;
  name: string;
  parentId: string | null;
  bounds: Bounds;
  party: string;
  coordinates?: number[][][]; // real polygon coordinates (districts)
}

// ── Deterministic hash (seeded pseudo-random) ────────────────────────────────
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const PARTIES = ["TDP", "YSRCP", "JSP", "BJP"];

function pickParty(id: string): string {
  const weighted = ["TDP", "TDP", "TDP", "TDP", "YSRCP", "YSRCP", "JSP", "JSP", "BJP"];
  return weighted[hash(id) % weighted.length];
}

// ── Geometry helpers ─────────────────────────────────────────────────────────
/** Compute the bounding box of a polygon's coordinates */
function coordsToBounds(coords: number[][][]): Bounds {
  let west = Infinity, south = Infinity, east = -Infinity, north = -Infinity;
  for (const ring of coords) {
    for (const [lng, lat] of ring) {
      if (lng < west) west = lng;
      if (lng > east) east = lng;
      if (lat < south) south = lat;
      if (lat > north) north = lat;
    }
  }
  return [west, south, east, north];
}

// Simple rectangular coords (used for sub-regions)
function rectCoords(b: Bounds): number[][][] {
  const [w, s, e, n] = b;
  return [[[w, s], [e, s], [e, n], [w, n], [w, s]]];
}

function makeResults(winner: string, total: number, id: string) {
  const winPct = 36 + (hash(id + "pct") % 16); // 36–52%
  const others = PARTIES.filter(p => p !== winner);
  const restPct = 100 - winPct;

  const shares: { code: string; pct: number }[] = [{ code: winner, pct: winPct }];
  let used = 0;
  others.forEach((code, i) => {
    if (i < others.length - 1) {
      const p = Math.max(5, Math.round(restPct / others.length) + (hash(id + code) % 7 - 3));
      shares.push({ code, pct: p });
      used += p;
    } else {
      shares.push({ code, pct: Math.max(3, restPct - used) });
    }
  });

  return shares
    .map(s => ({
      partyId: `party-${s.code.toLowerCase()}`,
      partyName: PARTY_NAMES[s.code] || s.code,
      partyCode: s.code,
      color: PARTY_COLORS[s.code] || PARTY_COLORS.OTH,
      votes: Math.round(total * s.pct / 100),
      voteSharePercent: s.pct,
    }))
    .sort((a, b) => b.votes - a.votes);
}

// ── District definitions (all 26 AP districts — real GADM polygon shapes) ────
const DISTRICTS: Region[] = AP_DISTRICT_SHAPES.map(d => ({
  id: d.id,
  name: d.name,
  parentId: null,
  bounds: coordsToBounds(d.coordinates),
  party: d.party,
  coordinates: d.coordinates,
}));

// ── Sub-region generation ────────────────────────────────────────────────────
function splitBounds(bounds: Bounds, count: number, horizontal?: boolean): Bounds[] {
  const [bW, bS, bE, bN] = bounds;
  const isHoriz = horizontal !== undefined ? horizontal : (bE - bW) > (bN - bS);
  const cells: Bounds[] = [];

  if (isHoriz) {
    const step = (bE - bW) / count;
    for (let i = 0; i < count; i++)
      cells.push([bW + i * step, bS, bW + (i + 1) * step, bN]);
  } else {
    const step = (bN - bS) / count;
    for (let i = 0; i < count; i++)
      cells.push([bW, bS + i * step, bE, bS + (i + 1) * step]);
  }
  return cells;
}

function genMP(district: Region): Region[] {
  const isWide = (district.bounds[2] - district.bounds[0]) > (district.bounds[3] - district.bounds[1]);
  const cells = splitBounds(district.bounds, 2, isWide);
  const dirs = isWide ? ["East", "West"] : ["South", "North"];
  return cells.map((b, i) => {
    const id = `${district.id}-p${i + 1}`;
    return { id, name: `${district.name} ${dirs[i]}`, parentId: district.id, bounds: b, party: pickParty(id) };
  });
}

function genMLA(mp: Region): Region[] {
  const isWide = (mp.bounds[2] - mp.bounds[0]) > (mp.bounds[3] - mp.bounds[1]);
  const cells = splitBounds(mp.bounds, 3, !isWide); // alternate direction
  return cells.map((b, i) => {
    const id = `${mp.id}-a${i + 1}`;
    const shortName = mp.name.length > 20 ? mp.name.split(" ").slice(0, 2).join(" ") : mp.name;
    return { id, name: `${shortName} Assy-${i + 1}`, parentId: mp.id, bounds: b, party: pickParty(id) };
  });
}

function genMandals(mla: Region): Region[] {
  const isWide = (mla.bounds[2] - mla.bounds[0]) > (mla.bounds[3] - mla.bounds[1]);
  const cells = splitBounds(mla.bounds, 2, isWide);
  return cells.map((b, i) => {
    const id = `${mla.id}-m${i + 1}`;
    const num = (hash(id) % 90) + 10;
    return { id, name: `Mandal-${num}`, parentId: mla.id, bounds: b, party: pickParty(id) };
  });
}

// ── Cached hierarchy ─────────────────────────────────────────────────────────
let _mp: Region[] | null = null;
let _mla: Region[] | null = null;
let _mandals: Region[] | null = null;

function getAllMP(): Region[] {
  if (!_mp) _mp = DISTRICTS.flatMap(genMP);
  return _mp;
}

function getAllMLA(): Region[] {
  if (!_mla) _mla = getAllMP().flatMap(genMLA);
  return _mla;
}

function getAllMandals(): Region[] {
  if (!_mandals) _mandals = getAllMLA().flatMap(genMandals);
  return _mandals;
}

// ── GeoJSON FeatureCollection builder ────────────────────────────────────────
function toFC(regions: Region[]) {
  return {
    type: "FeatureCollection" as const,
    features: regions.map(r => {
      const voters = 60000 + (hash(r.id) % 140000);
      return {
        type: "Feature" as const,
        geometry: {
          type: "Polygon" as const,
          coordinates: r.coordinates ?? rectCoords(r.bounds),
        },
        properties: {
          id: r.id,
          name: r.name,
          winning_party: r.party,
          parent_id: r.parentId,
          total_voters: voters,
          margin: 1000 + (hash(r.id + "mg") % 25000),
          party_results: makeResults(r.party, voters, r.id),
        },
      };
    }),
  };
}

// ── Exported GeoJSON getters (with filter support) ───────────────────────────
export function getDistrictsGeoJSON(filters?: Record<string, any>) {
  let regions = DISTRICTS;
  if (filters?.districtId) regions = regions.filter(r => r.id === filters.districtId);
  if (filters?.partyId) {
    const code = filters.partyId.replace("party-", "").toUpperCase();
    regions = regions.filter(r => r.party === code);
  }
  return toFC(regions); // use rectCoords for clean tiling — no gaps between districts
}

export function getMPGeoJSON(filters?: Record<string, any>) {
  let regions = getAllMP();
  if (filters?.districtId) regions = regions.filter(r => r.parentId === filters.districtId);
  if (filters?.mpConstituencyId) regions = regions.filter(r => r.id === filters.mpConstituencyId);
  return toFC(regions);
}

export function getMLAGeoJSON(filters?: Record<string, any>) {
  let regions = getAllMLA();
  if (filters?.mpConstituencyId) regions = regions.filter(r => r.parentId === filters.mpConstituencyId);
  if (filters?.mlaConstituencyId) regions = regions.filter(r => r.id === filters.mlaConstituencyId);
  if (filters?.districtId) {
    const mpIds = new Set(getAllMP().filter(m => m.parentId === filters.districtId).map(m => m.id));
    regions = regions.filter(r => r.parentId !== null && mpIds.has(r.parentId));
  }
  return toFC(regions);
}

export function getMandalsGeoJSON(filters?: Record<string, any>) {
  let regions = getAllMandals();
  if (filters?.mandalId) regions = regions.filter(r => r.id === filters.mandalId);
  if (filters?.mlaConstituencyId) regions = regions.filter(r => r.parentId === filters.mlaConstituencyId);
  if (filters?.mpConstituencyId) {
    const mlaIds = new Set(getAllMLA().filter(m => m.parentId === filters.mpConstituencyId).map(m => m.id));
    regions = regions.filter(r => r.parentId !== null && mlaIds.has(r.parentId));
  }
  if (filters?.districtId) {
    const mpIds = new Set(getAllMP().filter(m => m.parentId === filters.districtId).map(m => m.id));
    const mlaIds = new Set(getAllMLA().filter(m => m.parentId !== null && mpIds.has(m.parentId)).map(m => m.id));
    regions = regions.filter(r => r.parentId !== null && mlaIds.has(r.parentId));
  }
  return toFC(regions);
}

// ── Booth generation ─────────────────────────────────────────────────────────
export function getBoothsInBBox(
  bbox: { north: number; south: number; east: number; west: number },
  limit = 250,
) {
  const mandals = getAllMandals().filter(m => {
    const [w, s, e, n] = m.bounds;
    return !(e < bbox.west || w > bbox.east || n < bbox.south || s > bbox.north);
  });

  const booths: any[] = [];
  for (const m of mandals) {
    const [bW, bS, bE, bN] = m.bounds;
    const count = 3 + (hash(m.id + "bc") % 3);
    for (let i = 1; i <= count; i++) {
      const id = `${m.id}-b${i}`;
      const party = pickParty(id);
      const lat = +(bS + (hash(id + "la") % 1000) / 1000 * (bN - bS)).toFixed(5);
      const lng = +(bW + (hash(id + "lo") % 1000) / 1000 * (bE - bW)).toFixed(5);
      const totalV = 400 + (hash(id + "v") % 1400);
      const turnout = +(62 + (hash(id + "t") % 22)).toFixed(1);

      booths.push({
        id,
        boothNumber: 100 + (hash(id) % 800),
        latitude: lat,
        longitude: lng,
        winningParty: party,
        totalVoters: totalV,
        totalVotesCast: Math.round(totalV * turnout / 100),
        voterTurnoutPercent: turnout,
        villageName: `Village ${(hash(id + "vn") % 40) + 1}`,
        mandalName: m.name,
        mlaConstituencyName: m.parentId || "",
        partyResults: makeResults(party, totalV, id),
      });
      if (booths.length >= limit) return booths;
    }
  }
  return booths;
}

// ── Lookup data for filter dropdowns ─────────────────────────────────────────
export const getPartiesLookup = () =>
  PARTIES.map(code => ({
    id: `party-${code.toLowerCase()}`,
    name: PARTY_NAMES[code] || code,
    abbreviation: code,
    color: PARTY_COLORS[code],
  }));

export const getDistrictsLookup = () =>
  DISTRICTS.map(d => ({ id: d.id, name: d.name }));

export const getMPLookup = (districtId?: string) => {
  let list = getAllMP();
  if (districtId) list = list.filter(m => m.parentId === districtId);
  return list.map(m => ({ id: m.id, name: m.name }));
};

export const getMLALookup = (mpId?: string) => {
  let list = getAllMLA();
  if (mpId) list = list.filter(m => m.parentId === mpId);
  return list.map(m => ({ id: m.id, name: m.name }));
};

export const getMandalLookup = (mlaId?: string) => {
  let list = getAllMandals();
  if (mlaId) list = list.filter(m => m.parentId === mlaId);
  return list.map(m => ({ id: m.id, name: m.name }));
};
