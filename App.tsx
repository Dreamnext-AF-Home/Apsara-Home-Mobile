import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import LoginScreen from './src/screen/LoginScreen';
import SignupScreen from './src/screen/SignupScreen';
import OtpScreen from './src/screen/OtpScreen';
import AppNavigator from './src/navigation/AppNavigator';
import { storageService, StoredUser } from './src/services/storageService';
import { HomeScreenSkeleton } from './src/components/SkeletonLoader/SkeletonLoader';

type AuthScreen = 'login' | 'signup' | 'otp';

interface AuthUser {
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

export default function App() {
  const [screen, setScreen] = useState<AuthScreen>('login');
  const [otpEmail, setOtpEmail] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored authentication on app startup
  useEffect(() => {
    checkStoredAuth();
  }, []);

  async function checkStoredAuth() {
    try {
      const isAuth = await storageService.isAuthenticated();
      if (isAuth) {
        const token = await storageService.getToken();
        const user = await storageService.getUser();
        
        if (token && user) {
          setAuthToken(token);
          setAuthUser(user);
          setAuthenticated(true);
        }
      }
    } catch (error) {
      console.error('Error checking stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function goAuthenticated(user?: AuthUser, token?: string) {
    setAuthenticated(true);
    setScreen('login');
    if (user) setAuthUser(user);
    if (token) setAuthToken(token);
    
    // Save authentication data to storage for persistence
    if (user && token) {
      try {
        await storageService.saveAuthData(token, user);
      } catch (error) {
        console.error('Error saving auth data:', error);
      }
    }
  }

  async function logout() {
    try {
      await storageService.clearAuthData();
      setAuthenticated(false);
      setAuthUser(null);
      setAuthToken(null);
      setScreen('login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  function renderAuth() {
    if (screen === 'signup') {
      return (
        <SignupScreen
          onGoToLogin={() => setScreen('login')}
          onContinueToOtp={(email, token) => {
            setOtpEmail(email);
            setVerificationToken(token);
            setScreen('otp');
          }}
        />
      );
    }

    if (screen === 'otp') {
      return (
        <OtpScreen
          email={otpEmail}
          verificationToken={verificationToken}
          onBackToSignup={() => setScreen('signup')}
          onSuccess={goAuthenticated}
        />
      );
    }

    return <LoginScreen onGoToSignup={() => setScreen('signup')} onAuthenticated={(user, token) => goAuthenticated(user, token)} />;
  }

  return (
    <SafeAreaProvider>
      {isLoading ? (
        <HomeScreenSkeleton />
      ) : authenticated ? (
        <AppNavigator user={authUser} token={authToken} onLogout={logout} />
      ) : (
        renderAuth()
      )}
      <Toast />
    </SafeAreaProvider>
  );
}
