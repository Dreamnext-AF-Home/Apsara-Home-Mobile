import React from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, Platform, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

interface User {
  id: string;
  email: string;
  name: string;
  username?: string;
  avatar_url?: string;
  badge_name?: string;
  monthly_activation?: {
    remaining_pv: number;
  };
}

interface ProfileScreenProps {
  user?: User | null;
  onLogout?: () => void;
  onNavigateSettings?: () => void;
}

const REFERRAL_STATS = [
  { label: 'Total', value: '5', icon: 'people-outline' as const },
  { label: 'Pending', value: '₱1,200', icon: 'time-outline' as const },
  { label: 'Earned', value: '₱4,500', icon: 'cash-outline' as const },
];

const PURCHASE_ITEMS = [
  { icon: 'wallet-outline' as const, label: 'Paid' },
  { icon: 'cube-outline' as const, label: 'To Ship' },
  { icon: 'car-outline' as const, label: 'To Receive' },
  { icon: 'star-outline' as const, label: 'To Rate' },
];

const SOCIAL_ITEMS = [
  { icon: 'logo-facebook' as const, label: 'Facebook', url: 'https://facebook.com/afhome.ph', color: '#1877F2' },
  { icon: 'logo-instagram' as const, label: 'Instagram', url: 'https://instagram.com/afhome.ph', color: '#E4405F' },
  { icon: 'logo-tiktok' as const, label: 'TikTok', url: 'https://tiktok.com/@afhome.ph', color: '#000000' },
  { icon: 'globe-outline' as const, label: 'Website', url: 'https://www.afhome.ph', color: Colors.sky },
];

const MENU_ITEMS = [
  { icon: 'settings-outline' as const, label: 'Settings', chevron: true, key: 'settings' },
  { icon: 'log-out-outline' as const, label: 'Log Out', chevron: false, danger: true, key: 'logout' },
];

