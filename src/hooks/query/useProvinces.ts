import { useQuery } from "@tanstack/react-query"
import { addressService, type LocationData } from "../../services/addressService"

// Provinces for the selected region. Dependent query — only runs once a
// region code is available, and cached per region so re-selecting is instant.
export const useProvinces = (regionCode?: string | null) =>
  useQuery<LocationData[]>({
    queryKey: ["provinces", regionCode],
    queryFn: async () => addressService.getProvinces(regionCode as string),
    enabled: !!regionCode,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  })
