# 🔌 API Reference – Every Endpoint Documented

**Base URL**: `https://backend.afhome.ph/api`
**Auth**: Bearer token in `Authorization` header (unless marked 🔓 Public)

> [!TIP]
> All authenticated endpoints require: `Authorization: Bearer {token}` header. The token is obtained from the login response and stored in `expo-secure-store`. It expires after **1 week**.

---

## 1. Authentication

Source: [authService.ts](file:///d:/PROJECTS/Apsara-Home-Mobile/src/services/authService.ts)

### `POST /auth/mobile/login`

**Purpose**: Log in with email and password.

| Field      | Type   | Required |
| ---------- | ------ | -------- |
| `email`    | string | ✅       |
| `password` | string | ✅       |

**Response** (success):

```json
{
  "user": {
    "id": "123",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar_url": "https://...",
    "username": "johndoe",
    "rank": 1,
    "badge_name": "Member",
    ...
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Error responses**:

- `401` → Invalid credentials
- `403` → Account locked
- `404` → User not found
- Special: Error message containing `2FA_REQUIRED|{token}|{message}` → Triggers 2FA flow
- Special: Error message containing `MFA_APPROVAL_REQUIRED|{token}|{message}` → Triggers MFA approval flow

---

### `POST /auth/mobile/register`

**Purpose**: Register a new user account.

| Field                   | Type   | Required |
| ----------------------- | ------ | -------- |
| `first_name`            | string | ✅       |
| `last_name`             | string | ✅       |
| `middle_name`           | string | ❌       |
| `name`                  | string | ✅       |
| `email`                 | string | ✅       |
| `username`              | string | ✅       |
| `phone`                 | string | ✅       |
| `birth_date`            | string | ✅       |
| `gender`                | string | ✅       |
| `occupation`            | string | ✅       |
| `work_location`         | string | ✅       |
| `country`               | string | ✅       |
| `referred_by`           | string | ✅       |
| `password`              | string | ✅       |
| `password_confirmation` | string | ✅       |
| `address`               | string | ✅       |
| `barangay`              | string | ✅       |
| `city`                  | string | ✅       |
| `province`              | string | ✅       |
| `region`                | string | ✅       |
| `zip_code`              | string | ✅       |

**Response**:

```json
{
  "message": "Registration successful",
  "requires_otp": true,
  "verification_token": "abc123",
  "email": "user@example.com"
}
```

---

### `POST /auth/register/verify-otp`

**Purpose**: Verify email OTP after registration.

| Field                | Type              | Required |
| -------------------- | ----------------- | -------- |
| `verification_token` | string            | ✅       |
| `otp`                | string (6 digits) | ✅       |

**Response**: Same as login response (`user` + `token`).

---

### `POST /auth/send-sms-otp`

**Purpose**: Send SMS OTP for phone verification.

| Field                | Type   | Required |
| -------------------- | ------ | -------- |
| `verification_token` | string | ✅       |
| `phone`              | string | ✅       |

**Response**:

```json
{
  "message": "OTP sent",
  "requires_otp": true,
  "verification_token": "abc123",
  "phone": "+639..."
}
```

---

### `POST /auth/verify-sms-otp`

**Purpose**: Verify SMS OTP.

| Field                | Type   | Required |
| -------------------- | ------ | -------- |
| `verification_token` | string | ✅       |
| `otp`                | string | ✅       |

**Response**:

```json
{
  "message": "Phone verified",
  "phone": "+639..."
}
```

**Errors**: `OTP_EXPIRED`, `MAX_ATTEMPTS_EXCEEDED`, `INVALID_OTP` with `attempts_remaining` count.

---

### `POST /auth/mobile/google-login`

**Purpose**: Login with Google ID token.

| Field       | Type   | Required |
| ----------- | ------ | -------- |
| `id_token`  | string | ✅       |
| `fcm_token` | string | ❌       |

**Response**:

```json
{
  "success": true,
  "data": {
    "token": "eyJ...",
    "user": { ... }
  },
  "message": "Login successful"
}
```

---

### `POST /auth/mobile/login-biometric`

**Purpose**: Login using biometric authentication.

Source: [IndexScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/IndexScreen.tsx#L137) and [LoginScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/LoginScreen.tsx#L241)

| Field             | Type   | Required |
| ----------------- | ------ | -------- |
| `biometric_token` | string | ✅       |
| `device_id`       | string | ✅       |

**Response**: Same as login response (`user` + `token`).

---

### `POST /auth/login/2fa/verify`

**Purpose**: Verify 2FA code during login.

| Field   | Type   | Required |
| ------- | ------ | -------- |
| `token` | string | ✅       |
| `otp`   | string | ✅       |

---

### `POST /auth/login/2fa/resend`

**Purpose**: Resend 2FA code.

| Field   | Type   | Required |
| ------- | ------ | -------- |
| `token` | string | ✅       |

---

### `GET /auth/login/mfa/status?token={token}`

**Purpose**: Poll MFA approval status.

**Response**: `{ "approved": true/false }`

---

### `POST /auth/login/mfa/resend`

**Purpose**: Resend MFA approval request.

| Field   | Type   | Required |
| ------- | ------ | -------- |
| `token` | string | ✅       |

---

### `GET /auth/me`

**Purpose**: Get current user profile.

**Response**: Full user object with all profile fields.

---

### `PUT /auth/me`

**Purpose**: Update user profile.

Source: [ProfileDetailsScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/ProfileDetailsScreen.tsx#L159)

| Field                   | Type   | Required |
| ----------------------- | ------ | -------- |
| `first_name`            | string | ❌       |
| `last_name`             | string | ❌       |
| `phone`                 | string | ❌       |
| ... (any profile field) |        |          |

---

### `POST /me/avatar`

**Purpose**: Upload user avatar. Uses `multipart/form-data`.

Source: [ProfileDetailsScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/ProfileDetailsScreen.tsx#L116)

| Field    | Type         | Required |
| -------- | ------------ | -------- |
| `avatar` | file (image) | ✅       |

---

### `GET /auth/csrf`

**Purpose**: Get CSRF token (used in web-based auth flows).

---

### `POST /auth/callback/facebook`

**Purpose**: Facebook OAuth callback.

| Field         | Type   | Required |
| ------------- | ------ | -------- |
| `accessToken` | string | ✅       |

---

### `POST /auth/passkeys/login/options`

**Purpose**: Get WebAuthn passkey login options.

| Field   | Type   | Required |
| ------- | ------ | -------- |
| `email` | string | ✅       |

---

### `POST /auth/passkeys/login/verify`

**Purpose**: Verify WebAuthn passkey credential.

---

### `POST /auth/change-password`

**Purpose**: Change user's password.

Source: [SecurityScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/SecurityScreen.tsx#L218)

| Field                       | Type   | Required |
| --------------------------- | ------ | -------- |
| `current_password`          | string | ✅       |
| `new_password`              | string | ✅       |
| `new_password_confirmation` | string | ✅       |

---

### `POST /auth/qr/verify`

**Purpose**: Verify QR code for device linking.

Source: [SecurityScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/SecurityScreen.tsx#L251)

---

### `GET /auth/mobile/check-google-linked`

**Purpose**: Check if the user's account has a linked Google account.

Source: [SecurityScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/SecurityScreen.tsx#L94)

---

### `POST /auth/mobile/link-account`

**Purpose**: Link a Google account to the user's profile.

Source: [SecurityScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/SecurityScreen.tsx#L326)

---

### `POST /auth/mobile/unlink-account`

**Purpose**: Unlink a Google account from the user's profile.

Source: [SecurityScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/SecurityScreen.tsx#L613)

---

### `POST /auth/mobile/enable-biometric`

**Purpose**: Enable biometric login for this device.

Source: [SecurityScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/SecurityScreen.tsx#L394)

---

### `POST /auth/mobile/disable-biometric`

**Purpose**: Disable biometric login for this device.

Source: [SecurityScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/SecurityScreen.tsx#L486)

---

## 2. Products

Source: [productService.ts](file:///d:/PROJECTS/Apsara-Home-Mobile/src/services/productService.ts)

### `GET /products`

**Purpose**: Fetch all products. Supports query params for filtering.

| Query Param  | Type   | Description                 |
| ------------ | ------ | --------------------------- |
| `brand_type` | number | Filter by brand ID          |
| `room_type`  | number | Filter by room type         |
| `status`     | number | Product status (1 = active) |
| `page`       | number | Pagination page             |
| `per_page`   | number | Items per page              |

**Response**:

```json
{
  "products": [
    {
      "id": 1,
      "name": "Modern Sofa",
      "description": "...",
      "priceSrp": 15000,
      "priceDp": 12000,
      "priceMember": 10000,
      "prodpv": 50,
      "image": "https://...",
      "images": ["https://...", "..."],
      "brand": "AffordaHome",
      "variants": [
        {
          "id": 1,
          "name": "Blue / Large",
          "color": "Blue",
          "colorHex": "#0000FF",
          "size": "Large",
          "priceSrp": 15000,
          "priceDp": 12000,
          "priceMember": 10000,
          "prodpv": 50,
          "qty": 100,
          "images": ["https://..."]
        }
      ],
      "soldCount": 45,
      "musthave": true,
      "bestseller": false,
      "salespromo": true,
      ...
    }
  ]
}
```

---

### `GET /products/{id}`

**Purpose**: Get a single product by ID.

**Response**: `{ "product": { ... } }` or `{ "data": { ... } }`

---

### `GET /products/category/{catid}`

**Purpose**: Get products by category ID.

---

### `GET /products/{id}/reviews`

**Purpose**: Get product reviews and rating summary.

**Response**:

```json
{
  "summary": {
    "average": 4.5,
    "count": 23,
    "breakdown": { "1": 0, "2": 1, "3": 3, "4": 8, "5": 11 }
  },
  "reviews": [
    {
      "id": 1,
      "rating": 5,
      "review": "Great product!",
      "customer_name": "John D.",
      "customer_avatar": "https://...",
      "review_images": ["https://..."],
      "created_at": "2025-01-15T..."
    }
  ]
}
```

---

### `GET /home/shop/categories`

**Purpose**: Get categories for the home page / shop.

**Response**: `{ "categories": [{ "id": 1, "name": "Living Room", "image": "...", "url": "..." }] }`

---

### `GET /home/shop/brands`

**Purpose**: Get brands for the home page / shop.

**Response**: `{ "brands": [{ "id": 1, "name": "AffordaHome", "image": "...", "total_products": 50 }] }`

---

### `GET /home/shop/rooms`

**Purpose**: Get room types for browsing.

**Response**: `{ "rooms": [{ "id": 1, "name": "Bedroom", "image": "..." }] }`

---

### `GET /product-brands`

**Purpose**: Get all product brands with details.

**Response**: Array of brand objects.

---

### `GET /product-brands/{id}/profile`

**Purpose**: Get a brand's profile page data.

Source: [authService.ts](file:///d:/PROJECTS/Apsara-Home-Mobile/src/services/authService.ts#L492)

**Response**:

```json
{
  "brand": {
    "id": 1,
    "name": "AffordaHome",
    "profile_picture": "https://...",
    "is_online": true,
    "overall_rating": 4.8,
    "total_reviews": 150,
    "total_products": 50,
    "joined_date": "2023-01-01",
    "supplier_name": "AFHome Corp"
  }
}
```

---

## 3. Cart

Source: [CartScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/CartScreen.tsx) (inline API calls)

### `GET /cart`

**Purpose**: Fetch user's cart.

**Response**:

```json
{
  "cart_items": [
    {
      "crt_id": 1,
      "crt_customer_id": 123,
      "crt_product_id": 456,
      "crt_variant_id": 789,
      "crt_quantity": 2,
      "crt_unit_price": "10000",
      "crt_total_price": "20000",
      "crt_status": "active",
      "product_name": "Modern Sofa",
      "product_image": "https://...",
      "product_price_srp": "15000",
      "product_price_member": "10000",
      "brand_name": "AffordaHome",
      "variant_name": "Blue / Large",
      "variant_color": "Blue",
      "variant_image": "https://..."
    }
  ]
}
```

---

### `POST /cart/add`

**Purpose**: Add a product to cart.

Source: [ProductDetailScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/ProductDetailScreen.tsx#L456)

| Field        | Type   | Required |
| ------------ | ------ | -------- |
| `product_id` | number | ✅       |
| `variant_id` | number | ❌       |
| `quantity`   | number | ✅       |

---

### `POST /cart/bulk-add`

**Purpose**: Add multiple products to cart at once (from wishlist).

Source: [WishlistScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/WishlistScreen.tsx#L243)

| Field   | Type  | Required |
| ------- | ----- | -------- |
| `items` | array | ✅       |

---

### `PUT /cart/{crtId}/variant`

**Purpose**: Update cart item quantity or variant.

| Field        | Type   | Required |
| ------------ | ------ | -------- |
| `quantity`   | number | ❌       |
| `variant_id` | number | ❌       |

---

### `DELETE /cart/{crtId}`

**Purpose**: Remove an item from cart.

---

### `DELETE /cart`

**Purpose**: Clear the entire cart.

Source: [orderService.ts](file:///d:/PROJECTS/Apsara-Home-Mobile/src/services/orderService.ts#L91)

---

## 4. Wishlist

Source: [ProductDetailScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/ProductDetailScreen.tsx) and [WishlistScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/WishlistScreen.tsx) (inline)

### `GET /wishlist`

**Purpose**: Fetch user's wishlist.

Source: [productService.ts](file:///d:/PROJECTS/Apsara-Home-Mobile/src/services/productService.ts#L261)

**Response**: `{ "data": [{ "product_id": 1, "product": { ... } }] }`

---

### `POST /wishlist`

**Purpose**: Add a product to wishlist.

| Field        | Type   | Required |
| ------------ | ------ | -------- |
| `product_id` | number | ✅       |

---

### `DELETE /wishlist/{product_id}`

**Purpose**: Remove a product from wishlist.

---

### `GET /wishlist/count/{productId}`

**Purpose**: Get the number of times a product has been wishlisted.

Source: [ProductDetailScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/ProductDetailScreen.tsx#L189)

---

## 5. Orders & Payments

### `GET /orders/counts`

**Purpose**: Get order counts by status.

Source: [orderService.ts](file:///d:/PROJECTS/Apsara-Home-Mobile/src/services/orderService.ts#L46)

**Response**:

```json
{
  "all": 15,
  "pending": 2,
  "processing": 1,
  "shipped": 3,
  "delivered": 8,
  "cancelled": 1,
  "completed": 7,
  "paid": 2
}
```

---

### `GET /orders/history`

**Purpose**: Fetch all orders for the current user.

Source: [PurchasesScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/PurchasesScreen.tsx#L277)

**Response**:

```json
{
  "orders": [
    {
      "id": 1,
      "order_number": "ORD-001",
      "status": "delivered",
      "payment_status": "paid",
      "total_amount": 25000,
      "shipping_fee": 500,
      "payment_method": "gcash",
      "delivery_address": "...",
      "items": [{ "name": "Sofa", "quantity": 1, "price": 25000 }],
      "created_at": "2025-06-01T..."
    }
  ]
}
```

---

### `POST /mobile/payments/create`

**Purpose**: Create a payment checkout session (returns a PayMongo URL).

Source: [CheckoutScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/CheckoutScreen.tsx#L513)

| Field            | Type   | Required |
| ---------------- | ------ | -------- |
| `items`          | array  | ✅       |
| `address_id`     | number | ✅       |
| `payment_method` | string | ✅       |

**Response**: Contains a `checkout_url` for PayMongo WebView.

---

### `GET /mobile/payments/{order_number}/proceed`

**Purpose**: Get payment URL for an existing unpaid order (retry payment).

Source: [PurchasesScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/PurchasesScreen.tsx#L451)

---

## 6. Notifications

### `GET /mobile/notifications`

**Purpose**: Fetch user notifications.

Source: [orderService.ts](file:///d:/PROJECTS/Apsara-Home-Mobile/src/services/orderService.ts#L61)

**Response**:

```json
{
  "unread_count": 3,
  "items": [
    {
      "id": "uuid",
      "title": "Order Shipped",
      "message": "Your order #ORD-001 has been shipped",
      "severity": "success",
      "href": "purchases://shipped/cs_abc123",
      "is_read": false,
      "created_at": "2025-06-01T..."
    }
  ],
  "generated_at": "2025-06-01T..."
}
```

---

### `PATCH /mobile/notifications/{id}/read`

**Purpose**: Mark a notification as read.

Source: [orderService.ts](file:///d:/PROJECTS/Apsara-Home-Mobile/src/services/orderService.ts#L76)

---

### `POST /notifications/onesignal/register-token`

**Purpose**: Register a device for push notifications.

Source: [useDeviceRegistration.ts](file:///d:/PROJECTS/Apsara-Home-Mobile/src/hooks/useDeviceRegistration.ts#L41)

| Field         | Type                   | Required |
| ------------- | ---------------------- | -------- |
| `player_id`   | string (UUID)          | ✅       |
| `device_name` | string                 | ✅       |
| `platform`    | `"android"` or `"ios"` | ✅       |

---

## 7. Search

### `GET /search/history`

**Purpose**: Get user's search history.

Source: [authService.ts](file:///d:/PROJECTS/Apsara-Home-Mobile/src/services/authService.ts#L433)

---

### `POST /search/history`

**Purpose**: Save a search query to history.

| Field     | Type   | Required |
| --------- | ------ | -------- |
| `query`   | string | ✅       |
| `search`  | string | ✅       |
| `keyword` | string | ✅       |

---

### `GET /search/recommendations?limit=12`

**Purpose**: Get search recommendations.

Source: [SearchScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/SearchScreen.tsx#L241)

---

### `POST /transcribe`

**Purpose**: Transcribe voice audio to text for voice search.

Source: [SearchScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/SearchScreen.tsx#L119)

---

## 8. Referral & Network

Source: [referralService.ts](file:///d:/PROJECTS/Apsara-Home-Mobile/src/services/referralService.ts)

### `GET /referral-tree`

**Purpose**: Get the user's referral network tree.

**Response**:

```json
{
  "root": {
    "id": 1,
    "name": "John Doe",
    "username": "johndoe",
    "total_earnings": 5000,
    "total_pv": 250,
    "children_count": 5,
    "children": [ ... ]
  },
  "summary": {
    "direct_count": 5,
    "second_level_count": 12,
    "total_network": 17,
    "total_pv": 500
  },
  "children": [ ... ]
}
```

---

### 🔓 `GET /public/profile/{username}`

**Purpose**: Get a public user profile (for referral links). **No auth required.**

**Response**:

```json
{
  "username": "johndoe",
  "name": "John Doe",
  "avatar_url": "https://..."
}
```

---

### 🔓 `GET /public/top-members?sort=referrals&per_page=20`

**Purpose**: Get leaderboard of top members. **No auth required.**

Source: [LeaderboardScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/LeaderboardScreen.tsx#L107)

---

## 9. Account & Wallet

### `GET /account/snapshot`

**Purpose**: Get account loyalty data snapshot.

Source: [accountService.ts](file:///d:/PROJECTS/Apsara-Home-Mobile/src/services/accountService.ts#L26)

**Response**:

```json
{
  "loyalty": {
    "rank": 3,
    "tier": "Silver",
    "personal_pv": 150,
    "referral_count": 5,
    "active_members_count": 3,
    "active_builders_count": 1,
    "active_leaders_count": 0
  }
}
```

---

### `GET /encashment/wallet?wallet_type=all`

**Purpose**: Get wallet balances (all wallet types).

Source: [ProfileScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/ProfileScreen.tsx#L337) and AFWallet screens.

---

### `GET /encashment/wallet`

**Purpose**: Get wallet data (used by voucher/rewards/network screens).

Source: AFWallet screens.

---

## 10. User Behavior & Recommendations

Source: [userBehaviorService.ts](file:///d:/PROJECTS/Apsara-Home-Mobile/src/services/userBehaviorService.ts)

### `POST /user-behavior/track`

**Purpose**: Track user behavior for personalization.

| Field           | Type   | Required |
| --------------- | ------ | -------- |
| `behavior_type` | string | ✅       |
| `product_id`    | number | ❌       |
| `category_id`   | number | ❌       |
| `brand_id`      | number | ❌       |
| `search_query`  | string | ❌       |
| `metadata`      | object | ❌       |

**Behavior types**: `search`, `product_view`, `product_click`, `wishlist_add`, `wishlist_remove`, `cart_add`, `cart_remove`, `purchase`, `category_view`, `brand_view`

---

### `GET /user-behavior/recommendations?limit=20`

**Purpose**: Get personalized product recommendations based on tracked behavior.

**Response**: `{ "data": [{ "id": 1, "name": "...", "image": "...", "priceMember": 10000, ... }] }`

---

### `GET /user-behavior/stats?days=30`

**Purpose**: Get user behavior statistics.

---

### `DELETE /user-behavior?type={behaviorType}`

**Purpose**: Clear behavior history (all or by type).

---

## 11. Sessions & Security

### `GET /sessions`

**Purpose**: Get active sessions/tokens.

Source: [SecurityScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/SecurityScreen.tsx#L127)

---

### `DELETE /sessions/{tokenId}`

**Purpose**: Revoke a specific session/token.

Source: [SecurityScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/SecurityScreen.tsx#L158)

---

### `GET /user/security-settings`

**Purpose**: Get security settings (2FA status, linked accounts, etc.).

Source: [ProfileScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/ProfileScreen.tsx#L324)

---

### `GET /login-history`

**Purpose**: Get login history (device, IP, location, timestamp).

Source: [HistoryScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/HistoryScreen.tsx#L86)

---

### `GET /auth/addresses`

**Purpose**: Get user's saved shipping addresses.

Source: [CheckoutScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/CheckoutScreen.tsx#L205)

---

## 12. Address Lookup (Philippine PSGC)

Source: [ProfileEditScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/ProfileEditScreen.tsx)

### `GET /address/regions`

**Purpose**: Get all Philippine regions.

### `GET /address/provinces?region_code={code}`

**Purpose**: Get provinces for a region.

### `GET /address/cities?province_code={code}`

**Purpose**: Get cities/municipalities for a province.

### `GET /address/barangays?city_code={code}`

**Purpose**: Get barangays for a city.

> [!NOTE]
> Falls back to the public PSGC API (`https://psgc.gitlab.io/api/...`) when the backend endpoints fail.

---

## 13. Social / Brand Following

Source: [ShopByBrandScreen.tsx](file:///d:/PROJECTS/Apsara-Home-Mobile/src/screen/ShopByBrandScreen.tsx)

### `POST /followers/is-following`

**Purpose**: Check if the user is following a brand.

### `POST /followers/follow`

**Purpose**: Follow a brand.

### `POST /followers/unfollow`

**Purpose**: Unfollow a brand.

---

## 14. Real-time (Pusher)

Source: [pusherService.ts](file:///d:/PROJECTS/Apsara-Home-Mobile/src/services/pusherService.ts) and [useNotifications.ts](file:///d:/PROJECTS/Apsara-Home-Mobile/src/hooks/useNotifications.ts)

### `POST /realtime/pusher/auth`

**Purpose**: Authorize a Pusher private channel subscription.

| Field          | Type   | Required |
| -------------- | ------ | -------- |
| `socket_id`    | string | ✅       |
| `channel_name` | string | ✅       |

**Channel format**: `private-customer-{userId}`

**Events listened to**:
| Event | Description |
|---|---|
| `notification.created` | New notification received |
| `order.notification.updated` | Order status changed |
| `notification.count.updated` | Unread count changed |

---

## 15. Meilisearch (Search Engine)

**Host**: `https://search.afhome.ph`
**Auth**: API key in `Authorization: Bearer {SEARCH_KEY}` header

Source: [meilisearchService.ts](file:///d:/PROJECTS/Apsara-Home-Mobile/src/services/meilisearchService.ts)

### `POST /indexes/products/search`

**Purpose**: Full-text search for products.

| Field   | Type   | Required        |
| ------- | ------ | --------------- |
| `q`     | string | ✅              |
| `limit` | number | ❌ (default 20) |

**Response**:

```json
{
  "hits": [
    {
      "id": 1,
      "name": "Modern Sofa",
      "priceSrp": 15000,
      "priceMember": 10000,
      "prodpv": 50,
      "image": "https://...",
      "brand": "AffordaHome"
    }
  ]
}
```

> [!NOTE]
> Meilisearch is a **separate service** from the main API. It's used for fast, typo-tolerant product search. The search key is a read-only key safe for client-side use.
