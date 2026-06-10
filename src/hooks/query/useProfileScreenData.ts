import { useQuery, useQueryClient } from "@tanstack/react-query"
import { accountService } from "../../services/accountService"
import { orderService } from "../../services/orderService"
import { referralService, type ReferralTree } from "../../services/referralService"
import { profileService } from "../../services/profileService"

interface TokenOption {
  token?: string | null
  enabled?: boolean
}

const QUERY_DEFAULTS = {
  staleTime: 1000 * 60 * 5, // 5 minutes
  gcTime: 1000 * 60 * 10, // 10 minutes
}

// Loyalty snapshot (rank, tier, pv, referral_count, active member counts).
export const useLoyaltyData = ({ token, enabled = true }: TokenOption) => {
  return useQuery<any>({
    queryKey: ["loyalty", token],
    queryFn: async () => {
      if (!token) throw new Error("Token is required")
      const snapshot = await accountService.getAccountSnapshot(token)
      return snapshot.loyalty
    },
    enabled: !!token && enabled,
    ...QUERY_DEFAULTS,
  })
}

// Order counts, preserving ProfileScreen's exact normalization of the payload.
export const useOrderCounts = ({ token, enabled = true }: TokenOption) => {
  return useQuery<any>({
    queryKey: ["orderCounts", token],
    queryFn: async () => {
      if (!token) throw new Error("Token is required")
      // Cast to any: the backend payload carries alias keys (to_ship, canceled,
      // returns, ...) beyond the typed OrderCounts shape that we normalize here.
      const data = (await orderService.getOrderCounts(token)) as any
      return {
        ...data,
        to_receive: Number(
          data?.to_receive ??
            data?.out_for_delivery ??
            data?.outfordelivery ??
            data?.toReceive ??
            0
        ),
        delivered: Number(data?.delivered ?? 0),
        shipped: Number(data?.shipped ?? data?.to_ship ?? data?.toship ?? 0),
        cancelled: Number(data?.cancelled ?? data?.canceled ?? 0),
        return: Number(data?.return ?? data?.returned ?? data?.returns ?? 0),
      }
    },
    enabled: !!token && enabled,
    ...QUERY_DEFAULTS,
  })
}

// Referral network tree. Returns null when the tree has no root (matches the
// screen's previous "only set when data.root exists" guard).
export const useReferralTree = ({ token, enabled = true }: TokenOption) => {
  return useQuery<ReferralTree | null>({
    queryKey: ["referralTree", token],
    queryFn: async () => {
      if (!token) throw new Error("Token is required")
      const data = await referralService.getReferralTree(token)
      return data && data.root ? data : null
    },
    enabled: !!token && enabled,
    ...QUERY_DEFAULTS,
  })
}

// Security settings — biometric_enabled flag.
export const useSecuritySettings = ({ token, enabled = true }: TokenOption) => {
  return useQuery<boolean>({
    queryKey: ["securitySettings", token],
    queryFn: async () => {
      if (!token) throw new Error("Token is required")
      const settings = await profileService.getSecuritySettings(token)
      return settings.biometric_enabled ?? false
    },
    enabled: !!token && enabled,
    ...QUERY_DEFAULTS,
  })
}

// Whether the user's Google account is linked.
export const useGoogleLinked = ({ token, enabled = true }: TokenOption) => {
  return useQuery<boolean>({
    queryKey: ["googleLinked", token],
    queryFn: async () => {
      if (!token) throw new Error("Token is required")
      return profileService.getGoogleLinkedStatus(token)
    },
    enabled: !!token && enabled,
    ...QUERY_DEFAULTS,
  })
}

interface UseLeaderboardRankOptions extends TokenOption {
  userId?: string | number | null
}

// Derives the user's 1-based leaderboard rank from the public top-members list.
// Returns null when the user is not on the list.
export const useUserLeaderboardRank = ({
  token,
  userId,
  enabled = true,
}: UseLeaderboardRankOptions) => {
  return useQuery<number | null>({
    queryKey: ["leaderboardRank", token, userId ?? null],
    queryFn: async () => {
      if (!token) throw new Error("Token is required")
      const members = await profileService.getTopMembers("referrals", 100)
      const index = members.findIndex(
        (member: any) => member.id === parseInt(String(userId))
      )
      return index !== -1 ? index + 1 : null
    },
    enabled: !!token && !!userId && enabled,
    ...QUERY_DEFAULTS,
  })
}

// Single invalidate helper for the screen's pull-to-refresh.
export const useProfileScreenInvalidate = () => {
  const queryClient = useQueryClient()
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["loyalty"] }),
      queryClient.invalidateQueries({ queryKey: ["orderCounts"] }),
      queryClient.invalidateQueries({ queryKey: ["referralTree"] }),
      queryClient.invalidateQueries({ queryKey: ["securitySettings"] }),
      queryClient.invalidateQueries({ queryKey: ["googleLinked"] }),
      queryClient.invalidateQueries({ queryKey: ["leaderboardRank"] }),
    ])
  }
}
