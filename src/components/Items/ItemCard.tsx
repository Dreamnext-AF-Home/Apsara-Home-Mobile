import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';
import type { ProductCard } from '../../services/productService';

interface ItemCardProps {
  product: ProductCard;
  onPress?: (product: ProductCard) => void;
  showMemberPrice?: boolean;
}

const BADGE_CONFIG = [
  { key: 'musthave',   label: 'Must Have',  bg: ['#f97316', '#ea580c'] as const, icon: 'heart'     as const },
  { key: 'bestseller', label: 'Bestseller', bg: ['#d4a017', '#b8860b'] as const, icon: 'flame'     as const },
  { key: 'salespromo', label: 'On Sale',    bg: [Colors.forest, '#1e4236'] as const, icon: 'flash' as const },
] as const;

export default function ItemCard({
  product,
  onPress,
  showMemberPrice = false,
}: ItemCardProps) {
  const hasDiscount = product.discountedPrice < product.originalPrice;
  const displayPrice = product.discountedPrice;
  const discountPct = hasDiscount
    ? Math.round(((product.originalPrice - product.discountedPrice) / product.originalPrice) * 100)
    : 0;

  const activeBadges = BADGE_CONFIG.filter(b => product.badges[b.key]);

  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress?.(product)} activeOpacity={0.8}>

      {/* Image */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: product.image }} style={styles.productImage} resizeMode="cover" />

        {/* Top-left: Enjoy X% ribbon */}
        {hasDiscount && (
          <View style={styles.enjoyBadge}>
            <Ionicons name="pricetag" size={10} color={Colors.white} />
            <Text style={styles.enjoyBadgeText}>Enjoy {discountPct}% OFF</Text>
          </View>
        )}
      </View>

      {/* Border Below Image */}
      <View style={styles.imageBorder} />

      {/* Info */}
      <View style={styles.infoContainer}>

        {hasDiscount && (
          <LinearGradient
            colors={['transparent', Colors.sky + '20']}
            style={styles.detailsGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
        )}

        {/* Brand + Sold Count */}
        <View style={styles.brandRow}>
          <Text style={styles.brandText} numberOfLines={1}>{product.brandName}</Text>
          {product.soldCount > 0 && (
            <View style={styles.soldRow}>
              <Ionicons name="bag-check-outline" size={10} color={Colors.textSecondary} />
              <Text style={styles.soldCountText}>{product.soldCount} sold</Text>
            </View>
          )}
        </View>

        {/* Product Name */}
        <Text style={styles.productName} numberOfLines={2} ellipsizeMode="tail">
          {product.name}
        </Text>

        {/* Badges Row */}
        <View style={styles.badgesRow}>

          {/* PV badge */}
          <LinearGradient
            colors={[Colors.sky, Colors.skyDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.badge}
          >
            <Ionicons name="star" size={9} color={Colors.white} />
            <Text style={styles.badgeLabel}>PV {product.pv}</Text>
          </LinearGradient>

          {/* Product badges */}
          {activeBadges.map(b => (
            <LinearGradient
              key={b.key}
              colors={b.bg}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.badge}
            >
              <Ionicons name={b.icon} size={9} color={Colors.white} />
              <Text style={styles.badgeLabel}>{b.label}</Text>
            </LinearGradient>
          ))}

          {/* Variants badge */}
          {product.variantCount > 0 && (
            <LinearGradient
              colors={['#8b5cf6', '#7c3aed']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.badge}
            >
              <Ionicons name="layers" size={9} color={Colors.white} />
              <Text style={styles.badgeLabel}>{product.variantCount} variants</Text>
            </LinearGradient>
          )}
        </View>

        {/* Price */}
        <View style={styles.priceRow}>
          <Text style={styles.currentPrice}>₱{displayPrice.toLocaleString()}</Text>
          {hasDiscount && (
            <Text style={styles.originalPrice}>₱{product.originalPrice.toLocaleString()}</Text>
          )}
        </View>

      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    width: '100%',
    alignSelf: 'flex-start',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  enjoyBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: Colors.sky,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderBottomRightRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  enjoyBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  imageBorder: {
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  infoContainer: {
    padding: 12,
    gap: 6,
  },
  detailsGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  soldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  soldCountText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 18,
    flexShrink: 1,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
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
    gap: 8,
    marginTop: 2,
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.sky,
  },
  originalPrice: {
    fontSize: 13,
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
});
