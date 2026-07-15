# CouponHub Syria — Backend API (MVP v0.2)

A robust, enterprise-grade NestJS backend API built with TypeORM, PostgreSQL, and Swagger. It powers the CouponHub Syria platform, providing full support for user authentication, multi-role role-based access control (RBAC), admin operations, customer coupon discovery/claiming, branch staff redemption verification, and merchant analytics.

---

## 🚀 Key Features Implemented

### 1. Robust Authentication & Session Management (`src/modules/auth`, `src/modules/identity`)
* **Role-Based Access Control (RBAC):** Restricts endpoints based on platform roles: `ADMIN`, `MERCHANT` (Business Owner/Manager), `STAFF` (Branch staff), and `USER` (Customer).
* **Token Rotation & Security:** Uses JWT access tokens (short-lived) and refresh tokens (long-lived) to maintain secure sessions.
* **Session Termination:** Suspended users are immediately logged out by terminating all active sessions on their next request.

### 2. Admin Operations & Platform Management (`src/modules/organizations`, `src/modules/campaigns`, `src/modules/reference-data`)
* **Atomic Merchant Onboarding:** Provision a partner business, its primary Damascus branch address, the business manager account (`OWNER`), and branch staff (`STAFF`) in a single transaction.
* **Category CRUD Management:** Build and manage category lists with bilingual properties (`nameAr` / `nameEn`).
* **Campaign Moderation Board:** A queue for platform admins to audit merchant-submitted campaigns. Actions include: Approve, Reject (with audit comment), Suspend, or Reactivate.
* **User Status Enforcement:** Toggle user accounts between `ACTIVE` and `SUSPENDED` states via `PATCH /api/v1/admin/users/{userId}/status`.

### 3. Customer Coupon Portal (`src/modules/coupons`, `src/modules/campaigns`)
* **Idempotent Claiming:** Allows authenticated customers to claim campaign coupons. If a coupon was already claimed for that campaign, it returns the existing coupon (returns `200 OK` or `201 Created` gracefully).
* **Attributed Claiming:** Claims are tracked with optional tracking sources (e.g., WhatsApp share links, Facebook campaigns, influencer links) and entry points (`DIRECT`, `COUPONHUB_SEARCH`, `TRACKING_LINK`).
* **Smart Coupon Badging:** Automatically calculates and returns the `effectiveStatus` (`AVAILABLE`, `REDEEMED`, `EXPIRED`, `CANCELLED`, `SUSPENDED`) instead of just raw database states.
* **My Coupons Feed:** Paginated query lists of customer-owned coupons with status filtering.

### 4. Staff Redemption Terminal (`src/modules/redemptions`, `src/modules/coupons`)
* **Double-Step Verification:**
  1. **Validate Scan (`POST /api/v1/staff/coupons/validate`):** Scans a QR token (UUID) or processes a manual alphanumeric code (e.g., `CH-XXXX-XXXX`). Returns validation details (Validity status, failure reasons like `WRONG_BUSINESS`, `EXPIRED`, etc.) *without* consuming the coupon.
  2. **Confirm Redemption (`POST /api/v1/staff/coupons/{couponId}/redeem`):** Staff explicitly clicks to consume the coupon, locking it to their assigned branch and creating a permanent redemption record.
