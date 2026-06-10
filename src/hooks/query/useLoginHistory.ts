import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query"
import {
  orderService,
  type LoginHistoryItem,
} from "../../services/orderService"

interface UseLoginHistoryOptions {
  token?: string | null
  perPage?: number
  enabled?: boolean
}

const PER_PAGE = 20

export const useLoginHistory = ({
  token,
  perPage = PER_PAGE,
  enabled = true,
}: UseLoginHistoryOptions) => {
  const queryClient = useQueryClient()

  const query = useInfiniteQuery({
    queryKey: ["loginHistory", token, perPage],
    queryFn: async ({ pageParam = 1 }) => {
      if (!token) throw new Error("Token is required")
      const response = await orderService.getLoginHistory(
        token,
        pageParam,
        perPage
      )
      // Preserve exact normalization the screen used
      const items: LoginHistoryItem[] = response.data || []
      const hasMore = response.pagination?.has_more || false
      return {
        items,
        pageParam,
        hasMore,
      }
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.pageParam + 1 : undefined,
    initialPageParam: 1,
    enabled: !!token && enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  })

  const invalidateLoginHistory = async () => {
    await queryClient.invalidateQueries({ queryKey: ["loginHistory"] })
  }

  return {
    ...query,
    invalidateLoginHistory,
  }
}
