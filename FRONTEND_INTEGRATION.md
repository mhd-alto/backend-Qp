# CouponHub Syria — Frontend Integration Guide (MVP v0.2 APIs)

This guide documents the **11 newly implemented backend API operations** and provides guidelines on how the frontend team should integrate and link these endpoints with the user interfaces.

---

## 1. Global Integration Rules

### Base Endpoint Configuration
* **Base Path:** `/api/v1`
* **Content-Type:** `application/json` (except `/media/images` which is `multipart/form-data`)
* **Headers:** Enforce `Authorization: Bearer <JWT_ACCESS_TOKEN>` for all protected routes.

---

## 2. API Endpoint Directory

### Category: Admin Users (Platform Management)

#### 1. Suspend or Reactivate a User
* **Endpoint:** `PATCH /api/v1/admin/users/{userId}/status`
* **Actor:** Platform Admin
* **Request Body (`application/json`):**
  ```json
  {
    "status": "SUSPENDED", // "ACTIVE" or "SUSPENDED"
    "reason": "Violation of terms"
  }
  ```
* **Response Body (`UserSummary`):**
  ```json
  {
    "id": "e0a0d9b4-b490-4824-9b2f-76ee64db58ad",
    "fullName": "Imad Mansour",
    "email": "imad@example.com",
    "phone": "+963933111222",
    "platformRole": "USER",
    "status": "SUSPENDED"
  }
  ```
* **Frontend Guidelines:**
  * Require a confirmation dialog before deactivating/suspending a user.
  * When a user is suspended, the backend terminates all active sessions. The user will be automatically logged out on their next request.

---

### Category: Customer Coupons (Customer Portal)

#### 2. Claim or Retrieve Campaign Coupon (Idempotent Claim)
* **Endpoint:** `POST /api/v1/customer/campaigns/{campaignId}/coupons`
* **Actor:** Authenticated Customer (`USER` role)
* **Request Body (`application/json`):**
  ```json
  {
    "trackingToken": "src_whatsapp_xyz", // Optional, tracking token from direct link
    "entryPoint": "TRACKING_LINK"        // Optional: "DIRECT", "COUPONHUB_SEARCH", "TRACKING_LINK"
  }
  ```
* **Response Status Codes:**
  * **`201 Created`**: A new coupon has been claimed and issued.
  * **`200 OK`**: The customer already has a coupon for this campaign; the existing coupon is returned.
* **Response Body (`CouponDetails`):**
  ```json
  {
    "id": "d1c01e35-515a-4b05-9f5b-9d41334c9c22",
    "campaignId": "f9b8c7d6-e5d4-c3b2-a1b0-c9d8e7f6a5b4",
    "code": "CP87HJ6T",
    "status": "AVAILABLE",
    "effectiveStatus": "AVAILABLE",
    "issuedAt": "2026-07-11T15:20:00.000Z",
    "expiresAt": "2026-08-11T23:59:59.000Z",
    "offerTitle": "50% Discount on Pizza",
    "businessName": "Damascus Pizzeria",
    "qrToken": "70d9a8c7-b6e5-4a3d-2c1b-0a9b8c7d6e5f",
    "termsText": "Valid only for dine-in. One coupon per order.",
    "businessLogoUrl": "/uploads/logo-1234.png",
    "source": {
      "id": "a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6",
      "sourceType": "WHATSAPP",
      "label": "WhatsApp Share Link",
      "labelEn": "WhatsApp Share Link",
      "trackingToken": "src_whatsapp_xyz",
      "status": "ACTIVE"
    }
  }
  ```
* **Frontend Guidelines:**
  * **Idempotency Handling:** Accept both `200` and `201` as success states. Do not show error screens for `200` responses; proceed to render the coupon details or QR scanner code.
  * **Quota Limit (`409 Conflict`):** If the response is `409` with code `LIMIT_REACHED`, display a friendly message explaining that all available coupons for this campaign have been claimed.

#### 3. List Customer Coupons
* **Endpoint:** `GET /api/v1/customer/coupons`
* **Actor:** Authenticated Customer
* **Query Parameters:**
  * `status` (Optional): Filter by `effectiveStatus` (`AVAILABLE`, `REDEEMED`, `EXPIRED`, `CANCELLED`, `SUSPENDED`)
  * `page` (Optional, Default: `1`)
  * `limit` (Optional, Default: `20`)
* **Response Body (`CouponPage`):**
  ```json
  {
    "items": [
      {
        "id": "d1c01e35-515a-4b05-9f5b-9d41334c9c22",
        "campaignId": "f9b8c7d6-e5d4-c3b2-a1b0-c9d8e7f6a5b4",
        "code": "CP87HJ6T",
        "status": "AVAILABLE",
        "effectiveStatus": "AVAILABLE",
        "issuedAt": "2026-07-11T15:20:00.000Z",
        "expiresAt": "2026-08-11T23:59:59.000Z",
        "offerTitle": "50% Discount on Pizza",
        "businessName": "Damascus Pizzeria"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 1
    }
  }
  ```
