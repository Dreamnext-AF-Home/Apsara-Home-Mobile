import { useQuery } from "@tanstack/react-query"
import {
  meilisearchService,
  type LiveSearchItem,
} from "../../services/meilisearchService"

interface UseLiveSearchOptions {
  query: string
  limit?: number
  enabled?: boolean
}

export const useLiveSearch = ({
  query,
  limit = 10,
  enabled = true,
}: UseLiveSearchOptions) => {
  const trimmed = query.trim()

  return useQuery<LiveSearchItem[]>({
    queryKey: ["live-search", trimmed, limit],
    queryFn: async () => meilisearchService.liveSearch(trimmed, limit),
    enabled: enabled && trimmed.length >= 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  })
}
