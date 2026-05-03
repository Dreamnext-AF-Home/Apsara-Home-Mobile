import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity,
  Dimensions, ActivityIndicator, BackHandler,
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
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });
    return () => backHandler.remove();
  }, [onBack]);

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


  const images = useMemo(() => {
    if (!product) return [];
    const imgs = (product.images ?? []).filter(Boolean);
    if (imgs.length > 0) return imgs;
    if (product.image) return [product.image];
    return [];
  }, [product]);

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
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={e => {
                const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                setActiveImage(index);
              }}
            >
              {images.length > 0 ? images.map((img, i) => (
                <View key={i} style={styles.galleryImageContainer}>
                  <Image source={{ uri: img }} style={styles.galleryImage} resizeMode="contain" />
                </View>
              )) : (
                <View style={[styles.galleryImageContainer, styles.galleryFallback]}>
                  <Ionicons name="image-outline" size={48} color="#d1d5db" />
                </View>
              )}
            </ScrollView>
            {images.length > 1 && (
              <View style={styles.galleryDotsContainer}>
                {images.map((_, i) => (
                  <View key={i} style={[styles.galleryDot, i === activeImage && styles.galleryDotActive]} />
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
              <View style={styles.variantsList}>
                {product.variants.map((variant, index) => (
                  <TouchableOpacity
                    key={variant.id}
                    style={[
                      styles.variantChip,
                      selectedVariant === variant.id && styles.variantChipSelected,
                    ]}
                    onPress={() => setSelectedVariant(variant.id)}
                    activeOpacity={0.7}
                  >
                    {/* Color Circle */}
                    {variant.colorHex && (
                      <View style={[
                        styles.colorCircle,
                        selectedVariant === variant.id && styles.colorCircleSelected
                      ]}>
                        <View style={[styles.colorCircleInner, { backgroundColor: variant.colorHex }]} />
                      </View>
                    )}
                    {/* Variant Text */}
                    <Text style={[
                      styles.variantChipText,
                      selectedVariant === variant.id && styles.variantChipTextSelected
                    ]}>
                      {variant.color || `Variant ${index + 1}`}
                    </Text>
                    {variant.qty <= 10 && (
                      <Text style={[
                        styles.variantChipStock,
                        selectedVariant === variant.id && styles.variantChipStockSelected
                      ]}>
                        {variant.qty > 0 ? `${variant.qty} left` : '0 left'}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              {selectedVariant && (() => {
                const variant = product.variants?.find(v => v.id === selectedVariant);
                if (!variant) return null;
                return (
                  <View style={styles.variantDetailsCard}>
                    <View style={styles.variantDetailRow}>
                      <Text style={styles.variantDetailLabel}>SKU:</Text>
                      <Text style={styles.variantDetailValue}>{variant.sku}</Text>
                    </View>
                    <View style={styles.variantDetailRow}>
                      <Text style={styles.variantDetailLabel}>Stock:</Text>
                      <Text style={styles.variantDetailValue}>{variant.qty}</Text>
                    </View>
                    <View style={styles.variantDetailRow}>
                      <Text style={styles.variantDetailLabel}>Status:</Text>
                      <Text style={[
                        styles.variantDetailValue,
                        variant.qty > 0 ? styles.stockInStock : styles.stockOutOfStock
                      ]}>
                        {variant.qty > 0 ? 'In Stock' : 'Out of Stock'}
                      </Text>
                    </View>
                  </View>
                );
              })()}
            </View>
          )}

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

          {/* Product Rating - Shopee Style */}
          <View style={styles.ratingSection}>
            <View style={styles.ratingCard}>
              {productReviews && productReviews.summary ? (
                <>
                  {/* Rating Summary Header */}
                  <View style={styles.ratingSummaryHeader}>
                    <View style={styles.ratingScoreContainer}>
                      <Text style={styles.ratingScoreLarge}>{(productReviews.summary.average || 0).toFixed(1)}</Text>
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
                      <Text style={styles.brandStatText}>{brandProfile.overall_rating.toFixed(1)}</Text>
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
        <View style={styles.buyNowContainer}>
          <View style={{ paddingTop: 16, paddingBottom: insets.bottom }}>
          {/* Price Display */}
          <View style={styles.priceDisplay}>
            <View style={styles.priceLabelContainer}>
              <Ionicons name="pricetag" size={16} color={Colors.sky} style={styles.priceIcon} />
              <Text style={styles.compactPriceText}>
                Price ₱{(() => {
                  const variant = selectedVariant ? product.variants?.find(v => v.id === selectedVariant) : null;
                  const price = variant ? variant.priceMember : product.priceMember ?? 0;
                  return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                })()}
                {hasDiscount && (() => {
                  const variant = selectedVariant ? product.variants?.find(v => v.id === selectedVariant) : null;
                  const variantPrice = variant ? variant.priceMember : product.priceMember ?? 0;
                  const variantSrp = variant ? variant.priceSrp : product.priceSrp ?? 0;
                  const savings = variantSrp - variantPrice;
                  return `, you save ₱${savings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}!`;
                })()}
              </Text>
            </View>
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
              <Ionicons name="cart-outline" size={24} color={Colors.sky} />
            </TouchableOpacity>
            
            {/* Buy Now Button */}
            <PrimaryButton
              title="Buy Now"
              onPress={() => {
                // TODO: Implement buy now functionality
                console.log('Buy Now pressed');
              }}
              style={styles.buyNowButton}
            />
          </View>
          </View>
        </View>
        </>
      ) : (
        <View style={styles.loadingWrap}>
          <Ionicons name="alert-circle-outline" size={36} color="#d1d5db" />
          <Text style={styles.errorText}>Product not found</Text>
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
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  galleryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  galleryDotActive: {
    backgroundColor: Colors.sky,
    width: 24,
    borderColor: Colors.sky,
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
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  variantsSection: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  variantsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  variantChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  colorCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  colorCircleSelected: {
    borderColor: Colors.sky,
  },
  colorCircleInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  variantChipSelected: {
    backgroundColor: Colors.sky,
    borderColor: Colors.sky,
    borderWidth: 2,
  },
  variantChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  variantChipTextSelected: {
    color: Colors.white,
  },
  variantChipStock: {
    fontSize: 10,
    color: '#ef4444',
    fontWeight: '700',
  },
  variantChipStockSelected: {
    color: Colors.white,
  },
  variantDetailsCard: {
    marginTop: 12,
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    gap: 8,
  },
  variantDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  variantDetailLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  variantDetailValue: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '600',
  },
  stockInStock: {
    color: Colors.forest,
  },
  stockOutOfStock: {
    color: '#ef4444',
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
  descriptionSection: {
    paddingVertical: 8,
  },
  descriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  descriptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  descriptionContent: {
    marginTop: 8,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
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
    paddingVertical: 8,
  },
  specificationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  specificationsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  specificationsContent: {
    marginTop: 8,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
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
    backgroundColor: Colors.white, // Solid white background
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 0, // No padding - handled by insets
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
    width: 56,
    height: 52,
    borderRadius: 10,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: Colors.sky,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyNowButton: {
    backgroundColor: Colors.sky,
    height: 52,
    flex: 1,
  },
});
