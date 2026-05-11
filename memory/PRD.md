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
  - Admin login → token, Admin stats (top products, totals)
  - Auto-seed of 34 products on startup (idempotent)
- Frontend pages: Home (hero+10 sections), Products (with source filter + search), Category, Deals, About, Contact, Privacy, Affiliate Disclosure, Admin
- Components: Navbar (sticky, glass, search, theme toggle, mobile drawer), Footer, ProductCard, ProductGrid, Hero (bento), CategoryBento (asymmetric), DailyDeals + Countdown, Testimonials, NewsletterPopup (8s delay), TrustBadges
- Custom luxury palette: cream (#F9F8F6) + charcoal + sage green accent; dark mode jewel
- Cabinet Grotesk display + Satoshi body fonts
- All interactive elements have `data-testid` attributes

## Test results
- Backend: 21/21 pytest cases passing
- Frontend: All critical flows verified by testing agent (homepage, theme toggle, search, category routes, newsletter popup, admin login)

## Prioritized backlog
- **P1**: Edit product (PATCH) UI in admin (currently only create + delete)
- **P1**: Pagination on /products when catalog grows beyond 100 items
- **P2**: SEO meta tags per product (Open Graph, Twitter cards)
- **P2**: Sitemap.xml + structured data (Product schema) for Google ranking
- **P2**: Email service integration (Resend/SendGrid) for newsletter welcome
- **P2**: Image lazy-load with blur placeholder + CDN optimization
- **P3**: Internationalization (currency conversion + locales)
- **P3**: Cookie consent banner (GDPR)
- **P3**: Wishlist (localStorage-based)
