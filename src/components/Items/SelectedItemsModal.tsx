import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

interface SelectedItem {
  wishlist_id: number;
  product_id: number;
  product: {
    id: number;
    name: string;
    priceMember: number;
  };
}

interface SelectedItemsModalProps {
  visible: boolean;
  selectedItems: SelectedItem[];
  selectedCount: number;
  totalPrice: number;
  onClose: () => void;
  onAddToCart: () => void;
  loading?: boolean;
}

export default function SelectedItemsModal({
  visible,
  selectedItems,
  selectedCount,
  totalPrice,
  onClose,
  onAddToCart,
  loading = false,
}: SelectedItemsModalProps) {
  const slideAnim = React.useRef(new Animated.Value(300)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      />
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <Text style={styles.title}>Selected Items</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.summary}>
            <View>
              <Text style={styles.summaryLabel}>Total ({selectedCount} items)</Text>
              <Text style={styles.summaryPrice}>
                ₱{totalPrice.toLocaleString()}
              </Text>
            </View>
          </View>

          <View style={styles.itemsList}>
            {selectedItems.map((item) => (
              <View key={item.wishlist_id} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.product.name}
                  </Text>
                  <Text style={styles.itemPrice}>
                    ₱{item.product.priceMember.toLocaleString()}
                  </Text>
                </View>
                <Ionicons name="checkmark-circle" size={20} color={Colors.sky} />
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.addButton, loading && { opacity: 0.6 }]}
            onPress={onAddToCart}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Ionicons name="cart-outline" size={18} color={Colors.white} />
            <Text style={styles.addButtonText}>Add All to Cart</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    minHeight: 300,
    maxHeight: '70%',
  },
  safeArea: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  summary: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  summaryPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  itemsList: {
    flex: 1,
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  itemInfo: {
    flex: 1,
    gap: 4,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  itemPrice: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  addButton: {
    backgroundColor: Colors.sky,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
});
