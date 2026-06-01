# StudioBook Dubai — MVP Setup Guide

Real-time production studio booking platform for Dubai.
Book studios, check live availability, process payments — no WhatsApp required.

---

## Prerequisites

- Node.js 18+ (https://nodejs.org)
- npm 9+

---

## Quick Start (5 minutes)

### 1. Install dependencies

```bash
npm install
```

This installs: Next.js, React, better-sqlite3, date-fns, uuid

### 2. Configure environment

```bash
cp .env.example .env.local
```

For local development, the defaults work out of the box (Mock Stripe is pre-enabled).

### 3. Seed the database

```bash
npm run seed
```

This creates `data/studio_booking.db` and populates:
- 6 Dubai production studios (Studio Society, Ravenscar, Luma, AWS, Garage, HotCold)
- 10 add-on services
- 60 days of hourly availability blocks
- Realistic sample "already booked" slots for demo purposes

### 4. Start the dev server

```bash
npm run dev
```

Open http://localhost:3000

---

## Using the App

### Flow

1. **Home page** — Search by date, time, size, and requirements
2. **Studio detail** — Browse gallery, view availability calendar, select time slot + add-ons
3. **Checkout** — Fill in client details, select deposit or full payment, enter mock card
4. **Confirmation** — Booking confirmed, studio contact details revealed, contract downloadable

### Mock Stripe

By default, `NEXT_PUBLIC_MOCK_STRIPE=true` in `.env.local`.

Enter **any card number** (e.g. `4242 4242 4242 4242`), any expiry, any CVC.

To use real Stripe:
1. Get your keys from https://dashboard.stripe.com/test/apikeys
2. Set in `.env.local`:
   ```
   NEXT_PUBLIC_MOCK_STRIPE=false
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```
3. Install Stripe:
   ```bash
   npm install stripe @stripe/stripe-js @stripe/react-stripe-js
   ```
4. Update `pages/checkout/index.js` to use `@stripe/react-stripe-js` Elements

---

## Project Structure

```
studio-booking/
├── lib/
│   ├── db.js              # SQLite connection + schema initialisation
│   ├── seed.js            # 6 Dubai studios + availability data
│   ├── availability.js    # Core booking logic (check/lock/release slots)
│   └── contract.js        # HTML booking contract generator
│
├── pages/
│   ├── index.js           # PAGE 1: Studio Discovery
│   ├── studios/[slug].js  # PAGE 2: Studio Detail
│   ├── checkout/index.js  # PAGE 3: Checkout
│   ├── confirmation/[id].js # PAGE 4: Booking Confirmation
│   └── api/
│       ├── studios/
│       │   ├── search.js  # GET /api/studios/search — search + rank studios
│       │   └── [slug].js  # GET /api/studios/:slug — studio detail + availability
│       └── bookings/
│           ├── create.js  # POST /api/bookings/create — create + payment intent
│           ├── confirm.js # POST /api/bookings/confirm — confirm after payment
│           ├── [id].js    # GET /api/bookings/:id — get booking (contact revealed)
│           └── contract.js # GET /api/bookings/contract?id= — download HTML contract
│
├── components/
│   ├── Nav.js                    # Navigation
│   ├── StudioCard.js             # Search result card
│   ├── SearchFilters.js          # Date/time/size/requirements filter sidebar
│   ├── AvailabilityCalendar.js   # Hour-by-hour visual calendar
│   └── CheckoutForm.js           # Payment + client details form
│
├── styles/globals.css    # Tailwind + custom design system
├── tailwind.config.js
├── next.config.js
└── data/
    └── studio_booking.db  # Created on first run (git-ignored)
```

---

## Database Schema

### `studios`
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | UUID |
| name | TEXT | Studio name |
| slug | TEXT UNIQUE | URL slug |
| location | TEXT | Full address |
| district | TEXT | Al Quoz, Media City, etc |
| size_category | TEXT | small / medium / large |
| sqft | INTEGER | Floor space |
| hourly_price | INTEGER | AED/hour |
| half_day_price | INTEGER | AED for 4+ hours |
| full_day_price | INTEGER | AED for 8+ hours |
| images | JSON | Array of image URLs |
| amenities | JSON | Boolean flags: daylight, cyc_wall, etc |
| rules | JSON | Overtime, cancellation, min hours |
| contact_email | TEXT | Hidden until after booking |
| contact_phone | TEXT | Hidden until after booking |

### `availability_blocks`
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | |
| studio_id | TEXT FK | |
| date | TEXT | yyyy-MM-dd |
| start_hour | INTEGER | 6–22 |
| end_hour | INTEGER | start_hour + 1 |
| block_type | TEXT | available / booked / blocked |
| booking_id | TEXT | FK when booked |

### `bookings`
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | |
| studio_id | TEXT FK | |
| user_name, user_email, etc | TEXT | Client info |
| date | TEXT | |
| start_hour, end_hour | INTEGER | |
| base_price, addons_price, total_price | INTEGER | AED |
| deposit_amount | INTEGER | 50% of total |
| payment_status | TEXT | pending / deposit_paid / paid |
| status | TEXT | pending / confirmed / cancelled |
| stripe_payment_intent_id | TEXT | |
| contract_html | TEXT | Generated on confirmation |

### `addons`
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | |
| studio_id | TEXT | NULL = global addon |
| name | TEXT | |
| price | INTEGER | AED |

---

## Availability Logic

Booking is **atomic**: time slots are locked inside a SQLite transaction that checks for conflicts before writing. A race condition between two simultaneous bookings will result in one failing gracefully with a `TIME_SLOT_CONFLICT` error.

Flow:
```
User submits checkout
  → POST /api/bookings/create
    → checkAvailability() — read-only check
    → Create Stripe PaymentIntent (or mock)
    → Insert booking (status: pending)
  → POST /api/bookings/confirm
    → verifyPayment()
    → lockTimeSlots() — transaction-safe atomic lock
    → Update booking status: confirmed
    → Generate contract HTML
```

---

## Seeded Studios

| Studio | District | Size | AED/hr |
|--------|----------|------|--------|
| Studio Society | Al Quoz | Large (4,200 sqft) | 850 |
| Ravenscar Studios | Production City | Large (6,800 sqft) | 1,100 |
| Luma Studio | Al Quoz / Alserkal | Medium (1,800 sqft) | 480 |
| AWS Studios | Media City | Medium (2,400 sqft) | 650 |
| Garage Studio | Jumeirah | Small (900 sqft) | 280 |
| HotCold Rental | Al Barsha | Medium (2,100 sqft) | 550 |

---

## Production Checklist

- [ ] Replace `NEXT_PUBLIC_MOCK_STRIPE=false` and add real Stripe keys
- [ ] Configure SMTP for booking confirmation emails
- [ ] Deploy database to a persistent volume (Railway, Fly.io, Render)
- [ ] Or migrate to PostgreSQL using `@prisma/client` (schema is compatible)
- [ ] Add authentication (NextAuth.js recommended)
- [ ] Set `NEXT_PUBLIC_APP_URL` to your domain
- [ ] Add studio admin dashboard for managing availability
- [ ] Set up Stripe webhooks for reliable payment confirmation

---

## Design System

The UI uses a custom design system:
- **Font**: Cormorant Garamond (display) + DM Sans (body) + DM Mono
- **Palette**: `obsidian` dark backgrounds + `sand` gold accents
- **Style**: Luxury editorial — raw industrial with refined typography
