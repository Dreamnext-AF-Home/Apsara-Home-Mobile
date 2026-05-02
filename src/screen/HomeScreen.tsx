
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, Animated,
  Dimensions, NativeSyntheticEvent, NativeScrollEvent, FlatList, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { Colors } from '../constants/colors';
import { authService, BrandItem, CategoryItem } from '../services/authService';
import { productService } from '../services/productService';
import type { ProductCard } from '../services/productService';
import { API_CONFIG } from '../config/api';
import ItemCard from '../components/Items/ItemCard';
import Toast from 'react-native-toast-message';
import { 
  HomeScreenSkeleton, 
  BannerSkeleton, 
  SectionHeaderSkeleton,
  RoomGridSkeleton,
  CategoryRowSkeleton,
  BrandCardSkeleton
} from '../components/SkeletonLoader/SkeletonLoader';

interface HomeScreenProps {
  token?: string | null;
  user?: { name?: string; avatar_url?: string } | null;
}

interface RoomType {
  room_id: number;
  room_name: string;
  images: string[];
  count: number;
}

const FALLBACK_ROOMS: RoomType[] = [
  { room_id: 1, room_name: 'Bedroom',           images: [], count: 0 },
  { room_id: 2, room_name: 'Kitchen',            images: [], count: 0 },
  { room_id: 3, room_name: 'Living Room',        images: [], count: 0 },
  { room_id: 4, room_name: 'Outdoor',            images: [], count: 0 },
  { room_id: 5, room_name: 'Study & Office',     images: [], count: 0 },
  { room_id: 6, room_name: 'Dining Room',        images: [], count: 0 },
  { room_id: 7, room_name: 'Laundry Room',       images: [], count: 0 },
  { room_id: 8, room_name: 'Bath Room',          images: [], count: 0 },
];

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

