import { useQuery } from "@tanstack/react-query"
import {
  meilisearchService,
  type ProductCard,
} from "../../services/meilisearchService"

interface UseSearchResultsOptions {
  query: string
  limit?: number
  enabled?: boolean
}

export const useSearchResults = ({
  query,
  limit = 50,
  enabled = true,
}: UseSearchResultsOptions) => {
  const trimmed = query.trim()

  return useQuery<ProductCard[]>({
    queryKey: ["search-results", trimmed, limit],
    queryFn: async () => meilisearchService.searchProducts(trimmed, limit),
    enabled: enabled && trimmed.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  })
}
