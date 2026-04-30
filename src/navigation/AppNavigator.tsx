import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Pressable, StyleSheet, SafeAreaView, Modal, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

type TabKey = 'home' | 'wishlist' | 'shop' | 'cart' | 'profile';

const TABS: TabKey[] = ['home', 'wishlist', 'shop', 'cart', 'profile'];

export default function AppNavigator() {
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [menuVisible, setMenuVisible] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > Math.abs(g.dy) && Math.abs(g.dx) > 12,
      onPanResponderRelease: (_, g) => {
        if (g.dx < -50) {
          setActiveTab(prev => {
            const i = TABS.indexOf(prev);
            return i < TABS.length - 1 ? TABS[i + 1] : prev;
          });
        } else if (g.dx > 50) {
          setActiveTab(prev => {
            const i = TABS.indexOf(prev);
            return i > 0 ? TABS[i - 1] : prev;
          });
        }
      },
    })
  ).current;

  const labelMap: Record<TabKey, string> = {
    home: 'Home',
    wishlist: 'Wishlist',
    shop: 'Shop',
    cart: 'Cart',
    profile: 'Me',
  };

  const iconActive: Record<TabKey, keyof typeof Ionicons.glyphMap> = {
    home: 'home',
    wishlist: 'heart',
    shop: 'storefront',
    cart: 'cart',
    profile: 'person',
  };

  const iconInactive: Record<TabKey, keyof typeof Ionicons.glyphMap> = {
    home: 'home-outline',
    wishlist: 'heart-outline',
    shop: 'storefront-outline',
    cart: 'cart-outline',
    profile: 'person-outline',
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerIcon} onPress={() => setMenuVisible(true)}>
            <Ionicons name="menu-outline" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{labelMap[activeTab]}</Text>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="notifications-outline" size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.content} {...panResponder.panHandlers}>
          <Text style={styles.h1}>{labelMap[activeTab]}</Text>
          <Text style={styles.body}>This is the {labelMap[activeTab].toLowerCase()} page.</Text>
        </View>

        <View style={styles.navBar}>
          {TABS.map(key => {
            const active = activeTab === key;

            if (key === 'shop') {
              return (
                <Pressable key={key} style={styles.shopItem} onPress={() => setActiveTab(key)}>
                  <View style={styles.shopSlot}>
                    <View style={[styles.shopDiamond, active && styles.shopDiamondActive]}>
                      <View style={styles.shopDiamondInner}>
                        <Ionicons
                          name={active ? iconActive[key] : iconInactive[key]}
                          size={22}
                          color={Colors.white}
                        />
                      </View>
                    </View>
                  </View>
                  <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                    {labelMap[key]}
                  </Text>
                </Pressable>
              );
            }

            if (key === 'profile') {
              return (
                <Pressable key={key} style={styles.navItem} onPress={() => setActiveTab(key)}>
                  <View style={styles.indicator}>
                    {active && <View style={styles.indicatorLine} />}
                  </View>
                  <View style={[styles.avatar, active && styles.avatarActive]}>
                    <Ionicons name="person" size={14} color={active ? Colors.sky : Colors.textSecondary} />
                  </View>
                  <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                    {labelMap[key]}
                  </Text>
                </Pressable>
              );
            }

            return (
              <Pressable key={key} style={styles.navItem} onPress={() => setActiveTab(key)}>
                <View style={styles.indicator}>
                  {active && <View style={styles.indicatorLine} />}
                </View>
                <Ionicons
                  name={active ? iconActive[key] : iconInactive[key]}
                  size={24}
                  color={active ? Colors.sky : Colors.textSecondary}
                />
                <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                  {labelMap[key]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
          <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setMenuVisible(false)}>
            <View style={styles.menuPanel}>
              <Text style={styles.menuTitle}>Menu</Text>
              {TABS.map(item => (
                <TouchableOpacity
                  key={item}
                  style={styles.menuItem}
                  onPress={() => {
                    setActiveTab(item);
                    setMenuVisible(false);
                  }}
                >
                  <Text style={styles.menuText}>{labelMap[item]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fbff' },
  safe: { flex: 1, backgroundColor: '#f8fbff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: '#f8fbff',
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  headerTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  h1: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '900',
    color: Colors.text,
    marginBottom: 10,
  },
  body: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingBottom: 8,
    overflow: 'visible',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 4,
    paddingBottom: 4,
  },
  indicator: {
    height: 3,
    width: '100%',
    alignItems: 'center',
    marginBottom: 6,
  },
  indicatorLine: {
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.sky,
  },
  navLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  navLabelActive: {
    color: Colors.sky,
    fontWeight: '700',
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarActive: {
    borderColor: Colors.sky,
    backgroundColor: '#e0f2fe',
  },
  shopItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 4,
    paddingBottom: 4,
  },
  shopSlot: {
    height: 33,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'visible',
  },
  shopDiamond: {
    width: 48,
    height: 48,
    backgroundColor: Colors.sky,
    transform: [{ rotate: '45deg' }],
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    shadowColor: Colors.sky,
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  shopDiamondActive: {
    backgroundColor: Colors.skyDark,
  },
  shopDiamondInner: {
    transform: [{ rotate: '-45deg' }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-start',
  },
  menuPanel: {
    width: '78%',
    maxWidth: 320,
    backgroundColor: Colors.white,
    padding: 18,
    paddingTop: 36,
    borderBottomRightRadius: 24,
    borderTopRightRadius: 24,
    minHeight: '100%',
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.white,
    marginBottom: 12,
  },
  menuItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2b2f38',
  },
  menuText: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '700',
  },
});
