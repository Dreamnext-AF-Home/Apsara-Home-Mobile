import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import type { ProductCard } from '../../services/productService';

interface ItemCardProps {
  product: ProductCard;
  onPress?: (product: ProductCard) => void;
  showMemberPrice?: boolean;
}

const BADGE_CONFIG = [
  { key: 'musthave',   label: 'Must Have',  color: '#f97316',    icon: 'heart'        },
  { key: 'bestseller', label: 'Bestseller', color: Colors.brass, icon: 'flame'        },
  { key: 'salespromo', label: 'Sale',       color: Colors.forest, icon: 'pricetag'   },
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

        {/* Brand + Sold Count */}
        <View style={styles.brandRow}>
          <Text style={styles.brandText} numberOfLines={1}>{product.brandName}</Text>
          {product.soldCount > 0 && (
            <Text style={styles.soldCountText}>{product.soldCount} sold</Text>
          )}
        </View>

        {/* Product Name */}
        <Text style={styles.productName} numberOfLines={2} ellipsizeMode="tail">
          {product.name}
        </Text>

        {/* Badges Row: PV + product badges + variants */}
        <View style={styles.badgesRow}>
          <View style={[styles.badge, { borderColor: Colors.sky }]}>
            <View style={[styles.badgeIconWrap, { backgroundColor: Colors.sky }]}>
              <Ionicons name="star" size={9} color={Colors.white} />
            </View>
            <Text style={[styles.badgeText, { color: Colors.sky }]}>PV {product.pv}</Text>
          </View>
          {activeBadges.map(b => (
            <View key={b.key} style={[styles.badge, { borderColor: b.color }]}>
              <View style={[styles.badgeIconWrap, { backgroundColor: b.color }]}>
                <Ionicons name={b.icon} size={9} color={Colors.white} />
              </View>
              <Text style={[styles.badgeText, { color: b.color }]}>{b.label}</Text>
            </View>
          ))}
          {product.variantCount > 0 && (
            <View style={[styles.badge, { borderColor: '#7c3aed' }]}>
              <View style={[styles.badgeIconWrap, { backgroundColor: '#7c3aed' }]}>
                <Ionicons name="layers" size={9} color={Colors.white} />
              </View>
              <Text style={[styles.badgeText, { color: '#7c3aed' }]}>{product.variantCount} variants</Text>
            </View>
          )}
        </View>

        {/* Price */}
        <View style={styles.priceContainer}>
          <View style={styles.priceRow}>
            <Text style={styles.currentPrice}>₱{displayPrice.toLocaleString()}</Text>
            {hasDiscount && (
              <Text style={styles.originalPrice}>₱{product.originalPrice.toLocaleString()}</Text>
            )}
          </View>
        </View>

      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
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
  priceContainer: {
    backgroundColor: Colors.white,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 6,
    borderWidth: 1,
    overflow: 'hidden',
  },
  badgeIconWrap: {
    paddingHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.2,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
});
