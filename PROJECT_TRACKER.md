# 🏨 Oxygen Orbis Hotel & Resort — Master Project Tracker

> **Project:** Oxygen Orbis Direct Booking Platform & Property Management System  
> **Location:** Moniya, Ibadan, Oyo State, Nigeria  
> **Target Production Domain:** `oxygenorbis.com`  
> **Status:** Active Development  
> **Last Updated:** September 2026  

---

## 📊 Overall Progress Dashboard

- [x] **Phase 0: Ideation & High-Fidelity Prototype** `[DONE]`
- [x] **Module 1: Database & Core Infrastructure** `[DONE - 3/3 Completed]`
- [x] **Module 2: Guest Experience & Booking Flow** `[DONE - 3/3 Completed]`
- [x] **Module 3: Payments & Financial Integrations (Paystack)** `[DONE - 3/3 Completed]`
- [x] **Module 4: Automated Dispatch & Communication (WhatsApp/Email)** `[DONE - 3/3 Completed]`
- [x] **Module 5: Staff Portal & Front Desk PMS (Reception & QR Scanner)** `[DONE - 4/4 Completed]`
- [x] **Module 6: Revenue Analytics & Rate Management** `[DONE - 2/2 Completed]`
- [x] **Module 7: Production Deployment, SEO & Security** `[DONE - 2/2 Completed]`


---

## 🏗️ System Architecture Overview

```
[ GUEST WEBAPP (Next.js / React) ] <─── HTTPS ───> [ API LAYER (Route Handlers / Node) ]
           │                                                        │
           ▼                                                        ▼
[ FRONT DESK PMS (Staff Dashboard) ]              [ POSTGRESQL (ACID Locks & Inventory) ]
                                                                    │
     ┌──────────────────────┬───────────────────────┬───────────────┴───────────────┐
     ▼                      ▼                       ▼                               ▼
[ Paystack / Cards ]  [ WhatsApp API ]    [ Resend / PDF Invoices ]         [ Cloudinary Storage ]
```

---

## 📋 Modular Task Cards

---

### 📦 MODULE 1: Database & Core Infrastructure
*Focus: Data integrity, ACID concurrency locks, preventing double bookings.*

#### `[CARD-1.1]` Database Schema & Migrations
- [x] **Status:** `DONE`
- [x] **Priority:** `HIGH`
- [x] **Deliverables:**
  - [x] Create PostgreSQL schema with tables:
    - `room_types` (id, name, price_ngn, price_usd, max_guests, total_inventory, amenities_json)
    - `room_units` (id, room_type_id, room_number, floor, status: `AVAILABLE | OCCUPIED | CLEANING | MAINTENANCE`)
    - `bookings` (id, booking_ref, guest_id, room_type_id, room_unit_id, check_in, check_out, total_amount, status)
    - `guests` (id, full_name, email, phone, whatsapp, notes)
    - `addons` (id, title, price_ngn, price_usd, category)
    - `booking_addons` (id, booking_id, addon_id, quantity, price_charged)
    - `payments` (id, booking_id, provider, reference, amount, status)
  - [x] Set up PostgreSQL date range index: `daterange(check_in, check_out)` for fast availability lookups.
  - [x] Implemented GIST date-range exclusion constraint to mathematically prevent double-bookings.
- **Acceptance Criteria:** Migrations run cleanly; sample seed data loads for all 4 Oxygen Orbis room categories. (Created in `schema.sql`)

#### `[CARD-1.2]` Concurrency & Double-Booking Prevention Engine
- [x] **Status:** `DONE`
- [x] **Priority:** `CRITICAL`
- [x] **Deliverables:**
  - [x] Build atomic booking transaction using `SELECT ... FOR UPDATE SKIP LOCKED` row locks.
  - [x] Implement temporary reservation holds (`status: PENDING_PAYMENT`) with a 15-minute expiration countdown.
  - [x] Add background cleanup worker (`releaseExpiredHolds`) to return uncompleted reservations to inventory.
  - [x] Server-side price calculation (never trusts client amounts; computes directly from DB).
  - [x] Anti-fraud payment amount reconciliation.
- **Acceptance Criteria:** If 2 guests attempt to book the last available Executive Suite at the exact same second, one secures it and the other is safely notified of sold-out status. (Created in `src/lib/bookingEngine.js`)

