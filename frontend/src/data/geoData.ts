// ─────────────────────────────────────────────────────────────────────────────
// Real GeoJSON data loader for AP Election Map
// Fetches simplified GeoJSON from /data/geojson/ and attaches synthetic
// election results (since we don't have real election data yet).
// ─────────────────────────────────────────────────────────────────────────────

import { PARTY_COLORS, PARTY_NAMES } from "@shared/constants";

// ── Deterministic hash (same as original dummyData) ──────────────────────────
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const PARTIES = ["TDP", "YSRCP", "JSP", "BJP"];

function pickParty(id: string): string {
  const weighted = [
    "TDP", "TDP", "TDP", "TDP",
    "YSRCP", "YSRCP",
    "JSP", "JSP",
    "BJP",
  ];
  return weighted[hash(id) % weighted.length];
}

function makeResults(winner: string, total: number, id: string) {
  const winPct = 36 + (hash(id + "pct") % 16);
  const others = PARTIES.filter((p) => p !== winner);
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
    .map((s) => ({
      partyId: `party-${s.code.toLowerCase()}`,
      partyName: PARTY_NAMES[s.code] || s.code,
      partyCode: s.code,
      color: PARTY_COLORS[s.code] || PARTY_COLORS.OTH,
      votes: Math.round((total * s.pct) / 100),
      voteSharePercent: s.pct,
    }))
    .sort((a, b) => b.votes - a.votes);
}

// ── GeoJSON cache ────────────────────────────────────────────────────────────
const cache: Record<string, any> = {};

async function fetchGeoJSON(path: string): Promise<any> {
  if (cache[path]) return cache[path];
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
  const data = await res.json();
  cache[path] = data;
  return data;
}

// ── Eagerly preload all GeoJSON on app start ─────────────────────────────────
// This eliminates the lazy-loading delay when zooming between levels
export function preloadGeoJSON() {
  fetchGeoJSON("/data/geojson/districts.geojson");
  fetchGeoJSON("/data/geojson/mandals.geojson");
  fetchGeoJSON("/data/geojson/villages.geojson");
}

// Start preloading immediately on module import
preloadGeoJSON();

// ── Enrich features with election properties ─────────────────────────────────
function enrichFeature(feature: any, idField: string, nameField: string, parentField?: string) {
  const props = feature.properties;
  const name = props[nameField] ?? "Unknown";
  const id = props[idField] ?? name;
  const parentId = parentField ? props[parentField] ?? null : null;
  const party = pickParty(String(id));
  const voters = 60000 + (hash(String(id)) % 140000);

  return {
    ...feature,
    properties: {
      id: String(id),
      name,
      winning_party: party,
      parent_id: parentId,
      total_voters: voters,
      margin: 1000 + (hash(String(id) + "mg") % 25000),
      party_results: makeResults(party, voters, String(id)),
      // Keep original properties for filtering
      _district: props.District ?? props.district ?? null,
      _mandal: props.mandal_name ?? null,
    },
  };
}

// ── District GeoJSON ─────────────────────────────────────────────────────────
export async function getDistrictsGeoJSON(filters?: Record<string, any>) {
  const raw = await fetchGeoJSON("/data/geojson/districts.geojson");
  let features = raw.features
    .filter((f: any) => f.geometry)
    .map((f: any) => enrichFeature(f, "dt_code", "district"));

  if (filters?.districtId) {
    features = features.filter((f: any) => f.properties.id === filters.districtId);
  }
  if (filters?.partyId) {
    const code = filters.partyId.replace("party-", "").toUpperCase();
    features = features.filter((f: any) => f.properties.winning_party === code);
  }

  return { type: "FeatureCollection", features };
}

// ── Mandal GeoJSON ───────────────────────────────────────────────────────────
export async function getMandalsGeoJSON(filters?: Record<string, any>) {
  const raw = await fetchGeoJSON("/data/geojson/mandals.geojson");
  let features = raw.features
    .filter((f: any) => f.geometry)
    .map((f: any) => enrichFeature(f, "Subdis_LGD", "mandal_name", "District"));

  if (filters?.districtId) {
    // Match by district name from the districts lookup
    const districtName = await getDistrictNameById(filters.districtId);
    if (districtName) {
      features = features.filter((f: any) => f.properties._district === districtName);
    }
  }
  if (filters?.mandalId) {
    features = features.filter((f: any) => f.properties.id === filters.mandalId);
  }
  if (filters?.partyId) {
    const code = filters.partyId.replace("party-", "").toUpperCase();
    features = features.filter((f: any) => f.properties.winning_party === code);
  }

  return { type: "FeatureCollection", features };
}

// ── Village GeoJSON ──────────────────────────────────────────────────────────
export async function getVillagesGeoJSON(filters?: Record<string, any>) {
  const raw = await fetchGeoJSON("/data/geojson/villages.geojson");
  let features = raw.features
    .filter((f: any) => f.geometry)
    .map((f: any) => enrichFeature(f, "village_id", "village_name", "mandal_name"));

  if (filters?.districtId) {
    const districtName = await getDistrictNameById(filters.districtId);
    if (districtName) {
      features = features.filter((f: any) => f.properties._district === districtName);
    }
  }
  if (filters?.mandalId) {
    const mandalName = await getMandalNameById(filters.mandalId);
    if (mandalName) {
      features = features.filter((f: any) => f.properties._mandal === mandalName);
    }
  }
  if (filters?.partyId) {
    const code = filters.partyId.replace("party-", "").toUpperCase();
    features = features.filter((f: any) => f.properties.winning_party === code);
  }

  return { type: "FeatureCollection", features };
}

