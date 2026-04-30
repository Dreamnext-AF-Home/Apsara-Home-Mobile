import React, { useState } from 'react';
import Toast from 'react-native-toast-message';
import LoginScreen from './src/screen/LoginScreen';
import SignupScreen from './src/screen/SignupScreen';
import OtpScreen from './src/screen/OtpScreen';
import AppNavigator from './src/navigation/AppNavigator';

type AuthScreen = 'login' | 'signup' | 'otp';

export default function App() {
  const [screen, setScreen] = useState<AuthScreen>('login');
  const [otpEmail, setOtpEmail] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [authenticated, setAuthenticated] = useState(false);

  function goAuthenticated() {
    setAuthenticated(true);
    setScreen('login');
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

    return <LoginScreen onGoToSignup={() => setScreen('signup')} onAuthenticated={goAuthenticated} />;
  }

  return (
    <>
      {authenticated ? <AppNavigator /> : renderAuth()}
      <Toast />
    </>
  );
}
