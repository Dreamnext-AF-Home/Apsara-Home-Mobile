# 📱 Screens Guide – Every Screen Explained

This document lists every screen in the app, grouped by feature area. For each screen you'll find:

- **File path** (clickable link)
- **What it does** and the logic behind it
- **Why it exists** in the app flow

---

## 1. Authentication & Onboarding

These screens control the unauthenticated flow. The user must pass through them before reaching the main app.

### LoadingScreen

[LoadingScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/LoadingScreen.tsx)

**What**: A simple splash/loading indicator shown while the app checks for a stored auth token in `SecureStore`.

**Why**: The app needs ~200ms to read encrypted storage. This prevents a flash of the login screen for returning users.

---

### OnboardingScreen

[OnboardingScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/OnboardingScreen.tsx)

**What**: A multi-page swipeable introduction to the app (product showcase, features overview). Shown **only once** to new users.

**Why**: First-time user engagement. After completion, a flag `has_onboarded = 'true'` is saved in `SecureStore` so it never shows again.

---

### IndexScreen (Landing)

[IndexScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/IndexScreen.tsx)

**What**: The main landing/welcome screen. Shows the AFHome branding with options to:

- Log in (email/password)
- Sign up (navigates to referral signup)
- Google Sign-In (one-tap)
- Biometric login (fingerprint/face) if previously enrolled

**Why**: Central entry point for authentication. Also handles biometric login via `POST /auth/mobile/login-biometric`.

---

### LoginScreen

[LoginScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/LoginScreen.tsx)

**What**: Email + password login form. Handles:

- Standard login (`POST /auth/mobile/login`)
- 2FA verification flow (if `2FA_REQUIRED` error is returned)
- MFA approval polling (if `MFA_APPROVAL_REQUIRED` is returned)
- Biometric login shortcut
- Google login button

**Why**: Primary authentication method. Supports multiple auth challenge types returned by the backend.

---

### SignupScreen

[SignupScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/SignupScreen.tsx)

**What**: Full registration form collecting: name, email, phone, password, address (with PH region/province/city/barangay cascading dropdowns), occupation, gender, birth date.

**Why**: Creates a new user account via `POST /auth/mobile/register`. On success, redirects to OTP verification.

---

### ReferralSignupScreen

[ReferralSignupScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/ReferralSignupScreen.tsx)

**What**: Same as SignupScreen but with a **referrer username** field pre-filled (from a deep link like `afhome.ph/ref/username`). Also includes SMS OTP verification step.

**Why**: The app has a referral/affiliate system. New users who come via a referral link get linked to the referrer in the MLM tree. Includes `POST /auth/send-sms-otp` and `POST /auth/verify-sms-otp` for phone verification.

---

### OtpScreen

[OtpScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/OtpScreen.tsx)

**What**: 6-digit OTP input screen. Verifies the user's email after registration via `POST /auth/register/verify-otp`.

**Why**: Email verification is required before the account is activated.

---

### ReferralOtpScreen

[ReferralOtpScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/ReferralOtpScreen.tsx)

**What**: OTP verification screen specific to the referral signup flow.

**Why**: Separate from OtpScreen because it has a different navigation flow (back goes to ReferralSignupScreen, success goes to IndexScreen for login).

---

### ReferralScreen

[ReferralScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/ReferralScreen.tsx)

**What**: A modal that shows when a user taps a referral deep link (`/ref/username`). Displays the referrer's name, avatar, and a "Register" button.

**Why**: Social proof — shows who referred you and encourages sign-up.

---

### AFHomeAffiliateScreen

[AFHomeAffiliateScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/AFHomeAffiliateScreen.tsx)

**What**: Full-screen affiliate program info page accessible from the IndexScreen. Explains the commission structure, ranks, and benefits.

**Why**: Marketing — convinces unauthenticated visitors to join the affiliate network.

---

## 2. Main Tab Screens (Authenticated)