* **Manual Code Normalization:** Automatically strips all whitespace and special separators (e.g., `-`, `_`, `,`, `.`, `/`, `\`, `|`, `;`, `:`, `.`) and converts characters to uppercase before running database checks.
* **Rate Limiting:** Protects the validation endpoint from brute-force attempts by enforcing **30 validation attempts per minute** per staff membership. Returns `429 Too Many Requests` with a bilingual error message.

### 5. Business Analytics & Performance (`src/modules/analytics`)
* **Campaign Performance Summary:** Real-time metrics including total visits, unique known users, anonymous unique visitors, issued coupons, confirmed redemptions, remaining quota, claim rates, and redemption rates.
* **Source-Based Performance Attribution:** Aggregates analytics by tracking source (e.g. WHATSAPP, FACEBOOK, INSTAGRAM) to help business owners identify which marketing channels are converting best.

### 6. Media Assets Upload (`src/modules/media`)
* **Local Media Driver:** Secure upload of business logos and campaign banners into local directory paths (`uploads/`).
* **Validation Guards:** Filters uploads by size (up to `5MB`) and restricts formats to `.png`, `.jpg`, `.jpeg`, and `.webp`.

---

## 🛠️ Technology Stack & Architecture

* **Framework:** NestJS (TypeScript Node.js Framework)
* **Database & ORM:** PostgreSQL + TypeORM
* **Validation:** `class-validator` & `class-transformer`
* **API Documentation:** OpenAPI/Swagger (`@nestjs/swagger`)
* **Security:** Helmet (secure HTTP headers), CORS, password hashing (bcrypt), and JWT tokenization.
* **Feature Flags:** Built-in modular toggle configurations for future AI capabilities (Campaign Copilot, Smart Search, Trust Shield, Impact Metrics).

---

## ⚙️ Project Setup & Getting Started

### Prerequisites
* **Node.js** (v18 or higher recommended)
* **npm** (v9 or higher)
* **Docker** & **Docker Compose** (for running the PostgreSQL instance easily)

### 1. Database Setup (Docker)
Start the PostgreSQL 16 container using the provided docker-compose configuration:
```bash
docker-compose up -d
```
*This spawns a PostgreSQL instance running on port `5432` with database name `copoun`.*

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and adjust variables if necessary:
```bash
cp .env.example .env
```
Ensure your database details match the docker container:
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=12345
DATABASE_NAME=copoun
DATABASE_MIGRATIONS_RUN=true
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Migrations
Run TypeORM schema migrations:
```bash
npm run migration:run
```

### 5. Start the Server
* **Development Mode (Auto-reload):**
  ```bash
  npm run start:dev
  ```
* **Production Mode:**
  ```bash
  npm run build
  npm run start:prod
  ```

The server will boot up on `http://localhost:3000` (default) with API base path `/api/v1`.

---

## 📚 API Reference & Swagger Documentation

When the application is running, the interactive Swagger UI documentation is available at:
👉 **[http://localhost:3000/api/docs](http://localhost:3000/api/docs)**

### Key Endpoint Groups

| Scope | Method | Path | Description | Access Role |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/v1/auth/login` | Login and receive access/refresh tokens | Public |
| **Admin** | `POST` | `/api/v1/admin/businesses` | Provision a new merchant + branches + staff | `ADMIN` |
| **Admin** | `PATCH` | `/api/v1/admin/users/:userId/status` | Suspend/Reactivate user login status | `ADMIN` |
| **Admin** | `GET` | `/api/v1/admin/campaigns` | List pending campaigns for moderation | `ADMIN` |
| **Customer** | `POST` | `/api/v1/customer/campaigns/:campaignId/coupons` | Claim coupon with tracking options | `USER` |
| **Customer** | `GET` | `/api/v1/customer/coupons` | List owned coupons with effective status badge | `USER` |
| **Staff** | `POST` | `/api/v1/staff/coupons/validate` | Scan validation (QR Token or manual code) | `STAFF` |
| **Staff** | `POST` | `/api/v1/staff/coupons/:couponId/redeem` | Confirm permanent consumption | `STAFF` |
| **Business** | `GET` | `/api/v1/business/campaigns/:campaignId/analytics` | High level metrics dashboard | `MERCHANT` |
| **Media** | `POST` | `/api/v1/media/images` | Upload image binary (`multipart/form-data`) | `MERCHANT`, `ADMIN` |

---

## 🧪 Testing & Code Quality

* Run unit tests:
  ```bash
  npm run test
  ```
* Run test coverage report:
  ```bash
  npm run test:cov
  ```
* Lint and format verification:
  ```bash
  npm run lint
  ```
