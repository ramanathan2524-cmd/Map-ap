import { useQuery } from "@tanstack/react-query";
import { useMap } from "react-leaflet";
import { useMapStore } from "../store/mapStore";
import { resultsService } from "../services/api";
import { ZOOM_LEVELS } from "@shared/constants";

/**
 * Fetches booth data for the current map viewport.
 * Only activates when zoom level is high enough to show booths.
 */
export const useBoothQuery = () => {
  const map = useMap();
  const { currentZoom, filters, selectedYear } = useMapStore();

  const isBoothLevel = currentZoom >= ZOOM_LEVELS.BOOTH.min;

  const bounds = map.getBounds();
  const bbox = {
    north: bounds.getNorth(),
    south: bounds.getSouth(),
    east:  bounds.getEast(),
    west:  bounds.getWest(),
  };

  return useQuery({
    queryKey: ["booths", bbox, filters, selectedYear],
    queryFn: async () => {
      const res = await resultsService.getBooths({
        bbox,
        ...filters,
        electionYear: selectedYear,
        limit: parseInt(import.meta.env.VITE_MAX_BOOTH_MARKERS ?? "500"),
      });
      return res.data.data;
    },
    enabled: isBoothLevel,
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev, // keep old data while refetching
  });
};
