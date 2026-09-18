-- ==============================================================================
-- 🏨 OXYGEN ORBIS HOTEL & RESORT — PRODUCTION DATABASE SCHEMA
-- Target Engine: PostgreSQL 14+ (Supabase / AWS RDS / Neon / Local PostgreSQL)
-- Security: ACID Concurrency, Row-Level Constraints, Zero Double-Booking Protection
-- ==============================================================================

-- 1. Enable required cryptographic and range extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist"; -- Required for GIST date-range exclusion constraints

-- ==============================================================================
-- 2. ENUM TYPES (Restricts state transitions to strict valid values)
-- ==============================================================================

CREATE TYPE room_unit_status AS ENUM (
    'AVAILABLE',        -- Room is ready for guest check-in
    'OCCUPIED',         -- Guest is currently checked in
    'DIRTY',            -- Guest checked out; needs housekeeping cleaning
    'IN_CLEANING',      -- Housekeeping currently working on room
    'INSPECTED_CLEAN',  -- Housekeeping supervisor verified clean; ready to turn AVAILABLE
    'MAINTENANCE'       -- Temporarily out of order (repairs, AC servicing, plumbing)
);

CREATE TYPE booking_status AS ENUM (
    'PENDING_PAYMENT',  -- Guest initiated checkout; room held temporarily for 15 mins
    'CONFIRMED',        -- Payment verified by Paystack / Front desk; room allocated
    'CHECKED_IN',       -- Guest has arrived, scanned QR code, and received physical key
    'CHECKED_OUT',      -- Guest has departed; housekeeping notified
    'CANCELLED',        -- Reservation cancelled; room returned to inventory
    'EXPIRED'           -- Reservation hold timed out without payment
);

CREATE TYPE payment_provider AS ENUM (
    'PAYSTACK',         -- Automated card / dynamic virtual transfer / USSD
    'BANK_TRANSFER',    -- Direct manual wire to Oxygen Orbis bank account
    'POS_TERMINAL',     -- Physical card terminal swipe at front desk
    'CASH'              -- (Restricted / discouraged per resort policy)
);

CREATE TYPE payment_status AS ENUM (
    'PENDING',
    'SUCCESS',
    'FAILED',
    'REFUNDED'
);

CREATE TYPE staff_role AS ENUM (
    'SUPER_ADMIN',      -- General Manager / Owner: Full revenue access, rate overrides
    'FRONT_DESK',       -- Reception: Timeline grid, QR check-ins, walk-in creation
    'HOUSEKEEPING'      -- Cleaning staff: Room turnover and inspection states
);

-- ==============================================================================
-- 3. ROOM CATEGORIES TABLE (Public Room Types)
-- ==============================================================================

CREATE TABLE room_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(50) UNIQUE NOT NULL,                  -- e.g. 'deluxe-king', 'executive-suite'
    name VARCHAR(100) NOT NULL,                        -- 'Executive Suite with Balcony'
    description TEXT NOT NULL,
    price_ngn INTEGER NOT NULL CHECK (price_ngn > 0),   -- Price in Nigerian Naira (e.g. 115000)
    price_usd INTEGER NOT NULL CHECK (price_usd > 0),   -- Price in USD for diaspora (e.g. 150)
    size_sqm INTEGER NOT NULL CHECK (size_sqm > 0),     -- e.g. 58
    bed_type VARCHAR(100) NOT NULL,                    -- '1 Super King Bed'
    max_guests INTEGER NOT NULL DEFAULT 2 CHECK (max_guests BETWEEN 1 AND 10),
    view_type VARCHAR(100) NOT NULL,                   -- 'Panoramic Pool & Sunset View'
    total_rooms INTEGER NOT NULL DEFAULT 1 CHECK (total_rooms > 0),
    amenities JSONB NOT NULL DEFAULT '[]'::jsonb,       -- Array of amenity strings
    images JSONB NOT NULL DEFAULT '[]'::jsonb,          -- High-res image URLs
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 4. PHYSICAL ROOM UNITS TABLE (Specific Room Numbers in Resort)
-- ==============================================================================

CREATE TABLE room_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_type_id UUID NOT NULL REFERENCES room_types(id) ON DELETE RESTRICT,
    room_number VARCHAR(20) UNIQUE NOT NULL,           -- e.g. '101', '204', 'PH-01'
    floor INTEGER NOT NULL DEFAULT 1,
    status room_unit_status NOT NULL DEFAULT 'AVAILABLE',
    notes TEXT,                                        -- e.g. 'Poolside view, newly painted'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_room_units_type ON room_units(room_type_id);
