import axios from "axios"
import { API_CONFIG } from "../config/api"

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

export interface OrderCounts {
  all: number
  pending: number
  processing: number
  shipped: number
  delivered: number
  cancelled: number
  completed: number
  paid: number
}

export interface NotificationItem {
  id: string
  title: string
  message: string
  description?: string
  count?: number
  severity: "success" | "info" | "warning" | "error"
  href?: string
  latest_at?: string | null
  created_at?: string
  is_read: boolean
  amount?: number
  product_image?: string
  mobile_order_id?: string
  order_id?: string
}

export interface Notifications {
  unread_count: number
  items: NotificationItem[]
  generated_at: string
}

export interface OrderHistoryItem {
  id: number
  order_number: string
  mobile_order_id: string
  status: string
  created_at: string
  total_amount: number
  shipping_fee: number
  payment_method: string
  tracking_number?: string
  checkout_id?: string
  refund_reason?: string
  items: any[]
}

export interface OrderHistoryResponse {
  orders: OrderHistoryItem[]
}

export interface LoginHistoryItem {
  id: number
  description: string
  method: string
  method_icon: string
  device: string
  platform: string
  browser: string
  ip_address: string
  location?: string
  created_at: string
  timestamp: number
}

export interface LoginHistoryResponse {
  data: LoginHistoryItem[]
  pagination?: {
    has_more?: boolean
  }
}

export const orderService = {
  async getOrderHistory(token: string): Promise<OrderHistoryResponse> {
    try {
      const response = await api.get("/orders/history", {
        headers: { Authorization: `Bearer ${token}` },
      })
      // Preserve exact normalization the screen used: response.data?.orders || []
      return { orders: response.data?.orders || [] }
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to load orders",
        details: error.response?.data,
        status: error.response?.status,
      }
    }
  },

  async getLoginHistory(
    token: string,
    page: number = 1,
    perPage: number = 20
  ): Promise<LoginHistoryResponse> {
    try {
      const response = await api.get("/login-history", {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, per_page: perPage },
      })
      // Preserve exact normalization the screen used
      return {
        data: response.data?.data || [],
        pagination: response.data?.pagination,
      }
    } catch (error: any) {
      throw {
        message:
          error.response?.data?.message || "Failed to load login history",
        details: error.response?.data,
        status: error.response?.status,
      }
    }
  },

  async getOrderCounts(token: string): Promise<OrderCounts> {
    try {
      const response = await api.get("/orders/counts", {
        headers: { Authorization: `Bearer ${token}` },
      })
      return response.data
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to load order counts",
        details: error.response?.data,
        status: error.response?.status,
      }
    }
  },

  async getNotifications(token: string): Promise<any> {
    try {
      const response = await api.get("/mobile/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      })
      return response.data
    } catch (error: any) {
      throw {
        message:
          error.response?.data?.message || "Failed to load notifications",
        details: error.response?.data,
        status: error.response?.status,
      }
    }
  },

  async readNotification(
    token: string,
    notificationId: string | number
  ): Promise<any> {
    try {
      const response = await api.patch(
        `/mobile/notifications/${notificationId}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      return response.data
    } catch (error: any) {
      throw {
        message:
          error.response?.data?.message ||
          "Failed to mark notification as read",
        details: error.response?.data,
        status: error.response?.status,
      }
    }
  },

  async clearCart(token: string): Promise<any> {
    try {
      const response = await api.delete("/cart", {
        headers: { Authorization: `Bearer ${token}` },
      })
      return response.data
    } catch (error: any) {
      console.error("Error clearing cart:", error)
      return { success: false }
    }
  },
}
