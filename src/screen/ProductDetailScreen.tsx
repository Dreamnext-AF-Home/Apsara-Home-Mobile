import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity,
  Animated, Dimensions, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';
import { productService } from '../services/productService';
import type { Product, ProductCard } from '../services/productService';
import ItemCard from '../components/Items/ItemCard';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = (SCREEN_WIDTH - 8 - 8 - 8) / 2;

interface ProductDetailScreenProps {
  productId: number;
  token?: string | null;
  onBack: () => void;
  onProductPress?: (id: number) => void;
}

const BADGE_CONFIG = [
  { key: 'musthave' as const,   label: 'Must Have',  bg: ['#f97316', '#ea580c'] as [string, string], icon: 'heart' as const },
  { key: 'bestseller' as const, label: 'Bestseller', bg: ['#d4a017', '#b8860b'] as [string, string], icon: 'flame' as const },
  { key: 'salespromo' as const, label: 'On Sale',    bg: [Colors.forest, '#1e4236'] as [string, string], icon: 'flash' as const },
];

function toProductCard(p: Product): ProductCard {
  return {
    id: p.id,
    name: p.name,
    image: p.image,
    soldCount: p.soldCount,
    originalPrice: p.priceSrp,
    discountedPrice: p.priceDp,
    pv: p.prodpv,
    brandName: p.brand,
    variantCount: p.variants?.length ?? 0,
    badges: {
      musthave: p.musthave,
      bestseller: p.bestseller,
      salespromo: p.salespromo,
    },
  };
}