* **Frontend Guidelines:**
  * **Effective Status vs. Server Status:** Use `effectiveStatus` to drive UI badges and filters. A coupon with a database status of `'AVAILABLE'` but whose `expiresAt` is in the past will return `effectiveStatus: 'EXPIRED'` automatically from the backend. Always rely on this field.

#### 4. Get a Customer-Owned Coupon Details
* **Endpoint:** `GET /api/v1/customer/coupons/{couponId}`
* **Actor:** Coupon Owner
* **Response Body (`CouponDetails`):** Same schema as `/customer/campaigns/{campaignId}/coupons`.
* **Frontend Guidelines:**
  * Prevent storing coupon pages in public browser caches.
  * Render `qrToken` as a QR code and present `code` as the manual fallback for staff entry.

---

### Category: Staff Redemptions (Merchant App / Branch View)

#### 5. Validate a Coupon Scan
* **Endpoint:** `POST /api/v1/staff/coupons/validate`
* **Actor:** Branch Staff
* **Request Body (`application/json`):**
  ```json
  {
    "qrToken": "70d9a8c7-b6e5-4a3d-2c1b-0a9b8c7d6e5f", // Provide QR token (UUID)
    "code": null                                     // Or manual alphanumeric code
  }
  ```
  *(Note: Exactly one of `qrToken` or `code` must be provided. Sending both or neither returns `400 BadRequest`.)*
