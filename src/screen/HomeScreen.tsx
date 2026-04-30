import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, Animated,
  Dimensions, NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { authService, BrandItem, CategoryItem } from '../services/authService';
import Toast from 'react-native-toast-message';

interface HomeScreenProps {
  token?: string | null;
  user?: { name?: string; avatar_url?: string } | null;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const BANNER_HEIGHT = 190;

function sortByOrder(items: CategoryItem[]) {
  return [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function getCategoryImage(category: CategoryItem) {
  if (category.image) return category.image;
  const seed = encodeURIComponent(category.url || category.name);
  return `https://picsum.photos/seed/${seed}/240/240`;
}

function getCategoryImages(category: CategoryItem) {
  const images = (category.images ?? []).filter(Boolean);
  if (images.length > 0) return images;
  return [getCategoryImage(category)];
}

function getBrandImage(brand: BrandItem) {
  if (brand.image) return brand.image;
  const seed = encodeURIComponent(brand.name);
  return `https://picsum.photos/seed/${seed}/320/180`;
}

function getBrandInitial(brand: BrandItem) {
  return brand.name?.trim()?.charAt(0)?.toUpperCase() || '?';
}

function CategoryCircle({ category }: { category: CategoryItem }) {
  const images = useMemo(() => getCategoryImages(category), [category]);
  const [activeImage, setActiveImage] = useState(0);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setActiveImage(prev => (prev + 1) % images.length);
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 320,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, 3800);

    return () => clearInterval(interval);
  }, [images.length, opacity]);

  useEffect(() => {
    opacity.setValue(0);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 320,
      useNativeDriver: true,
    }).start();
  }, [activeImage, opacity]);

  return (
    <View style={styles.circleItem}>
      <View style={[styles.circleImageWrap, styles.categoryCircle]}>
        <Animated.Image
          key={`${category.id}-${activeImage}`}
          source={{ uri: images[activeImage] }}
          style={[styles.circleImage, { opacity }]}
        />
      </View>
      <Text style={styles.circleLabel} numberOfLines={2}>{category.name}</Text>
    </View>
  );
}