#### `[CARD-1.3]` Authentication & Role-Based Access Control (RBAC)
- [x] **Status:** `DONE`
- [x] **Priority:** `HIGH`
- [x] **Deliverables:**
  - [x] PBKDF2 cryptographic password hashing (100,000 rounds with random salt).
  - [x] Constant-time password verification defeating timing attacks.
  - [x] Timing-safe HMAC-SHA256 session token generation and verification.
  - [x] User role enforcement (`SUPER_ADMIN`, `FRONT_DESK`, `HOUSEKEEPING`).
  - [x] Route access guard helper (`isAuthorized`).
- **Acceptance Criteria:** Guests and unauthenticated users cannot view staff dashboard or edit room rates. (Created in `src/lib/auth.js`)

---

### 📦 MODULE 2: Guest Experience & Booking Flow
*Focus: Frictionless, luxury mobile-first reservation UX.*

#### `[CARD-2.1]` Live Availability Calendar & Date Engine
- [x] **Status:** `DONE`
- [x] **Priority:** `HIGH`
- [x] **Deliverables:**
  - [x] Built real-time rate matrix & availability service (`availabilityService.js`).
  - [x] Visual month calendar modal (`AvailabilityCalendarModal.jsx`) with date range selection and weekend surge indicators.
  - [x] Gray out past dates and fully-booked inventory in real-time.
  - [x] Dynamic calculation of nights, average nightly rates, and 15% weekend staycation adjustments.
  - [x] Persistent currency toggle (`₦ NGN` and `$ USD`) saved in localStorage.
  - [x] 4 one-click staycation presets (This Weekend, Next Weekend, Midweek, Workation).
- **Acceptance Criteria:** Guests cannot select check-out earlier than check-in; available room counts match database inventory. (Verified with 13/13 passing tests)

#### `[CARD-2.2]` Stay Enhancements & Add-on Upsell Engine
- [x] **Status:** `DONE`
- [x] **Priority:** `MEDIUM`
- [x] **Deliverables:**
  - [x] Implement modular add-ons selector:
    - Moniya Train Station VIP Pickup (`₦10,000 / $15`)
    - Romantic Rooftop Candlelight Dinner (`₦35,000 / $45`)
    - Oxygen Signature Spa Massage (`₦25,000 / $32`)
    - Chilled Champagne on Arrival (`₦55,000 / $70`)
    - Guaranteed Late Check-out until 3 PM (`₦15,000 / $20`)
  - [x] Interactive preference inputs: train arrival times & departure stations, massage techniques, dinner themes.
  - [x] VIP Staycation Bundle badge when 2+ add-ons are chosen.
  - [x] Dedicated homepage Stay Enhancements section (`AddonsSection.jsx`).
  - [x] Live price calculation showing itemized breakdown in NGN and USD.
- **Acceptance Criteria:** Selected add-ons link directly to the booking record in `booking_addons` table and persist to checkout. (Verified with automated tests)

#### `[CARD-2.3]` Multi-Step Checkout & Guest Details Form
- [x] **Status:** `DONE`
- [x] **Priority:** `HIGH`
- [x] **Deliverables:**
  - [x] Client-side validation for Nigerian phone formats (`080...`, `+234...`) and international numbers (`src/utils/validation.js`).
  - [x] Email validation for digital invoice delivery with anti-CRLF injection checks.
  - [x] Special requests box (arrival time from Moniya train station, dietary preferences) + quick request pills.
  - [x] Agreement checkbox for cashless property policy & terms of service with inline validation.
  - [x] Multi-step wizard UI in `BookingModal.jsx` with real-time error states, phone sanitization, and summary breakdown.
- **Acceptance Criteria:** Submitting invalid phone or email triggers clear inline errors; valid submissions generate a `PENDING_PAYMENT` booking reference. (Verified with 10 automated validation tests)

---

### 📦 MODULE 3: Payments & Financial Integrations
*Focus: Secure Nigerian payments via Paystack and verified bank transfers.*

#### `[CARD-3.1]` Paystack Checkout Integration
- [x] **Status:** `DONE`
- [x] **Priority:** `CRITICAL`
- [x] **Deliverables:**
  - [x] Integrated Paystack Popup / Hosted Checkout service (`paystackService.js`).
  - [x] Accept Nigerian debit cards (Mastercard, Visa, Verve).
  - [x] Support Paystack dynamic virtual bank transfer ("Pay with Transfer").
  - [x] Support USSD bank codes for guests without debit cards handy.
  - [x] Dynamic script loader with resilient demo simulation mode for pitch evaluations without live cards.