After login, the app renders a bottom tab navigator with **5 tabs**: Home, Wishlist, Shop, Notifications, Profile.

### HomeScreen

[HomeScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/HomeScreen.tsx) (~43KB)

**What**: The main dashboard. Shows:

- **Categories carousel** (fetched from `GET /home/shop/categories`)
- **Brands section** (fetched from `GET /home/shop/brands`)
- **Room types** (fetched from `GET /home/shop/rooms`)
- **Featured products** (Affordahome brand products from `GET /products`)
- **Cart quick-count** (from `GET /cart`)
- Pull-to-refresh to reload all data

**Why**: First screen users see after login. Provides quick access to all browsing paths.

---

### WishlistScreen

[WishlistScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/WishlistScreen.tsx)

**What**: Displays the user's saved/wishlisted products using React Query. Supports:

- Remove from wishlist (`DELETE /wishlist/{product_id}`)
- Add single item to cart (`POST /cart/add`)
- Add all wishlisted items to cart (`POST /cart/bulk-add`)
- Remove after adding to cart

**Why**: Standard e-commerce "save for later" feature.

---

### ShopScreen

[ShopScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/ShopScreen.tsx)

**What**: Product listing screen with filters. Can be filtered by:

- **Room type** (passed via `selectedRoomId`)
- **Category** (passed via `selectedCategoryId`)
- **Brand** (passed via `selectedBrandId`)

Products fetched from `GET /products` with query params like `?room_type=X&status=1`.

**Why**: The main product browsing screen. Reached from Home (tap a category/room/brand) or from the Shop tab.

---

### ShopByBrandScreen

[ShopByBrandScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/ShopByBrandScreen.tsx)

**What**: Dedicated brand storefront page showing:

- Brand profile (via `GET /product-brands/{id}/profile`)
- Brand's products (via `GET /products?brand_type={id}`)
- Follow/unfollow brand (`POST /followers/is-following`, `POST /followers/{follow|unfollow}`)
- Filter by category within the brand

**Why**: Brands are important sellers on the platform. This gives each brand a dedicated "shop" feel.

---

### NotificationsScreen

[NotificationsScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/NotificationsScreen.tsx)

**What**: Lists all user notifications (fetched from `GET /mobile/notifications`). Each notification can be:

- Tapped to navigate to the relevant order/section
- Marked as read (`PATCH /mobile/notifications/{id}/read`)

**Why**: Central hub for order status updates, payment confirmations, and system messages.

---

### ProfileScreen

[ProfileScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/ProfileScreen.tsx) (~65KB)

**What**: The user's account hub. This is a **massive screen** that includes:

- Profile card (avatar, name, rank badge, verification status)
- **Order summary** with counts by status (from `GET /orders/counts`)
- **Wallet overview** (from `GET /encashment/wallet?wallet_type=all`)
- **Referral link sharing** (generates `afhome.ph/ref/{username}` and `afhome.ph/shop?ref={username}`)
- **PV (Point Value) progress** with tier information
- Security settings shortcut
- Social media links
- Logout button

**Why**: The central "Me" page. Connects to almost every other feature in the app.

---

## 3. Shopping & Commerce

### SearchScreen

[SearchScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/SearchScreen.tsx)

**What**: Full-screen search overlay with:

- **Live search** via Meilisearch (`POST /indexes/products/search` on `search.afhome.ph`)
- **Search history** (saved via `POST /search/history`, fetched via `GET /search/history`)
- **Search recommendations** (`GET /search/recommendations?limit=12`)
- **Voice search** (audio transcription via `POST /transcribe`)

**Why**: Product discovery. Meilisearch provides fast, typo-tolerant search separate from the main API.

---

### SearchResultScreen

[SearchResultScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/SearchResultScreen.tsx)

**What**: Displays full search results as a product grid after submitting a search query.

**Why**: Separated from SearchScreen so the search overlay can show live suggestions while this shows full results.

---

### ProductDetailScreen

[ProductDetailScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/ProductDetailScreen.tsx) (~121KB — the largest file)

**What**: Full product detail page with:

- Image gallery (swipeable)
- Price display (SRP vs. member price with discount %)
- PV (Point Value) display
- Variant selection (color, size, style)
- Quantity selector
- **Add to cart** (`POST /cart/add`)
- **Add/remove from wishlist** (`POST /wishlist` / `DELETE /wishlist/{id}`)
- **Wishlist count** (`GET /wishlist/count/{productId}`)
- **Product reviews** (via `productService.getProductReviews`)
- **Share product** link (generates slug-based URL)
- **Related products** carousel
- Buy Now (direct checkout)

**Why**: The core commerce screen. Every product link/tap leads here.

---

### CartScreen

[CartScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/CartScreen.tsx) (~65KB)

**What**: Shopping cart with:

- Items grouped by brand
- Brand-level and individual item selection (checkboxes)
- Quantity update (`PUT /cart/{crtId}/variant`)
- Variant change (`PUT /cart/{crtId}/variant`)
- Remove item (`DELETE /cart/{crtId}`)
- Swipe-to-delete (SwipeListView)
- Select all / brand-level select all
- Checkout button (passes selected items)

**Why**: Standard e-commerce cart with the added complexity of variant management and brand grouping.

---

### CheckoutScreen

[CheckoutScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/CheckoutScreen.tsx) (~61KB)

**What**: Order placement screen. Shows:

- Delivery address selection (`GET /auth/addresses`)
- Order summary (items, quantities, prices)
- Shipping fee calculation
- **Place order** (`POST /mobile/payments/create`) — returns a PayMongo checkout URL
- Opens `PaymentWebViewScreen` with the checkout URL

**Why**: Bridges cart → payment. Integrates with PayMongo for online payment.

---

### PaymentWebViewScreen

[PaymentWebViewScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/PaymentWebViewScreen.tsx)

**What**: A WebView that loads the PayMongo checkout page. Listens for redirect URLs:

- `payment/success` → triggers `PaymentSuccessScreen`
- `payment/cancel` → triggers `PaymentCancelScreen`

**Why**: PayMongo requires a browser-based checkout flow. The WebView captures the result via deep link redirect.

---

### PaymentSuccessScreen

[PaymentSuccessScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/PaymentSuccessScreen.tsx)

**What**: Confirmation screen shown after successful payment. Shows order details, transaction ID, and a "View Orders" button.

**Why**: Post-payment confirmation and order summary.

---

### PaymentCancelScreen

[PaymentCancelScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/PaymentCancelScreen.tsx)

**What**: Screen shown when user cancels payment in the WebView.

**Why**: Provides a clear indication that payment was cancelled and allows retry.

---

### OrderSuccessScreen

[OrderSuccessScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/OrderSuccessScreen.tsx)

**What**: Order confirmation screen with celebration animation.

**Why**: Positive feedback after a successful order placement.

---

### PurchasesScreen

[PurchasesScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/PurchasesScreen.tsx) (~59KB)

**What**: Order history and tracking. Tabs for order statuses:

- Pending, Paid, Processing, Shipped, To Receive, Delivered, Cancelled, Returns
- Fetches orders via `GET /orders/history`
- **Pay now** for pending orders (`GET /mobile/payments/{order_number}/proceed`)
- Order detail view with item list, tracking info, and delivery address

**Why**: Users need to track their orders post-purchase. This is the "My Orders" equivalent.

---

### ShippingAddressSelectionScreen

[ShippingAddressSelectionScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/ShippingAddressSelectionScreen.tsx)

**What**: Allows selecting a saved shipping address or adding a new one during checkout.

**Why**: Users may have multiple delivery addresses.

---

### AddAddressScreen

[AddAddressScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/AddAddressScreen.tsx)

**What**: Form to add a new shipping address with cascading location selectors (Region → Province → City → Barangay) using the Philippine Standard Geographic Code (PSGC) API endpoints.

