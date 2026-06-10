import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  walletService,
  type WalletSummary,
  type WalletOverview,
  type WalletNetwork,
  type WalletVoucher,
} from "../../services/walletService"

interface UseWalletOptions {
  token?: string | null
  walletType?: string
  enabled?: boolean
}

export const useWallet = ({
  token,
  walletType,
  enabled = true,
}: UseWalletOptions) => {
  const queryClient = useQueryClient()

  const query = useQuery<WalletSummary>({
    queryKey: ["wallet", token, walletType ?? null],
    queryFn: async () => {
      if (!token) throw new Error("Token is required")
      return walletService.getWallet(token, walletType)
    },
    enabled: !!token && enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  })

  const invalidateWallet = async () => {
    await queryClient.invalidateQueries({ queryKey: ["wallet"] })
  }

  return {
    ...query,
    invalidateWallet,
  }
}

interface UseWalletScopedOptions {
  token?: string | null
  enabled?: boolean
}

export const useWalletOverview = ({
  token,
  enabled = true,
}: UseWalletScopedOptions) => {
  const queryClient = useQueryClient()

  const query = useQuery<WalletOverview>({
    queryKey: ["wallet", "overview", token],
    queryFn: async () => {
      if (!token) throw new Error("Token is required")
      return walletService.getWalletWithLedger(token, "all")
    },
    enabled: !!token && enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  })

  const invalidateWalletOverview = async () => {
    await queryClient.invalidateQueries({ queryKey: ["wallet", "overview"] })
  }

  return {
    ...query,
    invalidateWalletOverview,
  }
}

export const useWalletNetwork = ({
  token,
  enabled = true,
}: UseWalletScopedOptions) => {
  const queryClient = useQueryClient()

  const query = useQuery<WalletNetwork>({
    queryKey: ["wallet", "network", token],
    queryFn: async () => {
      if (!token) throw new Error("Token is required")
      return walletService.getWalletNetwork(token)
    },
    enabled: !!token && enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  })

  const invalidateWalletNetwork = async () => {
    await queryClient.invalidateQueries({ queryKey: ["wallet", "network"] })
  }

  return {
    ...query,
    invalidateWalletNetwork,
  }
}

export const useWalletVoucher = ({
  token,
  enabled = true,
}: UseWalletScopedOptions) => {
  const queryClient = useQueryClient()

  const query = useQuery<WalletVoucher>({
    queryKey: ["wallet", "voucher", token],
    queryFn: async () => {
      if (!token) throw new Error("Token is required")
      return walletService.getWalletVoucher(token)
    },
    enabled: !!token && enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  })

  const invalidateWalletVoucher = async () => {
    await queryClient.invalidateQueries({ queryKey: ["wallet", "voucher"] })
  }

  return {
    ...query,
    invalidateWalletVoucher,
  }
}