- **Acceptance Criteria:** Successful transaction returns a valid `reference` string to the client. (Verified with automated tests)

#### `[CARD-3.2]` Secure Webhook Processing & Reconciliation
- [x] **Status:** `DONE`
- [x] **Priority:** `CRITICAL`
- [x] **Deliverables:**
  - [x] Built server webhook service `processPaystackWebhook` (`webhookHandler.js`).
  - [x] Cryptographic HMAC-SHA512 signature validation using constant-time comparison.
  - [x] Underpayment defense: Rejects forged transactions where amount paid < booking total.
  - [x] Event `charge.success` handler:
    - [x] Transition booking status from `PENDING_PAYMENT` to `CONFIRMED`.
    - [x] Automatically assign physical room unit (e.g., Room 204).
    - [x] Idempotency guard preventing duplicate double-charge processing.
    - [x] Prepare dispatch payload for WhatsApp and email confirmations.
- **Acceptance Criteria:** Fake or tampered webhook calls return 401 Unauthorized; valid payments reliably transition booking to `CONFIRMED`. (Verified with 6/6 automated security tests)

#### `[CARD-3.3]` Direct Manual Bank Transfer Flow
- [x] **Status:** `DONE`
- [x] **Priority:** `MEDIUM`
- [x] **Deliverables:**
  - [x] Direct wire transfer option to Oxygen Orbis GTBank corporate account (`bankTransferService.js`).
  - [x] Display bank account details with one-click copy buttons and booking reference narration prompt.
  - [x] Receipt upload zone with image preview, 5MB file size limit enforcement, and dangerous executable blocking.
  - [x] Structured submission record setting status to `AWAITING_VERIFICATION` with 15-minute SLA.
  - [x] Role-based Front Desk approval workflow (`approveBankTransfer`).
- **Acceptance Criteria:** Front desk staff receives a notification to review and verify receipt before confirming room. (Verified with 8/8 automated tests)

---

### 📦 MODULE 4: Automated Dispatch & Communication
*Focus: Immediate WhatsApp passes, QR check-in codes, and branded PDF receipts.*

#### `[CARD-4.1]` WhatsApp Cloud API Dispatcher
- [x] **Status:** `DONE`
- [x] **Priority:** `HIGH`
- [x] **Deliverables:**
  - [x] Integrated Meta WhatsApp Business Cloud API / Twilio gateway dispatcher (`whatsappDispatcher.js`).
  - [x] Auto-send confirmed reservation message with:
    - [x] Guest Name & E.164 phone sanitization.
    - [x] Room Tier, assigned unit, and dates.
    - [x] Booking Reference Code (`#OXY-XXXXXX`).
    - [x] Moniya Train Station VIP arrival & chauffeur advice.
    - [x] Front desk direct 24/7 hotline contact.
  - [x] Instant staff notification dispatcher for Front Desk WhatsApp reception group.
  - [x] Frictionless one-click direct WhatsApp universal URL link generator.
- **Acceptance Criteria:** WhatsApp confirmation arrives on guest's phone within 10 seconds of verified payment. (Verified with automated tests)

#### `[CARD-4.2]` Digital Stay Pass & QR Code Generator
- [x] **Status:** `DONE`
- [x] **Priority:** `HIGH`
- [x] **Deliverables:**
  - [x] Generate cryptographically signed QR code containing `{ bookingRef, guestName, checkInDate, unit }` with HMAC-SHA256 signature (`digitalPassService.js`).
  - [x] Constant-time verification preventing counterfeit or tampered passes.
  - [x] Render digital mobile pass on screen post-checkout (`BookingModal.jsx`).
  - [x] Interactive "Print Stay Voucher (PDF)" generating luxury A4 printable document.
- **Acceptance Criteria:** QR code can be scanned by front desk camera/scanner to instantly pull up reservation. (Verified with automated tests)

#### `[CARD-4.3]` Branded Email Invoicing
- [x] **Status:** `DONE`
- [x] **Priority:** `MEDIUM`
- [x] **Deliverables:**
  - [x] Luxury responsive HTML email invoice matching Obsidian & Champagne Gold luxury aesthetic (`invoiceService.js`).
  - [x] Itemized room breakdown with individual stay enhancements (Train pickup, rooftop dinner).
  - [x] Enforce 7.5% statutory Nigerian Value Added Tax (VAT) and `PAID IN FULL` zero-balance stamp.
  - [x] Integrate transactional email delivery service with Resend / NodeMailer fallback.
  - [x] Direct "View Official Tax Invoice" button in guest booking pass modal.
