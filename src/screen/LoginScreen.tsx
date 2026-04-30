import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  Image,
  Modal,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as AuthSession from 'expo-auth-session';
import { useVideoPlayer, VideoView } from 'expo-video';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import appConfig from '../../app.json';
import { Colors } from '../constants/colors';
import Button from '../components/Button/PrimaryButton';
import { authService, AuthError } from '../services/authService';

// Handle auth session completion
WebBrowser.maybeCompleteAuthSession();

type Tab = 'signin' | 'signup';

type AuthStep = 'login' | '2fa' | 'mfa';

export default function LoginScreen() {
  const expoConfig = appConfig.expo;
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: expoConfig.scheme,
    path: 'redirect',
  });
  const [activeTab, setActiveTab] = useState<Tab>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [authStep, setAuthStep] = useState<AuthStep>('login');
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [mfaPolling, setMfaPolling] = useState(false);

  // Auto-dismiss message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const player = useVideoPlayer(require('../../assets/login/home-login.mp4'), p => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  function validate() {
    const next: { email?: string; password?: string } = {};
    if (!email.trim()) next.email = 'Username or email is required.';
    if (!password) next.password = 'Password is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSignIn() {
    if (!validate()) return;
    setLoading(true);
    setMessage(null);

    try {
      const response = await authService.login(email, password);
      
      // Validate response contains actual user data
      if (!response.user && !response.accessToken && !response.token) {
        setMessage({ type: 'error', text: 'Login failed - invalid credentials' });
        return;
      }
      
      setMessage({ type: 'success', text: 'Login successful!' });
    } catch (error: any) {
      if (error.type === '2FA_REQUIRED') {
        setAuthToken(error.token);
        setAuthStep('2fa');
        setMessage({ type: 'error', text: error.message });
      } else if (error.type === 'MFA_APPROVAL_REQUIRED') {
        setAuthToken(error.token);
        setAuthStep('mfa');
        setMessage({ type: 'error', text: error.message });
        startMfaPolling();
      } else {
        const errorDetails = error.details ? ` (${JSON.stringify(error.details)})` : '';
        const statusInfo = error.status ? ` [Status: ${error.status}]` : '';
        setMessage({ 
          type: 'error', 
          text: `${error.message || 'Login failed'}${statusInfo}${errorDetails}` 
        });
      }
    } finally {
      setLoading(false);
    }
  }

  async function handle2FAVerify() {
    if (!otp.trim()) {
      setMessage({ type: 'error', text: 'Please enter the OTP code' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await authService.verify2FA(authToken!, otp);
      setMessage({ type: 'success', text: '2FA verification successful!' });
      setAuthStep('login');
      setOtp('');
      setAuthToken(null);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || '2FA verification failed' });
    } finally {
      setLoading(false);
    }
  }

  async function handleResend2FA() {
    setLoading(true);
    setMessage(null);

    try {
      await authService.resend2FA(authToken!);
      setMessage({ type: 'success', text: 'OTP resent successfully' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to resend OTP' });
    } finally {
      setLoading(false);
    }
  }

  function startMfaPolling() {
    setMfaPolling(true);
    const interval = setInterval(async () => {
      try {
        const status = await authService.checkMFAStatus(authToken!);
        if (status.approved) {
          clearInterval(interval);
          setMfaPolling(false);
          setMessage({ type: 'success', text: 'MFA approved! Login successful.' });
          setAuthStep('login');
          setAuthToken(null);
        }
      } catch (error: any) {
        clearInterval(interval);
        setMfaPolling(false);
        setMessage({ type: 'error', text: error.message || 'MFA check failed' });
      }
    }, 3000);
  }

  async function handleResendMFA() {
    setLoading(true);
    setMessage(null);

    try {
      await authService.resendMFA(authToken!);
      setMessage({ type: 'success', text: 'MFA approval email resent' });
      startMfaPolling();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to resend MFA' });
    } finally {
      setLoading(false);
    }
  }

  // Google OAuth configuration
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '',
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    redirectUri,
  });

  // Handle Google OAuth response
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      if (id_token) {
        handleGoogleToken(id_token);
      } else {
        setMessage({ type: 'error', text: 'Google login failed - no ID token received' });
      }
    } else if (response?.type === 'error') {
      setMessage({ type: 'error', text: 'Google login was cancelled or failed' });
      setLoading(false);
    }
  }, [response]);

  async function handleGoogleToken(idToken: string) {
    setLoading(true);
    setMessage(null);

    try {
      const result = await authService.googleLogin(idToken);
      
      // Validate response contains actual user data
      if (!result.user) {
        setMessage({ type: 'error', text: 'Google login failed - no user data received' });
        return;
      }
      
      setMessage({ type: 'success', text: `Welcome, ${result.user.name || result.user.email}!` });
      // Store token and navigate to home screen
    } catch (error: any) {
      const errorMsg = error.message || 'Google login failed';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setLoading(true);
    setMessage(null);

    try {
      if (!request) {
        setMessage({ type: 'error', text: 'Google login not ready - please try again' });
        setLoading(false);
        return;
      }

      const result = await promptAsync();
      // Response is handled by useEffect above
      if (result.type !== 'success') {
        setLoading(false);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Google login failed' });
      setLoading(false);
    }
  }

  async function handlePasskeyLogin() {
    setLoading(true);
    setMessage(null);

    try {
      // TODO: Implement WebAuthn/Passkey using expo-web-browser or similar
      // For now, this is a placeholder
      setMessage({ type: 'error', text: 'Passkey not yet implemented' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Passkey login failed' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Video background */}
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
      />

      {/* Dark overlay */}
      <View style={styles.overlay} />

      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.card}>
              {/* Logo */}
              <Image
                source={require('../../assets/af_home_logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />

              {/* Tab Switcher */}
              <View style={styles.tabs}>
                <Pressable
                  style={[styles.tab, activeTab === 'signin' && styles.tabActive]}
                  onPress={() => setActiveTab('signin')}
                >
                  <Text style={[styles.tabText, activeTab === 'signin' && styles.tabTextActive]}>
                    Sign In
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.tab, activeTab === 'signup' && styles.tabActive]}
                  onPress={() => setActiveTab('signup')}
                >
                  <Text style={[styles.tabText, activeTab === 'signup' && styles.tabTextActive]}>
                    Sign Up
                  </Text>
                </Pressable>
              </View>

              {/* Heading */}
              <Text style={styles.heading}>Welcome back!</Text>
              <Text style={styles.subheading}>Sign in to your AF Home account</Text>

              {/* Email / Username */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Username or Email</Text>
                <TextInput
                  style={[styles.input, errors.email ? styles.inputError : null]}
                  value={email}
                  onChangeText={t => { setEmail(t); setErrors(e => ({ ...e, email: undefined })); }}
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  returnKeyType="next"
                />
                {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
              </View>

              {/* Password */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={[styles.passwordRow, errors.password ? styles.inputError : null]}>
                  <TextInput
                    style={styles.passwordInput}
                    value={password}
                    onChangeText={t => { setPassword(t); setErrors(e => ({ ...e, password: undefined })); }}
                    placeholderTextColor={Colors.textSecondary}
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    returnKeyType="done"
                    onSubmitEditing={handleSignIn}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(v => !v)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={Colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
                {errors.password
                  ? <Text style={styles.errorText}>{errors.password}</Text>
                  : <Text style={styles.hint}>Passwords are case-sensitive.</Text>
                }
              </View>

              {/* Remember me + Forgot Password */}
              <View style={styles.rememberRow}>
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setRememberMe(v => !v)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                    {rememberMe && (
                      <Ionicons name="checkmark" size={11} color={Colors.white} />
                    )}
                  </View>
                  <Text style={styles.rememberText}>Remember me</Text>
                </TouchableOpacity>

                <TouchableOpacity>
                  <Text style={styles.forgotText}>Forgot Password</Text>
                </TouchableOpacity>
              </View>

              {/* Sign In Button */}
              <Button
                title="Sign in"
                onPress={handleSignIn}
                loading={loading}
                style={styles.signInBtn}
              />

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerLabel}>Or continue with</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social buttons */}
              <View style={styles.socialRow}>
                <TouchableOpacity style={styles.socialBtn} activeOpacity={0.75} onPress={handleGoogleLogin} disabled={loading}>
                  <Image
                    source={require('../../assets/google-icon.png')}
                    style={styles.googleIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.socialBtnText}>Google</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.socialBtn} activeOpacity={0.75} onPress={handlePasskeyLogin} disabled={loading}>
                  <Ionicons name="key-outline" size={18} color={Colors.text} />
                  <Text style={styles.socialBtnText}>Passkey</Text>
                </TouchableOpacity>
              </View>

              {/* Message display */}
              {message && (
                <View style={[styles.messageBox, message.type === 'success' ? styles.messageSuccess : styles.messageError]}>
                  <Ionicons
                    name={message.type === 'success' ? 'checkmark-circle' : 'alert-circle'}
                    size={16}
                    color={message.type === 'success' ? '#10b981' : Colors.error}
                  />
                  <Text style={[styles.messageText, message.type === 'success' ? styles.messageTextSuccess : styles.messageTextError]}>
                    {message.text}
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* 2FA Modal */}
      <Modal visible={authStep === '2fa'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Two-Factor Authentication</Text>
            <Text style={styles.modalSubtitle}>Enter the OTP code sent to your email</Text>
            
            <TextInput
              style={styles.otpInput}
              value={otp}
              onChangeText={setOtp}
              placeholder="Enter OTP"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />

            <Button title="Verify" onPress={handle2FAVerify} loading={loading} style={styles.modalButton} />
            <TouchableOpacity style={styles.modalLink} onPress={handleResend2FA} disabled={loading}>
              <Text style={styles.modalLinkText}>Resend OTP</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalLink} onPress={() => { setAuthStep('login'); setOtp(''); setAuthToken(null); setMessage(null); }}>
              <Text style={styles.modalLinkText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MFA Modal */}
      <Modal visible={authStep === 'mfa'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="mail-outline" size={48} color={Colors.text} style={styles.modalIcon} />
            <Text style={styles.modalTitle}>MFA Approval Required</Text>
            <Text style={styles.modalSubtitle}>Check your email for the approval link</Text>
            {mfaPolling && <Text style={styles.modalPolling}>Waiting for approval...</Text>}

            <TouchableOpacity style={styles.modalLink} onPress={handleResendMFA} disabled={loading}>
              <Text style={styles.modalLinkText}>Resend Email</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalLink} onPress={() => { setAuthStep('login'); setAuthToken(null); setMessage(null); setMfaPolling(false); }}>
              <Text style={styles.modalLinkText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  // Card — border only, no shadow
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 28,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
  },

  // Logo
  logo: {
    width: 160,
    height: 56,
    alignSelf: 'center',
    marginBottom: 24,
  },

  // Tabs
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 28,
  },
  tab: {
    flex: 1,
    height: 38,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: '#0ea5e9',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.white,
  },

  // Heading
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
  },
  subheading: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 24,
  },

  // Fields
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  input: {
    height: 48,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: Colors.text,
  },
  inputError: {
    borderColor: Colors.error,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    borderRadius: 10,
    paddingLeft: 14,
    paddingRight: 12,
  },
  passwordInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  hint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 5,
    marginLeft: 2,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 5,
    marginLeft: 2,
  },

  // Remember + Forgot
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    marginTop: 4,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  checkboxChecked: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
  },
  rememberText: {
    fontSize: 13,
    color: Colors.text,
  },
  forgotText: {
    fontSize: 13,
    color: '#0ea5e9',
    fontWeight: '600',
  },

  // Sign in button
  signInBtn: {
    borderRadius: 999,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.inputBorder,
  },
  dividerLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },

  // Social
  socialRow: {
    flexDirection: 'row',
    gap: 12,
  },
  socialBtn: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    borderRadius: 10,
    gap: 8,
    backgroundColor: Colors.white,
  },
  googleIcon: {
    width: 18,
    height: 18,
  },
  socialBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },

  // Message box
  messageBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  messageSuccess: {
    backgroundColor: '#d1fae5',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  messageError: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: Colors.error,
  },
  messageText: {
    fontSize: 13,
    flex: 1,
  },
  messageTextSuccess: {
    color: '#065f46',
  },
  messageTextError: {
    color: '#991b1b',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalPolling: {
    fontSize: 13,
    color: '#0ea5e9',
    marginBottom: 20,
  },
  otpInput: {
    width: '100%',
    height: 52,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 18,
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: 16,
  },
  modalButton: {
    width: '100%',
    marginBottom: 12,
  },
  modalLink: {
    paddingVertical: 8,
  },
  modalLinkText: {
    fontSize: 14,
    color: '#0ea5e9',
    fontWeight: '600',
  },
});
