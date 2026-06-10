import { useQuery, useQueryClient } from "@tanstack/react-query"
import { homeService, type CartCount } from "../../services/homeService"

interface UseCartCountOptions {
  token?: string | null
  enabled?: boolean
}

export const useCartCount = ({ token, enabled = true }: UseCartCountOptions) => {
  const queryClient = useQueryClient()

  const query = useQuery<CartCount>({
    queryKey: ["cartCount", token],
    queryFn: async () => {
      if (!token) throw new Error("Token is required")
      return homeService.getCartCount(token)
    },
    enabled: !!token && enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  })

  const invalidateCartCount = async () => {
    await queryClient.invalidateQueries({ queryKey: ["cartCount"] })
  }

  return {
    ...query,
    invalidateCartCount,
  }
}
