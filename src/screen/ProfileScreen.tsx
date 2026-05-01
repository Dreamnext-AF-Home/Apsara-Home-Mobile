import React from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
}

interface ProfileScreenProps {
  user?: User | null;
  onLogout?: () => void;
}

const MENU_ITEMS = [
  { icon: 'person-outline' as const,       label: 'Edit Profile',        chevron: true },
  { icon: 'shield-checkmark-outline' as const, label: 'Verification',     chevron: true },
  { icon: 'card-outline' as const,          label: 'Payment Methods',    chevron: true },
  { icon: 'location-outline' as const,      label: 'Addresses',          chevron: true },
  { icon: 'help-circle-outline' as const,   label: 'Help & Support',     chevron: true },
  { icon: 'document-text-outline' as const, label: 'Terms & Privacy',    chevron: true },
  { icon: 'log-out-outline' as const,       label: 'Log Out',            chevron: false, danger: true },
];

export default function ProfileScreen({ user, onLogout }: ProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const photoUrl = user?.avatar_url ?? null;
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : '?';
  const firstName = user?.name?.split(' ')[0] ?? 'User';

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerLeft}>
          <View style={styles.headerAvatar}>
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.headerAvatarImg} />
            ) : (
              <Text style={styles.headerAvatarInitial}>{initial}</Text>
            )}
          </View>
          <Text style={styles.headerName}>{firstName}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
            <Ionicons name="notifications-outline" size={20} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
            <Ionicons name="settings-outline" size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Scrollable body ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero card */}
        <LinearGradient
          colors={[Colors.sky, Colors.skyDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroBubble}>
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.heroBubbleImg} />
            ) : (
              <Text style={styles.heroBubbleInitial}>{initial}</Text>
            )}
          </View>
          <Text style={styles.heroName}>{user?.name ?? 'Guest'}</Text>
          <Text style={styles.heroEmail}>{user?.email ?? ''}</Text>
          <View style={styles.heroBadge}>
            <Ionicons name="checkmark-circle" size={12} color={Colors.white} />
            <Text style={styles.heroBadgeText}>Member</Text>
          </View>
        </LinearGradient>

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
                if (item.label === 'Log Out' && onLogout) {
                  onLogout();
                }
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f8fbff',
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  headerName: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
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
    padding: 16,
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

  // ── Menu ──
  section: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
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
