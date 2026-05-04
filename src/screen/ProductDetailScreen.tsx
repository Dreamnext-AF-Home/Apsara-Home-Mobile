import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity,
  Dimensions, ActivityIndicator, BackHandler, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import RenderHtml from 'react-native-render-html';
import { Colors } from '../constants/colors';
import { productService, type Product, type ProductCard, type ProductReviewsResponse, type ProductReview } from '../services/productService';
import { authService } from '../services/authService';
import ItemCard from '../components/Items/ItemCard';
import PrimaryButton from '../components/Button/PrimaryButton';
import axios from 'axios';
import { API_CONFIG } from '../config/api';

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

interface BrandProfile {
  id: number;
  name: string;
  profile_picture?: string;
  status: number;
  is_online: boolean;
  chat_performance: number;
  overall_rating: number;
  total_reviews: number;
  total_products: number;
  joined_date: string;
  supplier_name: string;
}

function toProductCard(p: Product): ProductCard {
  return {
    id: p.id,
    name: p.name,
    image: p.image,
    soldCount: p.soldCount,
    originalPrice: p.priceSrp,
    memberPrice: p.priceMember,
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
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
  const [productReviews, setProductReviews] = useState<ProductReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [specificationsExpanded, setSpecificationsExpanded] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const galleryScrollRef = useRef<ScrollView>(null);
  const imageViewerScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showImageViewer) {
        setShowImageViewer(false);
        return true;
      }
      if (showBuyModal) {
        setShowBuyModal(false);
        return true;
      }
      onBack();
      return true;
    });
    return () => backHandler.remove();
  }, [onBack, showBuyModal, showImageViewer]);

  useEffect(() => {
    setLoading(true);
    setProduct(null);
    setRelatedProducts([]);
    setBrandProfile(null);
    setActiveImage(0);
    setDescriptionExpanded(false);
    setSpecificationsExpanded(false);
    setSelectedVariant(null);
    scrollRef.current?.scrollTo({ y: 0, animated: false });

    let active = true;
    productService.getProductById(productId, token ?? undefined)
      .then(async data => {
        if (!active) return;
        setProduct(data);
        // Set first variant as default
        if (data.variants && data.variants.length > 0) {
          setSelectedVariant(data.variants[0].id);
        }
        
        // Fetch brand profile if brandType is available
        if (data.brandType && token) {
          try {
            const brandData = await authService.getBrandProfile(data.brandType, token);
            if (brandData) {
              setBrandProfile(brandData);
            }
          } catch (error) {
            // Silently fail brand profile fetch
          }
        }

        // Fetch product reviews
        if (token) {
          try {
            const reviewsData = await productService.getProductReviews(productId, token);
            if (reviewsData) {
              setProductReviews(reviewsData);
            }
          } catch (error) {
            // Silently fail reviews fetch
          }
        }

        // Fetch related products by brand type
        if (data.brandType && token) {
          productService.getProductsByBrand(data.brandType, token)
            .then(items => {
              if (!active) return;
              const filteredItems = items.filter(p => p.id !== productId);
              // Shuffle the array and take 8 items
              const shuffled = filteredItems.sort(() => Math.random() - 0.5);
              const cards = shuffled
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


  // Create image list with variant mapping (unique images only)
  const imagesWithVariants = useMemo(() => {
    if (!product) return [];

    const list: Array<{ image: string; variantId: number | null }> = [];
    const addedImages = new Set<string>();

    // Add variant images first (with variant ID) - only if not already added
    if (product.variants && product.variants.length > 0) {
      product.variants.forEach(v => {
        if (v.images && v.images.length > 0) {
          const imgUrl = v.images[0];
          // Only add if this image hasn't been added yet
          if (!addedImages.has(imgUrl)) {
            list.push({ image: imgUrl, variantId: v.id });
            addedImages.add(imgUrl);
          }
        }
      });
    }

    // Add product images (no variant ID - don't auto-select)
    if (product.images && product.images.length > 0) {
      product.images.forEach(img => {
        if (img && !addedImages.has(img)) {
          list.push({ image: img, variantId: null });
          addedImages.add(img);
        }
      });
    }

    // Add main product image if not already added
    if (product.image && !addedImages.has(product.image)) {
      list.push({ image: product.image, variantId: null });
      addedImages.add(product.image);
    }

    return list;
  }, [product]);

  const images = useMemo(() => {
    return imagesWithVariants.map(item => item.image);
  }, [imagesWithVariants]);

  const hasDiscount = product ? (product.priceMember ?? 0) < (product.priceSrp ?? 0) : false;
  const discountPct = (hasDiscount && product)
    ? Math.round(((product.priceSrp ?? 0) - (product.priceMember ?? 0)) / (product.priceSrp ?? 0) * 100)
    : 0;

  const activeBadges = product
    ? BADGE_CONFIG.filter(b => (product as any)[b.key])
    : [];

  return (
    <View style={styles.root}>
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.sky} />
        </View>
      ) : product ? (
        <>
          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
          {/* Image Gallery */}
          <View style={styles.galleryWrap}>
            <ScrollView
              ref={galleryScrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              onMomentumScrollEnd={e => {
                const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                setActiveImage(index);
                // Auto-select variant based on image index
                if (imagesWithVariants.length > index) {
                  const item = imagesWithVariants[index];
                  if (item.variantId !== null) {
                    setSelectedVariant(item.variantId);
                  }
                }
              }}
            >
              {images.length > 0 ? images.map((img, i) => (
                <TouchableOpacity
                  key={i}
                  activeOpacity={0.95}
                  onPress={() => {
                    // Set active image and scroll gallery to this image
                    setActiveImage(i);
                    setImageViewerIndex(i);
                    setShowImageViewer(true);
                    galleryScrollRef.current?.scrollTo({
                      x: i * SCREEN_WIDTH,
                      animated: true,
                    });
                    // Auto-select variant based on image index
                    if (imagesWithVariants.length > i && imagesWithVariants[i].variantId !== null) {
                      setSelectedVariant(imagesWithVariants[i].variantId);
                    }
                  }}
                  style={styles.galleryImageContainer}
                >
                  <Image source={{ uri: img }} style={styles.galleryImage} resizeMode="contain" />
                </TouchableOpacity>
              )) : (
                <View style={[styles.galleryImageContainer, styles.galleryFallback]}>
                  <Ionicons name="image-outline" size={48} color="#d1d5db" />
                </View>
              )}
            </ScrollView>
            {/* Navigation Dots */}
            {images.length > 0 && (
              <View style={styles.galleryDotsContainer}>
                {images.map((_, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => {
                      setActiveImage(i);
                      setImageViewerIndex(i);
                      setShowImageViewer(true);
                      galleryScrollRef.current?.scrollTo({
                        x: i * SCREEN_WIDTH,
                        animated: true,
                      });
                      // Auto-select variant based on image index
                      if (imagesWithVariants.length > i && imagesWithVariants[i].variantId !== null) {
                        setSelectedVariant(imagesWithVariants[i].variantId);
                      }
                    }}
                    style={[styles.galleryDot, i === activeImage && styles.galleryDotActive]}
                    activeOpacity={0.7}
                  />
                ))}
              </View>
            )}
            {/* Back Button */}
            <TouchableOpacity 
              onPress={() => {
                try {
                  if (onBack && typeof onBack === 'function') {
                    onBack();
                  } else {
                    console.warn('onBack callback is not available');
                  }
                } catch (error) {
                  console.error('Error in back navigation:', error);
                }
              }} 
              style={[styles.galleryBackBtn, { paddingTop: insets.top + 10 }]} 
              activeOpacity={0.7}
            >
              <View style={styles.galleryBackBtnInner}>
                <Ionicons name="arrow-back" size={22} color={Colors.white} />
              </View>
            </TouchableOpacity>
                      </View>

          {/* Price and Sold */}
          <View style={styles.priceSoldContainer}>
            <View style={styles.priceRow}>
              <Text style={styles.currentPrice}>₱{(product.priceMember ?? 0).toLocaleString()}</Text>
              {hasDiscount && (
                <Text style={styles.originalPrice}>₱{(product.priceSrp ?? 0).toLocaleString()}</Text>
              )}
            </View>
            {product.soldCount > 0 && (
              <View style={styles.soldRow}>
                <Ionicons name="bag-check-outline" size={12} color={Colors.textSecondary} />
                <Text style={styles.soldText}>{product.soldCount} sold</Text>
              </View>
            )}
          </View>

          {/* Badges */}
          <View style={styles.badgesRow}>
            <LinearGradient
              colors={[Colors.sky, Colors.skyDark]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.badge}
            >
              <Ionicons name="star" size={10} color={Colors.white} />
              <Text style={styles.badgeLabel}>PV {product.prodpv}</Text>
            </LinearGradient>
            {hasDiscount && (
              <LinearGradient
                colors={['#ef4444', '#dc2626']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.badge}
              >
                <Ionicons name="pricetag" size={10} color={Colors.white} />
                <Text style={styles.badgeLabel}>
                  Save ₱{((product.priceSrp ?? 0) - (product.priceMember ?? 0)).toLocaleString()}
                </Text>
              </LinearGradient>
            )}
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
          </View>

          {/* Product Name and SKU */}
          <View style={styles.nameSection}>
            <View style={styles.nameCard}>
              <Text style={styles.productName}>{product.name}</Text>
              <View style={styles.nameDetails}>
                <View style={styles.nameDetailRow}>
                  <Ionicons name="barcode-outline" size={14} color={Colors.textSecondary} />
                  <Text style={styles.skuText}>SKU: {product.sku}</Text>
                </View>
                <View style={styles.nameDetailRow}>
                  <Ionicons name="cube-outline" size={14} color={Colors.forest} />
                  <Text style={styles.stockText}>Stock: {product.qty} available</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Variants */}
          {(product.variants?.length ?? 0) > 0 && (
            <View style={styles.variantsSection}>
              <Text style={styles.sectionLabel}>Variants ({product.variants.length})</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.variantsScrollView}
              >
                <View style={styles.variantsList}>
                  {product.variants.map((variant, index) => (
                    <TouchableOpacity
                      key={variant.id}
                      style={[
                        styles.variantCard,
                        selectedVariant === variant.id && styles.variantCardSelected,
                      ]}
                      onPress={() => setSelectedVariant(variant.id)}
                      activeOpacity={0.7}
                    >
                      {/* Variant Image, Color Circle, or Label */}
                      <View style={styles.variantMediaContainer}>
                        {variant.images && variant.images.length > 0 ? (
                          <Image
                            source={{ uri: variant.images[0] }}
                            style={styles.variantImage}
                            resizeMode="cover"
                          />
                        ) : variant.colorHex ? (
                          <View style={[
                            styles.variantColorCircle,
                            { backgroundColor: variant.colorHex }
                          ]} />
                        ) : (
                          <View style={styles.variantPlaceholder}>
                            <Ionicons name="image-outline" size={24} color="#d1d5db" />
                          </View>
                        )}
                        {selectedVariant === variant.id && (
                          <View style={styles.variantCheckmark}>
                            <Ionicons name="checkmark-circle" size={20} color={Colors.sky} />
                          </View>
                        )}
                      </View>

                      {/* Variant Info */}
                      <View style={styles.variantInfo}>
                        <Text
                          style={styles.variantLabel}
                          numberOfLines={1}
                        >
                          {variant.color || variant.name || `Variant ${index + 1}`}
                        </Text>
                        {(variant.size || variant.style) && (
                          <Text
                            style={styles.variantSubInfo}
                            numberOfLines={1}
                          >
                            {[variant.size, variant.style].filter(Boolean).join(' • ')}
                          </Text>
                        )}
                        <Text
                          style={[
                            styles.variantStock,
                            variant.qty > 0 ? styles.stockAvailable : styles.stockLow
                          ]}
                        >
                          {variant.qty > 10 ? `${variant.qty} left` : variant.qty > 0 ? `${variant.qty} left` : 'Out of stock'}
                        </Text>
                        <Text style={styles.variantPrice}>
                          ₱{(variant.priceMember ?? variant.priceSrp).toLocaleString()}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {selectedVariant && (() => {
                const variant = product.variants?.find(v => v.id === selectedVariant);
                if (!variant) return null;

                const variantDiscount = (variant.priceSrp ?? 0) - (variant.priceMember ?? 0);
                const hasVariantDiscount = variantDiscount > 0;

                return (
                  <View style={styles.variantDetailsCard}>
                    {/* Header with price */}
                    <View style={styles.variantDetailsHeader}>
                      <View>
                        <Text style={styles.variantDetailsTitle}>
                          {variant.color || variant.name || 'Selected Variant'}
                        </Text>
                        <Text style={styles.variantDetailsSku}>SKU: {variant.sku}</Text>
                      </View>
                      <View style={styles.variantPriceContainer}>
                        <Text style={styles.variantPriceLarge}>
                          ₱{(variant.priceMember ?? variant.priceSrp).toLocaleString()}
                        </Text>
                        {hasVariantDiscount && (
                          <Text style={styles.variantPriceOriginal}>
                            ₱{(variant.priceSrp ?? 0).toLocaleString()}
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Details Grid */}
                    <View style={styles.variantDetailsGrid}>
                      <View style={styles.detailGridItem}>
                        <Ionicons name="cube-outline" size={16} color={Colors.sky} />
                        <Text style={styles.detailGridLabel}>Stock</Text>
                        <Text style={[
                          styles.detailGridValue,
                          variant.qty > 0 ? styles.stockInStock : styles.stockOutOfStock
                        ]}>
                          {variant.qty}
                        </Text>
                      </View>

                      {variant.size && (
                        <View style={styles.detailGridItem}>
                          <Ionicons name="expand-outline" size={16} color={Colors.sky} />
                          <Text style={styles.detailGridLabel}>Size</Text>
                          <Text style={styles.detailGridValue}>{variant.size}</Text>
                        </View>
                      )}

                      <View style={styles.detailGridItem}>
                        <Ionicons name="star-outline" size={16} color={Colors.sky} />
                        <Text style={styles.detailGridLabel}>PV</Text>
                        <Text style={styles.detailGridValue}>{variant.prodpv}</Text>
                      </View>

                      {hasVariantDiscount && (
                        <View style={styles.detailGridItem}>
                          <Ionicons name="pricetag-outline" size={16} color="#ef4444" />
                          <Text style={styles.detailGridLabel}>Save</Text>
                          <Text style={[styles.detailGridValue, { color: '#ef4444' }]}>
                            ₱{variantDiscount.toLocaleString()}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Additional Info */}
                    <View style={styles.variantAdditionalInfo}>
                      {variant.style && (
                        <View style={styles.infoPair}>
                          <Text style={styles.infoLabel}>Style:</Text>
                          <Text style={styles.infoValue}>{variant.style}</Text>
                        </View>
                      )}
                      {(variant.width || variant.height || variant.dimension) && (
                        <View style={styles.infoPair}>
                          <Text style={styles.infoLabel}>Dimensions:</Text>
                          <Text style={styles.infoValue}>
                            {[
                              variant.width && `W: ${variant.width}`,
                              variant.height && `H: ${variant.height}`,
                              variant.dimension && `D: ${variant.dimension}`
                            ].filter(Boolean).join(' × ')}
                          </Text>
                        </View>
                      )}
                      <View style={styles.infoPair}>
                        <Text style={styles.infoLabel}>Status:</Text>
                        <Text style={[
                          styles.infoValue,
                          variant.qty > 0 ? styles.statusInStock : styles.statusOutOfStock
                        ]}>
                          {variant.qty > 0 ? '✓ In Stock' : '✗ Out of Stock'}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })()}
            </View>
          )}

          {/* Description & Specifications Wrapper */}
          {(!!product.description || !!product.specifications || !!product.material || !!product.warranty || product.pswidth || product.pslenght || product.psheight) && (
            <View style={styles.descriptionsWrapper}>
              {/* Description */}
              {!!product.description && (
                <View style={styles.descriptionSection}>
              <TouchableOpacity
                style={styles.descriptionHeader}
                onPress={() => setDescriptionExpanded(!descriptionExpanded)}
                activeOpacity={0.7}
              >
                <Text style={styles.descriptionTitle}>Description</Text>
                <Ionicons
                  name={descriptionExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={Colors.text}
                />
              </TouchableOpacity>
              {descriptionExpanded && (
                <View style={styles.descriptionContent}>
                  <View style={styles.descriptionContentInner}>
                    <RenderHtml
                      source={{ html: product.description }}
                      contentWidth={SCREEN_WIDTH - 16}
                      tagsStyles={{
                        body: { color: Colors.text, fontSize: 14, lineHeight: 22 },
                        h3: { color: Colors.text, fontSize: 16, fontWeight: '700', marginTop: 12, marginBottom: 6 },
                        h4: { color: Colors.text, fontSize: 15, fontWeight: '600', marginTop: 10, marginBottom: 6 },
                        p: { color: Colors.text, fontSize: 14, lineHeight: 22, marginBottom: 10 },
                        ul: { marginLeft: 20, marginBottom: 10 },
                        li: { color: Colors.text, fontSize: 14, lineHeight: 22, marginBottom: 6 },
                        hr: { backgroundColor: '#e5e7eb', marginVertical: 12 },
                        strong: { fontWeight: '700' },
                      }}
                    />
                  </View>
                </View>
              )}
                </View>
              )}

              {/* Specifications */}
              {(!!product.specifications || !!product.material || !!product.warranty || product.pswidth || product.pslenght || product.psheight) && (
                <View style={styles.specificationsSection}>
                <TouchableOpacity
                  style={styles.specificationsHeader}
                  onPress={() => setSpecificationsExpanded(!specificationsExpanded)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.specificationsTitle}>Specifications</Text>
                  <Ionicons
                    name={specificationsExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={Colors.text}
                  />
                </TouchableOpacity>
                {specificationsExpanded && (
                  <View style={styles.specificationsContent}>
                    <View style={styles.specificationsContentInner}>
                    {product.pswidth || product.pslenght || product.psheight ? (
                      <View style={styles.specRow}>
                        <Text style={styles.specLabel}>Dimensions:</Text>
                        <Text style={styles.specValue}>
                          W: {product.pswidth} cm x D: {product.pslenght} cm x H: {product.psheight} cm
                        </Text>
                      </View>
                    ) : null}
                    {product.material ? (
                      <View style={styles.specRow}>
                        <Text style={styles.specLabel}>Material:</Text>
                        <Text style={styles.specValue}>{product.material}</Text>
                      </View>
                    ) : null}
                    {product.warranty ? (
                      <View style={styles.specRow}>
                        <Text style={styles.specLabel}>Warranty:</Text>
                        <Text style={styles.specValue}>{product.warranty}</Text>
                      </View>
                    ) : null}
                    {product.specifications ? (
                      <View style={styles.specRow}>
                        <Text style={styles.specValue}>{product.specifications}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              )}
                </View>
              )}
            </View>
          )}

          {/* Product Rating - Shopee Style */}
          <View style={styles.ratingSection}>
            <View style={styles.ratingCard}>
              {productReviews && productReviews.summary ? (
                <>
                  {/* Rating Summary Header */}
                  <View style={styles.ratingSummaryHeader}>
                    <View style={styles.ratingScoreContainer}>
                      <Text style={styles.ratingScoreLarge}>{((productReviews.summary.average || 0) || 0).toFixed(1)}</Text>
                      <View style={styles.ratingStarsLarge}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <Ionicons
                            key={star}
                            name={star <= Math.round(productReviews.summary.average || 0) ? 'star' : 'star-outline'}
                            size={20}
                            color={star <= Math.round(productReviews.summary.average || 0) ? '#fbbf24' : '#d1d5db'}
                          />
                        ))}
                      </View>
                    </View>
                    <View style={styles.ratingStats}>
                      <Text style={styles.ratingCount}>{productReviews.summary.count || 0} ratings</Text>
                      <TouchableOpacity style={styles.viewAllButton}>
                        <Text style={styles.viewAllText}>See all</Text>
                        <Ionicons name="chevron-forward" size={16} color={Colors.sky} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {/* Rating Distribution */}
                  <View style={styles.ratingDistribution}>
                    {[5, 4, 3, 2, 1].map(rating => {
                      const count = productReviews.reviews?.filter(r => r.rating === rating).length || 0;
                      const percentage = productReviews.summary.count > 0 ? (count / productReviews.summary.count) * 100 : 0;
                      return (
                        <View key={rating} style={styles.ratingBarRow}>
                          <Text style={styles.ratingBarLabel}>{rating}★</Text>
                          <View style={styles.ratingBarTrack}>
                            <View style={[styles.ratingBarFill, { width: `${percentage}%` }]} />
                          </View>
                          <Text style={styles.ratingBarCount}>{count}</Text>
                        </View>
                      );
                    })}
                  </View>
                  
                  {/* Customer Reviews */}
                  {productReviews.reviews && productReviews.reviews.length > 0 && (
                    <View style={styles.reviewsSection}>
                      <View style={styles.reviewsSectionHeader}>
                        <Text style={styles.reviewsSectionTitle}>Customer Reviews</Text>
                        <Text style={styles.reviewsSectionCount}>({productReviews.reviews.length})</Text>
                      </View>
                      {productReviews.reviews.slice(0, 2).map((review, index) => (
                        <View key={review.id} style={styles.reviewCard}>
                          <View style={styles.reviewHeader}>
                            <View style={styles.reviewerInfo}>
                              <View style={styles.avatarContainer}>
                                <Image 
                                  source={{ uri: review.customer_avatar || 'https://via.placeholder.com/40' }} 
                                  style={styles.reviewAvatar}
                                  resizeMode="cover"
                                />
                              </View>
                              <View style={styles.reviewerDetails}>
                                <Text style={styles.reviewCustomerName}>
                                  {review.customer_name.charAt(0)}{review.customer_name.slice(1).replace(/./g, '*')}
                                </Text>
                                <View style={styles.reviewRatingRow}>
                                  <View style={styles.reviewStars}>
                                    {[1, 2, 3, 4, 5].map(star => (
                                      <Ionicons
                                        key={star}
                                        name={star <= review.rating ? 'star' : 'star-outline'}
                                        size={12}
                                        color={star <= review.rating ? '#fbbf24' : '#d1d5db'}
                                      />
                                    ))}
                                  </View>
                                  <Text style={styles.reviewRatingText}>{review.rating}.0</Text>
                                </View>
                              </View>
                            </View>
                            <Text style={styles.reviewDate}>
                              {new Date(review.created_at).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })}
                            </Text>
                          </View>
                          <Text style={styles.reviewComment}>{review.review}</Text>
                          {index < productReviews.reviews.slice(0, 2).length - 1 && (
                            <View style={styles.reviewSeparator} />
                          )}
                        </View>
                      ))}
                      {productReviews.reviews.length > 2 && (
                        <TouchableOpacity style={styles.seeAllReviewsBtn}>
                          <Text style={styles.seeAllReviewsBtnText}>See all reviews ({productReviews.reviews.length})</Text>
                          <Ionicons name="chevron-forward" size={16} color={Colors.sky} />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </>
              ) : (
                <>
                  {/* No Ratings State */}
                  <View style={styles.noRatingContainer}>
                    <View style={styles.noRatingScore}>
                      <Ionicons name="star-outline" size={24} color="#d1d5db" />
                      <Text style={styles.noRatingText}>No ratings yet</Text>
                    </View>
                    <TouchableOpacity style={styles.firstReviewButton}>
                      <Text style={styles.firstReviewButtonText}>Be the first to review</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Brand Information */}
          {brandProfile && (
            <View style={styles.brandSection}>
              <Text style={styles.sectionLabel}>Shop Information</Text>
              <View style={styles.brandCard}>
                <Image
                  source={{ uri: brandProfile.profile_picture || 'https://via.placeholder.com/60' }}
                  style={styles.brandLogo}
                  resizeMode="contain"
                />
                <View style={styles.brandInfo}>
                  <View style={styles.brandHeader}>
                    <Text style={styles.brandName}>{brandProfile.name}</Text>
                    <View style={[
                      styles.onlineDot,
                      brandProfile.is_online ? styles.onlineDotActive : styles.onlineDotInactive
                    ]} />
                  </View>
                  <Text style={styles.brandSupplier}>{brandProfile.supplier_name}</Text>
                  <View style={styles.brandStats}>
                    <View style={styles.brandStat}>
                      <Ionicons name="star" size={12} color="#fbbf24" />
                      <Text style={styles.brandStatText}>{(brandProfile.overall_rating || 0).toFixed(1)}</Text>
                    </View>
                    <View style={styles.brandStatDivider} />
                    <View style={styles.brandStat}>
                      <Text style={styles.brandStatText}>{brandProfile.total_reviews} reviews</Text>
                    </View>
                    <View style={styles.brandStatDivider} />
                    <View style={styles.brandStat}>
                      <Text style={styles.brandStatText}>{brandProfile.total_products} products</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity style={styles.chatButton} activeOpacity={0.7}>
                  <Ionicons name="chevron-forward" size={20} color={Colors.sky} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <View style={styles.relatedSection}>
              <View style={styles.relatedHeader}>
                <Ionicons name="grid-outline" size={15} color={Colors.sky} />
                <Text style={styles.relatedTitle}>Related Products</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.relatedScroll}>
                <View style={styles.relatedRow}>
                  {relatedProducts.map(p => (
                    <View key={p.id} style={styles.relatedCard}>
                      <ItemCard product={p} onPress={item => onProductPress?.(item.id)} />
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}
        </ScrollView>
        
        {/* Buy Now Button - Fixed Bottom */}
        <LinearGradient
          colors={['#f0f9ff', '#f0fdf4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.buyNowContainer}
        >
          <View style={{ paddingTop: 8, paddingBottom: insets.bottom || 4 }}>
          {/* Decorative Icon */}
          <View style={styles.decorativeIconContainer}>
            <Ionicons name="sparkles" size={16} color={Colors.sky} />
            <Text style={styles.decorativeText}>Complete your order</Text>
          </View>

          {/* Button Row */}
          <View style={styles.buttonRow}>
            {/* Add to Cart Button */}
            <TouchableOpacity
              style={styles.addToCartButton}
              onPress={() => {
                // TODO: Implement add to cart functionality
                console.log('Add to Cart pressed');
              }}
              activeOpacity={0.7}
            >
              <View style={styles.addToCartContent}>
                <Ionicons name="cart-outline" size={20} color={Colors.sky} />
                <View style={styles.addToCartLabel}>
                  <Text style={styles.addToCartText}>Add</Text>
                  <Text style={styles.addToCartSmallText}>to cart</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Buy Now Button with Save Badge */}
            <View style={styles.buyNowButtonContainer}>
              <TouchableOpacity
                style={styles.buyNowButton}
                onPress={() => {
                  setShowBuyModal(true);
                  setQuantity(1);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.buyNowContent}>
                  <Ionicons name="flash" size={18} color={Colors.white} />
                  <View style={styles.buyNowTextContainer}>
                    <Text style={styles.buyNowTitle}>Buy Now</Text>
                    <Text style={styles.buyNowSubtitle}>Limited stock • Fast shipping</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={18} color={Colors.white} />
                </View>
              </TouchableOpacity>
              {hasDiscount && (
                <View style={styles.saveBadge}>
                  <Ionicons name="gift" size={12} color={Colors.white} />
                  <Text style={styles.saveBadgeText}>Special Deal</Text>
                </View>
              )}
            </View>
          </View>
          </View>
        </LinearGradient>
        </>
      ) : (
        <View style={styles.loadingWrap}>
          <Ionicons name="alert-circle-outline" size={36} color="#d1d5db" />
          <Text style={styles.errorText}>Product not found</Text>
        </View>
      )}

      {/* Full Screen Image Slideshow Viewer */}
      {showImageViewer && images.length > 0 && product && (
        <View style={styles.slideshowOverlay}>
          {/* Header with Brand Info and Close */}
          <LinearGradient
            colors={['rgba(14,165,233,0.18)', 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[styles.slideshowHeader, { paddingTop: insets.top + 8 }]}
          >
            <TouchableOpacity
              onPress={() => setShowImageViewer(false)}
              activeOpacity={0.7}
              style={styles.slideshowCloseBtn}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>

            {/* Brand/Seller Info */}
            <View style={styles.slideshowBrandInfo}>
              <Image
                source={{ uri: brandProfile?.profile_picture || 'https://via.placeholder.com/32' }}
                style={styles.slideshowBrandImage}
                resizeMode="contain"
              />
              <View style={styles.slideshowBrandText}>
                <Text style={styles.slideshowBrandName} numberOfLines={1}>
                  {product.brand || 'Store'}
                </Text>
                {brandProfile && (
                  <View style={styles.slideshowRatingRow}>
                    <Ionicons name="star" size={12} color="#fbbf24" />
                    <Text style={styles.slideshowRating}>
                      {(brandProfile.overall_rating || 0).toFixed(1)}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Share Button */}
            <TouchableOpacity
              style={styles.slideshowShareBtn}
              activeOpacity={0.7}
              onPress={() => {
                console.log('Share product');
              }}
            >
              <Ionicons name="share-social-outline" size={22} color={Colors.text} />
            </TouchableOpacity>
          </LinearGradient>

          {/* Main Image Carousel */}
          <View style={styles.slideshowImageWrapper}>
            <ScrollView
              ref={imageViewerScrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              onMomentumScrollEnd={e => {
                const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                setImageViewerIndex(index);
                // Auto-select variant based on image index
                if (imagesWithVariants.length > index) {
                  const item = imagesWithVariants[index];
                  if (item.variantId !== null) {
                    setSelectedVariant(item.variantId);
                  }
                }
              }}
              style={styles.slideshowImageScroll}
            >
              {images.map((img, i) => (
                <View key={i} style={styles.slideshowImageContainer}>
                  {/* Image */}
                  <Image
                    source={{ uri: img }}
                    style={styles.slideshowImage}
                    resizeMode="contain"
                  />
                </View>
              ))}
            </ScrollView>

            {/* Page Indicator */}
            <View style={styles.slideshowPageIndicator}>
              <Text style={styles.slideshowPageText}>
                {imageViewerIndex + 1}/{images.length}
              </Text>
            </View>
          </View>

          {/* Bottom Product Card */}
          <LinearGradient
            colors={['rgba(255, 255, 255, 0)', Colors.white]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[styles.slideshowProductCard, { paddingBottom: insets.bottom + 12 }]}
          >
            {/* Product Image Thumbnail and Info */}
            <View style={styles.slideshowCardContent}>
              {/* Thumbnail */}
              <Image
                source={{ uri: images[imageViewerIndex] }}
                style={styles.slideshowCardImage}
                resizeMode="cover"
              />

              {/* Product Details */}
              <View style={styles.slideshowCardDetails}>
                <Text style={styles.slideshowCardName} numberOfLines={2}>
                  {product.name}
                </Text>

                {/* Variant Label */}
                {selectedVariant && product.variants && (
                  <Text style={styles.slideshowVariantLabelText} numberOfLines={1}>
                    {product.variants.find(v => v.id === selectedVariant)?.color ||
                     product.variants.find(v => v.id === selectedVariant)?.name ||
                     'Variant'}
                  </Text>
                )}

                {/* Pricing */}
                <View style={styles.slideshowCardPricing}>
                  <Text style={styles.slideshowCardPrice}>
                    ₱{(selectedVariant
                      ? (product.variants?.find(v => v.id === selectedVariant)?.priceMember ?? product.priceMember)
                      : product.priceMember).toLocaleString()}
                  </Text>
                  {(selectedVariant
                    ? (product.variants?.find(v => v.id === selectedVariant)?.priceSrp ?? 0)
                    : product.priceSrp) > (selectedVariant
                      ? (product.variants?.find(v => v.id === selectedVariant)?.priceMember ?? 0)
                      : product.priceMember) && (
                    <Text style={styles.slideshowCardOriginalPrice}>
                      ₱{(selectedVariant
                        ? (product.variants?.find(v => v.id === selectedVariant)?.priceSrp ?? 0)
                        : product.priceSrp).toLocaleString()}
                    </Text>
                  )}
                </View>

                {/* PV and Sold Count */}
                <View style={styles.slideshowCardMetaRow}>
                  {product.prodpv > 0 && (
                    <View style={styles.slideshowCardMeta}>
                      <Ionicons name="star" size={12} color={Colors.sky} />
                      <Text style={styles.slideshowCardMetaText}>
                        PV {product.prodpv}
                      </Text>
                    </View>
                  )}
                  {product.soldCount > 0 && (
                    <View style={styles.slideshowCardMeta}>
                      <Ionicons name="bag-check-outline" size={12} color={Colors.textSecondary} />
                      <Text style={styles.slideshowCardMetaText}>
                        {product.soldCount} sold
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Variants Section */}
            {product.variants && product.variants.length > 0 && (
              <View style={styles.slideshowVariantsSection}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.slideshowVariantsScroll}
                >
                  {product.variants.map((variant, idx) => (
                    <TouchableOpacity
                      key={variant.id}
                      style={[
                        styles.slideshowVariantOption,
                        selectedVariant === variant.id && styles.slideshowVariantOptionSelected,
                      ]}
                      onPress={() => {
                        setSelectedVariant(variant.id);
                        // Scroll to the variant's image in the gallery
                        const variantIndex = imagesWithVariants.findIndex(item => item.variantId === variant.id);
                        if (variantIndex >= 0) {
                          setImageViewerIndex(variantIndex);
                          imageViewerScrollRef.current?.scrollTo({
                            x: variantIndex * SCREEN_WIDTH,
                            animated: true,
                          });
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      {variant.images && variant.images.length > 0 ? (
                        <Image
                          source={{ uri: variant.images[0] }}
                          style={styles.slideshowVariantImage}
                          resizeMode="cover"
                        />
                      ) : variant.colorHex ? (
                        <View
                          style={[
                            styles.slideshowVariantColor,
                            { backgroundColor: variant.colorHex },
                          ]}
                        />
                      ) : (
                        <Ionicons name="image-outline" size={20} color="#d1d5db" />
                      )}
                      {selectedVariant === variant.id && (
                        <View style={styles.slideshowVariantCheck}>
                          <Ionicons name="checkmark" size={14} color={Colors.white} />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.slideshowButtonRow}>
              <TouchableOpacity
                style={styles.slideshowAddToCartBtn}
                activeOpacity={0.7}
                onPress={() => {
                  console.log('Add to cart');
                  setShowImageViewer(false);
                }}
              >
                <Ionicons name="cart-outline" size={20} color={Colors.sky} />
                <Text style={styles.slideshowAddToCartText}>Add to Cart</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.slideshowBuyNowBtn}
                activeOpacity={0.7}
                onPress={() => {
                  setShowBuyModal(true);
                  setShowImageViewer(false);
                  setQuantity(1);
                }}
              >
                <Ionicons name="flash" size={18} color={Colors.white} />
                <Text style={styles.slideshowBuyNowText}>Buy Now</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      )}

      {/* Buy Now Modal - Shopee Style */}
      {showBuyModal && product && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowBuyModal(false)}
          />
          <View style={[styles.shopeeModal, { paddingBottom: insets.bottom || 16 }]}>
            {/* Header */}
            <View style={styles.shopeeModalHeader}>
              <TouchableOpacity
                onPress={() => setShowBuyModal(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-down" size={28} color={Colors.text} />
              </TouchableOpacity>
              <Text style={styles.shopeeModalHeaderText}>Purchase</Text>
              <View style={{ width: 28 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.shopeeModalContent}>
              {/* Product Card - Shopee Style */}
              <View style={styles.shopeeProductCard}>
                {/* Image */}
                <View style={styles.shopeeProductImage}>
                  <Image
                    source={{ uri: images[0] || product.image }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="contain"
                  />
                </View>

                {/* Product Info */}
                <View style={styles.shopeeProductInfo}>
                  <Text style={styles.shopeeProductName} numberOfLines={2}>
                    {product.name}
                  </Text>

                  {/* Rating */}
                  <View style={styles.shopeeRatingRow}>
                    <View style={styles.shopeeStars}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <Ionicons
                          key={star}
                          name={star <= 4 ? 'star' : 'star-outline'}
                          size={14}
                          color="#fbbf24"
                        />
                      ))}
                    </View>
                    <Text style={styles.shopeeRatingText}>({product.soldCount} sold)</Text>
                  </View>

                  {/* Price Section */}
                  <View style={styles.shopeePriceSection}>
                    <View>
                      <Text style={styles.shopeePriceLabel}>Price</Text>
                      <View style={styles.shopeePriceRow}>
                        <Text style={styles.shopeePrice}>
                          ₱{(selectedVariant
                            ? (product.variants?.find(v => v.id === selectedVariant)?.priceMember ?? product.priceMember)
                            : product.priceMember).toLocaleString()}
                        </Text>
                        {(selectedVariant
                          ? (product.variants?.find(v => v.id === selectedVariant)?.priceSrp ?? 0)
                          : product.priceSrp) > (selectedVariant
                            ? (product.variants?.find(v => v.id === selectedVariant)?.priceMember ?? 0)
                            : product.priceMember) && (
                          <Text style={styles.shopeeOriginalPrice}>
                            ₱{(selectedVariant
                              ? (product.variants?.find(v => v.id === selectedVariant)?.priceSrp ?? 0)
                              : product.priceSrp).toLocaleString()}
                          </Text>
                        )}
                      </View>
                    </View>

                    {(selectedVariant
                      ? (product.variants?.find(v => v.id === selectedVariant)?.priceSrp ?? 0)
                      : product.priceSrp) > (selectedVariant
                        ? (product.variants?.find(v => v.id === selectedVariant)?.priceMember ?? 0)
                        : product.priceMember) && (
                      <View style={styles.shopeeDiscountBadge}>
                        <Text style={styles.shopeeDiscountPercent}>
                          {Math.round(
                            ((
                              (selectedVariant
                                ? (product.variants?.find(v => v.id === selectedVariant)?.priceSrp ?? 0)
                                : product.priceSrp) -
                              (selectedVariant
                                ? (product.variants?.find(v => v.id === selectedVariant)?.priceMember ?? 0)
                                : product.priceMember)
                            ) / (selectedVariant
                              ? (product.variants?.find(v => v.id === selectedVariant)?.priceSrp ?? 0)
                              : product.priceSrp)) * 100
                          )}%
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              {/* Divider */}
              <View style={styles.shopeeDivider} />

              {/* Variant Selection - Shopee Style */}
              {(product.variants?.length ?? 0) > 0 && (
                <View style={styles.shopeeSection}>
                  <View style={styles.shopeeSectionHeader}>
                    <Text style={styles.shopeeSectionTitle}>Variant</Text>
                    <Text style={styles.shopeeSectionRequired}>Required</Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.shopeeVariantScroll}
                  >
                    <View style={styles.shopeeVariantRow}>
                      {product.variants.map((variant, index) => (
                        <TouchableOpacity
                          key={variant.id}
                          style={[
                            styles.shopeeVariantOption,
                            selectedVariant === variant.id && styles.shopeeVariantOptionSelected
                          ]}
                          onPress={() => setSelectedVariant(variant.id)}
                          activeOpacity={0.7}
                        >
                          {variant.images && variant.images.length > 0 ? (
                            <Image
                              source={{ uri: variant.images[0] }}
                              style={styles.shopeeVariantOptionImage}
                              resizeMode="cover"
                            />
                          ) : variant.colorHex ? (
                            <View style={[
                              styles.shopeeVariantOptionColor,
                              { backgroundColor: variant.colorHex }
                            ]} />
                          ) : null}
                          <Text
                            style={styles.shopeeVariantOptionText}
                            numberOfLines={2}
                          >
                            {variant.color || variant.name || `Var ${index + 1}`}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}

              {/* Quantity - Shopee Style */}
              <View style={styles.shopeeSection}>
                <View style={styles.shopeeSectionHeader}>
                  <Text style={styles.shopeeSectionTitle}>Quantity</Text>
                  <Text style={styles.shopeeStockLeft}>
                    {selectedVariant
                      ? (product.variants?.find(v => v.id === selectedVariant)?.qty ?? product.qty)
                      : product.qty} available
                  </Text>
                </View>
                <View style={styles.shopeeQuantityControl}>
                  <TouchableOpacity
                    style={styles.shopeeQuantityBtn}
                    onPress={() => quantity > 1 && setQuantity(quantity - 1)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="remove" size={18} color={Colors.text} />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.shopeeQuantityInput}
                    value={quantity.toString()}
                    onChangeText={(text) => {
                      const num = parseInt(text) || 1;
                      const maxQty = selectedVariant
                        ? (product.variants?.find(v => v.id === selectedVariant)?.qty ?? product.qty)
                        : product.qty;
                      if (num > 0 && num <= maxQty) {
                        setQuantity(num);
                      }
                    }}
                    keyboardType="number-pad"
                    editable={false}
                  />
                  <TouchableOpacity
                    style={styles.shopeeQuantityBtn}
                    onPress={() => {
                      const maxQty = selectedVariant
                        ? (product.variants?.find(v => v.id === selectedVariant)?.qty ?? product.qty)
                        : product.qty;
                      if (quantity < maxQty) {
                        setQuantity(quantity + 1);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={18} color={Colors.text} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Price Summary - Shopee Style */}
              <View style={styles.shopeePriceSummary}>
                <View style={styles.shopeePriceSummaryRow}>
                  <Text style={styles.shopeePriceSummaryLabel}>Subtotal</Text>
                  <Text style={styles.shopeePriceSummaryValue}>
                    ₱{(
                      quantity * (selectedVariant
                        ? (product.variants?.find(v => v.id === selectedVariant)?.priceMember ?? product.priceMember)
                        : product.priceMember)
                    ).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.shopeePriceSummaryRow}>
                  <Text style={styles.shopeePriceSummaryLabel}>Shipping</Text>
                  <Text style={styles.shopeeShippingText}>See at checkout</Text>
                </View>
              </View>
            </ScrollView>

            {/* Bottom Total & Button - Shopee Style */}
            <View style={styles.shopeeCheckoutFooter}>
              <View style={styles.shopeeCheckoutInfo}>
                <Text style={styles.shopeeCheckoutLabel}>Total</Text>
                <Text style={styles.shopeeCheckoutTotal}>
                  ₱{(
                    quantity * (selectedVariant
                      ? (product.variants?.find(v => v.id === selectedVariant)?.priceMember ?? product.priceMember)
                      : product.priceMember)
                  ).toLocaleString()}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.shopeeCheckoutBtn}
                onPress={() => {
                  console.log('Checkout:', {
                    variantId: selectedVariant,
                    quantity,
                    product: product.id
                  });
                  setShowBuyModal(false);
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="arrow-forward" size={18} color={Colors.white} />
                <Text style={styles.shopeeCheckoutBtnText}>Proceed to Checkout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.white,
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
    paddingBottom: 80, // Reduced padding for Buy Now button
  },
  galleryWrap: {
    width: SCREEN_WIDTH,
    minHeight: 300,
    maxHeight: SCREEN_WIDTH * 0.85,
    backgroundColor: '#f1f5f9',
    position: 'relative',
  },
  galleryImageContainer: {
    width: SCREEN_WIDTH,
    minHeight: 300,
    maxHeight: SCREEN_WIDTH * 0.85,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  galleryImage: {
    width: SCREEN_WIDTH,
    height: '100%',
    minHeight: 300,
    maxHeight: SCREEN_WIDTH * 0.85,
  },
  galleryFallback: {
    width: SCREEN_WIDTH,
    minHeight: 300,
    maxHeight: SCREEN_WIDTH * 0.85,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  galleryDotsContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    alignItems: 'center',
  },
  galleryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.3)',
  },
  galleryDotActive: {
    borderColor: Colors.sky,
    backgroundColor: Colors.sky,
    width: 10,
  },
  galleryBackBtn: {
    position: 'absolute',
    top: 0,
    left: 0,
    padding: 12,
  },
  galleryBackBtnInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: 80,
    left: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    maxWidth: SCREEN_WIDTH - 24,
  },
  discountBadgeText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  discountMessage: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
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
    paddingHorizontal: 8,
    paddingVertical: 8,
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
  relatedSection: {
    paddingHorizontal: 8,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 12,
  },
  relatedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 0,
  },
  relatedTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
  },
  relatedScroll: {
    paddingHorizontal: 0,
  },
  relatedRow: {
    flexDirection: 'row',
    gap: 8,
  },
  relatedCard: {
    width: 220,
    height: 380, // Increased height to accommodate tallest item
  },
  priceSoldContainer: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameSection: {
    paddingVertical: 8,
  },
  nameCard: {
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    gap: 8,
  },
  nameDetails: {
    gap: 6,
  },
  nameDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  skuText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  stockText: {
    fontSize: 12,
    color: Colors.forest,
    fontWeight: '600',
  },
  ratingSection: {
    paddingVertical: 8,
  },
  ratingCard: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
  },
  // New Shopee-style rating styles
  ratingSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  ratingScoreContainer: {
    alignItems: 'center',
  },
  ratingScoreLarge: {
    fontSize: 48,
    fontWeight: '800',
    color: Colors.text,
    lineHeight: 56,
  },
  ratingStarsLarge: {
    flexDirection: 'row',
    marginTop: 4,
    marginBottom: 8,
  },
  ratingStats: {
    alignItems: 'flex-end',
    gap: 8,
  },
  ratingCount: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: Colors.sky,
    fontWeight: '600',
  },
  ratingDistribution: {
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  ratingBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  ratingBarLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    width: 24,
    textAlign: 'right',
  },
  ratingBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: '100%',
    backgroundColor: '#fbbf24',
    borderRadius: 4,
  },
  ratingBarCount: {
    fontSize: 12,
    color: Colors.textSecondary,
    width: 30,
    textAlign: 'right',
  },
  reviewsSection: {
    marginTop: 8,
  },
  reviewsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  reviewsSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  reviewsSectionCount: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  reviewCard: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
  },
  reviewAvatar: {
    width: 40,
    height: 40,
  },
  reviewerDetails: {
    flex: 1,
  },
  reviewCustomerName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  reviewRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 1,
  },
  reviewRatingText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  reviewDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  reviewComment: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  reviewSeparator: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginTop: 12,
  },
  seeAllReviewsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
    gap: 8,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
  },
  seeAllReviewsBtnText: {
    fontSize: 14,
    color: Colors.sky,
    fontWeight: '600',
  },
  // No ratings state
  noRatingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 16,
  },
  noRatingScore: {
    alignItems: 'center',
    gap: 8,
  },
  noRatingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  firstReviewButton: {
    backgroundColor: Colors.sky,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  firstReviewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  variantsSection: {
    paddingVertical: 8,
  },
  variantsScrollView: {
    paddingHorizontal: 8,
  },
  variantsList: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 4,
    paddingVertical: 12,
  },
  variantCard: {
    width: 140,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    paddingBottom: 8,
  },
  variantCardSelected: {
    borderColor: Colors.sky,
    borderWidth: 2.5,
    shadowColor: Colors.sky,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  variantMediaContainer: {
    width: '100%',
    height: 120,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  variantImage: {
    width: '100%',
    height: '100%',
  },
  variantColorCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  variantPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  variantCheckmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 2,
  },
  variantInfo: {
    paddingHorizontal: 8,
    paddingTop: 8,
    gap: 4,
  },
  variantLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  variantSubInfo: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  variantStock: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  stockAvailable: {
    color: Colors.forest,
  },
  stockLow: {
    color: '#ef4444',
  },
  variantPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.sky,
    marginTop: 4,
  },
  variantDetailsCard: {
    marginHorizontal: 0,
    marginTop: 12,
    marginBottom: 0,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  variantDetailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  variantDetailsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  variantDetailsSku: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  variantPriceContainer: {
    alignItems: 'flex-end',
  },
  variantPriceLarge: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.sky,
  },
  variantPriceOriginal: {
    fontSize: 12,
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  variantDetailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 8,
  },
  detailGridItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    gap: 4,
  },
  detailGridLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  detailGridValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  variantAdditionalInfo: {
    backgroundColor: '#f9fafb',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  infoPair: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  statusInStock: {
    color: Colors.forest,
    fontWeight: '700',
  },
  statusOutOfStock: {
    color: '#ef4444',
    fontWeight: '700',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  addToCartText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  descriptionsWrapper: {
    marginHorizontal: 0,
    marginVertical: 8,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  descriptionSection: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  descriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
  },
  descriptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  descriptionContent: {
    backgroundColor: Colors.white,
    overflow: 'hidden',
  },
  descriptionContentInner: {
    padding: 12,
    gap: 16,
  },
  descriptionBlock: {
    gap: 8,
  },
  specificationsBlock: {
    gap: 8,
  },
  blockTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  specificationsSection: {
  },
  specificationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
  },
  specificationsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  specificationsContent: {
    backgroundColor: Colors.white,
    overflow: 'hidden',
  },
  specificationsContentInner: {
    padding: 12,
    gap: 12,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  specLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    flexShrink: 0,
  },
  specValue: {
    fontSize: 13,
    color: Colors.text,
    flex: 1,
    textAlign: 'right',
  },
  brandSection: {
    paddingVertical: 8,
  },
  brandCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    gap: 12,
    alignItems: 'center',
  },
  brandLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  brandInfo: {
    flex: 1,
    gap: 2,
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  brandSupplier: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  brandStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  brandStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  brandStatText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  brandStatDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#e5e7eb',
  },
  chatButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  onlineDotActive: {
    backgroundColor: Colors.forest,
  },
  onlineDotInactive: {
    backgroundColor: '#9ca3af',
  },
  // Buy Now Button Styles
  buyNowContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 0,
  },
  decorativeIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    paddingLeft: 2,
  },
  decorativeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.sky,
    letterSpacing: 0.3,
  },
  priceDisplay: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  compactPriceText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 22,
  },
  priceLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceIcon: {
    marginRight: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addToCartButton: {
    width: 70,
    height: 52,
    borderRadius: 10,
    backgroundColor: '#f0f9ff',
    borderWidth: 1.5,
    borderColor: Colors.sky,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToCartContent: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  addToCartLabel: {
    alignItems: 'center',
  },
  addToCartText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.sky,
    lineHeight: 12,
  },
  addToCartSmallText: {
    fontSize: 9,
    fontWeight: '500',
    color: Colors.sky,
    lineHeight: 11,
  },
  buyNowButtonContainer: {
    flex: 1,
    position: 'relative',
  },
  buyNowButton: {
    backgroundColor: Colors.sky,
    height: 52,
    flex: 1,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyNowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
    gap: 8,
  },
  buyNowTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  buyNowTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.3,
  },
  buyNowSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  saveBadge: {
    position: 'absolute',
    top: -12,
    right: 12,
    backgroundColor: Colors.forest,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  saveBadgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  // Shopee Style Modal
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  shopeeModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '95%',
    zIndex: 1000,
    flexDirection: 'column',
  },
  shopeeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  shopeeModalHeaderText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  shopeeModalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  shopeeProductCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    marginBottom: 12,
    gap: 12,
  },
  shopeeProductImage: {
    width: 100,
    height: 100,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopeeProductInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  shopeeProductName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 18,
  },
  shopeeRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 4,
  },
  shopeeStars: {
    flexDirection: 'row',
    gap: 1,
  },
  shopeeRatingText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  shopeePriceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 8,
  },
  shopeePriceLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  shopeePriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shopeePrice: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.sky,
  },
  shopeeOriginalPrice: {
    fontSize: 12,
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  shopeeDiscountBadge: {
    backgroundColor: Colors.skyDark,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  shopeeDiscountPercent: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
  },
  shopeeDivider: {
    height: 8,
    backgroundColor: '#f1f5f9',
    marginHorizontal: -16,
    marginVertical: 8,
  },
  shopeeSection: {
    marginBottom: 12,
  },
  shopeeSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  shopeeSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  shopeeSectionRequired: {
    fontSize: 11,
    color: Colors.skyDark,
    fontWeight: '600',
  },
  shopeeStockLeft: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  shopeeVariantScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  shopeeVariantRow: {
    flexDirection: 'row',
    gap: 8,
  },
  shopeeVariantOption: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    backgroundColor: Colors.white,
    minWidth: 80,
  },
  shopeeVariantOptionSelected: {
    borderColor: Colors.sky,
    borderWidth: 2,
    backgroundColor: '#f0f9ff',
  },
  shopeeVariantOptionImage: {
    width: 50,
    height: 50,
    borderRadius: 6,
    marginBottom: 6,
  },
  shopeeVariantOptionColor: {
    width: 50,
    height: 50,
    borderRadius: 6,
    marginBottom: 6,
  },
  shopeeVariantOptionText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.text,
    textAlign: 'center',
  },
  shopeeQuantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  shopeeQuantityBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopeeQuantityInput: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    paddingVertical: 0,
  },
  shopeePriceSummary: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 8,
  },
  shopeePriceSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shopeePriceSummaryLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  shopeePriceSummaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  shopeeShippingText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  shopeeCheckoutFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: Colors.white,
  },
  shopeeCheckoutInfo: {
    alignItems: 'flex-end',
  },
  shopeeCheckoutLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  shopeeCheckoutTotal: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.sky,
    marginTop: 2,
  },
  shopeeCheckoutBtn: {
    backgroundColor: Colors.sky,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 10,
    marginLeft: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 160,
    justifyContent: 'center',
  },
  shopeeCheckoutBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
  // Slideshow Image Viewer Styles
  slideshowOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f8fafc',
    zIndex: 2000,
    flexDirection: 'column',
  },
  slideshowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  slideshowCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideshowBrandInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 12,
  },
  slideshowBrandImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
  },
  slideshowBrandText: {
    flex: 1,
  },
  slideshowBrandName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  slideshowRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  slideshowRating: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  slideshowShareBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideshowImageWrapper: {
    flex: 1,
    position: 'relative',
  },
  slideshowImageScroll: {
    flex: 1,
  },
  slideshowImageContainer: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: Colors.white,
  },
  slideshowImage: {
    width: '90%',
    height: '85%',
    zIndex: 10,
  },
  slideshowPageIndicator: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  slideshowPageText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  slideshowProductCard: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 12,
    paddingTop: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  slideshowCardContent: {
    flexDirection: 'row',
    gap: 12,
  },
  slideshowCardImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  slideshowCardDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  slideshowCardName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 18,
  },
  slideshowCardPricing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slideshowCardPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.sky,
  },
  slideshowCardOriginalPrice: {
    fontSize: 12,
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  slideshowCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  slideshowCardMetaText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  slideshowCardMetaRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 6,
  },
  slideshowVariantsSection: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  slideshowVariantsScroll: {
    marginHorizontal: -12,
    paddingHorizontal: 12,
  },
  slideshowVariantOption: {
    width: 60,
    height: 60,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    backgroundColor: '#f8fafc',
    overflow: 'hidden',
  },
  slideshowVariantOptionSelected: {
    borderColor: Colors.sky,
    backgroundColor: Colors.sky,
  },
  slideshowVariantImage: {
    width: '100%',
    height: '100%',
  },
  slideshowVariantColor: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  slideshowVariantCheck: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.sky,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideshowVariantLabelText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginTop: 4,
  },
  slideshowButtonRow: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 8,
  },
  slideshowAddToCartBtn: {
    flex: 0.4,
    borderWidth: 1.5,
    borderColor: Colors.sky,
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  slideshowAddToCartText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.sky,
  },
  slideshowBuyNowBtn: {
    flex: 0.6,
    backgroundColor: Colors.sky,
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  slideshowBuyNowText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },
});
