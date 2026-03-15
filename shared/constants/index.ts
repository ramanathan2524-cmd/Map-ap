// ─────────────────────────────────────────────────────────────────────────────
// Shared Constants — party colors, zoom levels, map config
// ─────────────────────────────────────────────────────────────────────────────

export const PARTY_COLORS: Record<string, string> = {
  TDP: "#F5C518",      // Yellow
  YSRCP: "#2979FF",    // Blue
  JSP: "#E53935",      // Red
  BJP: "#FF6D00",      // Saffron
  OTH: "#9E9E9E",      // Others (gray)
};

export const PARTY_NAMES: Record<string, string> = {
  TDP: "Telugu Desam Party",
  YSRCP: "YSR Congress Party",
  JSP: "Jana Sena Party",
  BJP: "Bharatiya Janata Party",
  OTH: "Others",
};

// Codes that are mapped to "OTH"
export const MINOR_PARTIES = ["INC", "CPI", "CPM", "IND"] as const;

// Zoom thresholds at which each level becomes visible
export const ZOOM_LEVELS = {
  STATE: { min: 0, max: 7 },
  DISTRICT: { min: 7, max: 10 },
  MP_CONSTITUENCY: { min: 10, max: 10 },   // kept for type compat (unused)
  MLA_CONSTITUENCY: { min: 10, max: 10 },  // kept for type compat (unused)
  MANDAL: { min: 10, max: 13 },
  VILLAGE: { min: 13, max: 16 },
  BOOTH: { min: 16, max: 22 },
} as const;

// Default map center for Andhra Pradesh
export const AP_MAP_CENTER = {
  lat: 15.9129,
  lng: 79.74,
  defaultZoom: 7,
};

// AP State bounds [SW, NE]
export const AP_BOUNDS = {
  south: 12.6,
  west: 76.7,
  north: 19.9,
  east: 84.8,
};

export const AP_DISTRICTS = [
  "Alluri Sitharama Raju",
  "Anakapalli",
  "Anantapur",
  "Annamayya",
  "Bapatla",
  "Chittoor",
  "Dr. B.R. Ambedkar Konaseema",
  "East Godavari",
  "Eluru",
  "Guntur",
  "Kakinada",
  "Krishna",
  "Kurnool",
  "Nandyal",
  "Ntr",
  "Palnadu",
  "Parvathipuram Manyam",
  "Prakasam",
  "Sri Potti Sriramulu Nellore",
  "Sri Sathya Sai",
  "Srikakulam",
  "Tirupati",
  "Visakhapatnam",
  "Vizianagaram",
  "West Godavari",
  "YSR Kadapa",
] as const;

export const ELECTION_YEARS = [2024, 2019, 2014] as const;

export const GEO_LEVELS = [
  "state",
  "district",
  "mp_constituency",
  "mla_constituency",
  "mandal",
  "village",
  "booth",
] as const;

export const API_BASE_URL =
  typeof window !== "undefined"
    ? (import.meta?.env?.VITE_API_URL ?? "http://localhost:4000/api/v1")
    : process.env.API_BASE_URL ?? "http://localhost:4000/api/v1";
