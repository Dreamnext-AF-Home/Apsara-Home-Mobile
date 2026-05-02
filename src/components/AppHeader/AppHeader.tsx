import React, { useEffect, useRef } from 'react';
import { Animated, Linking, View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

interface AppHeaderProps {
  user?: {
    name: string;
    avatar_url?: string;
    monthly_activation?: {
      current_month_pv: number;
      threshold_pv: number;
      remaining_pv: number;
    };
  } | null;
  onNotificationPress?: () => void;
  onFilterPress?: () => void;
  onSearchPress?: () => void;
  searchPlaceholder?: string;
}

const MARQUEE_ITEMS = [
  'Summer Sale - Up to 50% off selected items',
  'New arrivals every week',
  'Nationwide delivery to all major cities',
  'Installment available via GCash & Maya',
  'Free Shipping on orders over PHP 5,000',
];

const SOCIAL_LINKS = [
  { icon: 'logo-facebook' as const, url: 'https://www.facebook.com/AFHomePH/' },
  { icon: 'logo-instagram' as const, url: 'https://www.instagram.com/afhome.ph/' },
  { icon: 'logo-tiktok' as const, url: 'https://www.tiktok.com/@afhomeph' },
];

function MarqueeItems() {
  return (
    <>
      {MARQUEE_ITEMS.map((text, i) => (
        <View key={i} style={marqueeStyles.item}>
          <Text style={marqueeStyles.text}>{text}</Text>
          <Image
            source={require('../../../assets/af_home_logo.png')}
            style={marqueeStyles.logo}
            resizeMode="contain"
          />
        </View>
      ))}
    </>
  );
}

function MarqueeBanner() {
  const tx1 = useRef(new Animated.Value(0)).current;
  const tx2 = useRef(new Animated.Value(0)).current;
  const pos1 = useRef(0);
  const pos2 = useRef(0);
  const contentWidthRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startScrolling = (cw: number) => {
    pos1.current = 0;
    pos2.current = cw;
    tx1.setValue(0);
    tx2.setValue(cw);

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      pos1.current -= 0.7;
      pos2.current -= 0.7;

      // when a view goes fully off the left edge, teleport it to the right
      if (pos1.current <= -cw) pos1.current = cw;
      if (pos2.current <= -cw) pos2.current = cw;

      tx1.setValue(pos1.current);
      tx2.setValue(pos2.current);
    }, 16);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleLayout = (e: any) => {
    const w = e.nativeEvent.layout.width;
    if (w && w !== contentWidthRef.current) {
      contentWidthRef.current = w;
      startScrolling(w);
    }
  };

  return (
    <View style={marqueeStyles.container}>
      <View style={marqueeStyles.scrollArea}>
        <Animated.View
          style={[marqueeStyles.row, { transform: [{ translateX: tx1 }] }]}
          onLayout={handleLayout}
        >
          <MarqueeItems />
        </Animated.View>
        <Animated.View style={[marqueeStyles.row, { transform: [{ translateX: tx2 }] }]}>
          <MarqueeItems />
        </Animated.View>
      </View>

      <View style={marqueeStyles.socialRow}>
        {SOCIAL_LINKS.map(({ icon, url }) => (
          <TouchableOpacity key={url} onPress={() => Linking.openURL(url)} activeOpacity={0.7}>
            <Ionicons name={icon} size={14} color={Colors.white} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
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
  const currentPV = user?.monthly_activation?.current_month_pv ?? 0;

  return (
    <LinearGradient
      colors={['rgba(14,165,233,0.18)', 'rgba(255,255,255,0)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <MarqueeBanner />

      <View style={styles.innerContent}>
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

          <View style={styles.rightActions}>
            <View style={styles.pvBadge}>
              <Ionicons name="trending-up" size={12} color={Colors.white} />
              <Text style={styles.pvText}>{currentPV} PV</Text>
            </View>
            <TouchableOpacity style={styles.iconBtn} onPress={onNotificationPress} activeOpacity={0.7}>
              <Ionicons name="notifications-outline" size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>
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
      </View>
    </LinearGradient>
  );
}

const marqueeStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.sky,
    height: 30,
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollArea: {
    flex: 1,
    overflow: 'hidden',
    height: 30,
  },
  row: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 30,
    flexDirection: 'row',
    alignItems: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 6,
  },
  logo: {
    width: 44,
    height: 14,
    tintColor: Colors.white,
  },
  text: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '500',
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    height: 30,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.35)',
  },
});

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  innerContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
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
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pvBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.sky,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pvText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
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
