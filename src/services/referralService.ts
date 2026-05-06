import axios from 'axios';
import { API_CONFIG } from '../config/api';

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface ReferralUser {
  id: number;
  name: string;
  username: string;
  email: string;
  avatar_url?: string;
  joined_at: string;
  total_earnings: number;
  total_pv: number;
  verification_status: string;
  children_count?: number;
  children?: ReferralUser[];
}

export interface ReferralSummary {
  direct_count: number;
  second_level_count: number;
  total_network: number;
  total_pv: number;
}

export interface ReferralTree {
  root: ReferralUser;
  summary: ReferralSummary;
  children: ReferralUser[];
}

export const referralService = {
  async getReferralTree(token: string): Promise<ReferralTree> {
    try {
      const response = await api.get('/referral-tree', {
        headers: { Authorization: `Bearer ${token}` },
      });

      return response.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || 'Failed to load referral tree',
        details: error.response?.data,
        status: error.response?.status,
      };
    }
  },
};
