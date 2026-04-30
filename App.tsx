import React, { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import LoginScreen from './src/screen/LoginScreen';
import SignupScreen from './src/screen/SignupScreen';
import OtpScreen from './src/screen/OtpScreen';
import AppNavigator from './src/navigation/AppNavigator';

type AuthScreen = 'login' | 'signup' | 'otp';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
}

export default function App() {
  const [screen, setScreen] = useState<AuthScreen>('login');
  const [otpEmail, setOtpEmail] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  function goAuthenticated(user?: AuthUser, token?: string) {
    setAuthenticated(true);
    setScreen('login');
    if (user) setAuthUser(user);
    if (token) setAuthToken(token);
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
      {authenticated ? <AppNavigator user={authUser} token={authToken} /> : renderAuth()}
      <Toast />
    </SafeAreaProvider>
  );
}
