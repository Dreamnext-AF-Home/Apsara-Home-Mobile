import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';
const TOKEN_TIMESTAMP_KEY = 'token_timestamp';
const ONBOARDED_KEY = 'has_onboarded';

// Helper function to check if SecureStore is available
const isSecureStoreAvailable = () => {
  try {
    return !!SecureStore;
  } catch (error) {
    console.error('SecureStore not available:', error);
    return false;
  }
};

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  monthly_activation?: {
    current_month_pv: number;
    threshold_pv: number;
    remaining_pv: number;
  };
}

export const storageService = {
  // Save authentication data with timestamp
  async saveAuthData(token: string, user: StoredUser): Promise<void> {
    try {
      if (!isSecureStoreAvailable()) {
        console.warn('SecureStore not available, using in-memory storage');
        return;
      }
      const now = Date.now();
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
      await SecureStore.setItemAsync(TOKEN_TIMESTAMP_KEY, now.toString());
    } catch (error) {
      console.error('Error saving auth data:', error);
      throw error;
    }
  },

  // Get stored token
  async getToken(): Promise<string | null> {
    try {
      if (!isSecureStoreAvailable()) {
        console.warn('SecureStore not available, returning null');
        return null;
      }
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const timestamp = await SecureStore.getItemAsync(TOKEN_TIMESTAMP_KEY);
      
      if (!token || !timestamp) {
        return null;
      }

      // Check if token is older than 60 minutes (60 * 60 * 1000 = 3600000 ms)
      const tokenAge = Date.now() - parseInt(timestamp);
      const maxAge = 60 * 60 * 1000; // 60 minutes

      if (tokenAge > maxAge) {
        // Token expired, clear all auth data
        await this.clearAuthData();
        return null;
      }

      return token;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  // Get stored user
  async getUser(): Promise<StoredUser | null> {
    try {
      if (!isSecureStoreAvailable()) {
        console.warn('SecureStore not available, returning null');
        return null;
      }
      const userJson = await SecureStore.getItemAsync(USER_KEY);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  },

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await this.getToken();
      const user = await this.getUser();
      return !!(token && user);
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  },

  // Clear all authentication data
  async clearAuthData(): Promise<void> {
    try {
      if (!isSecureStoreAvailable()) {
        console.warn('SecureStore not available, skipping clear');
        return;
      }
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
      await SecureStore.deleteItemAsync(TOKEN_TIMESTAMP_KEY);
    } catch (error) {
      console.error('Error clearing auth data:', error);
      throw error;
    }
  },

  async hasOnboarded(): Promise<boolean> {
    try {
      const val = await SecureStore.getItemAsync(ONBOARDED_KEY);
      return val === 'true';
    } catch {
      return false;
    }
  },

  async setOnboarded(): Promise<void> {
    try {
      await SecureStore.setItemAsync(ONBOARDED_KEY, 'true');
    } catch {}
  },

  async resetOnboarding(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(ONBOARDED_KEY);
    } catch {}
  },

  // Refresh token timestamp (to extend session)
  async refreshTokenTimestamp(): Promise<void> {
    try {
      if (!isSecureStoreAvailable()) {
        console.warn('SecureStore not available, skipping refresh');
        return;
      }
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        await SecureStore.setItemAsync(TOKEN_TIMESTAMP_KEY, Date.now().toString());
      }
    } catch (error) {
      console.error('Error refreshing token timestamp:', error);
    }
  },
};
