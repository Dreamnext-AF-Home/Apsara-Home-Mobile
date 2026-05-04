import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Image, TextInput, StyleSheet, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface Product {
  id: number;
  name: string;
  image?: string;
  images?: string[];
  priceMember?: number;
  priceSrp?: number;
  prodpv?: number;
  soldCount: number;
  qty: number;
  variants?: Array<{
    id: number;
    color?: string;
    name?: string;
    colorHex?: string;
    images?: string[];
    priceMember?: number;
    priceSrp?: number;
    qty: number;
  }>;
}

interface BuyNowModalProps {
  visible: boolean;
  product: Product | null;
  images: string[];
  selectedVariant: number | null;
  quantity: number;
  onClose: () => void;
  onSelectVariant: (variantId: number) => void;
  onQuantityChange: (quantity: number) => void;
  onCheckout: () => void;
}

export default function BuyNowModal({
  visible,
  product,
  images,
  selectedVariant,
  quantity,
  onClose,
  onSelectVariant,
  onQuantityChange,
  onCheckout,
}: BuyNowModalProps) {
  const insets = useSafeAreaInsets();
  const scrollStartY = React.useRef(0);
  const hasScrolledDown = React.useRef(false);

  const handleScroll = (event: any) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;

    if (currentScrollY === 0) {
      scrollStartY.current = 0;
      hasScrolledDown.current = false;
    } else if (currentScrollY > 50 && !hasScrolledDown.current) {
      hasScrolledDown.current = true;
      onClose();
    }
  };

  if (!visible || !product) return null;

  return (
    <View style={styles.modalOverlay}>
      <TouchableOpacity
        style={styles.modalBackdrop}
        activeOpacity={1}
        onPress={onClose}
      />
      <View style={[styles.shopeeModal, { paddingBottom: insets.bottom || 16 }]}>
        {/* Header */}
        <View style={styles.shopeeModalHeader}>
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-down" size={28} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.shopeeModalHeaderText}>Purchase</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.shopeeModalContent}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {/* Product Card - Shopee Style */}
          <View style={styles.shopeeProductCard}>
            {/* Image */}
            <View style={styles.shopeeProductImage}>
              <Image
                source={{
                  uri: selectedVariant
                    ? (product.variants?.find(v => v.id === selectedVariant)?.images?.[0] || images[0] || product.image)
                    : (images[0] || product.image)
                }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="contain"
              />
            </View>

            {/* Product Info */}
            <View style={styles.shopeeProductInfo}>
              <Text style={styles.shopeeProductName} numberOfLines={2}>
                {product.name}
              </Text>

              {/* Rating and PV */}
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

              {/* PV Badge */}
              <View style={styles.pvBadgeRow}>
                <Ionicons name="trending-up" size={12} color={Colors.white} />
                <Text style={styles.pvBadgeText}>{product.prodpv || 0} PV</Text>
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
                      onPress={() => onSelectVariant(variant.id)}
                      activeOpacity={0.6}
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
                onPress={() => quantity > 1 && onQuantityChange(quantity - 1)}
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
                    onQuantityChange(num);
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
                    onQuantityChange(quantity + 1);
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
            {/* Original Subtotal (SRP) */}
            <View style={styles.shopeePriceSummaryRow}>
              <Text style={styles.shopeePriceSummaryLabel}>Subtotal (SRP)</Text>
              <Text style={styles.shopeePriceSummaryValue}>
                ₱{(
                  quantity * (selectedVariant
                    ? (product.variants?.find(v => v.id === selectedVariant)?.priceSrp ?? product.priceSrp)
                    : product.priceSrp)
                ).toLocaleString()}
              </Text>
            </View>

            {/* Member Discount */}
            {(selectedVariant
              ? (product.variants?.find(v => v.id === selectedVariant)?.priceSrp ?? 0)
              : product.priceSrp) > (selectedVariant
                ? (product.variants?.find(v => v.id === selectedVariant)?.priceMember ?? 0)
                : product.priceMember) && (
              <View style={styles.shopeePriceSummaryRow}>
                <Text style={styles.discountLabel}>Member Discount</Text>
                <Text style={styles.discountValue}>
                  -₱{(
                    quantity * (
                      (selectedVariant
                        ? (product.variants?.find(v => v.id === selectedVariant)?.priceSrp ?? product.priceSrp)
                        : product.priceSrp) -
                      (selectedVariant
                        ? (product.variants?.find(v => v.id === selectedVariant)?.priceMember ?? product.priceMember)
                        : product.priceMember)
                    )
                  ).toLocaleString()}
                </Text>
              </View>
            )}

            {/* Subtotal After Discount */}
            <View style={[styles.shopeePriceSummaryRow, { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTopY: 8, marginTopY: 8 }]}>
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

        {/* Bottom Total & Button - Styled like ProductDetailScreen */}
        <View style={[styles.shopeeCheckoutFooterGradient, { paddingHorizontal: 16, paddingTop: 12, paddingBottom: insets.bottom }]}>
          {/* Total Info */}
          <View style={styles.checkoutTotalContainer}>
            <Text style={styles.checkoutTotalLabel}>Total Price</Text>
            <Text style={styles.checkoutTotalPrice}>
              ₱{(
                quantity * (selectedVariant
                  ? (product.variants?.find(v => v.id === selectedVariant)?.priceMember ?? product.priceMember)
                  : product.priceMember)
              ).toLocaleString()}
            </Text>
          </View>

          {/* Checkout Button */}
          <TouchableOpacity
            style={styles.checkoutButtonStyle}
            onPress={onCheckout}
            activeOpacity={0.85}
          >
            <Ionicons name="arrow-forward" size={18} color={Colors.white} />
            <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    flexDirection: 'column',
  },
  shopeeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
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
  },
  shopeeProductCard: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  shopeeProductImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    overflow: 'hidden',
  },
  shopeeProductInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  shopeeProductName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 16,
  },
  shopeeRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  shopeeStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  shopeeRatingText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  pvBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.sky,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  pvBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
  },
  shopeePriceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  shopeePriceLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  shopeePriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  shopeePrice: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.sky,
  },
  shopeeOriginalPrice: {
    fontSize: 12,
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  discountTag: {
    backgroundColor: Colors.sky,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  discountTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
  },
  shopeeDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  shopeeSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  shopeeSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  shopeeSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  shopeeSectionRequired: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
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
    gap: 6,
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    minWidth: 75,
  },
  shopeeVariantOptionImage: {
    width: 55,
    height: 55,
    borderRadius: 6,
  },
  shopeeVariantOptionColor: {
    width: 55,
    height: 55,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  shopeeVariantOptionSelected: {
    borderColor: Colors.sky,
    backgroundColor: '#f0f9ff',
    borderWidth: 2,
  },
  shopeeVariantOptionText: {
    fontSize: 10,
    color: Colors.text,
    fontWeight: '500',
    textAlign: 'center',
  },
  shopeeStockLeft: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  shopeeQuantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
  },
  shopeeQuantityBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopeeQuantityInput: {
    flex: 1,
    height: 36,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  shopeePriceSummary: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  shopeePriceSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  shopeePriceSummaryLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  shopeePriceSummaryValue: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '600',
  },
  shopeeShippingText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  discountLabel: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '500',
  },
  discountValue: {
    fontSize: 13,
    color: '#ef4444',
    fontWeight: '600',
  },
  shopeeCheckoutFooterGradient: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: Colors.white,
  },
  checkoutTotalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkoutTotalLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  checkoutTotalPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.sky,
  },
  checkoutButtonStyle: {
    backgroundColor: Colors.sky,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
});
