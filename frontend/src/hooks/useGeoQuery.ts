import { useQuery } from "@tanstack/react-query";
import { useMapStore } from "../store/mapStore";
import { geoService } from "../services/api";

/**
 * Hook that fetches the correct GeoJSON layer based on current zoom level.
 * Each layer is cached independently by React Query.
 */
export const useGeoQuery = () => {
  const { currentLevel, filters } = useMapStore();

  const districtQuery = useQuery({
    queryKey: ["geo", "districts", filters],
    queryFn: () => geoService.getDistricts(filters).then((r) => r.data.data),
    staleTime: 30 * 60 * 1000,
    enabled: currentLevel === "district",
  });

  const mpQuery = useQuery({
    queryKey: ["geo", "mp", filters],
    queryFn: () => geoService.getMPConstituencies(filters).then((r) => r.data.data),
    staleTime: 30 * 60 * 1000,
    enabled: currentLevel === "mp_constituency",
  });

  const mlaQuery = useQuery({
    queryKey: ["geo", "mla", filters],
    queryFn: () => geoService.getMLAConstituencies(filters).then((r) => r.data.data),
    staleTime: 30 * 60 * 1000,
    enabled: currentLevel === "mla_constituency",
  });

  const mandalQuery = useQuery({
    queryKey: ["geo", "mandals", filters],
    queryFn: () => geoService.getMandals(filters).then((r) => r.data.data),
    staleTime: 30 * 60 * 1000,
    enabled: currentLevel === "mandal",
  });

  const queryMap = {
    district:         districtQuery,
    mp_constituency:  mpQuery,
    mla_constituency: mlaQuery,
    mandal:           mandalQuery,
  };

  const activeQuery = queryMap[currentLevel as keyof typeof queryMap];

  return {
    data:      activeQuery?.data ?? null,
    isLoading: activeQuery?.isLoading ?? false,
    isError:   activeQuery?.isError ?? false,
    error:     activeQuery?.error ?? null,
  };
};
