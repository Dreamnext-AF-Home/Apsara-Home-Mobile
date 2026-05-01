import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import type { Product } from '../../services/productService';

interface ItemCardProps {
  product: Product;
  onPress?: (product: Product) => void;
  showMemberPrice?: boolean;
}

export default function ItemCard({ 
  product, 
  onPress, 
  showMemberPrice = false 
}: ItemCardProps) {
  const displayPrice = showMemberPrice ? product.priceMember : product.priceSrp;
  const hasDiscount = product.priceMember < product.priceSrp;
  const hasVariants = product.variants && product.variants.length > 1;
  const inStock = product.qty > 0;

  const handlePress = () => {
    if (onPress) {
      onPress(product);
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      {/* Product Image */}
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: product.image }} 
          style={styles.productImage}
          resizeMode="cover"
        />
        
        {/* Stock Status Badge */}
        {!inStock && (
          <View style={styles.outOfStockBadge}>
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        )}

        {/* Bestseller Badge */}
        {product.soldCount > 10 && (
          <View style={styles.bestsellerBadge}>
            <Ionicons name="flame" size={12} color={Colors.white} />
            <Text style={styles.bestsellerText}>Bestseller</Text>
          </View>
        )}
      </View>

      {/* Border Below Image */}
      <View style={styles.imageBorder} />

      {/* Product Info */}
      <View style={styles.infoContainer}>
        {/* Brand */}
        <Text style={styles.brandText} numberOfLines={1}>
          {product.brand}
        </Text>

        {/* Product Name */}
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>

        {/* Rating and Sold Count */}
        <View style={styles.ratingContainer}>
          <View style={styles.ratingLeft}>
            <Ionicons name="star" size={12} color={Colors.brass} />
            <Text style={styles.ratingText}>
              {product.avgRating.toFixed(1)}
            </Text>
            {product.soldCount > 0 && (
              <Text style={styles.soldCountText}>
                ({product.soldCount} sold)
              </Text>
            )}
          </View>
        </View>

        {/* Price Section */}
        <View style={styles.priceContainer}>
          <View style={styles.priceRow}>
            <Text style={styles.currentPrice}>
              ₱{displayPrice.toLocaleString()}
            </Text>
            
            {hasDiscount && (
              <Text style={styles.originalPrice}>
                ₱{product.priceSrp.toLocaleString()}
              </Text>
            )}
          </View>
        </View>

        {/* PV Section */}
        <View style={styles.pvSection}>
          <Text style={styles.pvTextInfo}>{product.prodpv} PV</Text>
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
  outOfStockBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  outOfStockText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  bestsellerBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.brass,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  bestsellerText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  pvBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  pvText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  discountTopBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#22c55e',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  discountTopText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  infoContainer: {
    padding: 12,
    gap: 6,
  },
  brandText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 18,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '500',
  },
  soldCountText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  variantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  variantsText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  priceContainer: {
    gap: 4,
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
  discountBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#ef4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  discountText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  imageBorder: {
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  pvSection: {
    backgroundColor: '#f0f9ff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 4,
    borderRadius: 6,
  },
  pvTextInfo: {
    fontSize: 12,
    color: Colors.sky,
    fontWeight: '600',
    textAlign: 'center',
  },
  dpText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  skuText: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  warrantyText: {
    fontSize: 10,
    color: Colors.forest,
    fontWeight: '500',
  },
});