export default function ProfileScreen({ user, onLogout, onNavigateSettings }: ProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const photoUrl = user?.avatar_url ?? null;
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : '?';
  const firstName = user?.name?.split(' ')[0] ?? 'User';

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <LinearGradient
        colors={['rgba(14,165,233,0.18)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerLeft}>
          <View style={styles.headerAvatar}>
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.headerAvatarImg} />
            ) : (
              <Text style={styles.headerAvatarInitial}>{initial}</Text>
            )}
          </View>
          <View style={styles.headerNameContainer}>
            <View style={styles.headerNameRow}>
              <Text style={styles.headerName} numberOfLines={1}>{user?.name ?? 'Guest'}</Text>
            </View>
            {user?.username && (
              <View style={styles.usernameRow}>
                <Text style={styles.usernameText}>@{user.username}</Text>
                {user?.badge_name && (
                  <>
                    <View style={styles.usernameDot} />
                    <View style={styles.userBadge}>
                      <Ionicons name="shield-checkmark" size={10} color={Colors.white} />
                      <Text style={styles.userBadgeText}>{user.badge_name}</Text>
                    </View>
                  </>
                )}
                <View style={styles.usernameDot} />
                <Text style={styles.usernamePvText}>{user.monthly_activation?.remaining_pv ?? 0} PV</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
            <Ionicons name="notifications-outline" size={20} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7} onPress={onNavigateSettings}>
            <Ionicons name="settings-outline" size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* ── Scrollable body ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* My Purchases */}
        <View style={styles.section}>
          <View style={styles.purchasesHeader}>
            <Text style={styles.purchasesTitle}>My Purchases</Text>
            <TouchableOpacity style={styles.purchasesViewAll}>
              <Text style={styles.purchasesViewAllText}>View Purchase History</Text>
              <Ionicons name="chevron-forward" size={14} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <View style={styles.purchasesGrid}>
            {PURCHASE_ITEMS.map((item) => (
              <TouchableOpacity key={item.label} style={styles.purchaseItem} activeOpacity={0.7}>
                <View style={styles.purchaseIconContainer}>
                  <Ionicons name={item.icon} size={24} color={Colors.sky} />
                </View>
                <Text style={styles.purchaseLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* My Referrals */}
        <View style={styles.section}>
          <View style={styles.purchasesHeader}>
            <Text style={styles.purchasesTitle}>My Referrals</Text>
            <TouchableOpacity style={styles.purchasesViewAll}>
              <Text style={styles.purchasesViewAllText}>View Network</Text>
              <Ionicons name="chevron-forward" size={14} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <View style={styles.purchasesGrid}>
            {REFERRAL_STATS.map((item) => (
              <TouchableOpacity key={item.label} style={styles.purchaseItem} activeOpacity={0.7}>
                <View style={styles.purchaseIconContainer}>
                  <Ionicons name={item.icon} size={22} color={Colors.sky} />
                </View>
                <Text style={styles.referralValue}>{item.value}</Text>
                <Text style={styles.purchaseLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Menu */}
        <View style={styles.section}>
          {MENU_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.menuRow,
                index < MENU_ITEMS.length - 1 && styles.menuRowBorder,
              ]}
              activeOpacity={0.7}
              onPress={() => {
                if (item.key === 'logout') onLogout?.();
                if (item.key === 'settings') onNavigateSettings?.();
              }}
            >
              <View style={[styles.menuIcon, item.danger && styles.menuIconDanger]}>
                <Ionicons
                  name={item.icon}
                  size={18}
                  color={item.danger ? Colors.error : Colors.sky}
                />
              </View>
              <Text style={[styles.menuLabel, item.danger && styles.menuLabelDanger]}>
                {item.label}
              </Text>
              {item.chevron && (
                <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Connect with Us */}
        <View style={styles.section}>
          <View style={styles.purchasesHeader}>
            <Text style={styles.purchasesTitle}>Connect with Us</Text>
          </View>
          <View style={styles.purchasesGrid}>
            {SOCIAL_ITEMS.map((item) => (
              <TouchableOpacity 
                key={item.label} 
                style={styles.purchaseItem} 
                activeOpacity={0.7}
                onPress={() => item.url && Linking.openURL(item.url)}
              >
                <View style={styles.purchaseIconContainer}>
                  <Ionicons name={item.icon} size={24} color={item.color} />
                </View>
                <Text style={styles.purchaseLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f0f9ff',
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 16,
    backgroundColor: Colors.white,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 8,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e0f2fe',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.sky,
  },
  headerAvatarImg: {
    width: '100%',
    height: '100%',
  },
  headerAvatarInitial: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.sky,
  },
  headerNameContainer: {
    flex: 1,
  },
  headerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerName: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
    flexShrink: 1,
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  userBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.white,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  usernameText: {
    fontSize: 12,
    color: Colors.sky,
    fontWeight: '600',
  },
  usernameDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#cbd5e1',
  },
  usernamePvText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Body ──
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 8,
    gap: 16,
    paddingBottom: 32,
  },

  // ── Hero ──
  hero: {
    borderRadius: 20,
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 16,
    gap: 6,
  },
  heroBubble: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
    marginBottom: 4,
  },
  heroBubbleImg: {
    width: '100%',
    height: '100%',
  },
  heroBubbleInitial: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.white,
  },
  heroName: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.white,
  },
  heroEmail: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  heroBadgeText: {
    fontSize: 11,
    color: Colors.white,
    fontWeight: '700',
  },

  // ── My Purchases ──
  purchasesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  purchasesTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  purchasesViewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  purchasesViewAllText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  purchasesGrid: {
    flexDirection: 'row',
    paddingVertical: 16,
  },
  purchaseItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  purchaseIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  purchaseLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.text,
  },
  referralValue: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.text,
    marginTop: -2,
  },

  // ── Menu ──
  section: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconDanger: {
    backgroundColor: '#fee2e2',
  },
  menuLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  menuLabelDanger: {
    color: Colors.error,
  },
});