export default function HomeScreen({ token, user }: HomeScreenProps) {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBanner, setActiveBanner] = useState(0);
  const bannerRef = useRef<ScrollView>(null);
  const roomItems = [
    { id: 'bedroom', name: 'Bedroom', icon: 'bed-outline' as const },
    { id: 'kitchen', name: 'Kitchen', icon: 'restaurant-outline' as const },
    { id: 'living-room', name: 'Living Room', icon: 'home-outline' as const },
    { id: 'outdoor', name: 'Outdoor', icon: 'leaf-outline' as const },
    { id: 'study-office', name: 'Study & Office Room', icon: 'briefcase-outline' as const },
    { id: 'dining-room', name: 'Dining Room', icon: 'cafe-outline' as const },
    { id: 'laundry-room', name: 'Laundry Room', icon: 'water-outline' as const },
    { id: 'bathroom', name: 'Bathroom', icon: 'water-outline' as const },
  ];

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    Promise.all([authService.getCategories(token), authService.getBrands(token)])
      .then(([categoryData, brandData]) => {
        if (!active) return;
        setCategories(sortByOrder(categoryData));
        setBrands(brandData);
      })
      .catch(error => {
        if (!active) return;
        Toast.show({
          type: 'error',
          text1: 'Home data failed',
          text2: error.message || 'Unable to load categories and brands.',
        });
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  const greeting = useMemo(() => {
    const firstName = user?.name?.split(' ')[0] ?? 'there';
    return `Discover home essentials for ${firstName}`;
  }, [user?.name]);

  const banners = useMemo(() => {
    const categoryName = categories[0]?.name ?? 'Categories';
    const brandName = brands[0]?.name ?? 'Brands';
    return [
      {
        eyebrow: 'Browse',
        title: 'Shop by category',
        subtitle: `Explore ${categories.length} curated categories with image tiles.`,
        accent: Colors.sky,
        icon: 'grid-outline' as const,
      },
      {
        eyebrow: 'Discover',
        title: 'Find top brands',
        subtitle: `Swipe to see brand collections like ${brandName}.`,
        accent: Colors.forest,
        icon: 'pricetag-outline' as const,
      },
      {
        eyebrow: 'Featured',
        title: 'Fresh picks for you',
        subtitle: `Start with ${categoryName} and move across the collection.`,
        accent: Colors.brass,
        icon: 'sparkles-outline' as const,
      },
    ];
  }, [categories, brands]);

  function handleBannerScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const x = event.nativeEvent.contentOffset.x;
    const index = Math.round(x / SCREEN_WIDTH);
    setActiveBanner(index);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.sky} />
          <Text style={styles.loadingText}>Loading categories and brands...</Text>
        </View>
      ) : (
        <>
          <View style={styles.bannerShell}>
            <ScrollView
              ref={bannerRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleBannerScroll}
              decelerationRate="fast"
            >
              {banners.map((banner, index) => (
                <View key={`banner-${index}`} style={[styles.banner, { width: SCREEN_WIDTH - 32 }]}>
                  <View style={[styles.bannerGlow, { backgroundColor: banner.accent }]} />
                  <View style={styles.bannerTextWrap}>
                    <Text style={styles.bannerEyebrow}>{banner.eyebrow}</Text>
                    <Text style={styles.bannerTitle}>{banner.title}</Text>
                    <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
                  </View>
                  <View style={styles.bannerIcon}>
                    <Ionicons name={banner.icon} size={30} color={banner.accent} />
                  </View>
                </View>
              ))}
            </ScrollView>
            <View style={styles.pagination}>
              {banners.map((_, index) => (
                <View
                  key={`dot-${index}`}
                  style={[styles.dot, activeBanner === index && styles.dotActive]}
                />
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <View style={styles.sectionAction}>
                <Text style={styles.sectionMeta}>{categories.length} total</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.circleRow}>
              {categories.map(category => (
                <CategoryCircle key={`category-${category.id}`} category={category} />
              ))}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Rooms</Text>
              <View style={styles.sectionAction}>
                <Text style={styles.sectionMeta}>{roomItems.length} total</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.circleRow}>
              {roomItems.map(item => (
                <View key={item.id} style={styles.circleItem}>
                  <View style={[styles.circleImageWrap, styles.roomCircle]}>
                    <Ionicons name={item.icon} size={24} color={Colors.sky} />
                  </View>
                  <Text style={styles.circleLabel} numberOfLines={2}>{item.name}</Text>
                </View>
              ))}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Brands</Text>
              <View style={styles.sectionAction}>
                <Text style={styles.sectionMeta}>{brands.length} total</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.brandRowHorizontal}>
              {brands.map(item => (
                <View key={`brand-${item.id}`} style={styles.brandCard}>
                  {item.image ? (
                    <Image source={{ uri: getBrandImage(item) }} style={styles.brandCardImage} />
                  ) : (
                    <View style={[styles.brandCardImage, styles.brandFallback]}>
                      <Text style={styles.brandFallbackInitial}>{getBrandInitial(item)}</Text>
                    </View>
                  )}
                  <View style={styles.brandCardOverlay} />
                  <Text style={styles.brandCardName} numberOfLines={1}>{item.name}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fbff' },
  content: { padding: 16, paddingBottom: 28, gap: 16 },
  loadingWrap: { paddingVertical: 42, alignItems: 'center', gap: 10 },
  loadingText: { fontSize: 13, color: Colors.textSecondary },
  bannerShell: {
    gap: 10,
  },
  banner: {
    height: BANNER_HEIGHT,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    padding: 18,
    marginRight: 12,
    justifyContent: 'space-between',
    position: 'relative',
  },
  bannerGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    top: -80,
    right: -70,
    opacity: 0.22,
  },
  bannerTextWrap: {
    zIndex: 2,
    flex: 1,
    justifyContent: 'center',
    paddingRight: 90,
  },
  bannerEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.75)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  bannerTitle: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '900',
    color: Colors.white,
    marginTop: 8,
  },
  bannerSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.84)',
    marginTop: 8,
  },
  bannerIcon: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#cbd5e1',
  },
  dotActive: {
    width: 20,
    backgroundColor: Colors.sky,
  },
  section: { gap: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  sectionMeta: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  sectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  circleRow: {
    gap: 12,
    paddingRight: 4,
  },
  circleItem: {
    width: 88,
    alignItems: 'center',
    gap: 8,
    marginRight: 12,
  },
  circleImageWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    padding: 3,
    backgroundColor: Colors.white,
  },
  roomCircle: {
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  circleImage: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
  },
  categoryCircle: {
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  circleLabel: {
    fontSize: 12,
    textAlign: 'center',
    color: Colors.text,
    fontWeight: '700',
    lineHeight: 16,
  },
  brandRowHorizontal: {
    gap: 12,
    paddingRight: 4,
  },
  brandCard: {
    width: 170,
    height: 110,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
  },
  brandCardImage: {
    width: '100%',
    height: '100%',
  },
  brandFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dbeafe',
  },
  brandFallbackInitial: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '900',
    color: Colors.sky,
  },
  brandCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.34)',
  },
  brandCardName: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    fontSize: 13,
    fontWeight: '800',
    color: Colors.white,
    zIndex: 2,
  },
});
