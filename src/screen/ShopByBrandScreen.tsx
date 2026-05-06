import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Dimensions,
  Pressable,
  SafeAreaView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { productService, Product } from '../services/productService';
import ItemCard from '../components/Items/ItemCard';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import { API_CONFIG } from '../config/api';

const { width } = Dimensions.get('window');

const ROOMS = [
  { room_id: 1, slug: 'bedroom', room_name: 'Bedroom' },
  { room_id: 2, slug: 'kitchen', room_name: 'Kitchen' },
  { room_id: 3, slug: 'living-room', room_name: 'Living Room' },
  { room_id: 4, slug: 'outdoor', room_name: 'Outdoor' },
  { room_id: 5, slug: 'study-office-room', room_name: 'Study & Office' },
  { room_id: 6, slug: 'dining-room', room_name: 'Dining Room' },
  { room_id: 7, slug: 'laundry-room', room_name: 'Laundry Room' },
  { room_id: 8, slug: 'bathroom', room_name: 'Bathroom' },
];

interface BrandInfo {
  id: number;
  name: string;
  logo?: string;
  brand_image?: string;
  image?: string;
  total_products?: number;
}

interface ShopByBrandScreenProps {
  token?: string | null;
  user?: any;
  cartCount?: number;
  brandId?: number;
  brand?: BrandInfo;
  categories?: any[];
  onBack?: () => void;
  onProductPress?: (id: number) => void;
  onCartPress?: () => void;
  wishlistItems?: any[];
  onWishlistChange?: () => void;
}

