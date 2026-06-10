import { useQuery } from "@tanstack/react-query"
import { addressService, type LocationData } from "../../services/addressService"

// Cities/municipalities for the selected province. Dependent query — only runs
// once a province code is available, and cached per province.
export const useCities = (provinceCode?: string | null) =>
  useQuery<LocationData[]>({
    queryKey: ["cities", provinceCode],
    queryFn: async () => addressService.getCities(provinceCode as string),
    enabled: !!provinceCode,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  })
