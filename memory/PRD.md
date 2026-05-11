# EzHome — Premium Affiliate Marketing Platform

## Original problem statement
Build a premium modern affiliate website for "EzHome" showcasing products from Amazon, Temu, and SHEIN. Luxury Shopify-style design, mobile-first, high-converting. Sections required: Hero, Trending, Best Sellers, Smart Home, Kitchen, Decor, Organization, Viral TikTok, SHEIN Fashion, Daily Deals (countdown), Reviews, Newsletter, About, Contact, Privacy, Affiliate Disclosure. Features: sticky nav, search, dark mode, countdown timer, trust badges, affiliate redirect tracking.

## Architecture
- **Backend**: FastAPI + Motor (async MongoDB) at `/app/backend/server.py`
- **Frontend**: React 19 + react-router-dom v7 + Tailwind + shadcn/ui + sonner (toasts) + lucide-react (icons)
- **Theme**: Custom CSS variables (light + dark) — Cabinet Grotesk (display) + Satoshi (body) from Fontshare
- **Auth**: Simple password → static X-Admin-Token (header-based) for admin

## User personas
- Mobile shoppers from TikTok/Instagram (primary)
- Aesthetic-driven Gen-Z & Millennial home enthusiasts
- Site admin (curator) managing the product catalog

## Core requirements (static)
- Display 30+ curated products across 6 categories
- Affiliate redirect with click tracking
- Newsletter capture
- Mobile-first responsive
- Dark mode toggle
- Brand consistency (luxury DTC feel)

## What's been implemented (as of Feb 2026)
- Backend (FastAPI, all `/api` prefixed):
  - Products CRUD with filters (category, source, trending, best_seller, daily_deal, search)
  - Categories list endpoint
  - `/api/click/{id}` — 302 redirect with click_count + clicks collection logging
  - Newsletter subscribe (dedupe) + Contact form
  - **JWT auth** (`/api/auth/login`, `/api/auth/me`, `/api/auth/logout`) with bcrypt-hashed admin password
  - **Brute-force protection** (5 attempts / 15 min per IP+email)
  - Admin user auto-seeded on startup
  - **Banner CRUD** (`/api/banners`)
  - **SiteSettings singleton** (`/api/settings`) with feature toggles
  - Admin stats (top products, totals)
  - Auto-seed of 34 products + admin user on startup (idempotent)
  - MongoDB indexes for performance (unique email, product id, etc.)
- Public Frontend pages: Home, Products, Category, Deals, About, Contact, Privacy, Affiliate Disclosure
- **Admin section** at `/admin`:
  - `/admin/login` — JWT auth with rate-limited login
  - `/admin` (Dashboard) — stat cards + top performing products
  - `/admin/products` — full CRUD with search, category filter, edit drawer, delete confirm
  - `/admin/banners` — CRUD + visibility toggle (eye icon)
  - `/admin/settings` — site-wide feature toggles dynamically connected to public site
  - Sidebar layout with logout button, view-live-site link
  - ProtectedRoute + axios interceptor (401 → auto logout)
- SettingsProvider wires CMS values to public Navbar (announcement), Hero (overline), NewsletterPopup (enable), Home (countdown enable)
- Components: Navbar (sticky, glass, search, theme toggle, mobile drawer), Footer, ProductCard, ProductGrid, Hero (bento), CategoryBento, DailyDeals + Countdown, Testimonials, NewsletterPopup, TrustBadges
- Custom luxury palette + Cabinet Grotesk display + Satoshi body fonts
- All interactive elements have `data-testid` attributes

## Test results
- Backend: 25/25 pytest cases passing (JWT, brute-force, banner CRUD, settings CRUD, all existing flows)
- Frontend: 100% on tested flows after critical Navbar fix (announcement_text now safely consumed from useSettings with fallback)

## Prioritized backlog
- **P1**: Refresh token endpoint (currently 60-min access only; user must re-login on expiry)
- **P1**: Settings live-update on public site (websocket or polling) instead of refresh-required
- **P2**: Modularize server.py into routers/auth.py, routers/banners.py, routers/settings.py
- **P2**: Per-field data-testid on Banner form for stronger test automation
- **P2**: Top-level React error boundary on public site
- **P2**: SEO meta tags per product (Open Graph, Twitter cards)
- **P2**: Sitemap.xml + structured data (Product schema) for Google ranking
- **P2**: Email service integration (Resend/SendGrid) for newsletter welcome
- **P3**: Internationalization (currency conversion + locales)
- **P3**: Cookie consent banner (GDPR)
- **P3**: Wishlist (localStorage-based)
