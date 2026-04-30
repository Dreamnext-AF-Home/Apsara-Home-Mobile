import React, { useEffect, useState } from 'react';
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
  useWindowDimensions,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { Colors } from '../constants/colors';
import Button from '../components/Button/PrimaryButton';
import { authService } from '../services/authService';

type SignupScreenProps = {
  onGoToLogin?: () => void;
  onContinueToOtp?: (email: string, verificationToken: string) => void;
};

export default function SignupScreen({ onGoToLogin, onContinueToOtp }: SignupScreenProps) {
  const { width } = useWindowDimensions();
  const isCompact = width < 700;
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [termsScrolledToEnd, setTermsScrolledToEnd] = useState(false);
  const [signupData, setSignupData] = useState({
    firstName: '',
    lastName: '',
    mobileNumber: '',
    email: '',
    username: '',
    referralCode: '',
    password: '',
    passwordConfirmation: '',
  });

  const player = useVideoPlayer(require('../../assets/login/home-login.mp4'), p => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  function validate() {
    const next: Record<string, string> = {};
    const phoneDigits = signupData.mobileNumber.replace(/\D/g, '');
    if (!signupData.firstName.trim()) next.firstName = 'First name is required.';
    if (!signupData.lastName.trim()) next.lastName = 'Last name is required.';
    if (!signupData.email.trim()) next.email = 'Email is required.';
    if (!signupData.username.trim()) next.username = 'Username is required.';
    if (phoneDigits.length !== 11) next.mobileNumber = 'Use 11 digits only.';
    if (!signupData.referralCode.trim()) next.referralCode = 'Referral code or link is required.';
    if (signupData.password.length < 8) next.password = 'Password must be at least 8 characters.';
    if (signupData.passwordConfirmation !== signupData.password) next.passwordConfirmation = 'Passwords do not match.';
    if (!acceptedTerms) next.terms = 'Please agree to the Terms and Conditions.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleRegister() {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        first_name: signupData.firstName,
        last_name: signupData.lastName,
        middle_name: '',
        name: `${signupData.firstName} ${signupData.lastName}`.trim(),
        email: signupData.email,
        username: signupData.username,
        phone: signupData.mobileNumber,
        birth_date: '2000-01-01',
        gender: 'male',
        occupation: 'Not specified',
        work_location: 'local',
        country: 'Philippines',
        referred_by: signupData.referralCode,
        password: signupData.password,
        password_confirmation: signupData.passwordConfirmation,
        address: 'Not specified',
        barangay: 'Not specified',
        city: 'Not specified',
        province: 'Not specified',
        region: 'Not specified',
        zip_code: '0000',
      };
      const response = await authService.mobileRegister(payload);
      if (response.requires_otp && response.verification_token) {
        Toast.show({
          type: 'success',
          text1: response.message || 'Registration successful',
          text2: 'A 4-digit verification code has been sent to your email.',
        });
        setTimeout(() => {
          onContinueToOtp?.(response.email, response.verification_token);
        }, 900);
      }
    } catch (error: any) {
      setErrors({ form: error.message || 'Registration failed' });
      Toast.show({
        type: 'error',
        text1: 'Registration failed',
        text2: error.message || 'Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }

  function openTermsModal() {
    setTermsScrolledToEnd(false);
    setTermsModalVisible(true);
  }

  function handleTermsScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 24) {
      setTermsScrolledToEnd(true);
    }
  }

  const fields: Array<{ key: keyof typeof signupData; label: string; half?: boolean; keyboard?: any }> = [
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'mobileNumber', label: 'Mobile Number', keyboard: 'phone-pad' },
    { key: 'email', label: 'Email Address', keyboard: 'email-address' },
    { key: 'username', label: 'Username' },
    { key: 'referralCode', label: 'Referral Code / Referral Link' },
  ];

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
      <View style={styles.overlay} />
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.scroll}>
            <View style={styles.card}>
              <View style={styles.header}>
                <Image
                  source={require('../../assets/af_home_logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
                <View style={styles.tabs}>
                  <Pressable style={styles.tab} onPress={onGoToLogin}>
                    <Text style={styles.tabText}>Sign In</Text>
                  </Pressable>
                  <Pressable style={[styles.tab, styles.tabActive]}>
                    <Text style={[styles.tabText, styles.tabTextActive]}>Sign Up</Text>
                  </Pressable>
                </View>

                <Text style={styles.heading}>Let&apos;s Get Started!</Text>
                <Text style={styles.subheading}>Please enter the required details to create your account.</Text>
              </View>

              <ScrollView
                contentContainerStyle={styles.formScrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {fields.map(field => (
                  <View key={String(field.key)} style={styles.fieldWrap}>
                    <Text style={styles.label}>{field.label} <Text style={styles.required}>*</Text></Text>
                    <TextInput
                      style={[styles.input, errors[field.key] ? styles.inputError : null]}
                      value={signupData[field.key]}
                      onChangeText={t => setSignupData(v => ({ ...v, [field.key]: t }))}
                      placeholderTextColor={Colors.textSecondary}
                      keyboardType={field.keyboard}
                      autoCapitalize={field.key === 'email' || field.key === 'username' ? 'none' : 'words'}
                    />
                    {field.key === 'mobileNumber' ? <Text style={styles.hint}>Use 11 digits only. Format 0929-226-0447.</Text> : null}
                    {field.key === 'username' ? <Text style={styles.hint}>Letters and numbers only, no spaces or symbols.</Text> : null}
                    {errors[field.key] ? <Text style={styles.errorText}>{errors[field.key]}</Text> : null}
                  </View>
                ))}

                <View style={styles.fieldWrap}>
                  <Text style={styles.label}>Password <Text style={styles.required}>*</Text></Text>
                  <View style={[styles.passwordRow, errors.password ? styles.inputError : null]}>
                    <TextInput
                      style={styles.passwordInput}
                      value={signupData.password}
                      onChangeText={t => setSignupData(v => ({ ...v, password: t }))}
                      secureTextEntry={!showPassword}
                      placeholderTextColor={Colors.textSecondary}
                      autoComplete="new-password"
                    />
                    <TouchableOpacity onPress={() => setShowPassword(v => !v)}>
                      <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
                  {!errors.password ? (
                    <View style={styles.ruleList}>
                      <Text style={styles.ruleText}>At least 8 characters</Text>
                      <Text style={styles.ruleText}>At least one uppercase letter</Text>
                      <Text style={styles.ruleText}>At least one lowercase letter</Text>
                      <Text style={styles.ruleText}>At least one number</Text>
                      <Text style={styles.ruleText}>At least one special character</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.fieldWrap}>
                  <Text style={styles.label}>Password Confirmation <Text style={styles.required}>*</Text></Text>
                  <View style={[styles.passwordRow, errors.passwordConfirmation ? styles.inputError : null]}>
                    <TextInput
                      style={styles.passwordInput}
                      value={signupData.passwordConfirmation}
                      onChangeText={t => setSignupData(v => ({ ...v, passwordConfirmation: t }))}
                      secureTextEntry={!showConfirmPassword}
                      placeholderTextColor={Colors.textSecondary}
                      autoComplete="new-password"
                    />
                    <TouchableOpacity onPress={() => setShowConfirmPassword(v => !v)}>
                      <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  {errors.passwordConfirmation ? <Text style={styles.errorText}>{errors.passwordConfirmation}</Text> : null}
                </View>
                <View style={styles.termsBox}>
                  <TouchableOpacity style={styles.checkboxRow} onPress={openTermsModal} activeOpacity={0.7}>
                    <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                      {acceptedTerms && <Ionicons name="checkmark" size={11} color={Colors.white} />}
                    </View>
                    <Text style={styles.termsText}>
                      I have read and agree to the <Text style={styles.linkText}>Terms and Conditions</Text>.
                    </Text>
                  </TouchableOpacity>
                </View>

                {errors.form ? <Text style={styles.errorText}>{errors.form}</Text> : null}

                <Button
                  title="SIGN UP"
                  onPress={handleRegister}
                  loading={loading}
                  disabled={!acceptedTerms}
                  style={styles.signUpBtn}
                />
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <Modal visible={termsModalVisible} transparent animationType="fade" onRequestClose={() => setTermsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.termsModalContent}>
            <Text style={styles.termsModalTitle}>Terms and Conditions</Text>
            <Text style={styles.termsModalSubtitle}>The following are the latest Terms and Conditions of AF Home.</Text>
            <ScrollView
              style={styles.termsModalScroll}
              contentContainerStyle={styles.termsModalScrollContent}
              showsVerticalScrollIndicator
              onScroll={handleTermsScroll}
              scrollEventThrottle={16}
            >
              <Text style={styles.termsParagraphTitle}>1. Independent Distributor Agreement</Text>
              <Text style={styles.termsParagraph}>By becoming a distributor of our company, you agree to be bound by the terms and conditions outlined in this agreement. You acknowledge that you are an independent contractor and not an employee, partner, or agent of the company.</Text>
              <Text style={styles.termsParagraphTitle}>2. Distributor Obligations</Text>
              <Text style={styles.termsParagraph}>As a distributor, you agree to adhere to all applicable laws, regulations, and ethical guidelines in promoting and selling our products and services, represent the company honestly and accurately, maintain a positive and professional image, and attend company-provided training and development programs.</Text>
              <Text style={styles.termsParagraphTitle}>3. Compensation Plan</Text>
              <Text style={styles.termsParagraph}>Our company uses a compensation plan that rewards distributors for sales and building a network. The details of the compensation plan, including commission structure, bonus eligibility, and qualification criteria, are outlined in a separate document, which is an integral part of these terms and conditions.</Text>
              <Text style={styles.termsParagraphTitle}>4. Product Purchase Requirements</Text>
              <Text style={styles.termsParagraph}>To remain an active distributor and qualify for commissions and bonuses, you are required to meet monthly or quarterly product purchase requirements. These requirements may include personal consumption and or retail sales requirements. Failure to meet these requirements may result in the loss of commissions and bonuses.</Text>
              <Text style={styles.termsParagraphTitle}>5. Downline Structure</Text>
              <Text style={styles.termsParagraph}>You may build and manage a network of distributors, commonly referred to as your downline. You understand that your commissions and bonuses may be based on the sales performance and activities of your downline. However, you are responsible for training, supporting, and motivating your downline members.</Text>
              <Text style={styles.termsParagraphTitle}>6. Termination and Resignation</Text>
              <Text style={styles.termsParagraph}>Either party may terminate this agreement at any time with written notice. You understand that in the event of termination or resignation, you will no longer be eligible to receive commissions, bonuses, or other benefits associated with the MLM business.</Text>
              <Text style={styles.termsParagraphTitle}>7. Intellectual Property</Text>
              <Text style={styles.termsParagraph}>All trademarks, logos, copyrighted materials, and other intellectual property owned by the company are protected and may not be used without written permission. Any unauthorized use of company intellectual property may result in legal action.</Text>
              <Text style={styles.termsParagraphTitle}>8. Non-Disparagement</Text>
              <Text style={styles.termsParagraph}>During and after the term of this agreement, you agree not to make any disparaging or defamatory statements about the company, its products, or other distributors. Violation of this clause may result in termination and legal consequences.</Text>
              <Text style={styles.termsParagraphTitle}>9. Product Returns and Refunds</Text>
              <Text style={styles.termsParagraph}>Our company has a product return policy that allows customers to request refunds or exchanges within a specified time frame. You understand that you are responsible for handling customer returns and refunds, and any costs associated with the process.</Text>
              <Text style={styles.termsParagraphTitle}>10. Governing Law and Jurisdiction</Text>
              <Text style={styles.termsParagraph}>This agreement shall be governed by and construed in accordance with the laws of the Philippines. Any disputes arising from this agreement shall be subject to the exclusive jurisdiction of the courts of the Philippines.</Text>
              <Text style={styles.termsParagraph}>By signing below or by accepting these terms and conditions electronically, you acknowledge that you have read, understood, and agreed to abide by the terms and conditions of AF Home.</Text>
              <Text style={styles.termsParagraph}>Need clarification? Reach us anytime through the Contact Us page.</Text>
            </ScrollView>
            <View style={styles.termsModalFooter}>
              <TouchableOpacity style={styles.termsCloseBtn} onPress={() => setTermsModalVisible(false)}>
                <Text style={styles.termsCloseBtnText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.termsAcceptBtn, !termsScrolledToEnd && styles.termsAcceptBtnDisabled]}
                disabled={!termsScrolledToEnd}
                onPress={() => {
                  setAcceptedTerms(true);
                  setTermsModalVisible(false);
                }}
              >
                <Text style={styles.termsAcceptBtnText}>{termsScrolledToEnd ? 'I Agree' : 'Scroll to enable'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 420, height: '88%', maxHeight: 760, minHeight: 560, backgroundColor: Colors.white, borderRadius: 24, padding: 28, borderWidth: 1.5, borderColor: Colors.inputBorder, overflow: 'hidden' },
  header: { flexShrink: 0 },
  logo: { width: 160, height: 56, alignSelf: 'center', marginBottom: 24 },
  tabs: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 12, padding: 4, marginBottom: 28 },
  tab: { flex: 1, height: 38, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  tabActive: { backgroundColor: '#0ea5e9' },
  tabText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: Colors.white },
  heading: { fontSize: 24, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  subheading: { fontSize: 13, color: Colors.textSecondary, marginBottom: 24 },
  formScrollContent: { paddingBottom: 12 },
  fieldWrap: { width: '100%', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 6 },
  required: { color: Colors.error },
  input: { height: 48, backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.inputBorder, borderRadius: 10, paddingHorizontal: 14, fontSize: 15, color: Colors.text },
  inputError: { borderColor: Colors.error },
  hint: { fontSize: 11, color: Colors.textSecondary, marginTop: 5, marginLeft: 2 },
  ruleList: { marginTop: 6, marginLeft: 4, gap: 3 },
  ruleText: { fontSize: 11, color: Colors.textSecondary },
  errorText: { fontSize: 12, color: Colors.error, marginTop: 5, marginLeft: 2 },
  passwordRow: { flexDirection: 'row', alignItems: 'center', height: 48, backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.inputBorder, borderRadius: 10, paddingLeft: 14, paddingRight: 12 },
  passwordInput: { flex: 1, fontSize: 15, color: Colors.text },
  termsBox: { borderWidth: 1, borderColor: Colors.inputBorder, borderRadius: 14, padding: 14, marginBottom: 14 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: { width: 18, height: 18, borderWidth: 1.5, borderColor: Colors.inputBorder, borderRadius: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.white },
  checkboxChecked: { backgroundColor: '#0ea5e9', borderColor: '#0ea5e9' },
  termsText: { flex: 1, fontSize: 12, color: Colors.text },
  linkText: { color: '#0ea5e9', fontWeight: '700' },
  signUpBtn: { borderRadius: 10, backgroundColor: '#0ea5e9' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  termsModalContent: { width: '100%', maxWidth: 520, maxHeight: '86%', backgroundColor: Colors.white, borderRadius: 20, padding: 20 },
  termsModalTitle: { fontSize: 22, fontWeight: '800', color: Colors.text },
  termsModalSubtitle: { marginTop: 6, marginBottom: 14, color: Colors.textSecondary, fontSize: 13 },
  termsModalScroll: { maxHeight: 420 },
  termsModalScrollContent: { paddingBottom: 12 },
  termsParagraphTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginTop: 10, marginBottom: 6 },
  termsParagraph: { fontSize: 13, lineHeight: 19, color: Colors.text, marginBottom: 8 },
  termsModalFooter: { flexDirection: 'row', gap: 10, marginTop: 8 },
  termsCloseBtn: { flex: 1, height: 48, borderRadius: 10, borderWidth: 1, borderColor: Colors.inputBorder, alignItems: 'center', justifyContent: 'center' },
  termsCloseBtnText: { color: Colors.text, fontWeight: '700' },
  termsAcceptBtn: { flex: 1, height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0ea5e9' },
  termsAcceptBtnDisabled: { backgroundColor: '#93c5fd' },
  termsAcceptBtnText: { color: Colors.white, fontWeight: '800' },
});