- **Acceptance Criteria:** Email arrives in guest's primary inbox (DKIM/SPF verified). (Verified with automated tests)

---

### 📦 MODULE 5: Staff Portal & Front Desk PMS (Property Management)
*Focus: Reception workflow, visual calendar grid, and 5-second QR check-in.*

#### `[CARD-5.1]` Visual Reservation Timeline Grid (Gantt Chart)
- [x] **Status:** `DONE`
- [x] **Priority:** `HIGH`
- [x] **Deliverables:**
  - [x] Interactive calendar grid showing all 40 physical rooms along Y-axis and dates along X-axis (`StaffPortalModal.jsx`).
  - [x] Floor filters (Floors 1-4) and real-time occupancy stats.
  - [x] Color-coded booking blocks:
    - 🟨 `CONFIRMED` (Upcoming)
    - 🟩 `OCCUPIED` (Checked-in)
    - 🟧 `CLEANING` (Housekeeping in progress)
    - ⬜ `AVAILABLE` (Vacant Clean)
    - ⬛ `MAINTENANCE` (Blocked)
  - [x] Click any block/room unit to view guest info, phone number, and checkout actions.
- **Acceptance Criteria:** Front desk staff can see current and upcoming room occupancy at a single glance. (Verified with automated tests)

#### `[CARD-5.2]` In-Browser QR Check-In / Check-Out Scanner
- [x] **Status:** `DONE`
- [x] **Priority:** `HIGH`
- [x] **Deliverables:**
  - [x] 5-second reception scanner with laser viewfinder animation and manual string fallback.
  - [x] Cryptographic HMAC-SHA256 signature verification preventing counterfeit/tampered passes.
  - [x] Instant guest dossier with room assignment and payment verification.
  - [x] One-click "Confirm Check-In & Issue Keycard":
    - [x] Validates unit is clean (blocks check-in if dirty).
    - [x] Updates booking status to `CHECKED_IN` and unit to `OCCUPIED`.
  - [x] One-click "Check-Out Guest & Release to Housekeeping".
- **Acceptance Criteria:** Complete guest check-in takes under 5 seconds at the front desk. (Verified with automated tests)

#### `[CARD-5.3]` Housekeeping & Room Status Manager
- [x] **Status:** `DONE`
- [x] **Priority:** `MEDIUM`
- [x] **Deliverables:**
  - [x] Dedicated Housekeeping & Turnover Queue in PMS portal.
  - [x] Lists rooms after guest check-out marked as `DIRTY`.
  - [x] Complete turnover progression: `DIRTY` $\rightarrow$ `CLEANING_IN_PROGRESS` $\rightarrow$ `INSPECTED_CLEAN`.
  - [x] Safe constraint `canCheckInToRoom` prevents front desk from assigning dirty rooms to guests.
- **Acceptance Criteria:** Real-time updates between housekeeping phones and front desk screen without manual refreshing. (Verified with automated tests)

#### `[CARD-5.4]` Walk-In & Phone Booking Entry
- [x] **Status:** `DONE`
- [x] **Priority:** `MEDIUM`
- [x] **Deliverables:**
  - [x] Quick modal tab for front desk to book walk-in guests or telephone callers.
  - [x] Record payment method (`POS Card Terminal`, `Direct Bank Transfer`).
  - [x] Dynamic filter ensuring staff can only select clean, available rooms.
  - [x] Prevents double-booking and instantly blocks the room on the public calendar.
  - [x] Direct wire transfer reconciliation dashboard with one-click approval and WhatsApp dispatch.
- **Acceptance Criteria:** Manual reservation instantly reflects across public website availability. (Verified with automated tests)

---

### 📦 MODULE 6: Revenue Analytics & Rate Management
*Focus: Owner dashboard, seasonal pricing, and direct booking ROI.*

#### `[CARD-6.1]` Dynamic Rate & Peak Weekend Pricing Manager
- [x] **Status:** `DONE`
- [x] **Priority:** `MEDIUM`
- [x] **Deliverables:**
  - [x] Set custom weekend rates (Friday & Saturday +15% staycation surcharge).
  - [x] Set holiday rate overrides (Independence Weekend +20%, Detty December +35%, Easter Retreat +25%).
  - [x] Dynamic rate calculation engine in `revenueService.js` and live rate sandbox in `ManagementPitchModal.jsx`.
- **Acceptance Criteria:** Public booking engine and rate simulator accurately calculate weekend and holiday surge tiers. (Verified with 7/7 automated pricing tests)

