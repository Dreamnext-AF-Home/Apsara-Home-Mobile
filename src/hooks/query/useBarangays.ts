import { useQuery } from "@tanstack/react-query"
import { addressService, type LocationData } from "../../services/addressService"

// Barangays for the selected city. Dependent query — only runs once a city
// code is available, and cached per city.
export const useBarangays = (cityCode?: string | null) =>
  useQuery<LocationData[]>({
    queryKey: ["barangays", cityCode],
    queryFn: async () => addressService.getBarangays(cityCode as string),
    enabled: !!cityCode,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  })