**Why**: Philippine addressing requires hierarchical location selection.

---

## 4. Profile & Account

### ProfileDetailsScreen

[ProfileDetailsScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/ProfileDetailsScreen.tsx)

**What**: Detailed profile view with:

- Avatar upload (`POST /me/avatar` with `multipart/form-data`)
- Profile info update (`PUT /auth/me`)
- Verification status display

**Why**: Users need to view and update their profile information and avatar.

---

### ProfileEditScreen

[ProfileEditScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/ProfileEditScreen.tsx) (~40KB)

**What**: Full profile editing form. Cascading address selectors using:

- `GET /address/regions`
- `GET /address/provinces?region_code=X`
- `GET /address/cities?province_code=X`
- `GET /address/barangays?city_code=X`

Falls back to **PSGC API** (`https://psgc.gitlab.io/api/...`) when the backend endpoints fail.

**Why**: Comprehensive profile editing with Philippine geographic data.

---

### ReferralNetworkScreen

[ReferralNetworkScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/ReferralNetworkScreen.tsx)

**What**: Visualizes the user's referral tree (downline). Shows:

- Direct referrals (1st level)
- 2nd-level referrals
- Network summary (total PV, member counts)
- Data from `GET /referral-tree`

**Why**: Core feature of the MLM/affiliate model. Users need to see their network.

---

### LeaderboardScreen

[LeaderboardScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/LeaderboardScreen.tsx)

**What**: Public leaderboard showing top members sorted by referrals. Fetched from `GET /public/top-members?sort=referrals&per_page=20`.

**Why**: Gamification — motivates users to grow their referral network.

---

### LevelProgressDetailsScreen

[LevelProgressDetailsScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/LevelProgressDetailsScreen.tsx)

**What**: Detailed breakdown of the user's rank/tier progress, showing PV thresholds and requirements.

**Why**: Users need to understand what it takes to advance to the next rank in the affiliate system.

---

### PVEarnerScreen

[PVEarnerScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/PVEarnerScreen.tsx)

**What**: Shows the user's Point Value (PV) earnings and history.

**Why**: PV is the primary metric in the affiliate system. Users earn PV from purchases and their network's purchases.

---

### HistoryScreen

[HistoryScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/HistoryScreen.tsx)

**What**: Login history showing device, IP, location, and timestamp. Fetched from `GET /login-history`.

**Why**: Security feature — users can audit where their account has been accessed from.

---

## 5. Affiliate Wallet

These screens form the wallet/financial section of the affiliate system.

### AFWalletOverviewScreen

[AFWalletOverviewScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/AFWalletOverviewScreen.tsx)

**What**: Main wallet dashboard showing all wallet types and balances. Fetched from `GET /encashment/wallet`.

**Why**: Central financial overview for affiliates.

---

### AFWalletVoucherScreen

[AFWalletVoucherScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/AFWalletVoucherScreen.tsx)

**What**: Shows available vouchers and voucher wallet balance. Uses `GET /encashment/wallet`.

**Why**: Vouchers are one of the commission payout types.

---

### AFWalletRewardsScreen

[AFWalletRewardsScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/AFWalletRewardsScreen.tsx)

**What**: Shows reward earnings and transaction history.

**Why**: Rewards/commissions from referral network activity.

---

### AFWalletNetworkScreen

[AFWalletNetworkScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/AFWalletNetworkScreen.tsx)

**What**: Network-level wallet showing earnings from the referral tree.

**Why**: Separates personal earnings from network earnings for transparency.

---

## 6. Settings & Security

### SettingsScreen

[SettingsScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/SettingsScreen.tsx)

**What**: App settings including:

- Dark mode toggle (persisted via `AsyncStorage`)
- Security settings shortcut
- Edit profile shortcut
- About, Privacy Policy, Terms links
- Session management

**Why**: Central settings hub.

---

### SecurityScreen

[SecurityScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/SecurityScreen.tsx) (~50KB)

