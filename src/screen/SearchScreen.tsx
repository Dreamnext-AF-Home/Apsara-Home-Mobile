import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Animated, Dimensions, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { authService, SearchHistoryItem } from '../services/authService';
import Toast from 'react-native-toast-message';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface SearchScreenProps {
  onBack: () => void;
  token?: string | null;
}

function getHistoryLabel(item: SearchHistoryItem) {
  return item.query ?? item.term ?? item.keyword ?? item.name ?? '';
}

export default function SearchScreen({ onBack, token }: SearchScreenProps) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [savingQuery, setSavingQuery] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 240,
      useNativeDriver: true,
    }).start(() => inputRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!token) return;
    let active = true;
    setLoadingHistory(true);
    authService.getSearchHistory(token)
      .then(items => {
        if (!active) return;
        setHistory(items);
      })
      .catch(error => {
        if (!active) return;
        Toast.show({
          type: 'error',
          text1: 'Search history failed',
          text2: error.message || 'Unable to load search history.',
        });
      })
      .finally(() => {
        if (active) setLoadingHistory(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  const recentSearches = useMemo(() => {
    const seen = new Set<string>();
    const labels = history
      .map(getHistoryLabel)
      .map(label => label.trim())
      .filter(Boolean)
      .filter(label => {
        const normalized = label.toLowerCase();
        if (seen.has(normalized)) return false;
        seen.add(normalized);
        return true;
      });
    if (labels.length > 0) return labels.slice(0, 8);
    return ['sofa', 'dining table', 'bed frame', 'floor lamp', 'curtains'];
  }, [history]);

  function handleBack() {
    inputRef.current?.blur();
    Animated.timing(slideAnim, {
      toValue: SCREEN_WIDTH,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onBack());
  }

  async function submitSearch(term: string) {
    const next = term.trim();
    if (!next) return;
    setQuery(next);

    if (!token) {
      Toast.show({ type: 'error', text1: 'Search unavailable', text2: 'Please sign in again.' });
      return;
    }

    setSavingQuery(true);
    try {
      await authService.saveSearchHistory(token, next);
      setHistory(prev => {
        const normalized = prev.filter(item => getHistoryLabel(item).toLowerCase() !== next.toLowerCase());
        return [{ query: next }, ...normalized].slice(0, 8);
      });
      Toast.show({ type: 'success', text1: 'Search saved', text2: next });
      // Hook the actual product search here when the backend endpoint is available.
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Search failed',
        text2: error.message || 'Unable to save the search.',
      });
    } finally {
      setSavingQuery(false);
    }
  }

  const suggestions = query.length > 0
    ? [query, `${query} set`, `${query} modern`, `${query} on sale`]
    : [];

  return (
    <Animated.View
      style={[styles.root, { transform: [{ translateX: slideAnim }] }]}
    >
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>

        <View style={styles.searchWrapper}>
          <Ionicons name="search-outline" size={16} color={Colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => submitSearch(query)}
            placeholder="Search products..."
            placeholderTextColor={Colors.textSecondary}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity onPress={handleBack} style={styles.cancelBtn} activeOpacity={0.7}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {query.length === 0 && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Recent Searches</Text>
              {loadingHistory ? (
                <ActivityIndicator size="small" color={Colors.sky} />
              ) : null}
            </View>
            <View style={styles.tags}>
              {recentSearches.map(term => (
                <TouchableOpacity
                  key={`recent-${term.toLowerCase()}`}
                  style={styles.tag}
                  onPress={() => submitSearch(term)}
                  activeOpacity={0.7}
                  disabled={savingQuery}
                >
                  <Ionicons name="time-outline" size={13} color={Colors.textSecondary} />
                  <Text style={styles.tagText}>{term}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {suggestions.map(s => (
          <TouchableOpacity
            key={`suggestion-${s.toLowerCase()}`}
            style={styles.suggestionRow}
            activeOpacity={0.7}
            onPress={() => submitSearch(s)}
            disabled={savingQuery}
          >
            <Ionicons name="search-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.suggestionText}>{s}</Text>
            <Ionicons name="arrow-forward-outline" size={14} color="#d1d5db" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.white,
    zIndex: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: Colors.white,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    paddingVertical: 0,
  },
  cancelBtn: {
    paddingHorizontal: 4,
  },
  cancelText: {
    fontSize: 14,
    color: Colors.sky,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
    backgroundColor: '#f8fbff',
  },
  section: {
    padding: 16,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: Colors.white,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
});
