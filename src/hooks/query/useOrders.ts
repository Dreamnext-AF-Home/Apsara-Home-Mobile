import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  orderService,
  type OrderHistoryItem,
} from "../../services/orderService"

interface UseOrdersOptions {
  token?: string | null
  enabled?: boolean
}

export const useOrders = ({ token, enabled = true }: UseOrdersOptions) => {
  const queryClient = useQueryClient()

  const query = useQuery<OrderHistoryItem[]>({
    queryKey: ["orders", token],
    queryFn: async () => {
      if (!token) throw new Error("Token is required")
      const result = await orderService.getOrderHistory(token)
      return result.orders
    },
    enabled: !!token && enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  })

  const invalidateOrders = async () => {
    await queryClient.invalidateQueries({ queryKey: ["orders"] })
  }

  return {
    ...query,
    invalidateOrders,
  }
}
