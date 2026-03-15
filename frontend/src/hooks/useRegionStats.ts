import { useQuery } from "@tanstack/react-query";
import { useMapStore } from "../store/mapStore";
import { resultsService } from "../services/api";

/**
 * Fetches detailed stats for the currently selected region.
 * Used by the Sidebar to show vote breakdowns.
 */
export const useRegionStats = () => {
  const { selectedRegion, selectedYear } = useMapStore();

  return useQuery({
    queryKey: ["region-stats", selectedRegion?.id, selectedRegion?.level, selectedYear],
    queryFn: async () => {
      if (!selectedRegion) return null;
      const res = await resultsService.getRegionStats(
        selectedRegion.id,
        selectedRegion.level,
        selectedYear
      );
      return res.data.data;
    },
    enabled: !!selectedRegion?.id,
    staleTime: 15 * 60 * 1000,
  });
};
