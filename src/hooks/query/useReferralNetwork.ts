import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  referralService,
  type ReferralTree,
} from "../../services/referralService"

interface UseReferralNetworkOptions {
  token?: string | null
  enabled?: boolean
}

export const useReferralNetwork = ({
  token,
  enabled = true,
}: UseReferralNetworkOptions) => {
  const queryClient = useQueryClient()

  const query = useQuery<ReferralTree>({
    queryKey: ["referral-network", token],
    queryFn: async () => {
      if (!token) throw new Error("Token is required")
      return referralService.getReferralTree(token)
    },
    enabled: !!token && enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  })

  const invalidateReferralNetwork = async () => {
    await queryClient.invalidateQueries({ queryKey: ["referral-network"] })
  }

  return {
    ...query,
    invalidateReferralNetwork,
  }
}