export default function ProductDetailScreen({
  productId,
  token,
  onBack,
  onProductPress,
}: ProductDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ProductCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 240,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    setLoading(true);
    setProduct(null);
    setRelatedProducts([]);
    setActiveImage(0);
    scrollRef.current?.scrollTo({ y: 0, animated: false });

    let active = true;
    productService.getProductById(productId, token ?? undefined)
      .then(data => {
        if (!active) return;
        setProduct(data);
        if (data.catid) {
          productService.getProductsByCategory(data.catid, token ?? undefined)
            .then(items => {
              if (!active) return;
              const cards = items
                .filter(p => p.id !== productId)
                .slice(0, 8)
                .map(toProductCard);
              setRelatedProducts(cards);
            })
            .catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [productId, token]);

  function handleBack() {
    Animated.timing(slideAnim, {
      toValue: SCREEN_WIDTH,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onBack());
  }

  const images = useMemo(() => {
    if (!product) return [];
    const imgs = (product.images ?? []).filter(Boolean);
    if (imgs.length > 0) return imgs;
    if (product.image) return [product.image];
    return [];
  }, [product]);

  const hasDiscount = product ? product.priceDp < product.priceSrp : false;
  const discountPct = (hasDiscount && product)
    ? Math.round(((product.priceSrp - product.priceDp) / product.priceSrp) * 100)
    : 0;

  const activeBadges = product
    ? BADGE_CONFIG.filter(b => (product as any)[b.key])
    : [];

  return (
    <Animated.View style={[styles.root, { transform: [{ translateX: slideAnim }] }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {product?.name ?? 'Product Details'}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.sky} />
        </View>
      ) : product ? (
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Image Gallery */}
          <View style={styles.galleryWrap}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={e => {
                const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                setActiveImage(index);
              }}
            >
              {images.length > 0 ? images.map((img, i) => (
                <Image key={i} source={{ uri: img }} style={styles.galleryImage} resizeMode="cover" />
              )) : (
                <View style={[styles.galleryImage, styles.galleryFallback]}>
                  <Ionicons name="image-outline" size={48} color="#d1d5db" />
                </View>
              )}
            </ScrollView>
            {images.length > 1 && (
              <View style={styles.galleryDots}>
                {images.map((_, i) => (
                  <View key={i} style={[styles.galleryDot, i === activeImage && styles.galleryDotActive]} />
                ))}
              </View>
            )}
            {hasDiscount && (
              <View style={styles.discountCorner}>
                <Ionicons name="pricetag" size={10} color={Colors.white} />
                <Text style={styles.discountCornerText}>Enjoy {discountPct}% OFF</Text>
              </View>
            )}
          </View>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <View style={styles.brandRow}>
              <Text style={styles.brandText}>{product.brand}</Text>
              {product.soldCount > 0 && (
                <View style={styles.soldRow}>
                  <Ionicons name="bag-check-outline" size={12} color={Colors.textSecondary} />
                  <Text style={styles.soldText}>{product.soldCount} sold</Text>
                </View>
              )}
            </View>

            <Text style={styles.productName}>{product.name}</Text>

            <View style={styles.badgesRow}>
              <LinearGradient
                colors={[Colors.sky, Colors.skyDark]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.badge}
              >
                <Ionicons name="star" size={10} color={Colors.white} />
                <Text style={styles.badgeLabel}>PV {product.prodpv}</Text>
              </LinearGradient>
              {activeBadges.map(b => (
                <LinearGradient
                  key={b.key}
                  colors={b.bg}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.badge}
                >
                  <Ionicons name={b.icon} size={10} color={Colors.white} />
                  <Text style={styles.badgeLabel}>{b.label}</Text>
                </LinearGradient>
              ))}
              {(product.variants?.length ?? 0) > 0 && (
                <LinearGradient
                  colors={['#8b5cf6', '#7c3aed']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.badge}
                >
                  <Ionicons name="layers" size={10} color={Colors.white} />
                  <Text style={styles.badgeLabel}>{product.variants.length} variants</Text>
                </LinearGradient>
              )}
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.currentPrice}>₱{product.priceDp.toLocaleString()}</Text>
              {hasDiscount && (
                <Text style={styles.originalPrice}>₱{product.priceSrp.toLocaleString()}</Text>
              )}
            </View>

            <View style={styles.divider} />

            {!!product.description && (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldTitle}>Description</Text>
                <Text style={styles.fieldText}>{product.description}</Text>
              </View>
            )}

            {!!product.specifications && (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldTitle}>Specifications</Text>
                <Text style={styles.fieldText}>{product.specifications}</Text>
              </View>
            )}

            {(!!product.material || !!product.warranty) && (
              <View style={styles.metaRow}>
                {!!product.material && (
                  <View style={styles.metaChip}>
                    <Text style={styles.metaChipLabel}>Material</Text>
                    <Text style={styles.metaChipValue}>{product.material}</Text>
                  </View>
                )}
                {!!product.warranty && (
                  <View style={styles.metaChip}>
                    <Text style={styles.metaChipLabel}>Warranty</Text>
                    <Text style={styles.metaChipValue}>{product.warranty}</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <View style={styles.relatedSection}>
              <View style={styles.relatedHeader}>
                <Ionicons name="grid-outline" size={15} color={Colors.sky} />
                <Text style={styles.relatedTitle}>Related Products</Text>
              </View>
              <View style={styles.relatedGrid}>
                {relatedProducts.map(p => (
                  <View key={p.id} style={styles.relatedCard}>
                    <ItemCard product={p} onPress={item => onProductPress?.(item.id)} />
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={styles.loadingWrap}>
          <Ionicons name="alert-circle-outline" size={36} color="#d1d5db" />
          <Text style={styles.errorText}>Product not found</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.white,
    zIndex: 200,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: Colors.white,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  galleryWrap: {
    width: SCREEN_WIDTH,
    height: 300,
    backgroundColor: '#f1f5f9',
    position: 'relative',
  },
  galleryImage: {
    width: SCREEN_WIDTH,
    height: 300,
  },
  galleryFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  galleryDots: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },
  galleryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  galleryDotActive: {
    width: 18,
    backgroundColor: Colors.white,
  },
  discountCorner: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: Colors.sky,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomRightRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  discountCornerText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  infoSection: {
    padding: 16,
    gap: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  soldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  soldText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  productName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    lineHeight: 24,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  currentPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.sky,
  },
  originalPrice: {
    fontSize: 15,
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 4,
  },
  fieldGroup: {
    gap: 5,
  },
  fieldTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metaChip: {
    flex: 1,
    backgroundColor: '#f0f9ff',
    borderRadius: 10,
    padding: 10,
    gap: 3,
  },
  metaChipLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.sky,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  metaChipValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  relatedSection: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 8,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 12,
  },
  relatedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  relatedTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
  },
  relatedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  relatedCard: {
    width: CARD_WIDTH,
  },
});
