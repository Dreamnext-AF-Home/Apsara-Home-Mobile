import axios from "axios"
import { API_CONFIG } from "../config/api"

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

export interface UserAddress {
  id: number
  full_name: string
  phone: string
  address: string
  region: string
  province: string
  city: string
  barangay: string
  zip_code: string
  address_type: string
  notes?: string
  is_default: boolean
  full_address: string
}

export const checkoutService = {
  async getAddresses(token: string): Promise<UserAddress[]> {
    try {
      const response = await api.get("/auth/addresses", {
        headers: { Authorization: `Bearer ${token}` },
      })
      return response.data?.addresses ?? []
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to load addresses",
        details: error.response?.data,
        status: error.response?.status,
      }
    }
  },
}