**What**: Comprehensive security management:

- **Change password** (`POST /auth/change-password`)
- **Active sessions** (`GET /sessions`, `DELETE /sessions/{tokenId}`)
- **Google account linking** (`GET /auth/mobile/check-google-linked`, `POST /auth/mobile/link-account`, `POST /auth/mobile/unlink-account`)
- **Biometric enrollment** (`POST /auth/mobile/enable-biometric`, `POST /auth/mobile/disable-biometric`)
- **QR code verification** (`POST /auth/qr/verify`)

**Why**: Account security is critical for an e-commerce + financial app.

---

## 7. Informational / Static Pages

These screens display static content (fetched once, rarely changes).

| Screen                | File                                                                                                                 | Purpose                     |
| --------------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| About Us              | [AboutUsScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/AboutUsScreen.tsx)                             | Company information         |
| Privacy Policy        | [PrivacyPolicyScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/PrivacyPolicyScreen.tsx)                 | Legal privacy policy        |
| Terms & Conditions    | [TermsAndConditionsScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/TermsAndConditionsScreen.tsx)       | Legal T&Cs                  |
| Cookie Policy         | [CookiePolicyScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/CookiePolicyScreen.tsx)                   | Cookie usage policy         |
| Income Disclaimer     | [IncomeDisclaimerScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/IncomeDisclaimerScreen.tsx)           | Affiliate income disclaimer |
| Rewards & Commissions | [RewardsAndCommissionsScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/RewardsAndCommissionsScreen.tsx) | Commission structure info   |
| Contact Us            | [ContactUsScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/ContactUsScreen.tsx)                         | Company contact details     |
| Our Branches          | [OurBranchesScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/OurBranchesScreen.tsx)                     | Physical store locations    |
| FAQs                  | [FAQsScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/FAQsScreen.tsx)                                   | Frequently asked questions  |
| Shipping Info         | [ShippingInfoScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/ShippingInfoScreen.tsx)                   | Shipping policies           |
| Returns               | [ReturnsScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/ReturnsScreen.tsx)                             | Return/refund policies      |
| Products              | [ProductsScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/ProductsScreen.tsx)                           | Simple product listing      |

---

## 8. Navigation Architecture

> [!IMPORTANT]
> The app does **NOT** use a standard React Navigation stack for all screens. Instead, `AppNavigator.tsx` manages ~40 boolean state variables (e.g., `showCart`, `showCheckout`, `showPurchases`) to show/hide screens as **full-screen modals** or **conditional renders**. Only the 5 main tabs use `@react-navigation/bottom-tabs`.

### Why this pattern?

- **Performance**: Avoids deep stack nesting and screen mounting/unmounting
- **State persistence**: Tab screens stay mounted when switching tabs (no data loss)
- **Custom transitions**: Full control over modal animations

### Tab structure (in `TabNavigator.tsx`):

```
Bottom Tabs:
  ├── home        → HomeTabScreen (with AppHeader)
  ├── wishlist    → WishlistTabScreen (with AppHeader)
  ├── shop        → ShopTabScreen (Shop or ShopByBrand)
  ├── notification → NotificationTabScreen (with AppHeader)
  └── profile     → ProfileTabScreen
```

### Deep Link Handling

The app supports these deep link patterns:

| Pattern                             | Handler                | Destination                |
| ----------------------------------- | ---------------------- | -------------------------- |
| `*/ref/{username}`                  | App.tsx + AppNavigator | ReferralScreen modal       |
| `*/product/{slug}-i{id}`            | AppNavigator           | ProductDetailScreen        |
| `*/payment/success`                 | AppNavigator           | PaymentSuccessScreen       |
| `*/payment/cancel`                  | AppNavigator           | PaymentCancelScreen        |
| `purchases://{status}/{checkoutId}` | AppNavigator           | PurchasesScreen (filtered) |
| `*/shop?ref={username}`             | AppNavigator           | Shop tab                   |
