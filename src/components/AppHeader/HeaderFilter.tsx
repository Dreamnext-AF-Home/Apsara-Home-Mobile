import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

interface HeaderFilterProps {
  onFilterChange?: (filterType: string, value: any) => void;
}

const SORT_OPTIONS = ['Relevant', 'Price: Low', 'Price: High', 'Newest'];
const PRICE_OPTIONS = ['All', 'Under ₱5k', '₱5k-₱20k', '₱20k-₱50k', 'Over ₱50k'];
const CATEGORY_OPTIONS = ['All', 'Bedroom', 'Kitchen', 'Living Room', 'Outdoor', 'Office'];

export default function HeaderFilter({ onFilterChange }: HeaderFilterProps) {
  const [activeSort, setActiveSort] = useState('Relevant');
  const [activePrice, setActivePrice] = useState('All');
  const [activeCategory, setActiveCategory] = useState('All');
  const [expandedFilter, setExpandedFilter] = useState<string | null>(null);

  const handleSort = (sort: string) => {
    setActiveSort(sort);
    setExpandedFilter(null);
    onFilterChange?.('sort', sort);
  };

  const handlePrice = (price: string) => {
    setActivePrice(price);
    setExpandedFilter(null);
    onFilterChange?.('price', price);
  };

  const handleCategory = (category: string) => {
    setActiveCategory(category);
    setExpandedFilter(null);
    onFilterChange?.('category', category);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Sort */}
        <View style={styles.filterItem}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              expandedFilter === 'sort' && styles.filterButtonActive,
            ]}
            onPress={() => setExpandedFilter(expandedFilter === 'sort' ? null : 'sort')}
          >
            <Ionicons name="swap-vertical" size={14} color={Colors.text} />
            <Text style={styles.filterText}>{activeSort}</Text>
            <Ionicons
              name={expandedFilter === 'sort' ? 'chevron-up' : 'chevron-down'}
              size={12}
              color={Colors.text}
            />
          </TouchableOpacity>

          {expandedFilter === 'sort' && (
            <View style={styles.dropdown}>
              {SORT_OPTIONS.map((sort) => (
                <TouchableOpacity
                  key={sort}
                  style={[
                    styles.dropdownItem,
                    activeSort === sort && styles.dropdownItemActive,
                  ]}
                  onPress={() => handleSort(sort)}
                >
                  <Text
                    style={[
                      styles.dropdownText,
                      activeSort === sort && styles.dropdownTextActive,
                    ]}
                  >
                    {sort}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Price */}
        <View style={styles.filterItem}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              expandedFilter === 'price' && styles.filterButtonActive,
            ]}
            onPress={() => setExpandedFilter(expandedFilter === 'price' ? null : 'price')}
          >
            <Ionicons name="pricetag-outline" size={14} color={Colors.text} />
            <Text style={styles.filterText}>{activePrice}</Text>
            <Ionicons
              name={expandedFilter === 'price' ? 'chevron-up' : 'chevron-down'}
              size={12}
              color={Colors.text}
            />
          </TouchableOpacity>

          {expandedFilter === 'price' && (
            <View style={styles.dropdown}>
              {PRICE_OPTIONS.map((price) => (
                <TouchableOpacity
                  key={price}
                  style={[
                    styles.dropdownItem,
                    activePrice === price && styles.dropdownItemActive,
                  ]}
                  onPress={() => handlePrice(price)}
                >
                  <Text
                    style={[
                      styles.dropdownText,
                      activePrice === price && styles.dropdownTextActive,
                    ]}
                  >
                    {price}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Category */}
        <View style={styles.filterItem}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              expandedFilter === 'category' && styles.filterButtonActive,
            ]}
            onPress={() =>
              setExpandedFilter(expandedFilter === 'category' ? null : 'category')
            }
          >
            <Ionicons name="grid-outline" size={14} color={Colors.text} />
            <Text style={styles.filterText}>{activeCategory}</Text>
            <Ionicons
              name={expandedFilter === 'category' ? 'chevron-up' : 'chevron-down'}
              size={12}
              color={Colors.text}
            />
          </TouchableOpacity>

          {expandedFilter === 'category' && (
            <View style={[styles.dropdown, styles.dropdownWide]}>
              {CATEGORY_OPTIONS.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.dropdownItem,
                    activeCategory === category && styles.dropdownItemActive,
                  ]}
                  onPress={() => handleCategory(category)}
                >
                  <Text
                    style={[
                      styles.dropdownText,
                      activeCategory === category && styles.dropdownTextActive,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 8,
    gap: 8,
    alignItems: 'center',
  },
  filterItem: {
    position: 'relative',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterButtonActive: {
    backgroundColor: '#eff6ff',
    borderColor: Colors.sky,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    maxWidth: 80,
  },
  dropdown: {
    position: 'absolute',
    top: 42,
    left: 0,
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 140,
    zIndex: 1000,
  },
  dropdownWide: {
    minWidth: 160,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dropdownItemActive: {
    backgroundColor: '#eff6ff',
  },
  dropdownText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text,
  },
  dropdownTextActive: {
    color: Colors.sky,
    fontWeight: '700',
  },
});