CREATE INDEX idx_room_units_status ON room_units(status);

-- ==============================================================================
-- 5. GUESTS TABLE
-- ==============================================================================

CREATE TABLE guests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NOT NULL,                        -- e.g. '+2348060648413'
    whatsapp VARCHAR(30),
    notes TEXT,                                        -- VIP guest notes, preferences
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_guests_email ON guests(email);
CREATE INDEX idx_guests_phone ON guests(phone);

-- ==============================================================================
-- 6. ADDONS CATALOG TABLE (Upsells)
-- ==============================================================================

CREATE TABLE addons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(50) UNIQUE NOT NULL,                  -- 'train-pickup', 'rooftop-dinner'
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price_ngn INTEGER NOT NULL CHECK (price_ngn >= 0),
    price_usd INTEGER NOT NULL CHECK (price_usd >= 0),
    category VARCHAR(50) NOT NULL,                     -- 'Transport', 'Dining', 'Wellness'
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 7. BOOKINGS TABLE (Core Reservation Engine with Double-Booking Exclusion)
-- ==============================================================================

CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_ref VARCHAR(20) UNIQUE NOT NULL,           -- Unique human-readable code: e.g. 'OXY-784920'
    guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE RESTRICT,
    room_type_id UUID NOT NULL REFERENCES room_types(id) ON DELETE RESTRICT,
    room_unit_id UUID REFERENCES room_units(id) ON DELETE SET NULL, -- Assigned specific room
    
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    guests_count INTEGER NOT NULL DEFAULT 1 CHECK (guests_count > 0),
    
    status booking_status NOT NULL DEFAULT 'PENDING_PAYMENT',
    currency VARCHAR(3) NOT NULL DEFAULT 'NGN' CHECK (currency IN ('NGN', 'USD')),
    
    room_amount INTEGER NOT NULL CHECK (room_amount >= 0),
    addons_amount INTEGER NOT NULL DEFAULT 0 CHECK (addons_amount >= 0),
    total_amount INTEGER NOT NULL CHECK (total_amount >= 0),
    
    special_requests TEXT,
    hold_expires_at TIMESTAMPTZ,                       -- 15-min countdown for PENDING_PAYMENT
    checked_in_at TIMESTAMPTZ,
    checked_out_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Business Logic Invariants
    CONSTRAINT check_dates_validity CHECK (check_out > check_in),

    -- ========================================================================
    -- 🛡️ SECURITY DEFENSE: MATHEMATICAL EXCLUSION CONSTRAINT
    -- Prevents overlapping confirmed or checked-in bookings for the exact same
    -- physical room unit. If two transactions attempt to overlap, the database
    -- engine itself rejects the second one atomically!
    -- ========================================================================
    EXCLUDE USING gist (
        room_unit_id WITH =,
        daterange(check_in, check_out, '[)') WITH &&
    ) WHERE (status IN ('CONFIRMED', 'CHECKED_IN'))
);

CREATE INDEX idx_bookings_ref ON bookings(booking_ref);
CREATE INDEX idx_bookings_dates ON bookings(check_in, check_out);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_guest ON bookings(guest_id);

-- ==============================================================================
-- 8. BOOKING ADDONS JUNCTION TABLE
-- ==============================================================================

