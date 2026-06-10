import { useQuery } from "@tanstack/react-query"
import { addressService, type LocationData } from "../../services/addressService"

interface UseRegionsOptions {
  enabled?: boolean
}

// Philippine regions list for the address dropdowns. Public lookup — no token.
export const useRegions = ({ enabled = true }: UseRegionsOptions = {}) => {
  return useQuery<LocationData[]>({
    queryKey: ["regions"],
    queryFn: async () => addressService.getRegions(),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  })
}
