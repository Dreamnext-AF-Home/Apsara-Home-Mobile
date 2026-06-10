import { useQuery, useQueryClient } from "@tanstack/react-query"
import { checkoutService, type UserAddress } from "../../services/checkoutService"

interface UseAddressesOptions {
  token?: string | null
  enabled?: boolean
}

export const useAddresses = ({ token, enabled = true }: UseAddressesOptions) => {
  const queryClient = useQueryClient()

  const query = useQuery<UserAddress[]>({
    queryKey: ["addresses", token],
    queryFn: async () => {
      if (!token) throw new Error("Token is required")
      return checkoutService.getAddresses(token)
    },
    enabled: !!token && enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  })

  const invalidateAddresses = async () => {
    await queryClient.invalidateQueries({ queryKey: ["addresses"] })
  }

  return {
    ...query,
    invalidateAddresses,
  }
}
