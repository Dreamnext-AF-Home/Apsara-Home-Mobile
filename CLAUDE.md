# CLAUDE.md — Agent Instructions for Apsara Home Mobile

> **Read this file first before making any changes to the codebase.**

---

## Project Identity

- **App**: AF Home (`com.afhome.mobile`) — Philippine e-commerce + MLM affiliate mobile app
- **Framework**: React Native 0.81 + Expo SDK 54
- **Language**: TypeScript
- **Backend**: `https://backend.afhome.ph/api` (Laravel)
- **Search**: Meilisearch at `https://search.afhome.ph`
- **Real-time**: Pusher (WebSocket, private channels per user)
- **Push**: Firebase Cloud Messaging + OneSignal

---

## Project Documentation

Before doing deep research on the codebase, read these docs in `docs/guide.md` for reference links:

| Document        | Covers                                            |
| --------------- | ------------------------------------------------- |
| `docs/guide.md` | Overview index linking to all documentation below |

The detailed documentation artifacts were generated and live in the conversation artifacts directory. Key reference docs:

- **01-project-overview.md** — Tech stack, folder structure, high-level flow
- **02-screens-guide.md** — All 53 screens explained (what/why)
- **03-api-reference.md** — All 60+ API endpoints (method, path, payload, response)
- **04-architecture-deep-dive.md** — Services, hooks, state management, data flow

---

## Architecture Overview

```
App.tsx (root)
├── LoadingScreen               (checking SecureStore for saved auth)
├── OnboardingScreen            (first-time only)
├── Auth Flow (state machine)   (IndexScreen → Login/Signup → OTP)
└── AppNavigator                (authenticated — the main app)
    ├── AppContext.Provider      (global state for ~40+ values)
    └── TabNavigator             (5 bottom tabs)
        ├── Home
        ├── Wishlist
        ├── Shop (diamond icon)
        ├── Notifications
        └── Profile
```

### Key Architectural Patterns

1. **NO stack navigator for modals** — `AppNavigator.tsx` uses boolean state variables (`showCart`, `showCheckout`, etc.) to render screens as conditional modals. Only the 5 tabs use `@react-navigation/bottom-tabs`.

2. **Service layer** — All API calls should go through `src/services/`. Some screens (CartScreen, ProductDetailScreen, SecurityScreen) currently make direct `axios` calls — this is technical debt.

3. **State ownership** — `AppNavigator.tsx` (~2500 lines) owns all global state. `AppContext.tsx` is just the pipe that passes it to tab screens.

4. **Auth persistence** — Uses `expo-secure-store` (NOT AsyncStorage) for token/user. Tokens expire after 7 days via client-side timestamp check.

5. **Caching** — Home screen data is cached in `AsyncStorage` with the prefix `apsara_cache:` and restored instantly on mount before fresh API data loads.

---

## Folder Structure

```
src/
├── config/api.ts           ← Base URLs (backend + Meilisearch)
├── constants/              ← colors.ts, tierConfig.ts
├── context/                ← AppContext.tsx (global state), NavigationContext.tsx
├── hooks/                  ← 10 custom hooks (notifications, wishlist, products, etc.)
├── navigation/             ← AppNavigator.tsx (master), TabNavigator.tsx (5 tabs)
├── screen/                 ← 53 screen files
├── services/               ← 12 API service files
├── utils/                  ← biometricUtils, fcmUtils, firebaseMessaging
└── components/             ← Reusable UI (AppHeader, ChatBot, Items, etc.)
```

---

## Code Conventions

### Imports

- Use **direct imports** from source files — avoid barrel exports (see performance notes below)
- Services are imported inline in some screens: `const { authService } = require('../services/authService')`

### Styling

- Use `StyleSheet.create({})` — never inline style objects in render
- Color constants from `src/constants/colors.ts` (`Colors.sky`, `Colors.cream`, etc.)
- Dark mode: every screen receives `isDarkMode` and defines a local `colors` object

### Types

- `@ts-nocheck` is used in several files — do NOT add it to new files
- Define interfaces for props, API responses, and data models
- The `AuthUser` interface in `App.tsx` is the canonical user type

### Error Handling

- Services throw structured errors: `{ message, details, status }`
- Screens show errors via `react-native-toast-message` (`Toast.show()`)

### API Calls

- All authenticated requests: `headers: { Authorization: \`Bearer ${token}\` }`
- Response normalization: always handle multiple shapes (`data.data`, `data.products`, `data.items`, raw array)

---

