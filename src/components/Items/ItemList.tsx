import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

export interface ItemListProps {
  wishlist_id: number;
  product_id: number;
  product: {
    id: number;
    name: string;
    brand: string;
    image: string;
    priceSrp: number;
    priceMember: number;
    avgRating: number;
    qty: number;
    prodpv: number;
    variants?: Array<{
      id: number;
      name: string;
      color?: string;
      size?: string;
    }>;
  };
  isSelected?: boolean;
  onProductPress?: (id: number) => void;
  onRemove?: (wishlistId: number) => void;
  onAddToCart?: (wishlistId: number) => void;
  onSelect?: (wishlistId: number) => void;
}

export default function ItemList({
  wishlist_id,
  product_id,
  product,
  isSelected = false,
  onProductPress,
  onRemove,
  onAddToCart,
  onSelect,
}: ItemListProps) {
  const discount = Math.round(
    ((product.priceSrp - product.priceMember) / product.priceSrp) * 100
  );
  const inStock = product.qty > 0;

  return (
    <View style={[styles.container, isSelected && styles.containerSelected]}>
      <TouchableOpacity
        style={styles.checkbox}
        onPress={() => onSelect?.(wishlist_id)}
        activeOpacity={0.7}
      >
        <View style={[styles.checkboxBox, isSelected && styles.checkboxBoxChecked]}>
          {isSelected && <Ionicons name="checkmark" size={14} color={Colors.white} />}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.contentWrapper}
        onPress={() => onProductPress?.(product.id)}
        activeOpacity={0.7}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: product.image }}
            style={styles.productImage}
          />
          {!inStock && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockText}>Out of Stock</Text>
            </View>
          )}
          {discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{discount}%</Text>
            </View>
          )}
        </View>

        <View style={styles.detailsContainer}>
          <Text style={styles.brand} numberOfLines={1}>
            {product.brand}
          </Text>
          <Text style={styles.productName} numberOfLines={2}>
            {product.name}
          </Text>

          <View style={styles.ratingRow}>
            <Ionicons name="star" size={12} color="#fbbf24" />
            <Text style={styles.rating}>{product.avgRating || 'No rating'}</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.memberPrice}>
              ₱{product.priceMember.toLocaleString()}
            </Text>
            <Text style={styles.srpPrice}>
              ₱{product.priceSrp.toLocaleString()}
            </Text>
          </View>

          <View style={styles.badgeRow}>
            <View style={styles.pvBadge}>
              <Ionicons name="trending-up" size={10} color={Colors.white} />
              <Text style={styles.pvText}>{product.prodpv} PV</Text>
            </View>
            {product.variants && product.variants.length > 0 && (
              <View style={styles.variantBadge}>
                <Text style={styles.variantText}>{product.variants.length} variants</Text>
              </View>
            )}
          </View>

          <View style={styles.stockRow}>
            <Text style={styles.stockText}>
              {inStock ? `${product.qty} available` : 'Out of Stock'}
            </Text>
          </View>

          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={[styles.button, styles.cartButton]}
              onPress={() => onAddToCart?.(wishlist_id)}
              activeOpacity={0.7}
            >
              <Ionicons name="cart-outline" size={14} color={Colors.white} />
              <Text style={styles.cartButtonText}>Add to Cart</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.removeButton]}
              onPress={() => onRemove?.(wishlist_id)}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={14} color={Colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 10,
    alignItems: 'flex-start',
    marginBottom: 1,
  },
  containerSelected: {
    backgroundColor: '#f0f7ff',
  },
  checkbox: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: Colors.sky,
    borderColor: Colors.sky,
  },
  contentWrapper: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
  },
  imageContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    flexShrink: 0,
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  outOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 11,
  },
  discountBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ef4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  detailsContainer: {
    flex: 1,
    gap: 5,
    justifyContent: 'space-between',
  },
  brand: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  productName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 16,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  rating: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
  },
  srpPrice: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    marginTop: 4,
  },
  pvBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.sky,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pvText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.white,
  },
  variantBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#ef4444',
  },
  variantText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.white,
  },
  stockRow: {
    marginTop: 2,
  },
  stockText: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 4,
  },
  cartButton: {
    flex: 1,
    backgroundColor: Colors.sky,
  },
  cartButtonText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  removeButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
  },
});
