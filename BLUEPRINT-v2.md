# Omix Marketplace v2 — Blueprint

> A clean, focused marketplace for buying and selling in Kericho, Kenya.
> No bloat. No animations. No auth walls. Just products, search, and trust.

---

## 1. What This Is

A **single-page marketplace** where anyone can browse listings. Sellers can post items. Payments happen via M-Pesa (manual, no API integration yet). The goal is a working, professional-looking MVP — not a feature-complete platform.

**What it is NOT (for v2):**
- Not eBay. Not Amazon. Not Jumia.
- Not a multi-tenant SaaS platform.
- Not trying to do escrow, delivery, analytics, AI chat, admin dashboards, or messaging in v1.

---

## 2. Pages (Total: 4)

| Page | Route | Purpose |
|------|-------|---------|
| Home | `/` | Hero + search + category filters + product grid |
| Listing Detail | `/listings/[id]` | Single product view, seller info, M-Pesa pay instructions |
| Sell | `/sell` | Form to post a new listing (title, price, category, description, images, location) |
| About | `/about` | Short description of Omix, how it works, contact info |

That's it. No dashboard. No cart. No messages. No user profiles page. No admin.

---

## 3. Design Spec

### Colors
- **Background (light):** `#ffffff`
- **Background (dark):** `#0a0f1a`
- **Card surface:** `#ffffff` (light) / `#1a2235` (dark)
- **Primary text:** `#222222` (light) / `#e2e8f0` (dark)
- **Secondary text:** `#6a6a6a` (light) / `#94a3b8` (dark)
- **Muted text:** `#8f8f8f` (light) / `#64748b` (dark)
- **Border:** `#c1c1c1` (light) / `#2a3040` (dark)
- **Accent (CTA):** `#ff385c` — used ONLY for buttons, badges, links
- **Font:** DM Sans (already configured)

### Cards
- Border-radius: 14px
- Border: 1px solid var(--border)
- Shadow: `0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)`
- Image aspect ratio: 4:3
- Padding inside card body: 12px

### Grid
- Mobile (< 640px): 2 columns, 10px gap
- Tablet (640-1024px): 3 columns
- Desktop (> 1024px): 4 columns

### No Animations
- Zero transitions. Zero keyframes. Zero hover scale effects.
- Hover states change color/opacity only — no movement.

### Spacing
- Section padding: `py-8` mobile, `py-12` desktop
- Max container width: `max-w-7xl`
- Content padding: `px-4`

---

## 4. Homepage Layout (Top to Bottom)

### 4a. Navbar
- Sticky top, 60px height
- Logo left (image + "Omix" text)
- Search icon (navigates to search focus) — desktop only
- Right side: "Sell" button (accent) + theme toggle (dark/light switch)
- Mobile: hamburger menu with Sell, Theme toggle, About link

### 4b. Hero Section
- Full-width background: subtle gradient (`#fff5f7` to `#ffffff` in light, `#1a0a10` to `#0a0f1a` in dark)
- Heading: "Buy & Sell in Kericho" (left-aligned or centered, bold, `text-2xl md:text-4xl`)
- Subtitle: "The local marketplace for electronics, furniture, clothing, and more."
- Two buttons: [Browse Listings] (primary, accent bg) [Sell Something] (outline)
- No badge/pill above heading. No dot. No "trusted marketplace" label.

### 4c. Search Bar
- Full-width, max 600px, centered
- Rounded pill shape (`rounded-full`)
- Shadow: `0 1px 2px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)`
- Input: "Search electronics, furniture, clothing..."
- Search button: accent circle with magnifying glass icon

### 4d. Category Pills
- Horizontal scrollable row
- All categories from constants.ts
- Active pill: accent bg + white text
- Inactive: card bg + border + secondary text
- Pills: `text-xs`, `px-3 py-1.5`, `rounded-full`

### 4e. Product Grid
- Map over listings data
- Each card: image (or category placeholder), title, price (bold), condition badge, location
- No seller info on card (too cluttered)
- Bottom of grid: "Showing X of Y listings"

### 4f. Footer
- Background: var(--bg-secondary)
- 3 columns on desktop, stacked on mobile:
  - **Brand:** "Omix" + one-line description
  - **Links:** About | Sell | Contact
  - **Contact:** M-Pesa till number, phone, email
- Copyright: "2026 Omix Marketplace. Kericho, Kenya."
- Border-top, padding: `py-8`

---

## 5. Product Card Specification

```
┌─────────────────────────────┐
│  [Image 4:3 or placeholder] │
│  [condition badge]     [♡]  │
├─────────────────────────────┤
│  Product Title Here         │
│  KES 2,500       Negotiable │
│  📍 Location               │
└─────────────────────────────┘
```

- Condition badge: top-left, small pill (New / Like New / Good / Fair)
- Favorite icon: top-right, heart outline, 32x32 tap target
- Title: 2 lines max, truncate
- Price: bold, accent colour if negotiable
- Location: muted text, icon prefix
- Placeholder when no image: category icon centered + tinted background

---

## 6. Listing Detail Page

