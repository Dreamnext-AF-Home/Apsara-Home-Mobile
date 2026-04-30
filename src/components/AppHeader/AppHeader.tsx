import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

interface AppHeaderProps {
  user?: { name: string; avatar_url?: string } | null;
  onNotificationPress?: () => void;
  onFilterPress?: () => void;
  onSearchPress?: () => void;
  searchPlaceholder?: string;
}

export default function AppHeader({
  user,
  onNotificationPress,
  onFilterPress,
  onSearchPress,
  searchPlaceholder = 'Search...',
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const photoUrl = user?.avatar_url ?? null;
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : null;
  const firstName = user?.name ? user.name.split(' ')[0] : 'Guest';

  return (
    <LinearGradient
      colors={['rgba(14,165,233,0.18)', 'rgba(255,255,255,0)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[styles.container, { paddingTop: insets.top + 12 }]}
    >
      <View style={styles.topRow}>
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.avatarImage} />
            ) : initial ? (
              <Text style={styles.avatarInitial}>{initial}</Text>
            ) : (
              <Ionicons name="person" size={18} color={Colors.textSecondary} />
            )}
          </View>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.nameText}>{firstName}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.iconBtn} onPress={onNotificationPress} activeOpacity={0.7}>
          <Ionicons name="notifications-outline" size={20} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <TouchableOpacity
          style={styles.searchWrapper}
          onPress={onSearchPress}
          activeOpacity={0.75}
        >
          <Ionicons name="search-outline" size={16} color={Colors.textSecondary} style={styles.searchIcon} />
          <Text style={styles.searchPlaceholder}>{searchPlaceholder}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconBtn} onPress={onFilterPress} activeOpacity={0.7}>
          <Ionicons name="options-outline" size={20} color={Colors.text} />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.sky,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.sky,
  },
  welcomeText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '400',
  },
  nameText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