## React Native Best Practices

> These rules are synthesized from the `.agents/skills/` directory. Follow them strictly.

### 🔴 CRITICAL — Lists & FPS

1. **Never use `ScrollView` + `.map()` for dynamic lists** — Always use `FlatList` or `FlashList`
2. **Memoize list item components** with `React.memo()`
3. **Stabilize callbacks** passed to list items with `useCallback()`
4. **Avoid inline objects/styles in render** — Extract to `StyleSheet.create()` or constants
5. **Extract functions outside render** — Don't define functions inside `renderItem`
6. **Use `keyExtractor`** with stable, unique keys (not array index)

```typescript
// ❌ BAD — causes full re-render on every state change
<ScrollView>
  {items.map(item => <ItemCard key={item.id} item={item} />)}
</ScrollView>

// ✅ GOOD — virtualized, only renders visible items
<FlatList
  data={items}
  keyExtractor={(item) => String(item.id)}
  renderItem={renderItem}
  getItemLayout={(data, index) => ({ length: 80, offset: 80 * index, index })}
/>
```

### 🔴 CRITICAL — Bundle Size

1. **Import directly from source** — No barrel exports (`index.ts` re-exports)
2. **Audit dependencies** before adding — check bundle impact
3. **Enable R8** for Android builds (native code shrinking)

```typescript
// ❌ BAD — barrel import pulls entire library
import { something } from "../components"

// ✅ GOOD — direct import, tree-shakeable
import { something } from "../components/Something/Something"
```

### 🟡 HIGH — Performance

1. **Run animations on UI thread** — Use Reanimated worklets, not `Animated` API with JS thread
2. **Animate only `transform` and `opacity`** — These are GPU-accelerated. Avoid animating `width`, `height`, `margin`, `padding`
3. **Use `Pressable` over `TouchableOpacity`** — `Pressable` is the modern, more flexible API
4. **Use `useDeferredValue`** for expensive computations that don't need to block the UI
5. **Minimize state subscriptions** — Only subscribe components to the state they need
6. **Prefer native navigation** — `react-native-screens` is already installed

### 🟡 HIGH — Memory Management

1. **Cancel animations in cleanup** — Always return cleanup functions in `useEffect`
2. **Remove event listeners** — Every `addEventListener` needs a corresponding `removeEventListener` in cleanup
3. **Avoid closures over large objects** — Can prevent garbage collection
4. **Clear intervals/timeouts** — Always `clearInterval`/`clearTimeout` in cleanup

```typescript
// ✅ GOOD — proper cleanup
useEffect(() => {
  const subscription = AppState.addEventListener("change", handler)
  return () => subscription.remove()
}, [])
```

### 🟢 MEDIUM — UI Patterns

1. **Handle safe areas** — Use `SafeAreaView` or `useSafeAreaInsets()` (already used)
2. **Wrap text in `<Text>`** — All strings must be inside `<Text>` components
3. **Use `numberOfLines`** — Prevent text overflow in cards and list items
4. **Use `onLayout` not `measure()`** — For getting view dimensions
5. **Platform-specific code** — Use `Platform.select()` for iOS/Android differences
6. **Test on real devices** — Emulator performance differs significantly

### 🟢 MEDIUM — State Management

1. **Use React Query** for server state (already using `@tanstack/react-query`)
2. **Use Context sparingly** — `AppContext` is already large; consider Zustand for new global state
3. **Show fallback on first render** — Don't render empty states before data loads
4. **Avoid falsy `&&` rendering** — Use ternary or `Boolean()` to prevent rendering `0` or `""`

```typescript
// ❌ BAD — renders "0" as text when count is 0
{count && <Badge count={count} />}

// ✅ GOOD — explicit boolean check
{count > 0 ? <Badge count={count} /> : null}
```

---

## Useful Commands

### Development

```bash
# Start Metro bundler (development server)
npx expo start

# Start with cache cleared
npx expo start -c

# Run on Android device/emulator
npx expo run:android

# Run on iOS simulator (macOS only)
npx expo run:ios

# Start with tunnel (for testing on physical device over network)
npx expo start --tunnel
```

### Build & Deploy

```bash
# Create development build (installs dev client)
npx eas build --profile development --platform android

# Create preview/staging build
npx eas build --profile preview --platform android

# Create production build
npx eas build --profile production --platform android

# Submit to Play Store
npx eas submit --platform android

# Push an OTA update (no new build needed for JS changes)
npx eas update --branch production --message "description of changes"
```

