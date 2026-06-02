import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Image,
} from 'react-native';
import { Colors } from '../../constants/colors';

interface DailyCheckinProps {
  isDarkMode?: boolean;
  onCheckin?: (day: number) => void;
  onViewMore?: () => void;
}

const CHECKIN_REWARDS = [20, 25, 30, 35, 40, 45, 50]; // PV for each day
const DAY_LABELS = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'];

export default function DailyCheckin({ isDarkMode = false, onCheckin }: DailyCheckinProps) {
  const [checkedInDays, setCheckedInDays] = useState<number[]>([]);
  const [scaleAnims] = useState(DAY_LABELS.map(() => new Animated.Value(1)));

  const colors = {
    bg: isDarkMode ? '#0f172a' : '#f5f5f5',
    containerBg: isDarkMode ? '#1f2937' : Colors.white,
    cardBg: isDarkMode ? '#1e293b' : '#f8fafc',
    text: isDarkMode ? '#f8fafc' : Colors.text,
    textSec: isDarkMode ? '#94a3b8' : Colors.textSecondary,
    border: isDarkMode ? '#374151' : '#e5e7eb',
    borderLight: isDarkMode ? '#475569' : '#f1f5f9',
  };

  const handleCheckin = (day: number) => {
    if (!checkedInDays.includes(day)) {
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
      if (onCheckin) {
        onCheckin(day);
      }
    }
  };

  const todayReward = CHECKIN_REWARDS[0];
  const totalPV = CHECKIN_REWARDS.reduce((sum, pv) => sum + pv, 0);

  return (
    <View style={[styles.section, { backgroundColor: colors.containerBg, borderColor: colors.border }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>PV Check In</Text>
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
          const isToday = day === 1;

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
              <View style={styles.dayCardWrapper}>
                <TouchableOpacity
                  style={[
                    styles.dayCard,
                    {
                      backgroundColor: isChecked ? Colors.sky : colors.cardBg,
                    },
                  ]}
                  onPress={() => handleCheckin(day)}
                  disabled={isChecked}
                  activeOpacity={0.8}
                >
                  {/* Reward Badge */}
                  {!isChecked && (
                    <View style={styles.rewardBadge}>
                      <Text style={styles.rewardBadgeText}>+{reward}</Text>
                    </View>
                  )}

                  {/* Coin Image */}
                  <View style={styles.coinContainer}>
                    <Image
                      source={day <= 6 ? require('../../../assets/coin_1.png') : require('../../../assets/coin_2.png')}
                      style={styles.coinImage}
                      resizeMode="contain"
                    />
                  </View>
                </TouchableOpacity>

                {/* Label - Outside/Below */}
                <Text
                  style={[
                    styles.dayLabel,
                    {
                      color: isToday ? Colors.sky : colors.text,
                    },
                  ]}
                >
                  {DAY_LABELS[index]}
                </Text>
              </View>
            </Animated.View>
          );
        })}
      </ScrollView>

      {/* Check-in Button */}
      <TouchableOpacity
        style={[styles.checkinButton, { borderTopColor: colors.borderLight }]}
        onPress={() => handleCheckin(1)}
        disabled={checkedInDays.includes(1)}
      >
        <Text style={styles.checkinButtonText}>Check in to get total of {totalPV} PV</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  daysScroll: {
    maxHeight: 165,
  },
  daysScrollContainer: {
    paddingHorizontal: 4,
    paddingVertical: 20,
    gap: 0,
  },
  dayWrapper: {
    alignItems: 'center',
    width: 70,
  },
  dayCardWrapper: {
    width: '100%',
    alignItems: 'center',
    gap: 6,
  },
  dayCard: {
    width: 60,
    height: 95,
    borderRadius: 8,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  coinContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
  },
  coinImage: {
    width: 36,
    height: 36,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  rewardBadge: {
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.sky,
    zIndex: 10,
  },
  rewardBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.sky,
  },
  checkinButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkinButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.sky,
  },
});
