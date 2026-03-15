import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";
import type { GeoLevel, GeoRegion, Booth, MapFilters } from "@shared/types";

export type BreadcrumbItem = {
  id: string;
  name: string;
  level: GeoLevel;
  bounds?: [[number, number], [number, number]];
};

interface MapState {
  // ── Navigation ──────────────────────────────────────────────────────────
  currentLevel: GeoLevel;
  currentZoom: number;
  selectedRegion: GeoRegion | null;
  selectedBooth: Booth | null;
  hoveredRegionId: string | null;
  breadcrumb: BreadcrumbItem[];

  // ── Filters ─────────────────────────────────────────────────────────────
  filters: MapFilters;

  // ── UI State ────────────────────────────────────────────────────────────
  sidebarOpen: boolean;
  filterPanelOpen: boolean;
  isLoading: boolean;
  error: string | null;

  // ── Election Year ────────────────────────────────────────────────────────
  selectedYear: number;

  // ── Actions ─────────────────────────────────────────────────────────────
  setCurrentLevel: (level: GeoLevel) => void;
  setCurrentZoom: (zoom: number) => void;
  setSelectedRegion: (region: GeoRegion | null) => void;
  setSelectedBooth: (booth: Booth | null) => void;
  setHoveredRegionId: (id: string | null) => void;
  setBreadcrumb: (crumbs: BreadcrumbItem[]) => void;
  pushBreadcrumb: (crumb: BreadcrumbItem) => void;
  popBreadcrumb: () => void;
  resetBreadcrumb: () => void;
  navigateToLevel: (index: number) => void;

  setFilters: (filters: Partial<MapFilters>) => void;
  clearFilters: () => void;

  setSidebarOpen: (open: boolean) => void;
  setFilterPanelOpen: (open: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedYear: (year: number) => void;
}

export const useMapStore = create<MapState>()(
  devtools(
    subscribeWithSelector((set) => ({
      // ── Initial State ──────────────────────────────────────────────────
      currentLevel: "state",
      currentZoom: 7,
      selectedRegion: null,
      selectedBooth: null,
      hoveredRegionId: null,
      breadcrumb: [{ id: "ap", name: "Andhra Pradesh", level: "state" }],

      filters: {},
      sidebarOpen: false,
      filterPanelOpen: true,
      isLoading: false,
      error: null,
      selectedYear: 2024,

      // ── Actions ────────────────────────────────────────────────────────
      setCurrentLevel: (level) => set({ currentLevel: level }),
      setCurrentZoom: (zoom) => set({ currentZoom: zoom }),

      setSelectedRegion: (region) =>
        set({ selectedRegion: region, sidebarOpen: !!region, selectedBooth: null }),

      setSelectedBooth: (booth) =>
        set({ selectedBooth: booth, sidebarOpen: !!booth, selectedRegion: null }),

      setHoveredRegionId: (id) => set({ hoveredRegionId: id }),

      setBreadcrumb: (crumbs) => set({ breadcrumb: crumbs }),

      pushBreadcrumb: (crumb) =>
        set((state) => ({ breadcrumb: [...state.breadcrumb, crumb] })),

      popBreadcrumb: () =>
        set((state) => ({ breadcrumb: state.breadcrumb.slice(0, -1) })),

      resetBreadcrumb: () =>
        set((state) => ({
          breadcrumb: [{ id: "ap", name: "Andhra Pradesh", level: "state" }],
          currentLevel: "state" as GeoLevel,
          selectedRegion: null,
          selectedBooth: null,
          sidebarOpen: false,
          filters: { partyId: state.filters.partyId, electionYear: state.filters.electionYear },
        })),

      navigateToLevel: (index) =>
        set((state) => {
          if (index === 0) {
            return {
              breadcrumb: [{ id: "ap", name: "Andhra Pradesh", level: "state" as GeoLevel }],
              currentLevel: "state" as GeoLevel,
              selectedRegion: null,
              selectedBooth: null,
              sidebarOpen: false,
              filters: { partyId: state.filters.partyId, electionYear: state.filters.electionYear },
            };
          }
          const newCrumbs = state.breadcrumb.slice(0, index + 1);
          const targetCrumb = newCrumbs[newCrumbs.length - 1];
          const targetLevel = targetCrumb.level;

          // Build filters: keep only levels at or above target
          const newFilters: MapFilters = {
            partyId: state.filters.partyId,
            electionYear: state.filters.electionYear,
          };
          // When navigating back to a district, keep only districtId (to show its mandals)
          if (targetLevel === "district") {
            newFilters.districtId = targetCrumb.id;
          } else if (targetLevel === "mandal") {
            newFilters.districtId = state.filters.districtId;
            newFilters.mandalId = targetCrumb.id;
          } else if (targetLevel === "village") {
            newFilters.districtId = state.filters.districtId;
            newFilters.mandalId = state.filters.mandalId;
            newFilters.villageId = targetCrumb.id;
          }

          return {
            breadcrumb: newCrumbs,
            currentLevel: targetLevel,
            filters: newFilters,
            selectedRegion: null,
            selectedBooth: null,
            sidebarOpen: false,
          };
        }),

      setFilters: (filters) =>
        set((state) => ({ filters: { ...state.filters, ...filters } })),

      clearFilters: () => set({ filters: {} }),

      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setFilterPanelOpen: (open) => set({ filterPanelOpen: open }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      setSelectedYear: (year) => set({ selectedYear: year }),
    })),
    { name: "ap-map-store" }
  )
);
