import axios from 'axios';
import { API_CONFIG } from '../config/api';

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface LoginResponse {
  user?: {
    id: string;
    email: string;
    name: string;
  };
  accessToken?: string;
  token?: string;
  error?: string;
  message?: string;
}

export interface AuthError {
  message: string;
  type?: '2FA_REQUIRED' | 'MFA_APPROVAL_REQUIRED';
  token?: string;
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await api.post('/auth/mobile/login', {
        email,
        password,
      });
      
      // Validate response contains user data
      const data = response.data;
      if (!data) {
        throw { message: 'Invalid response from server' } as AuthError;
      }
      
      // Check for error in response
      if (data.error || data.message?.toLowerCase().includes('invalid') || data.message?.toLowerCase().includes('incorrect')) {
        throw { message: data.message || data.error || 'Invalid credentials' } as AuthError;
      }
      
      // Validate user object exists
      if (!data.user && !data.accessToken && !data.token) {
        throw { message: 'Login failed - no user data received' } as AuthError;
      }
      
      return data;
    } catch (error: any) {
      // If already an AuthError, re-throw
      if (error.type || (error.message && !error.response)) {
        throw error;
      }
      
      const errorMessage = error.response?.data?.message 
        || error.response?.data?.error 
        || error.message 
        || 'Login failed';
      const status = error.response?.status;
      
      // Handle HTTP error status codes
      if (status === 401) {
        throw { message: 'Invalid email or password', status } as AuthError;
      }
      if (status === 403) {
        throw { message: 'Account locked or access denied', status } as AuthError;
      }
      if (status === 404) {
        throw { message: 'User not found', status } as AuthError;
      }
      if (status >= 500) {
        throw { message: 'Server error - please try again later', status } as AuthError;
      }
      
      // Handle special 2FA/MFA responses
      if (errorMessage.includes('2FA_REQUIRED')) {
        const [, token, msg] = errorMessage.split('|');
        throw { message: msg || '2FA required', type: '2FA_REQUIRED', token } as AuthError;
      }
      
      if (errorMessage.includes('MFA_APPROVAL_REQUIRED')) {
        const [, token, msg] = errorMessage.split('|');
        throw { message: msg || 'MFA approval required', type: 'MFA_APPROVAL_REQUIRED', token } as AuthError;
      }
      
      throw { 
        message: errorMessage,
        details: error.response?.data,
        status: status,
      } as AuthError;
    }
  },

  async getCsrfToken(): Promise<string> {
    try {
      const response = await api.get('/auth/csrf');
      return response.data.csrfToken;
    } catch (error) {
      return '';
    }
  },

  async verify2FA(token: string, otp: string): Promise<LoginResponse> {
    try {
      const response = await api.post('/auth/login/2fa/verify', { token, otp });
      return response.data;
    } catch (error: any) {
      throw { message: error.response?.data?.message || '2FA verification failed' } as AuthError;
    }
  },

  async resend2FA(token: string): Promise<void> {
    try {
      await api.post('/auth/login/2fa/resend', { token });
    } catch (error: any) {
      throw { message: error.response?.data?.message || 'Failed to resend 2FA' } as AuthError;
    }
  },

  async checkMFAStatus(token: string): Promise<{ approved: boolean }> {
    try {
      const response = await api.get('/auth/login/mfa/status', { params: { token } });
      return response.data;
    } catch (error: any) {
      throw { message: error.response?.data?.message || 'Failed to check MFA status' } as AuthError;
    }
  },

  async resendMFA(token: string): Promise<void> {
    try {
      await api.post('/auth/login/mfa/resend', { token });
    } catch (error: any) {
      throw { message: error.response?.data?.message || 'Failed to resend MFA' } as AuthError;
    }
  },

  async passkeyLoginOptions(email: string): Promise<any> {
    try {
      const response = await api.post('/auth/passkeys/login/options', { email });
      return response.data;
    } catch (error: any) {
      throw { message: error.response?.data?.message || 'Failed to get passkey options' } as AuthError;
    }
  },

  async verifyPasskey(options: any, credential: any): Promise<LoginResponse> {
    try {
      const response = await api.post('/auth/passkeys/login/verify', { options, credential });
      return response.data;
    } catch (error: any) {
      throw { message: error.response?.data?.message || 'Passkey verification failed' } as AuthError;
    }
  },

  async googleLogin(idToken: string): Promise<LoginResponse> {
    try {
      const response = await api.post('/auth/google/login', { id_token: idToken });
      
      const data = response.data;
      if (!data) {
        throw { message: 'Invalid response from server' } as AuthError;
      }
      
      // Handle error responses
      if (data.error) {
        throw { message: data.error } as AuthError;
      }
      
      // Validate user data
      if (!data.user) {
        throw { message: 'Google login failed - no user data received' } as AuthError;
      }
      
      return data;
    } catch (error: any) {
      if (error.type) {
        throw error;
      }
      
      const status = error.response?.status;
      const message = error.response?.data?.error 
        || error.response?.data?.message 
        || error.message 
        || 'Google login failed';
      
      if (status === 400) {
        throw { message: 'Invalid Google token - please try again', status } as AuthError;
      }
      
      throw { message, status, details: error.response?.data } as AuthError;
    }
  },

  async facebookCallback(accessToken: string): Promise<LoginResponse> {
    try {
      const response = await api.post('/auth/callback/facebook', { accessToken });
      return response.data;
    } catch (error: any) {
      throw { message: error.response?.data?.message || 'Facebook login failed' } as AuthError;
    }
  },
};
