import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ImageBackground,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

interface LeaderboardEntry {
  rank: number;
  name: string;
  handle: string;
  earnings: number;
  avatar: string;
}

const TOP_EARNERS: LeaderboardEntry[] = [
  { rank: 1, name: 'Jordyn Kenter', handle: '@jordynkenter', earnings: 96239, avatar: '👨‍💼' },
  { rank: 2, name: 'Alana Bator', handle: '@alanabator', earnings: 84787, avatar: '👩‍🦰' },
  { rank: 3, name: 'Carl Oliver', handle: '@carloliver', earnings: 82139, avatar: '👨‍🦱' },
  { rank: 4, name: 'Davis Curtis', handle: '@daviscurtis', earnings: 80857, avatar: '👨‍💻' },
  { rank: 5, name: 'Isona Othid', handle: '@isonaothid', earnings: 76128, avatar: '👩‍🔬' },
  { rank: 6, name: 'Makenna George', handle: '@makeanna', earnings: 71667, avatar: '👩‍💼' },
  { rank: 7, name: 'Kianna Batista', handle: '@kiannabatista', earnings: 68439, avatar: '👩‍🎤' },
  { rank: 8, name: 'Maxith Cullep', handle: '@maxith', earnings: 66981, avatar: '👨‍🏫' },
  { rank: 9, name: 'Zain Dias', handle: '@zaindias', earnings: 50546, avatar: '👨‍🎨' },
];

const MEDAL_COLORS: Record<number, string> = {
  1: '#FFD700',
  2: '#C0C0C0',
  3: '#CD7F32',
};

const getMedalIcon = (rank: number) => {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return null;
};

export default function LeaderboardScreen({
  isDarkMode = false,
  onClose,
}: {
  isDarkMode?: boolean;
  onClose?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'team' | 'local' | 'global'>('local');

  const colors = {
    bg: isDarkMode ? '#0f172a' : '#f5f5f5',
    headerBg: isDarkMode ? '#16213e' : Colors.white,
    text: isDarkMode ? '#f8fafc' : Colors.text,
    textSec: isDarkMode ? '#94a3b8' : Colors.textSecondary,
    border: isDarkMode ? '#374151' : '#e5e7eb',
    accentGreen: '#4ade80',
  };

  const topThree = TOP_EARNERS.slice(0, 3);
  const restRankings = TOP_EARNERS.slice(3);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header with Background */}
      <ImageBackground
        source={require('../../assets/profile_bg.png')}
        style={[styles.headerBackground]}
        resizeMode="cover"
      >
        <View style={[styles.headerContent, { paddingTop: insets.top }]}>
          <TouchableOpacity style={styles.backBtn} onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Leaderboard</Text>
          <View style={styles.headerPlaceholder} />
        </View>
      </ImageBackground>

      {/* Tab Buttons */}
      <View style={[styles.tabContainer, { borderBottomColor: colors.border }]}>
        {(['team', 'local', 'global'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabButton,
              activeTab === tab && [styles.tabButtonActive, { backgroundColor: '#ef4444' }],
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabButtonText,
                { color: activeTab === tab ? Colors.white : colors.textSec },
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top 3 Rankings */}
        <View style={styles.topThreeContainer}>
          {topThree.map((entry, index) => (
            <View key={entry.rank} style={[styles.topCard, { backgroundColor: colors.headerBg }]}>
              <View style={styles.medalBadge}>
                <Text style={styles.medalEmoji}>{getMedalIcon(entry.rank)}</Text>
              </View>
              <View style={styles.topCardAvatar}>
                <Text style={styles.avatarEmoji}>{entry.avatar}</Text>
              </View>
              <Text style={[styles.topCardName, { color: colors.text }]}>{entry.name.split(' ')[0]}</Text>
              <Text style={[styles.topCardEarnings, { color: colors.accentGreen }]}>
                ₱{entry.earnings.toLocaleString()}
              </Text>
              <View style={[styles.rankBadge, { backgroundColor: MEDAL_COLORS[entry.rank] }]}>
                <Text style={styles.rankBadgeText}>#{entry.rank}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Rest of Rankings */}
        <View style={[styles.rankingsSection, { backgroundColor: colors.headerBg }]}>
          <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.accentGreen }]}>★ Top Ranking ★</Text>
          </View>

          {restRankings.map((entry) => (
            <View key={entry.rank} style={[styles.rankingItem, { borderBottomColor: colors.border }]}>
              <View style={styles.rankingItemLeft}>
                <View style={[styles.rankingAvatar, { backgroundColor: colors.border }]}>
                  <Text style={styles.rankingAvatarEmoji}>{entry.avatar}</Text>
                </View>
                <View style={styles.rankingInfo}>
                  <Text style={[styles.rankingName, { color: colors.text }]}>{entry.name}</Text>
                  <Text style={[styles.rankingEarnings, { color: colors.accentGreen }]}>
                    ▲ ₱{entry.earnings.toLocaleString()}
                  </Text>
                </View>
              </View>
              <View style={[styles.rankingBadge, { backgroundColor: colors.border }]}>
                <Text style={[styles.rankingBadgeText, { color: colors.textSec }]}>#{entry.rank}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ── Header ──
  headerBackground: {
    position: 'relative',
    overflow: 'hidden',
    minHeight: 90,
  },
  headerContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    flex: 1,
    textAlign: 'center',
  },
  headerPlaceholder: {
    width: 44,
  },

  // ── Tabs ──
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  tabButtonActive: {
    borderColor: '#ef4444',
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // ── Content ──
  scrollContent: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 16,
  },

  // ── Top 3 ──
  topThreeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 24,
    alignItems: 'flex-end',
  },
  topCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 8,
  },
  medalBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  medalEmoji: {
    fontSize: 24,
  },
  topCardAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2d3a5c',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  avatarEmoji: {
    fontSize: 28,
  },
  topCardName: {
    fontSize: 12,
    fontWeight: '600',
  },
  topCardEarnings: {
    fontSize: 13,
    fontWeight: '700',
  },
  rankBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
  },
  rankBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000000',
  },

  // ── Rankings Section ──
  rankingsSection: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  sectionHeader: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // ── Ranking Items ──
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  rankingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rankingAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankingAvatarEmoji: {
    fontSize: 22,
  },
  rankingInfo: {
    gap: 2,
    flex: 1,
  },
  rankingName: {
    fontSize: 12,
    fontWeight: '600',
  },
  rankingEarnings: {
    fontSize: 11,
    fontWeight: '600',
  },
  rankingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  rankingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
