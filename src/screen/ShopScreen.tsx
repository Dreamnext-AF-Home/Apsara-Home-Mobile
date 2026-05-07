import React, { useEffect, useState, useCallback, useMemo, useRef, memo } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  Dimensions,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { productService, Product } from '../services/productService';
import ItemCard from '../components/Items/ItemCard';
import AppHeader from '../components/AppHeader/AppHeader';
import Toast from 'react-native-toast-message';
import { useOptimizedProducts } from '../hooks/useOptimizedProducts';
import { Skeleton } from '../components/SkeletonLoader/SkeletonLoader';

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

interface ShopScreenProps {
  token?: string | null;
  user?: any;
  cartCount?: number;
  roomId?: number | null;
  categoryId?: number | null;
  brandId?: number | null;
  categories?: any[];
  brands?: any[];
  onBack?: () => void;
  onProductPress?: (id: number) => void;
  onCartPress?: () => void;
  onOpenSearch?: () => void;
  wishlistItems?: any[];
  onWishlistChange?: () => void;
}

function ShopScreen({
  token,
  user,
  cartCount = 0,
  roomId = null,
  categoryId = null,
  brandId = null,
  categories = [],
  brands = [],
  onBack = () => {},
  onProductPress = () => {},
  onCartPress = () => {},
  onOpenSearch = () => {},
  wishlistItems = [],
  onWishlistChange = () => {},
}: ShopScreenProps) {
  const shopScreenLoadStartRef = useRef(Date.now());
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    console.log('🛍️ ShopScreen MOUNTED');
  }, []);

  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(roomId);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(categoryId);
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(brandId);
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const prefetchedPageRef = useRef(2);

  const selectedRoom = useMemo(
    () => selectedRoomId ? ROOMS.find(r => r.room_id === selectedRoomId) : null,
    [selectedRoomId]
  );

  const {
    data,
    isLoading,
    isError,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
    isTransitioning,
  } = useOptimizedProducts({
    token,
    roomId: selectedRoomId,
    categoryId: selectedCategoryId,
    brandId: selectedBrandId,
  });

  // Scroll to top when page changes
  useEffect(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [currentPage]);

  // Background prefetch ONLY the next page (not multiple pages)
  useEffect(() => {
    if (!data?.pages) return;

    const lastPage = data.pages[data.pages.length - 1];
    const totalPages = lastPage?.totalPages || 0;

    // Only prefetch if the next page hasn't been fetched yet AND it exists
    if (currentPage + 1 <= totalPages && data.pages.length <= currentPage) {
      console.log(`🔮 Prefetching page ${currentPage + 1}...`);
      prefetchedPageRef.current = currentPage + 1;
      fetchNextPage();
    }
  }, [currentPage, data, fetchNextPage]);

  const handleRoomSelect = useCallback((roomId: number | null) => {
    setSelectedRoomId(roomId);
    setCurrentPage(1);
    prefetchedPageRef.current = 2;
    console.log(`🏠 Room filter changed to: ${roomId}`);
  }, []);

  const handleCategorySelect = useCallback((categoryId: number | null) => {
    setSelectedCategoryId(categoryId);
    setCurrentPage(1);
    prefetchedPageRef.current = 2;
    console.log(`📂 Category filter changed to: ${categoryId}`);
  }, []);

  const handleBrandSelect = useCallback((brandId: number | null) => {
    setSelectedBrandId(brandId);
    setCurrentPage(1);
    prefetchedPageRef.current = 2;
    console.log(`🏷️ Brand filter changed to: ${brandId}`);
  }, []);

  // Get products from current page only
  const currentPageProducts = useMemo(() => {
    const products = data?.pages?.[currentPage - 1]?.products || [];
    if (products.length > 0) {
      const loadTime = Date.now() - shopScreenLoadStartRef.current;
      console.log(`⚡ ShopScreen READY: ${products.length} products (page ${currentPage}) loaded in ${loadTime}ms`);
    }
    return products;
  }, [data?.pages, currentPage]);

  // Get pagination info
  const paginationInfo = useMemo(() => {
    if (!data?.pages?.length) {
      return { currentPage: 0, totalPages: 0, total: 0, startProduct: 0, endProduct: 0 };
    }
    const lastPage = data.pages[data.pages.length - 1];
    const total = lastPage.total;
    const startProduct = ((currentPage - 1) * 20) + 1;
    const endProduct = Math.min(currentPage * 20, total);
    return {
      currentPage,
      totalPages: lastPage.totalPages,
      total,
      startProduct,
      endProduct,
    };
  }, [data, currentPage]);

  // Prepare data for masonry layout
  const masonryData = useMemo(() => {
    const leftColumn: Product[] = [];
    const rightColumn: Product[] = [];

    currentPageProducts.forEach((product, index) => {
      if (index % 2 === 0) {
        leftColumn.push(product);
      } else {
        rightColumn.push(product);
      }
    });

    return { leftColumn, rightColumn };
  }, [currentPageProducts]);

  const handleRefresh = useCallback(() => {
    setCurrentPage(1);
    prefetchedPageRef.current = 2;
    refetch();
  }, [refetch]);

  const handleNextPage = useCallback(() => {
    if (currentPage < paginationInfo.totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, paginationInfo.totalPages]);

  const handlePreviousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

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
      <View style={styles.masonryItem}>
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

  const renderLoadingPlaceholders = () => (
    <View style={styles.masonryGrid}>
      <View style={styles.masonryColumn}>
        <Skeleton width="100%" height={220} borderRadius={8} />
        <Skeleton width="100%" height={260} borderRadius={8} style={{ marginTop: 8 }} />
        <Skeleton width="100%" height={240} borderRadius={8} style={{ marginTop: 8 }} />
      </View>
      <View style={styles.masonryColumn}>
        <Skeleton width="100%" height={260} borderRadius={8} />
        <Skeleton width="100%" height={220} borderRadius={8} style={{ marginTop: 8 }} />
        <Skeleton width="100%" height={250} borderRadius={8} style={{ marginTop: 8 }} />
      </View>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.filterInfoContainer}>
      <View style={styles.viewToggleWrapper}>
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
          <Text
            style={[
              styles.viewToggleText,
              viewType === 'grid' && styles.viewToggleTextActive,
            ]}
          >
            Card
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.viewToggleButton,
            styles.viewToggleButtonLast,
            viewType === 'list' && styles.viewToggleButtonActive,
          ]}
          onPress={() => setViewType('list')}
        >
          <Ionicons
            name="reader-outline"
            size={14}
            color={viewType === 'list' ? Colors.white : Colors.text}
          />
          <Text
            style={[
              styles.viewToggleText,
              viewType === 'list' && styles.viewToggleTextActive,
            ]}
          >
            List
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.productCountContainer}>
        <Text style={styles.productCountInfo}>
          {paginationInfo.startProduct} to {paginationInfo.endProduct} of {paginationInfo.total} products
        </Text>
        {isTransitioning && (
          <ActivityIndicator size="small" color={Colors.sky} style={styles.filterLoadingIndicator} />
        )}
      </View>
    </View>
  );

  const renderContent = () => {
    if (currentPageProducts.length === 0 && isLoading) {
      return renderLoadingPlaceholders();
    }

    if (currentPageProducts.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="cube-outline" size={48} color={Colors.textSecondary} />
          <Text style={styles.emptyText}>No products found</Text>
        </View>
      );
    }

    return (
      <View style={styles.masonryGrid}>
        <View style={styles.masonryColumn}>
          {masonryData.leftColumn.map((product) => (
            <View key={`left-${product.id}`} style={styles.masonryItem}>
              {renderItem(product)}
            </View>
          ))}
        </View>
        <View style={styles.masonryColumn}>
          {masonryData.rightColumn.map((product) => (
            <View key={`right-${product.id}`} style={styles.masonryItem}>
              {renderItem(product)}
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderFooter = () => {
    if (currentPageProducts.length === 0) return null;

    return (
      <View style={styles.paginationContainer}>
        <Pressable
          onPress={handlePreviousPage}
          disabled={currentPage === 1}
          style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
        >
          <Ionicons name="chevron-back" size={18} color={currentPage === 1 ? Colors.textSecondary : Colors.sky} />
          <Text style={[styles.paginationText, currentPage === 1 && styles.paginationTextDisabled]}>Prev</Text>
        </Pressable>

        <Text style={styles.paginationInfo}>
          {paginationInfo.currentPage} / {paginationInfo.totalPages}
        </Text>

        <Pressable
          onPress={handleNextPage}
          disabled={currentPage >= paginationInfo.totalPages}
          style={[styles.paginationButton, currentPage >= paginationInfo.totalPages && styles.paginationButtonDisabled]}
        >
          <Text style={[styles.paginationText, currentPage >= paginationInfo.totalPages && styles.paginationTextDisabled]}>
            Next
          </Text>
          <Ionicons name="chevron-forward" size={18} color={currentPage >= paginationInfo.totalPages ? Colors.textSecondary : Colors.sky} />
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <AppHeader
        user={user}
        cartCount={cartCount}
        onCartPress={onCartPress}
        onCameraPress={() => console.log('Camera pressed')}
        onSearchPress={onOpenSearch}
        onProfilePress={() => console.log('Profile pressed')}
        showRoomFilter={true}
        selectedRoom={selectedRoom?.room_name || 'All Room Types'}
        showCategoryFilter={true}
        selectedCategory={selectedCategoryId ? categories.find(c => c.id === selectedCategoryId)?.name : 'All Categories'}
        categories={categories}
        showBrandFilter={true}
        selectedBrand={selectedBrandId ? brands.find(b => b.id === selectedBrandId)?.name : 'All Brands'}
        brands={brands}
        onRoomFilterChange={(filterType, value) => {
          if (filterType === 'room') {
            handleRoomSelect(value === 'All Room Types' ? null : ROOMS.find(r => r.room_name === value)?.room_id || null);
          }
          if (filterType === 'category') {
            handleCategorySelect(value || null);
          }
          if (filterType === 'brand') {
            handleBrandSelect(value || null);
          }
        }}
      />

      <FlatList
        ref={flatListRef}
        style={styles.flatList}
        contentContainerStyle={styles.flatListContent}
        data={[{ type: 'header' }, { type: 'content' }, { type: 'footer' }]}
        renderItem={({ item }) => {
          if (item.type === 'header') return renderHeader();
          if (item.type === 'content') return renderContent();
          if (item.type === 'footer') return renderFooter();
          return null;
        }}
        keyExtractor={(item, index) => `${item.type}-${index}`}
        scrollEnabled={true}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

export default memo(ShopScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  flatList: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  flatListContent: {
    paddingBottom: 12,
    backgroundColor: Colors.white,
  },
  filterInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    paddingHorizontal: 8,
    paddingVertical: 12,
    gap: 8,
  },
  viewToggleWrapper: {
    flexDirection: 'row',
    gap: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  viewToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRightWidth: 0,
    backgroundColor: 'transparent',
  },
  viewToggleButtonActive: {
    backgroundColor: Colors.sky,
  },
  viewToggleButtonLast: {
    borderRightWidth: 0,
  },
  viewToggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text,
  },
  viewToggleTextActive: {
    color: Colors.white,
  },
  productCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  productCountInfo: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  filterLoadingIndicator: {
    marginLeft: 4,
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
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
    borderColor: '#d1d5db',
  },
  paginationText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.sky,
  },
  paginationTextDisabled: {
    color: Colors.textSecondary,
  },
  paginationInfo: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
});