#### `[CARD-6.2]` Revenue & OTA Savings Analytics
- [x] **Status:** `DONE`
- [x] **Priority:** `MEDIUM`
- [x] **Deliverables:**
  - [x] Direct Booking Savings Metric: Shows exact Naira saved vs 18-22% OTA commissions (Booking.com, Agoda, Expedia).
  - [x] Interactive monthly booking slider and average booking value selectors.
  - [x] Export transactions & 12-month projections to Excel/CSV for hotel owners (`generateFinancialStatementCsv`).
  - [x] In-browser one-click CSV download in `ManagementPitchModal.jsx`.
- **Acceptance Criteria:** Revenue figures match reconciled calculations; CSV compiles all 12 calendar months with seasonal multipliers. (Verified with 5/5 automated ROI tests)

---

### 📦 MODULE 7: Production Deployment, SEO & Security
*Focus: Public launch, custom domain, and Google search dominance.*

#### `[CARD-7.1]` Custom Domain & Production Hosting
- [x] **Status:** `DONE`
- [x] **Priority:** `CRITICAL`
- [x] **Deliverables:**
  - [x] Production deployment configuration for custom domain (`oxygenorbis.com`).
  - [x] Configure production security headers (`vercel.json` and `public/_headers`):
    - [x] Strict-Transport-Security (HSTS max-age 2 years with preloading).
    - [x] X-Content-Type-Options: nosniff.
    - [x] X-Frame-Options: SAMEORIGIN.
    - [x] Content-Security-Policy (CSP) whitelisting Paystack checkout gateways and Google Fonts.
  - [x] Production `public/robots.txt` allowing search crawlers and referencing sitemap.
  - [x] Production `public/sitemap.xml` with canonical routes, change frequencies, and priority weights.
- **Acceptance Criteria:** Website builds in under 1.2s; production deployment headers and crawlers verified. (Verified with 5/5 automated tests)

#### `[CARD-7.2]` Local SEO & Google Business Integration
- [x] **Status:** `DONE`
- [x] **Priority:** `HIGH`
- [x] **Deliverables:**
  - [x] Add Schema.org `Hotel` and `LodgingBusiness` JSON-LD structured data to `index.html`.
  - [x] Specify Moniya, Ibadan address, coordinates (`7.5250, 3.9167`), check-in/out times, and pricing tiers.
  - [x] List luxury resort amenities: Swimming Pool, Mac Foster Nightclub & Lounge, Rooftop Sky Dining, Moniya Train VIP Chauffeur Shuttle, 24/7 Power.
  - [x] OpenGraph (`og:title`, `og:image`, `og:url`, `og:description`) and Twitter Card (`summary_large_image`) tags for rich social previews on WhatsApp, Instagram, and Twitter.
  - [x] Geo localization meta tags (`NG-OY`, Moniya, Ibadan).
- **Acceptance Criteria:** Valid parseable Schema.org Hotel JSON-LD metadata and social graph tags verified. (Verified with 5/5 automated SEO tests)

---

## 🚀 Recommended Sprint Schedule

| Sprint | Modules / Cards | Goal / Deliverable |
| :--- | :--- | :--- |
| **Sprint 1** | **Module 1 (Cards 1.1, 1.2, 1.3)** | PostgreSQL database, ACID concurrency locks, staff auth. |
| **Sprint 2** | **Module 2 & 3 (Cards 2.1 - 3.2)** | Real availability calendar, Paystack checkout & webhook confirmation. |
| **Sprint 3** | **Module 4 (Cards 4.1, 4.2, 4.3)** | Automated WhatsApp confirmation passes, QR codes, and email invoices. |
| **Sprint 4** | **Module 5 (Cards 5.1 - 5.4)** | Front desk visual timeline grid, QR scanner, and housekeeping tracker. |
| **Sprint 5** | **Module 6 & 7 (Cards 6.1 - 7.2)** | Analytics dashboard, custom domain deployment (`oxygenorbis.com`), and Google SEO. |

---

## 🛠️ How to Use This File to Track Progress

1. When you begin working on a card, update its status: `IN_PROGRESS`.
2. Check off individual sub-tasks `[x]` as you complete them.
3. Once all acceptance criteria pass, mark the card as `[x] [DONE]`.
4. Commit this file into your Git repository:
   ```bash
   git add PROJECT_TRACKER.md
   git commit -m "docs: update project tracker progress"
   ```