* **Manual Code Normalization:** Manual alphanumeric codes are unified on the backend by stripping all whitespace and special separators (e.g., `-`, `_`, `,`, `.`, `/`, `\`, `|`, `;`, `:`, `.`) and converting the result to uppercase before verification.
* **Rate Limiting:** This endpoint enforces a rate limit of **30 validation attempts per minute** per active staff member membership. Exceeding this limit returns a `429 Too Many Requests` status code with the following JSON response:
  ```json
  {
    "statusCode": 429,
    "code": "TOO_MANY_ATTEMPTS",
    "message": {
      "ar": "لقد تجاوزت الحد المسموح به من محاولات التحقق. يرجى المحاولة لاحقاً.",
      "en": "Too many validation attempts. Please try again later."
    }
  }
  ```
* **Response Status Code:** `200 OK` (Even when the coupon is invalid or not found, the endpoint returns a `200` to allow the scanner UI to process structured results.)
* **Response Body (`ValidationResult`):**
  * **Valid Scan Response:**
    ```json
    {
      "result": "VALID",
      "failureReason": null,
      "coupon": {
        "id": "d1c01e35-515a-4b05-9f5b-9d41334c9c22",
        "campaignId": "f9b8c7d6-e5d4-c3b2-a1b0-c9d8e7f6a5b4",
        "code": "CP87HJ6T",
        "status": "AVAILABLE",
        "effectiveStatus": "AVAILABLE",
        "issuedAt": "2026-07-11T15:20:00.000Z",
        "expiresAt": "2026-08-11T23:59:59.000Z",
        "offerTitle": "50% Discount on Pizza",
        "businessName": "Damascus Pizzeria"
      },
      "benefit": {
        "benefitType": "PERCENTAGE",
        "percentageValue": 50,
        "fixedAmount": null,
        "currency": "SYP",
        "maxDiscountAmount": 10000,
        "description": "50% discount up to 10,000 SYP",
        "descriptionEn": "50% off up to 10,000 SYP"
      },
      "previouslyRedeemedAt": null
    }
    ```
  * **Invalid Scan Response:**
    ```json
    {
      "result": "INVALID",
      "failureReason": "EXPIRED", // Options: "NOT_FOUND", "WRONG_BUSINESS", "ALREADY_REDEEMED", "EXPIRED", "CANCELLED", "SUSPENDED", "CAMPAIGN_INACTIVE", "BRANCH_NOT_ALLOWED"
      "coupon": null,
      "benefit": null,
      "previouslyRedeemedAt": null
    }
    ```
* **Frontend Guidelines:**
  * Do **not** treat a successful validation as a redemption.
  * If `result` is `VALID`, show the coupon details and display a large, primary confirmation button to **Redeem**.
  * If `result` is `INVALID`, show a clean error state based on `failureReason` (e.g. "This coupon belongs to another merchant" for `WRONG_BUSINESS`). Keep the scanner active for subsequent scans.

#### 6. Confirm Coupon Redemption
* **Endpoint:** `POST /api/v1/staff/coupons/{couponId}/redeem`
* **Actor:** Branch Staff
* **Response Status Codes:**
  * **`201 Created`**: Newly redeemed.
  * **`200 OK`**: Idempotent response if already confirmed by this staff member.
* **Response Body (`Redemption`):**
  ```json
  {
    "id": "b3b2a1a0-9c8b-7d6e-5f4a-3b2c1d0a9f8e",
    "couponId": "d1c01e35-515a-4b05-9f5b-9d41334c9c22",
    "campaignId": "f9b8c7d6-e5d4-c3b2-a1b0-c9d8e7f6a5b4",
    "businessId": "c7b6a5d4-e3f2-1a0b-9c8d-7e6f5a4b3c2d",
    "branchId": "1a2b3c4d-5e6f-7a8b-9c0d-e1f2a3b4c5d6",
    "redeemedByMembershipId": "9f8e7d6c-5b4a-3b2c-1d0a-9f8e7d6c5b4a",
    "redeemedAt": "2026-07-11T15:24:00.000Z",
    "status": "CONFIRMED"
  }
  ```
* **Frontend Guidelines:**
  * Enforce a confirmation click (e.g., "Are you sure you want to redeem?") and immediately disable the button on click to prevent duplicate submissions.
  * Handle network timeouts gracefully: if a timeout occurs, do not assume it failed. Re-query the validation status to see if it is now `'REDEEMED'`.

#### 7. List Staff Redemption History
* **Endpoint:** `GET /api/v1/staff/redemptions`
* **Actor:** Branch Staff
* **Query Parameters:**
  * `page` (Optional, Default: `1`): Must be an integer greater than or equal to 1.
  * `limit` (Optional, Default: `20`): Must be an integer between 1 and 50 inclusive.
  * *(Note: Violating page or limit parameters returns `400 BadRequest` validation error.)*
* **Response Body (`RedemptionPage`):**
  ```json
  {
    "items": [
      {
        "id": "b3b2a1a0-9c8b-7d6e-5f4a-3b2c1d0a9f8e",
        "couponId": "d1c01e35-515a-4b05-9f5b-9d41334c9c22",
        "campaignId": "f9b8c7d6-e5d4-c3b2-a1b0-c9d8e7f6a5b4",
        "businessId": "c7b6a5d4-e3f2-1a0b-9c8d-7e6f5a4b3c2d",
        "branchId": "1a2b3c4d-5e6f-7a8b-9c0d-e1f2a3b4c5d6",
        "redeemedByMembershipId": "9f8e7d6c-5b4a-3b2c-1d0a-9f8e7d6c5b4a",
        "redeemedAt": "2026-07-11T15:24:00.000Z",
        "status": "CONFIRMED"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 1
    }
  }
  ```

---

### Category: Business Analytics (Merchant Dashboard)

#### 8. Get Campaign Performance Summary
* **Endpoint:** `GET /api/v1/business/campaigns/{campaignId}/analytics`
* **Actor:** Business Owner / Manager
* **Response Body (`CampaignAnalytics`):**
  ```json
  {
    "campaignId": "f9b8c7d6-e5d4-c3b2-a1b0-c9d8e7f6a5b4",
    "totalVisits": 1250,
    "knownUniqueUsers": 450,
    "anonymousUniqueVisitors": 600,
    "issuedCoupons": 350,
    "confirmedRedemptions": 120,
    "remainingQuota": 150,
    "claimRatePercent": 28.0,      // (issuedCoupons / totalVisits) * 100
    "redemptionRatePercent": 34.28 // (confirmedRedemptions / issuedCoupons) * 100
  }
  ```
* **Frontend Guidelines:**
  * Hide this tab or report from `STAFF` members; it must be visible only to business `OWNER` managers.

#### 9. Get Campaign Performance by Source
* **Endpoint:** `GET /api/v1/business/campaigns/{campaignId}/analytics/sources`
* **Actor:** Business Owner / Manager
* **Response Body (`Array<SourceAnalytics>`):**
  ```json
  [
    {
      "sourceId": "a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6",
      "sourceType": "WHATSAPP",
      "label": "WhatsApp Share Link",
      "totalVisits": 800,
      "issuedCoupons": 200,
      "confirmedRedemptions": 80,
      "claimRatePercent": 25.0,
      "redemptionRatePercent": 40.0
    }
  ]
  ```
* **Frontend Guidelines:**
  * Render this comparison as a table or bar chart (e.g. comparing Whatsapp, Facebook, Search, and Direct traffic).

---

### Category: Media (Media Assets Upload)

#### 10. Upload Business Logo or Campaign Image
* **Endpoint:** `POST /api/v1/media/images`
* **Actor:** Authenticated Merchant / Admin
* **Request Format:** `multipart/form-data`
* **Form Field Key:** `file` (binary payload)
* **Response Body (`ImageUploadResponse`):**
  ```json
  {
    "url": "/uploads/1720713845000-8f9d0c2b.png"
  }
  ```
* **Frontend Guidelines:**
  * **Client-Side Size Check:** Validate file size locally before sending (restrict files to `5MB` maximum).
  * **File Type Check:** Limit options in file dialogs to `.png`, `.jpg`, `.jpeg`, and `.webp`.
  * Use the returned relative `url` path to submit in the business profile edit or campaign creation forms.