export default function ShopByBrandScreen({
  token,
  user,
  cartCount = 0,
  brandId,
  brand,
  categories = [],
  onBack = () => {},
  onProductPress = () => {},
  onCartPress = () => {},
  wishlistItems = [],
  onWishlistChange = () => {},
}: ShopByBrandScreenProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const perPage = 20;
  const scrollViewRef = useRef<ScrollView>(null);

  const selectedRoom = useMemo(
    () => selectedRoomId ? ROOMS.find(r => r.room_id === selectedRoomId) : null,
    [selectedRoomId]
  );

  const masonryColumns = useMemo(() => {
    const leftColumn: Product[] = [];
    const rightColumn: Product[] = [];

    products.forEach((product, index) => {
      if (index % 2 === 0) {
        leftColumn.push(product);
      } else {
        rightColumn.push(product);
      }
    });

    return { leftColumn, rightColumn };
  }, [products]);

  const fetchProducts = useCallback(async (page: number = 1) => {
    if (!token || !brandId) return;

    try {
      setLoading(page === 1);
      const headers = { Authorization: `Bearer ${token}` };

      let url = `${API_CONFIG.BASE_URL}/products?status=1&page=${page}&per_page=${perPage}&brand_type=${brandId}`;
      if (selectedRoomId) url += `&room_type=${selectedRoomId}`;
      if (selectedCategoryId) url += `&cat_id=${selectedCategoryId}`;
      if (searchQuery.trim()) url += `&search=${encodeURIComponent(searchQuery)}`;

      const response = await axios.get(url, { headers });

      let data = response.data?.data || response.data?.products || [];
      if (!Array.isArray(data)) {
        data = [];
      }

      const total = response.data?.meta?.total || response.data?.total || response.data?.pagination?.total || data.length;
      const pages = Math.ceil(total / perPage);

      setProducts(data);
      setTotalProducts(total);
      setTotalPages(pages);
      setCurrentPage(page);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to load products',
        text2: error.message || 'Please try again',
      });
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, brandId, selectedRoomId, selectedCategoryId, searchQuery, perPage]);

  useEffect(() => {
    setCurrentPage(1);
    fetchProducts(1);
  }, [selectedRoomId, selectedCategoryId, searchQuery, fetchProducts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts(currentPage);
  };

  const handleRoomSelect = (roomId: number | null) => {
    setSelectedRoomId(roomId);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      fetchProducts(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      fetchProducts(currentPage - 1);
    }
  };

  const renderItem = (item: Product) => {
    const wishlistItem = wishlistItems?.find(w => w.product.id === item.id);
    const productCard = {
      id: item.id,
      name: item.name,
      image: item.image,
      soldCount: item.soldCount,
      originalPrice: item.priceSrp,
      memberPrice: item.priceMember,
      pv: item.prodpv,
      brandName: item.brand,
      variantCount: item.variants?.length ?? 0,
      badges: {
        musthave: item.musthave,
        bestseller: item.bestseller,
        salespromo: item.salespromo,
      },
    };

    return (
      <View key={`product-${item.id}`} style={styles.masonryItem}>
        <ItemCard
          product={productCard}
          token={token}
          onPress={(product) => onProductPress(product.id)}
          isWishlisted={!!wishlistItem}
          wishlistId={wishlistItem?.wishlist_id}
          onWishlistToggle={onWishlistChange}
        />
      </View>
    );
  };

  const getBrandLogo = () => {
    if (brand?.logo) return brand.logo;
    if (brand?.brand_image) return brand.brand_image;
    if (brand?.image) return brand.image;
    return null;
  };

  const getBrandInitial = () => {
    return brand?.name?.trim()?.charAt(0)?.toUpperCase() || '?';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Brand Header */}
      <View style={styles.brandHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>

        <View style={styles.brandInfo}>
          <View style={styles.brandLogoContainer}>
            {getBrandLogo() ? (
              <Image source={{ uri: getBrandLogo() }} style={styles.brandLogoImage} />
            ) : (
              <View style={styles.brandLogoFallback}>
                <Text style={styles.brandInitial}>{getBrandInitial()}</Text>
              </View>
            )}
          </View>
          <View style={styles.brandDetails}>
            <Text style={styles.brandName}>{brand?.name || 'Brand'}</Text>
            {brand?.total_products !== undefined && (
              <Text style={styles.brandProductCount}>{brand.total_products} products</Text>
            )}
          </View>
        </View>

        <TouchableOpacity onPress={onCartPress} style={styles.cartButton}>
          <Ionicons name="cart-outline" size={22} color={Colors.text} />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search Field */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={Colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search in brand..."
          placeholderTextColor={Colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedRoomId !== null && styles.filterButtonActive,
          ]}
          onPress={() => {
            if (selectedRoomId === null) {
              handleRoomSelect(1);
            } else {
              handleRoomSelect(null);
            }
          }}
        >
          <Text
            style={[
              styles.filterButtonText,
              selectedRoomId !== null && styles.filterButtonTextActive,
            ]}
          >
            {selectedRoom?.room_name || 'Room Type'}
          </Text>
          <Ionicons
            name={selectedRoomId !== null ? 'filter' : 'filter-outline'}
            size={14}
            color={selectedRoomId !== null ? Colors.white : Colors.text}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedCategoryId !== null && styles.filterButtonActive,
          ]}
          onPress={() => {
            if (selectedCategoryId === null) {
              setSelectedCategoryId(categories[0]?.id || null);
            } else {
              setSelectedCategoryId(null);
            }
          }}
        >
          <Text
            style={[
              styles.filterButtonText,
              selectedCategoryId !== null && styles.filterButtonTextActive,
            ]}
          >
            {selectedCategoryId ? categories.find(c => c.id === selectedCategoryId)?.name : 'Category'}
          </Text>
          <Ionicons
            name={selectedCategoryId !== null ? 'filter' : 'filter-outline'}
            size={14}
            color={selectedCategoryId !== null ? Colors.white : Colors.text}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* View Toggle */}
        <View style={styles.filterInfoContainer}>
          <TouchableOpacity
            style={[
              styles.viewToggleButton,
              viewType === 'grid' && styles.viewToggleButtonActive,
            ]}
            onPress={() => setViewType('grid')}
          >
            <Ionicons
              name="apps-outline"
              size={14}
              color={viewType === 'grid' ? Colors.white : Colors.text}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewToggleButton,
              viewType === 'list' && styles.viewToggleButtonActive,
            ]}
            onPress={() => setViewType('list')}
          >
            <Ionicons
              name="reader-outline"
              size={14}
              color={viewType === 'list' ? Colors.white : Colors.text}
            />
          </TouchableOpacity>

          <Text style={styles.productCountInfo}>
            {(currentPage - 1) * perPage + 1} - {Math.min(currentPage * perPage, totalProducts)} of {totalProducts}
          </Text>
        </View>

        {/* Products Grid */}
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.sky} />
            <Text style={styles.loadingText}>Loading products...</Text>
          </View>
        ) : products.length > 0 ? (
          <View style={styles.masonryGrid}>
            <View style={styles.masonryColumn}>
              {masonryColumns.leftColumn.map((product) => renderItem(product))}
            </View>
            <View style={styles.masonryColumn}>
              {masonryColumns.rightColumn.map((product) => renderItem(product))}
            </View>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No products found</Text>
          </View>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <View style={styles.paginationContainer}>
            <Pressable
              onPress={handlePreviousPage}
              disabled={currentPage === 1}
              style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color={currentPage === 1 ? Colors.textSecondary : Colors.sky}
              />
              <Text style={[styles.paginationButtonText, currentPage === 1 && styles.paginationButtonTextDisabled]}>
                Previous
              </Text>
            </Pressable>

            <View style={styles.pageInfo}>
              <Text style={styles.pageNumber}>
                Page {currentPage} of {totalPages}
              </Text>
            </View>

            <Pressable
              onPress={handleNextPage}
              disabled={currentPage >= totalPages}
              style={[styles.paginationButton, currentPage >= totalPages && styles.paginationButtonDisabled]}
            >
              <Text style={[styles.paginationButtonText, currentPage >= totalPages && styles.paginationButtonTextDisabled]}>
                Next
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={currentPage >= totalPages ? Colors.textSecondary : Colors.sky}
              />
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fbff',
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  brandInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandLogoContainer: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  brandLogoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  brandLogoFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.sky,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
  },
  brandDetails: {
    flex: 1,
  },
  brandName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  brandProductCount: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  cartButton: {
    padding: 8,
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.error,
    borderWidth: 1.5,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.white,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterButtonActive: {
    backgroundColor: Colors.sky,
    borderColor: Colors.sky,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  filterButtonTextActive: {
    color: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  filterInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 12,
    gap: 8,
  },
  viewToggleButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  viewToggleButtonActive: {
    backgroundColor: Colors.sky,
    borderColor: Colors.sky,
  },
  productCountInfo: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    textAlign: 'right',
  },
  masonryGrid: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 16,
  },
  masonryColumn: {
    flex: 1,
    gap: 8,
  },
  masonryItem: {
    width: '100%',
  },
  loadingContainer: {
    minHeight: 300,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    minHeight: 300,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fbff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    marginTop: 16,
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: Colors.sky,
  },
  paginationButtonDisabled: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
  },
  paginationButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.sky,
  },
  paginationButtonTextDisabled: {
    color: Colors.textSecondary,
  },
  pageInfo: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  pageNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
});
