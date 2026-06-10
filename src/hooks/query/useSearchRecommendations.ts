import { useQuery } from "@tanstack/react-query"
import { productService } from "../../services/productService"

interface UseSearchRecommendationsOptions {
  token?: string | null
  limit?: number
  enabled?: boolean
}

export const useSearchRecommendations = ({
  token,
  limit = 12,
  enabled = true,
}: UseSearchRecommendationsOptions) => {
  return useQuery<any[]>({
    queryKey: ["search-recommendations", token, limit],
    queryFn: async () => {
      if (!token) throw new Error("Token is required")
      return productService.getSearchRecommendations(token, limit)
    },
    enabled: !!token && enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  })
}