CREATE TABLE booking_addons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    addon_id UUID NOT NULL REFERENCES addons(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price INTEGER NOT NULL CHECK (unit_price >= 0),
    total_price INTEGER NOT NULL CHECK (total_price >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_booking_addons_booking ON booking_addons(booking_id);

-- ==============================================================================
-- 9. PAYMENTS TABLE (Audit & Reconciliation)
-- ==============================================================================

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
    provider payment_provider NOT NULL,
    provider_reference VARCHAR(150) UNIQUE,            -- Paystack transaction reference
    amount INTEGER NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'NGN',
    status payment_status NOT NULL DEFAULT 'PENDING',
    payment_method VARCHAR(50),                        -- 'card', 'bank_transfer', 'ussd'
    card_last4 VARCHAR(4),
    card_bank VARCHAR(100),
    paid_at TIMESTAMPTZ,
    raw_webhook_payload JSONB,                         -- Full cryptographic log for dispute audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_ref ON payments(provider_reference);
CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_status ON payments(status);

-- ==============================================================================
-- 10. STAFF USERS TABLE (Front Desk & Management)
-- ==============================================================================

CREATE TABLE staff_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,               -- Argon2id or Bcrypt hash (never plaintext)
    full_name VARCHAR(150) NOT NULL,
    role staff_role NOT NULL DEFAULT 'FRONT_DESK',
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 11. AUTOMATIC UPDATED_AT TRIGGER FUNCTION
-- ==============================================================================

CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_room_types_updated BEFORE UPDATE ON room_types FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
CREATE TRIGGER trg_room_units_updated BEFORE UPDATE ON room_units FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
CREATE TRIGGER trg_guests_updated BEFORE UPDATE ON guests FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
CREATE TRIGGER trg_bookings_updated BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
CREATE TRIGGER trg_staff_users_updated BEFORE UPDATE ON staff_users FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- ==============================================================================
-- 12. SEED DATA FOR OXYGEN ORBIS (Moniya, Ibadan)
-- ==============================================================================

-- Seed Room Categories
INSERT INTO room_types (slug, name, description, price_ngn, price_usd, size_sqm, bed_type, max_guests, view_type, total_rooms, amenities, images)
VALUES
(
    'deluxe-king',
    'Deluxe King Room',
    'An intimate sanctuary designed for weekend relaxation, remote work getaways, and rejuvenating sleep.',
    48000, 65, 34, '1 King Bed (Orthopedic)', 2, 'Lush Courtyard View', 12,
    '["Complimentary Daily Breakfast", "High-Speed Fiber Wi-Fi", "50\" Smart 4K TV", "24/7 Guaranteed Power", "Silent Split AC", "Private Rain Shower", "Tea/Coffee Station"]'::jsonb,
    '["https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80"]'::jsonb
),
(
    'executive-room',
    'Executive Room',
    'Spacious luxury designed for business travelers and couples seeking elevated comfort with poolside vistas.',
    72000, 95, 44, '1 Super King Bed', 2, 'Swimming Pool & Palm View', 16,
    '["Pool View Balcony", "Complimentary Breakfast for Two", "55\" Smart 4K TV", "High-Speed Fiber Wi-Fi", "24/7 Power", "Bathrobes & Slippers", "Minibar", "Pool Access"]'::jsonb,
    '["https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80"]'::jsonb
),
(
    'executive-suite',
    'Executive Suite with Balcony',
    'A haven of prestige featuring a separate living room lounge, oversized private balcony, and deep soaking tub.',
    115000, 150, 58, '1 Master King Bed + Plush Sofa', 3, 'Panoramic Pool & Sunset View', 8,
    '["Private Sunset Balcony", "Separate Living Lounge", "Deep Soaking Bathtub", "Free Gourmet Breakfast", "VIP Welcome Drink", "Priority Table at Rooftop Lounge", "Nespresso Machine"]'::jsonb,
    '["https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80"]'::jsonb
),
(
    'presidential-suite',
    'Presidential Penthouse Suite',
    'The crown jewel of Oxygen Orbis. Unmatched grandeur with private rooftop terrace access, master jacuzzi, and butler support.',
    210000, 275, 95, '1 Master Emperor Bed + Dressing Suite', 4, '360° Moniya Skyline & Resort Grounds', 4,
    '["Private Rooftop Terrace", "In-Suite Jacuzzi", "Dining Table for 6", "VIP Moniya Train Pickup Included", "Chilled Champagne on Arrival", "All-Inclusive Minibar", "24/7 Butler Service"]'::jsonb,
    '["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80"]'::jsonb
);

-- Seed Addons
INSERT INTO addons (slug, name, description, price_ngn, price_usd, category)
VALUES
('train-pickup', 'Moniya Train Station VIP Pickup', 'Private chauffeured car waiting at Moniya Lagos-Ibadan train terminal.', 10000, 15, 'Transport'),
('rooftop-dinner', 'Romantic Rooftop Candlelight Dinner', 'Reserved VIP table at Oxygen Rooftop Lounge with 3-course chef menu & wine pairing.', 35000, 45, 'Dining'),
('spa-massage', 'Oxygen Signature Spa Massage (60 Mins)', 'Deep tissue or Swedish relaxation massage by certified therapists.', 25000, 32, 'Wellness'),
('champagne-ice', 'Luxury Chilled Champagne on Arrival', 'Chilled bottle of Moët & Chandon or sparkling vintage with flute glasses.', 55000, 70, 'Romance'),
('late-checkout', 'Guaranteed Late Check-Out (Until 3 PM)', 'Relax and savor your stay without morning rush.', 15000, 20, 'Comfort');
