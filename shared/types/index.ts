// ─────────────────────────────────────────────────────────────────────────────
// Shared TypeScript Types — used by both frontend and backend
// ─────────────────────────────────────────────────────────────────────────────

// ── Geographic Hierarchy ─────────────────────────────────────────────────────

export type GeoLevel =
  | "state"
  | "district"
  | "mp_constituency"
  | "mla_constituency"
  | "mandal"
  | "village"
  | "booth";

export interface GeoRegion {
  id: string;
  name: string;
  level: GeoLevel;
  parentId?: string;
  totalVoters: number;
  winningParty?: string;
  winningPartyColor?: string;
  marginOfVictory?: number;
  partyResults: PartyResult[];
}

// ── Administrative Entities ───────────────────────────────────────────────────

export interface State {
  id: string;
  name: string;
  code: string;
  totalDistricts: number;
  totalMPConstituencies: number;
  totalMLAConstituencies: number;
  totalMandals: number;
  totalVillages: number;
  totalBooths: number;
  totalVoters: number;
}

export interface District {
  id: string;
  stateId: string;
  name: string;
  code: string;
  mpConstituencyIds: string[];
  totalVoters: number;
  winningParty?: string;
  partyResults: PartyResult[];
}

export interface MPConstituency {
  id: string;
  districtId: string;
  name: string;
  code: string;
  number: number;
  mlaConstituencyIds: string[];
  totalVoters: number;
  winningParty?: string;
  partyResults: PartyResult[];
}

export interface MLAConstituency {
  id: string;
  mpConstituencyId: string;
  districtId: string;
  name: string;
  code: string;
  number: number;
  mandalIds: string[];
  totalVoters: number;
  winningParty?: string;
  partyResults: PartyResult[];
}

export interface Mandal {
  id: string;
  mlaConstituencyId: string;
  districtId: string;
  name: string;
  code: string;
  villageIds: string[];
  totalVoters: number;
  winningParty?: string;
  partyResults: PartyResult[];
}

export interface Village {
  id: string;
  mandalId: string;
  mlaConstituencyId: string;
  districtId: string;
  name: string;
  code: string;
  boothIds: string[];
  totalVoters: number;
  winningParty?: string;
  partyResults: PartyResult[];
}

export interface Booth {
  id: string;
  boothNumber: string;
  villageId: string;
  villageName: string;
  mandalId: string;
  mandalName: string;
  mlaConstituencyId: string;
  mlaConstituencyName: string;
  mpConstituencyId: string;
  districtId: string;
  latitude: number;
  longitude: number;
  totalVoters: number;
  totalVotesCast: number;
  voterTurnoutPercent: number;
  winningParty: string;
  partyResults: PartyResult[];
}

// ── Election Results ─────────────────────────────────────────────────────────

export interface PartyResult {
  partyId: string;
  partyName: string;
  partyCode: string;
  color: string;
  votes: number;
  voteSharePercent: number;
  candidateName?: string;
}

export interface ElectionResult {
  regionId: string;
  regionLevel: GeoLevel;
  electionYear: number;
  electionType: "general" | "assembly" | "local";
  partyResults: PartyResult[];
  winningParty: string;
  winningCandidate?: string;
  totalVotesCast: number;
  totalVoters: number;
  voterTurnoutPercent: number;
  marginOfVictory: number;
}

// ── Party ─────────────────────────────────────────────────────────────────────

export interface Party {
  id: string;
  name: string;
  abbreviation: string;
  color: string;
  logoUrl?: string;
  allianceId?: string;
}

export interface Alliance {
  id: string;
  name: string;
  partyIds: string[];
  color: string;
}

// ── API Response Types ────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
  };
  error?: string;
}

export interface GeoJSONFeature {
  type: "Feature";
  geometry: {
    type: "Polygon" | "MultiPolygon" | "Point";
    coordinates: number[][][] | number[][] | number[];
  };
  properties: Record<string, unknown>;
}

export interface GeoJSONCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

// ── Filter & Query Types ──────────────────────────────────────────────────────

export interface MapFilters {
  partyId?: string;
  districtId?: string;
  mpConstituencyId?: string;
  mlaConstituencyId?: string;
  mandalId?: string;
  villageId?: string;
  electionYear?: number;
  electionType?: "general" | "assembly" | "local";
}

export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface BoothQueryParams extends MapFilters {
  bbox?: BoundingBox;
  zoom?: number;
  page?: number;
  limit?: number;
}
