import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

interface DailyCheckinProps {
  isDarkMode?: boolean;
  onCheckin?: (day: number) => void;
  onViewMore?: () => void;
}

const CHECKIN_REWARDS = [20, 25, 30, 35, 40, 45, 50]; // PV for each day
const DAY_LABELS = ['Today', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'];
const DAY_ICONS = ['gift-outline', 'gift-outline', 'gift-outline', 'gift-outline', 'gift-outline', 'gift-outline', 'trophy-outline'];

export default function DailyCheckin({ isDarkMode = false, onCheckin, onViewMore }: DailyCheckinProps) {
  const [checkedInDays, setCheckedInDays] = useState<number[]>([]);
  const [lastCheckinDay, setLastCheckinDay] = useState<number | null>(null);
  const [scaleAnims] = useState(DAY_LABELS.map(() => new Animated.Value(1)));

  const colors = {
    bg: isDarkMode ? '#1e293b' : Colors.white,
    text: isDarkMode ? '#f8fafc' : Colors.text,
    textSec: isDarkMode ? '#94a3b8' : Colors.textSecondary,
    border: isDarkMode ? '#334155' : '#e5e7eb',
    borderLight: isDarkMode ? '#475569' : '#f1f5f9',
  };

  const handleCheckin = (day: number) => {
    if (!checkedInDays.includes(day)) {
      // Bounce animation
      Animated.sequence([
        Animated.timing(scaleAnims[day - 1], {
          toValue: 1.1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnims[day - 1], {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      setCheckedInDays([...checkedInDays, day]);
      setLastCheckinDay(day);
      if (onCheckin) {
        onCheckin(day);
      }
    }
  };

  const totalEarned = checkedInDays.reduce((sum, day) => sum + CHECKIN_REWARDS[day - 1], 0);
  const isComplete = checkedInDays.length === 7;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDarkMode ? '#0ea5e9' : Colors.sky }]}>
        <View>
          <Text style={styles.headerTitle}>Daily Check-In</Text>
          <Text style={styles.headerSubtitle}>Earn up to 245 PV this week!</Text>
        </View>
        {isComplete && (
          <View style={styles.completeBadge}>
            <Ionicons name="star" size={24} color={Colors.white} />
          </View>
        )}
      </View>

      {/* Info Bar */}
      <View style={[styles.infoBar, { backgroundColor: isDarkMode ? '#0f172a' : '#f0f9ff', borderBottomColor: colors.borderLight }]}>
        <View style={styles.progressInfo}>
          <Text style={[styles.progressLabel, { color: colors.textSec }]}>Progress</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(checkedInDays.length / 7) * 100}%` }]} />
          </View>
        </View>
        <Text style={[styles.progressText, { color: Colors.sky }]}>{checkedInDays.length}/7</Text>
      </View>

      {/* Days Container */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.daysScrollContainer}
        style={styles.daysScroll}
      >
        {CHECKIN_REWARDS.map((reward, index) => {
          const day = index + 1;
          const isChecked = checkedInDays.includes(day);
          const scaleAnim = scaleAnims[index];

          return (
            <Animated.View
              key={day}
              style={[
                styles.dayWrapper,
                {
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.dayCard,
                  {
                    backgroundColor: isChecked
                      ? Colors.sky
                      : isDarkMode
                      ? '#334155'
                      : '#f1f5f9',
                    borderColor: isChecked ? Colors.sky : colors.border,
                  },
                ]}
                onPress={() => handleCheckin(day)}
                disabled={isChecked}
                activeOpacity={0.8}
              >
                {/* Icon */}
                <View style={styles.iconContainer}>
                  <Ionicons
                    name={isChecked ? 'checkmark-circle' : DAY_ICONS[index]}
                    size={32}
                    color={isChecked ? Colors.white : Colors.sky}
                  />
                </View>

                {/* Label */}
                <Text
                  style={[
                    styles.dayLabel,
                    {
                      color: isChecked ? Colors.white : colors.text,
                    },
                  ]}
                >
                  {DAY_LABELS[index]}
                </Text>

                {/* Reward */}
                <View
                  style={[
                    styles.rewardBox,
                    {
                      backgroundColor: isChecked
                        ? 'rgba(255,255,255,0.2)'
                        : Colors.sky,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.rewardValue,
                      {
                        color: isChecked ? Colors.white : Colors.white,
                      },
                    ]}
                  >
                    +{reward}
                  </Text>
                  <Text
                    style={[
                      styles.rewardLabel,
                      {
                        color: isChecked ? Colors.white : Colors.white,
                      },
                    ]}
                  >
                    PV
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </ScrollView>

      {/* Total Earned & View More */}
      <View style={[styles.totalSection, { borderTopColor: colors.borderLight }]}>
        <View style={styles.totalLeft}>
          <View>
            <Text style={[styles.totalLabel, { color: colors.textSec }]}>Total Earned</Text>
            <Text style={[styles.totalValue, { color: Colors.sky }]}>{totalEarned} PV</Text>
          </View>
          {onViewMore && (
            <TouchableOpacity onPress={onViewMore} style={styles.viewMoreButton}>
              <Text style={[styles.viewMoreText, { color: Colors.sky }]}>View More Ways</Text>
              <Ionicons name="chevron-forward" size={14} color={Colors.sky} />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.messageBox}>
          {isComplete ? (
            <View style={styles.messageContent}>
              <Ionicons name="trophy-outline" size={14} color={Colors.sky} />
              <Text style={[styles.messageText, { color: Colors.sky }]}>All done!</Text>
            </View>
          ) : lastCheckinDay ? (
            <View style={styles.messageContent}>
              <Ionicons name="flame-outline" size={14} color="#ff6b35" />
              <Text style={[styles.messageText, { color: '#ff6b35' }]}>{7 - checkedInDays.length} more</Text>
            </View>
          ) : (
            <View style={styles.messageContent}>
              <Ionicons name="sparkles-outline" size={14} color={Colors.sky} />
              <Text style={[styles.messageText, { color: Colors.sky }]}>Tap to start</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  header: {
    backgroundColor: Colors.sky,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  completeBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  progressInfo: {
    flex: 1,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.sky,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '700',
    minWidth: 35,
    textAlign: 'right',
  },
  daysScroll: {
    maxHeight: 160,
  },
  daysScrollContainer: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 10,
  },
  dayWrapper: {
    width: 95,
  },
  dayCard: {
    width: 95,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  rewardBox: {
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
    width: '100%',
  },
  rewardValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  rewardLabel: {
    fontSize: 9,
    fontWeight: '600',
  },
  totalSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  totalLeft: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewMoreText: {
    fontSize: 11,
    fontWeight: '600',
  },
  messageBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  messageText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