// ── Helper: resolve district ID → name ───────────────────────────────────────
async function getDistrictNameById(districtId: string): Promise<string | null> {
  const raw = await fetchGeoJSON("/data/geojson/districts.geojson");
  const feat = raw.features.find(
    (f: any) => String(f.properties.dt_code) === String(districtId)
  );
  return feat?.properties?.district ?? null;
}

async function getMandalNameById(mandalId: string): Promise<string | null> {
  const raw = await fetchGeoJSON("/data/geojson/mandals.geojson");
  const feat = raw.features.find(
    (f: any) => String(f.properties.Subdis_LGD) === String(mandalId)
  );
  return feat?.properties?.mandal_name ?? null;
}

// ── Lookup data for filter dropdowns ─────────────────────────────────────────
export async function getDistrictsLookup() {
  const raw = await fetchGeoJSON("/data/geojson/districts.geojson");
  return raw.features
    .filter((f: any) => f.geometry)
    .map((f: any) => ({
      id: String(f.properties.dt_code),
      name: f.properties.district,
    }))
    .sort((a: any, b: any) => a.name.localeCompare(b.name));
}

export async function getMandalsLookup(districtId?: string) {
  const raw = await fetchGeoJSON("/data/geojson/mandals.geojson");
  let features = raw.features.filter((f: any) => f.geometry);

  if (districtId) {
    const districtName = await getDistrictNameById(districtId);
    if (districtName) {
      features = features.filter((f: any) => f.properties.District === districtName);
    }
  }

  return features
    .map((f: any) => ({
      id: String(f.properties.Subdis_LGD),
      name: f.properties.mandal_name,
    }))
    .sort((a: any, b: any) => a.name.localeCompare(b.name));
}

export async function getVillagesLookup(mandalId?: string) {
  const raw = await fetchGeoJSON("/data/geojson/villages.geojson");
  let features = raw.features.filter((f: any) => f.geometry);

  if (mandalId) {
    const mandalName = await getMandalNameById(mandalId);
    if (mandalName) {
      features = features.filter((f: any) => f.properties.mandal_name === mandalName);
    }
  }

  return features
    .map((f: any) => ({
      id: String(f.properties.village_id),
      name: f.properties.village_name,
    }))
    .sort((a: any, b: any) => a.name.localeCompare(b.name));
}

export function getPartiesLookup() {
  return PARTIES.map((code) => ({
    id: `party-${code.toLowerCase()}`,
    name: PARTY_NAMES[code] || code,
    abbreviation: code,
    color: PARTY_COLORS[code],
  }));
}

// ── Booth generation (kept from synthetic data) ──────────────────────────────
function coordsToBounds(
  coords: number[][][] | number[][][][]
): [number, number, number, number] {
  let west = Infinity,
    south = Infinity,
    east = -Infinity,
    north = -Infinity;

  function processRing(ring: number[][]) {
    for (const [lng, lat] of ring) {
      if (lng < west) west = lng;
      if (lng > east) east = lng;
      if (lat < south) south = lat;
      if (lat > north) north = lat;
    }
  }

  if (Array.isArray(coords[0]?.[0]?.[0])) {
    // MultiPolygon
    for (const poly of coords as number[][][][]) {
      for (const ring of poly) processRing(ring);
    }
  } else {
    // Polygon
    for (const ring of coords as number[][][]) processRing(ring);
  }

  return [west, south, east, north];
}

export async function getBoothsInBBox(
  bbox: { north: number; south: number; east: number; west: number },
  limit = 250
) {
  const raw = await fetchGeoJSON("/data/geojson/mandals.geojson");
  const mandals = raw.features.filter((f: any) => {
    if (!f.geometry) return false;
    const [w, s, e, n] = coordsToBounds(f.geometry.coordinates);
    return !(e < bbox.west || w > bbox.east || n < bbox.south || s > bbox.north);
  });

  const booths: any[] = [];
  for (const m of mandals) {
    const mId = String(m.properties.Subdis_LGD);
    const mName = m.properties.mandal_name;
    const [bW, bS, bE, bN] = coordsToBounds(m.geometry.coordinates);
    const count = 3 + (hash(mId + "bc") % 3);

    for (let i = 1; i <= count; i++) {
      const id = `${mId}-b${i}`;
      const party = pickParty(id);
      const lat = +(bS + ((hash(id + "la") % 1000) / 1000) * (bN - bS)).toFixed(5);
      const lng = +(bW + ((hash(id + "lo") % 1000) / 1000) * (bE - bW)).toFixed(5);
      const totalV = 400 + (hash(id + "v") % 1400);
      const turnout = +(62 + (hash(id + "t") % 22)).toFixed(1);

      booths.push({
        id,
        boothNumber: 100 + (hash(id) % 800),
        latitude: lat,
        longitude: lng,
        winningParty: party,
        totalVoters: totalV,
        totalVotesCast: Math.round((totalV * turnout) / 100),
        voterTurnoutPercent: turnout,
        villageName: `Village ${(hash(id + "vn") % 40) + 1}`,
        mandalName: mName,
        mlaConstituencyName: "",
        partyResults: makeResults(party, totalV, id),
      });
      if (booths.length >= limit) return booths;
    }
  }
  return booths;
}