function VideoBanner({ banner }: { banner: any }) {
  const player = useVideoPlayer(banner.videoSource, player => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  return (
    <VideoView
      player={player}
      style={styles.bannerVideo}
      contentFit="cover"
    />
  );
}

function SampleAdCard({ title, subtitle }: { title: string, subtitle: string }) {
  return (
    <View style={styles.sampleAdCard}>
      <LinearGradient colors={['#38bdf8', '#0284c7']} style={styles.sampleAdGradient}>
        <Ionicons name="sparkles" size={28} color={Colors.white} />
        <Text style={styles.sampleAdTitle}>{title}</Text>
        <Text style={styles.sampleAdSubtitle}>{subtitle}</Text>
        <View style={styles.sampleAdBadge}>
          <Text style={styles.sampleAdBadgeText}>Ad</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

function RoomItemComponent({ item }: { item: RoomType }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const badge = item.room_id === 1 ? 'New' : item.room_id === 3 ? 'Hot' : null;

  return (
    <Animated.View style={[styles.roomItem, { transform: [{ scale }] }]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{ alignItems: 'center', width: '100%', gap: 6 }}
      >
        <View style={styles.roomCircleContainer}>
          <View style={styles.roomCircleWrap}>
            {item.images && item.images.length > 0 ? (
              <Image
                source={{ uri: item.images[0] }}
                style={styles.roomImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.roomCircleFallback}>
                <Ionicons name="home-outline" size={24} color={Colors.sky} />
              </View>
            )}
          </View>
          {badge && (
            <View style={[styles.roomBadge, badge === 'Hot' ? { backgroundColor: '#ef4444' } : {}]}>
              <Text style={styles.roomBadgeText}>{badge}</Text>
            </View>
          )}
        </View>
        <Text style={styles.circleLabel} numberOfLines={2}>{item.room_name}</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function HomeScreen({ token, user }: HomeScreenProps) {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<ProductCard[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBanner, setActiveBanner] = useState(0);
  const bannerRef = useRef<ScrollView>(null);
  const dataFetchedRef = useRef(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    // If data is already loaded, don't fetch again
    if (dataFetchedRef.current && categories.length > 0 && brands.length > 0 && featuredProducts.length > 0) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    Promise.all([
      authService.getCategories(token),
      authService.getBrands(token),
      productService.getProductCards(token),
    ])
      .then(([categoryData, brandData, productData]) => {
        if (!active) return;
        setCategories(sortByOrder(categoryData));
        setBrands(brandData);
        if (Array.isArray(productData) && productData.length > 0) {
          setFeaturedProducts(productData.slice(0, 4));
        } else {
          setFeaturedProducts([]);
        }
        dataFetchedRef.current = true;
      })
      .catch(error => {
        if (!active) return;
        console.error('Home data fetch error:', error);
        Toast.show({
          type: 'error',
          text1: 'Home data failed',
          text2: error.message || 'Unable to load home data.',
        });
        setFeaturedProducts([]); // Set empty array on error
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token, categories.length, brands.length]);

  useEffect(() => {
    if (!token) return;
    let active = true;
    axios.get(`${API_CONFIG.BASE_URL}/room-types`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!active) return;
        if (res.data?.success && Array.isArray(res.data?.data)) {
          setRoomTypes(res.data.data);
        }
      })
      .catch(() => {})
      .finally(() => {});
    return () => { active = false; };
  }, [token]);

  const greeting = useMemo(() => {
    const firstName = user?.name?.split(' ')[0] ?? 'there';
    return `Discover home essentials for ${firstName}`;
  }, [user?.name]);

  // Distribute products into two columns for masonry layout
  const masonryColumns = useMemo(() => {
    const leftColumn: any[] = [];
    const rightColumn: any[] = [];
    
    featuredProducts.forEach((product, index) => {
      if (index % 2 === 0) {
        leftColumn.push(product);
      } else {
        rightColumn.push(product);
      }
    });
    
    // Add sample ads
    if (leftColumn.length > 0) {
      leftColumn.splice(1, 0, { id: 'sample-ad-1', isAd: true, title: 'Summer Sale', subtitle: 'Up to 50% off' });
    }
    if (rightColumn.length > 0) {
      rightColumn.splice(2, 0, { id: 'sample-ad-2', isAd: true, title: 'New Arrivals', subtitle: 'Explore now' });
    }

    return { leftColumn, rightColumn };
  }, [featuredProducts]);

  const banners = useMemo(() => {
    const categoryName = categories[0]?.name ?? 'Categories';
    const brandName = brands[0]?.name ?? 'Brands';
    return [
      {
        type: 'video' as const,
        videoSource: require('../../assets/login/home-login.mp4'),
        eyebrow: 'Welcome',
        title: 'Discover Your Dream Home',
        subtitle: 'Explore our curated collection of premium home essentials.',
        accent: Colors.sky,
        icon: 'play-circle-outline' as const,
      },
      {
        type: 'content' as const,
        eyebrow: 'Browse',
        title: 'Shop by category',
        subtitle: `Explore ${categories.length} curated categories with image tiles.`,
        accent: Colors.sky,
        icon: 'grid-outline' as const,
      },
      {
        type: 'content' as const,
        eyebrow: 'Discover',
        title: 'Find top brands',
        subtitle: `Swipe to see brand collections like ${brandName}.`,
        accent: Colors.forest,
        icon: 'pricetag-outline' as const,
      },
      {
        type: 'content' as const,
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
    const index = Math.round(x / (SCREEN_WIDTH - 16));
    setActiveBanner(index);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {loading ? (
        <HomeScreenSkeleton />
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
              snapToInterval={SCREEN_WIDTH - 16}
              snapToAlignment="start"
              bounces={true}
            >
              {banners.map((banner, index) => (
                <View key={`banner-${index}`} style={[styles.banner, { width: SCREEN_WIDTH - 16 }]}>
                  {banner.type === 'video' ? (
                    <>
                      <VideoBanner banner={banner} />
                      <View style={styles.videoOverlay} />
                      <View style={[styles.bannerGlow, { backgroundColor: banner.accent }]} />
                      <View style={styles.bannerTextWrap}>
                        <Text style={styles.bannerEyebrow}>{banner.eyebrow}</Text>
                        <Text style={styles.bannerTitle}>{banner.title}</Text>
                        <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
                      </View>
                      <View style={styles.bannerIcon}>
                        <Ionicons name={banner.icon} size={30} color={banner.accent} />
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={[styles.bannerGlow, { backgroundColor: banner.accent }]} />
                      <View style={styles.bannerTextWrap}>
                        <Text style={styles.bannerEyebrow}>{banner.eyebrow}</Text>
                        <Text style={styles.bannerTitle}>{banner.title}</Text>
                        <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
                      </View>
                      <View style={styles.bannerIcon}>
                        <Ionicons name={banner.icon} size={30} color={banner.accent} />
                      </View>
                    </>
                  )}
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
              <Text style={styles.sectionTitle}>Shop by Rooms</Text>
              <View style={styles.sectionAction}>
                <Text style={styles.sectionMeta}>{(roomTypes.length || FALLBACK_ROOMS.length)} total</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
              </View>
            </View>
            <FlatList
              data={roomTypes.length > 0 ? roomTypes : FALLBACK_ROOMS}
              renderItem={({ item }) => <RoomItemComponent item={item} />}
              keyExtractor={item => `room-${item.room_id}`}
              numColumns={4}
              contentContainerStyle={styles.roomGrid}
              scrollEnabled={false}
            />
          </View>

          <View style={styles.sectionEven}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Shop by Categories</Text>
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

          <View style={styles.sectionOdd}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Shop by Brand</Text>
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

          <View style={styles.sectionFeatured}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Products</Text>
              <View style={styles.sectionAction}>
                <Text style={styles.sectionMeta}>New arrivals</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
              </View>
            </View>
            <View style={styles.featuredProductsContainer}>
              {loading ? (
                <View style={styles.masonryGrid}>
                  <View style={styles.masonryColumn}>
                    <View style={styles.featuredProductItem}>
                      <View style={styles.featuredProductSkeleton} />
                    </View>
                    <View style={styles.featuredProductItem}>
                      <View style={styles.featuredProductSkeleton} />
                    </View>
                  </View>
                  <View style={styles.masonryColumn}>
                    <View style={styles.featuredProductItem}>
                      <View style={styles.featuredProductSkeleton} />
                    </View>
                    <View style={styles.featuredProductItem}>
                      <View style={styles.featuredProductSkeleton} />
                    </View>
                  </View>
                </View>
              ) : featuredProducts.length > 0 ? (
                <View style={styles.masonryGrid}>
                  <View style={styles.masonryColumn}>
                    {masonryColumns.leftColumn.map((item) => (
                      <View key={item.id} style={styles.featuredProductItem}>
                        {item.isAd ? <SampleAdCard title={item.title} subtitle={item.subtitle} /> : <ItemCard product={item as ProductCard} />}
                      </View>
                    ))}
                  </View>
                  <View style={styles.masonryColumn}>
                    {masonryColumns.rightColumn.map((item) => (
                      <View key={item.id} style={styles.featuredProductItem}>
                        {item.isAd ? <SampleAdCard title={item.title} subtitle={item.subtitle} /> : <ItemCard product={item as ProductCard} />}
                      </View>
                    ))}
                  </View>
                </View>
              ) : (
                <Text style={styles.noProductsText}>No featured products available</Text>
              )}
            </View>
          </View>
        </>
      )}
    </ScrollView>

  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fbff' },
  content: { paddingHorizontal: 8, paddingTop: 16, paddingBottom: 28, gap: 16 },
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
  bannerVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 24,
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
  section: { gap: 10, paddingHorizontal: 4 },
  sectionEven: {
    backgroundColor: '#f0f9ff',
    marginHorizontal: -8,
    paddingHorizontal: 8,
    paddingVertical: 16,
    gap: 10,
  },
  sectionFeatured: {
    backgroundColor: '#f0f9ff',
    marginHorizontal: -8,
    paddingHorizontal: 8,
    paddingTop: 16,
    paddingBottom: 44,
    marginBottom: -28,
    gap: 10,
  },
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
  categoryGrid: {
    gap: 16,
  },
  roomGrid: {
    gap: 0,
  },
  circleItem: {
    width: 88,
    alignItems: 'center',
    gap: 8,
    marginRight: 12,
  },
  roomItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
  },
  roomCircleContainer: {
    position: 'relative',
    width: 64,
    height: 64,
  },
  roomBadge: {
    position: 'absolute',
    top: -2,
    right: -6,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#ffffff',
    zIndex: 10,
  },
  roomBadgeText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  circleImageWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    padding: 3,
    backgroundColor: Colors.white,
  },
  roomCircleWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#e0f2fe',
  },
  roomImage: {
    width: '100%',
    height: '100%',
  },
  roomCircleFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
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
    bottom: 8,
    left: 8,
    right: 8,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  featuredProductsContainer: {
    gap: 8,
  },
  masonryGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  masonryColumn: {
    flex: 1,
    gap: 8,
  },
  featuredProductItem: {
    width: '100%',
  },
  sampleAdCard: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sampleAdGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 6,
  },
  sampleAdTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.white,
    textAlign: 'center',
  },
  sampleAdSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  sampleAdBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sampleAdBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.white,
    textTransform: 'uppercase',
  },
  featuredProductSkeleton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    height: 280,
    overflow: 'hidden',
  },
  noProductsText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 20,
  },

});
