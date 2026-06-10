import { useQuery, useQueryClient } from "@tanstack/react-query"
import { profileService } from "../../services/profileService"

interface UseProfileOptions {
  token?: string | null
  enabled?: boolean
}

export const useProfile = ({ token, enabled = true }: UseProfileOptions) => {
  const queryClient = useQueryClient()

  const query = useQuery<any>({
    queryKey: ["profile", token],
    queryFn: async () => {
      if (!token) throw new Error("Token is required")
      return profileService.getCurrentUser(token)
    },
    enabled: !!token && enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  })

  const invalidateProfile = async () => {
    await queryClient.invalidateQueries({ queryKey: ["profile"] })
  }

  return {
    ...query,
    invalidateProfile,
  }
}