### Debugging & Profiling

```bash
# Open React DevTools (in Metro terminal, press 'j')
# Or shake device → "Open DevTools"

# Check bundle size
npx react-native bundle \
  --entry-file index.ts \
  --bundle-output output.js \
  --platform android \
  --sourcemap-output output.js.map \
  --dev false --minify true

# Analyze bundle (after bundling)
npx source-map-explorer output.js --no-border-checks

# Check for dependency issues
npx expo doctor

# View installed native modules
npx expo config --type introspect

# Check what Expo SDK version supports
npx expo install --check
```

### Dependency Management

```bash
# Install a package (Expo-compatible version)
npx expo install <package-name>

# Check for outdated packages
npm outdated

# Fix Expo SDK compatibility issues
npx expo install --fix

# Clear all caches (nuclear option)
npx expo start -c
# Also manually clear:
#   - Delete node_modules and reinstall: rm -rf node_modules && npm install
#   - Clear Metro cache: npx react-native start --reset-cache
#   - Clear Android build: cd android && ./gradlew clean
```

### TypeScript

```bash
# Type check the entire project
npx tsc --noEmit

# Type check and watch for changes
npx tsc --noEmit --watch
```

---

## Deep Link Testing

```bash
# Test referral deep link
adb shell am start -a android.intent.action.VIEW -d "https://www.afhome.ph/ref/username" com.afhome.mobile

# Test product deep link
adb shell am start -a android.intent.action.VIEW -d "https://www.afhome.ph/product/sofa-set-i123" com.afhome.mobile

# Test payment success deep link
adb shell am start -a android.intent.action.VIEW -d "apsarahome://payment/success?checkout_id=cs_abc" com.afhome.mobile

# Test order notification deep link
adb shell am start -a android.intent.action.VIEW -d "purchases://delivered/cs_abc123" com.afhome.mobile
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in:

```
EXPO_PUBLIC_GOOGLE_CLIENT_ID=         # Google OAuth (Android)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=     # Google OAuth (Web)
EXPO_PUBLIC_EXPO_USERNAME=            # Expo account username
EXPO_PUBLIC_EXPO_SLUG=                # Expo project slug
EXPO_PUBLIC_API_URL=                  # Backend API URL
EXPO_PUBLIC_PUSHER_KEY=               # Pusher app key
EXPO_PUBLIC_PUSHER_APP_CLUSTER=       # Pusher cluster (ap3)
```

---

## Skills Reference

When working on specific problem areas, read the relevant skill files for detailed patterns:

| Problem              | Skill File                                                                             |
| -------------------- | -------------------------------------------------------------------------------------- |
| Slow/janky scrolling | `.agents/skills/react-native-best-practices/references/js-lists-flatlist-flashlist.md` |
| Too many re-renders  | `.agents/skills/react-native-best-practices/references/js-profile-react.md`            |
| Animation jank       | `.agents/skills/react-native-best-practices/references/js-animations-reanimated.md`    |
| Memory leaks         | `.agents/skills/react-native-best-practices/references/js-memory-leaks.md`             |
| Large bundle size    | `.agents/skills/react-native-best-practices/references/bundle-analyze-js.md`           |
| Slow app startup     | `.agents/skills/react-native-best-practices/references/native-measure-tti.md`          |
| Bottom sheet issues  | `.agents/skills/react-native-best-practices/references/js-bottomsheet.md`              |
| TextInput lag        | `.agents/skills/react-native-best-practices/references/js-uncontrolled-components.md`  |
| Full Vercel rules    | `.agents/skills/vercel-react-native-skills/AGENTS.md`                                  |
| Design patterns      | `.agents/skills/react-native-design/SKILL.md`                                          |

---

## Do NOT

- ❌ Add `@ts-nocheck` to new files
- ❌ Use `ScrollView` + `.map()` for lists of dynamic data
- ❌ Create barrel exports (`index.ts` that re-exports)
- ❌ Use `AsyncStorage` for sensitive data (tokens, user data) — use `SecureStore`
- ❌ Add inline styles in render methods
- ❌ Create new global state without considering if it belongs in AppContext or a new Zustand store
- ❌ Make direct `axios` calls in screens — put them in `src/services/`
- ❌ Forget cleanup functions in `useEffect` (event listeners, subscriptions, timeouts)
- ❌ Use `TouchableOpacity` for new components — use `Pressable`
- ❌ Animate `width`, `height`, `margin`, or `padding` — only animate `transform` and `opacity`
