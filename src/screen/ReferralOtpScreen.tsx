import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Clipboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { Colors } from '../constants/colors';
import Button from '../components/Button/PrimaryButton';
import { authService } from '../services/authService';

interface ReferralOtpScreenProps {
  email: string;
  verificationToken: string;
  isDarkMode?: boolean;
  onBack: () => void;
  onSuccess: () => void;
}

export default function ReferralOtpScreen({
  email,
  verificationToken,
  isDarkMode = false,
  onBack,
  onSuccess,
}: ReferralOtpScreenProps) {
  const insets = useSafeAreaInsets();
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [expiresIn, setExpiresIn] = useState(300); // 5 minutes in seconds
  const [errorMessage, setErrorMessage] = useState('');
  const otpRefs = useRef<(TextInput | null)[]>([]);

  // Countdown timer for OTP expiration
  useEffect(() => {
    const timer = setInterval(() => {
      setExpiresIn(seconds => (seconds > 0 ? seconds - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Auto-fill OTP from clipboard
  useEffect(() => {
    const autoFillOtp = async () => {
      try {
        const clipboardText = await Clipboard.getString();
        // Check if clipboard contains exactly 4 digits
        if (clipboardText && /^\d{4}$/.test(clipboardText.trim())) {
          const digits = clipboardText.trim().split('');
          setOtp(digits as [string, string, string, string]);
        }
      } catch (error) {
        // Silently fail if clipboard read fails
        console.log('Could not read clipboard for OTP auto-fill');
      }
    };

    autoFillOtp();
  }, []);

  const colors = {
    bg: isDarkMode ? '#0f172a' : '#f8fbff',
    containerBg: isDarkMode ? '#1f2937' : Colors.white,
    text: isDarkMode ? '#f8fafc' : Colors.text,
    textSec: isDarkMode ? '#94a3b8' : Colors.textSecondary,
    border: isDarkMode ? '#374151' : '#e5e7eb',
  };

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text.slice(-1);
    setOtp(newOtp);

    if (text && index < 3) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (index: number, key: string) => {
    if (key === 'Backspace') {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        otpRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 4) {
      setErrorMessage('Please enter all 4 digits.');
      return;
    }

    if (expiresIn === 0) {
      setErrorMessage('OTP has expired. Please request a new code.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      await authService.verifyRegisterOtp(verificationToken, otpCode);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Account verified successfully!',
      });
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (error: any) {
      setErrorMessage(error.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = () => {
    // TODO: Implement resend OTP function
    setErrorMessage('A new OTP has been sent to your contact number.');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <LinearGradient
        colors={isDarkMode ? ['rgba(59,130,246,0.15)', 'rgba(31,41,55,0)'] : ['rgba(14,165,233,0.18)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.header, { paddingTop: insets.top, backgroundColor: colors.containerBg }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={[styles.headerGreeting, { color: colors.text }]}>
              Verify Account
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSec }]}>
              Enter the 4-digit code
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >


          {/* OTP Input Boxes */}
          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: colors.text }]}>Enter Verification Code</Text>
            <Text style={[styles.expiryText, { color: expiresIn < 60 ? '#ef4444' : colors.textSec }]}>
              Expires in {Math.floor(expiresIn / 60)}:{(expiresIn % 60).toString().padStart(2, '0')}
            </Text>
          </View>
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (otpRefs.current[index] = ref)}
                style={[
                  styles.otpBox,
                  {
                    borderColor: digit ? Colors.sky : colors.border,
                    backgroundColor: colors.containerBg,
                    color: colors.text,
                  },
                ]}
                value={digit}
                onChangeText={(text) => handleOtpChange(text, index)}
                onKeyPress={({ nativeEvent }) => handleOtpKeyPress(index, nativeEvent.key)}
                maxLength={1}
                keyboardType="number-pad"
                placeholderTextColor={colors.textSec}
                placeholder="-"
              />
            ))}
          </View>

          {/* Error Message */}
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          {/* Resend OTP */}
          <View style={styles.resendContainer}>
            <Text style={[styles.resendText, { color: colors.textSec }]}>Didn't receive code?</Text>
            <TouchableOpacity onPress={handleResendOtp}>
              <Text style={[styles.resendLink, { color: Colors.sky }]}>Resend OTP</Text>
            </TouchableOpacity>
          </View>

          {/* Verify Button */}
          <Button
            title="VERIFY"
            onPress={handleVerify}
            loading={loading}
            style={styles.verifyBtn}
          />

          <View style={styles.spacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  headerGreeting: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    width: '100%',
    maxWidth: 900,
    marginHorizontal: 'auto',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  expiryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginBottom: 12,
    fontWeight: '500',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  otpBox: {
    width: 56,
    height: 56,
    borderWidth: 2,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 20,
  },
  resendText: {
    fontSize: 12,
  },
  resendLink: {
    fontSize: 12,
    fontWeight: '600',
  },
  verifyBtn: {
    marginBottom: 16,
  },
  spacer: {
    height: 40,
  },
});
