import axios from "axios";
import type {
  ApiResponse,
  GeoJSONCollection,
  GeoRegion,
  Booth,
  Party,
  District,
  MPConstituency,
  MLAConstituency,
  Mandal,
  Village,
  BoothQueryParams,
  MapFilters,
} from "@shared/types";

const BASE_URL = import.meta.env.VITE_API_URL ?? "/api/v1";

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor ────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  config.params = { ...config.params };
  return config;
});

// ── Response interceptor ───────────────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error("[API Error]", err.response?.data ?? err.message);
    return Promise.reject(err);
  }
);

// ── GeoJSON Endpoints ──────────────────────────────────────────────────────

export const geoService = {
  getStateBoundary: () =>
    api.get<ApiResponse<GeoJSONCollection>>("/geo/state"),

  getDistricts: (filters?: MapFilters) =>
    api.get<ApiResponse<GeoJSONCollection>>("/geo/districts", { params: filters }),

  getMPConstituencies: (filters?: MapFilters) =>
    api.get<ApiResponse<GeoJSONCollection>>("/geo/mp-constituencies", { params: filters }),

  getMLAConstituencies: (filters?: MapFilters) =>
    api.get<ApiResponse<GeoJSONCollection>>("/geo/mla-constituencies", { params: filters }),

  getMandals: (filters?: MapFilters) =>
    api.get<ApiResponse<GeoJSONCollection>>("/geo/mandals", { params: filters }),

  getVillages: (filters?: MapFilters) =>
    api.get<ApiResponse<GeoJSONCollection>>("/geo/villages", { params: filters }),
};

// ── Election Results ───────────────────────────────────────────────────────

export const resultsService = {
  getRegionStats: (regionId: string, level: string, year: number) =>
    api.get<ApiResponse<GeoRegion>>(`/results/${level}/${regionId}`, {
      params: { year },
    }),

  getBooths: (params: BoothQueryParams) =>
    api.get<ApiResponse<Booth[]>>("/results/booths", { params }),

  getBoothDetail: (boothId: string, year: number) =>
    api.get<ApiResponse<Booth>>(`/results/booths/${boothId}`, { params: { year } }),

  getPartyPerformance: (partyId: string, year: number) =>
    api.get<ApiResponse<GeoRegion[]>>(`/results/party/${partyId}`, {
      params: { year },
    }),
};

// ── Lookup/Filter Endpoints ────────────────────────────────────────────────

export const lookupService = {
  getParties: (year: number) =>
    api.get<ApiResponse<Party[]>>("/lookup/parties", { params: { year } }),

  getDistricts: () =>
    api.get<ApiResponse<District[]>>("/lookup/districts"),

  getMPConstituencies: (districtId?: string) =>
    api.get<ApiResponse<MPConstituency[]>>("/lookup/mp-constituencies", {
      params: { districtId },
    }),

  getMLAConstituencies: (mpId?: string) =>
    api.get<ApiResponse<MLAConstituency[]>>("/lookup/mla-constituencies", {
      params: { mpId },
    }),

  getMandals: (mlaId?: string) =>
    api.get<ApiResponse<Mandal[]>>("/lookup/mandals", { params: { mlaId } }),

  getVillages: (mandalId?: string) =>
    api.get<ApiResponse<Village[]>>("/lookup/villages", { params: { mandalId } }),

  search: (query: string) =>
    api.get<ApiResponse<{ type: string; id: string; name: string }[]>>(
      "/lookup/search",
      { params: { q: query } }
    ),
};
