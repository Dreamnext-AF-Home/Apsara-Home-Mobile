import axios from "axios"
import { API_CONFIG } from "../config/api"

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

export interface CartCount {
  count: number
}

export const homeService = {
  async getCartCount(token: string): Promise<CartCount> {
    try {
      const response = await api.get("/cart", {
        headers: { Authorization: `Bearer ${token}` },
      })
      return { count: response.data?.cart_items?.length || 0 }
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to load cart",
        details: error.response?.data,
        status: error.response?.status,
      }
    }
  },
}