- Left column (60%): Image gallery (main image + thumbnails)
- Right column (40%):
  - Condition badge
  - Title (large, bold)
  - Price (very large, bold)
  - Description (body text)
  - Location
  - Seller name
  - "Pay via M-Pesa" section: Till number + instructions + "I've Paid" button
  - "Contact Seller" button (outline)
- Below: Related listings from same category (grid, 4 cards)

---

## 7. Seed Data

Pre-populate Supabase with **25-30 realistic listings** across categories:

| Category | Count | Example Items |
|----------|-------|---------------|
| Electronics | 6 | Samsung A14, HP laptop, JBL speaker, TV, iPhone (used), Router |
| Furniture | 4 | Sofa set, Dining table, Office chair, Bedframe |
| Clothing | 4 | Shoes suit, Kitenge dresses, Sneakers, Jackets |
| Books | 2 | set books, Business books |
| Services | 3 | Cleaning, Tutoring, Photography |
| Home & Garden | 3 | Water tank, Garden tools, Cooker |
| Others | 3 | Exercise bike, Car battery, Music speaker |

Each listing needs:
- Realistic Kenyan price in KES
- Location within Kericho (CBD, Litein, Kapsoit, Kaitet, Awasi, etc.)
- Condition: random from list
- Image: use Unsplash/Pexels URLs via `next/image` remotePatterns
- Created date: spread across last 30 days

---

## 8. Data Model (Simplified)

```sql
-- listings table
create table listings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  price integer not null, -- in KES (not cents)
  condition text not null, -- new, like-new, good, fair, poor
  category text not null, -- slug from CATEGORIES
  location text not null,
  images text[], -- array of URLs
  seller_name text not null,
  seller_phone text,
  is_negotiable boolean default false,
  status text default 'active',
  view_count integer default 0,
  created_at timestamp default now()
);

-- Add index for common queries
create index idx_listings_category on listings(category);
create index idx_listings_status on listings(status);
create index idx_listings_created on listings(created_at desc);
```

No users table. No auth. No orders. No conversations. Just listings.

---

## 9. File Structure (Clean)

```
src/
  app/
    layout.tsx        -- Navbar + Footer wrapper, theme
    page.tsx          -- Homepage (hero, search, categories, grid)
    globals.css       -- CSS variables, card styles, utilities
    listings/
      [id]/
        page.tsx      -- Listing detail
    sell/
      page.tsx        -- Sell form
    about/
      page.tsx        -- About page
  components/
    Navbar.tsx
    ProductCard.tsx
    Footer.tsx
    CategoryPills.tsx
    SearchBar.tsx
    ListingGrid.tsx
    ThemeProvider.tsx
  lib/
    constants.ts      -- Categories, conditions, etc.
    supabase/
      client.ts       -- Supabase client
  data/
    seed.ts           -- Seed listing data (run once)
```

Delete these (carryover from v1, not needed):
- `dashboard/` directory
- `admin/` directory
- `cart/` directory
- `checkout/` directory
- `messages/` directory
- `orders/` directory
- `store/` directory
- `services/` directory
- `ai-assistant/` directory
- `auth/` directory
- `api/` directory (unless needed for form submit)
- `ListingsSection.tsx` (component, now page-level)
- `OmixAiChatPopup.tsx`
- `PWAInstaller.tsx`
- `ImageUploader.tsx`
- `StarRating.tsx`
- `loading.tsx` (let Next.js handle it)

---

## 10. Deployment

- Same repo: `github.com/oliver4441/omix-marketplace`
- Same Vercel project: `omix-marketplace`
- Branch: `master`
- Build command: `next build`
- No special env vars needed beyond Supabase URL + anon key
- Set `REMOTE_PATTERNS` in next.config.ts for Unsplash/Pexels images

---

## 11. What to Build First (Priority Order)

1. **Clean slate** — Delete all unused directories and files
2. **CSS variables + reset** — Theme system, card styles, grid
3. **Navbar + Footer** — With responsive mobile menu
4. **Homepage** — Hero, search, category pills, product grid
5. **Seed data** — 25 listings in Supabase
6. **Product Card** — With proper images and placeholder
7. **Listing Detail page** — M-Pesa payment instructions
8. **Sell form** — Submit to Supabase, image upload optional
9. **About page** — One page, text + contact info
10. **Deploy** — Push to master, verify on Vercel

---

## 12. Success Criteria

- [ ] Page loads in under 2 seconds on 3G
- [ ] Works on mobile (test on Android Chrome)
- [ ] 25+ listings visible with real images
- [ ] No animations anywhere
- [ ] Dark theme by default, toggle works
- [ ] Search filters listings by title
- [ ] Category pills filter by category
- [ ] Sell form submits and creates a listing
- [ ] Listing detail shows M-Pesa payment info

---

## 13. Anti-Patterns (Don't Do These)

- Don't add animations "just for polish" — they add complexity and slow rendering
- Don't add user accounts in v2 — seller name is a text field
- Don't add a chat system — use phone/WhatsApp
- Don't add a cart — direct M-Pesa payment per listing
- Don't add analytics dashboards — irrelevant for v2
- Don't use emoji in the UI — use SVG icons only
- Don't use external icon libraries (lucide, heroicons) — inline SVGs only to avoid dependency issues
- Don't use client-side data fetching for the main product grid — fetch at build/request time
