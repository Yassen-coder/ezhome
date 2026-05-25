/** Canonical site categories — single source of truth for UI and admin. */
export const SITE_CATEGORIES = [
  {
    slug: "kitchen",
    name: "Kitchen",
    navLabel: "Kitchen",
    overline: "For the modern cook",
    description: "Tools that turn cooking into a ritual. Marble, ceramic, and Japanese steel.",
    defaultImage: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=900&q=85",
    gridSpan: "md:col-span-6 row-span-1 h-[220px] md:h-[230px]",
  },
  {
    slug: "cleaning",
    name: "Cleaning",
    navLabel: "Cleaning",
    overline: "A cleaner home, effortlessly",
    description: "Smart tools and supplies that make everyday cleaning faster and more satisfying.",
    defaultImage: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=900&q=85",
    gridSpan: "md:col-span-3 row-span-1 h-[220px] md:h-[230px]",
  },
  {
    slug: "organization",
    name: "Organization",
    navLabel: "Organization",
    overline: "Order, beautifully",
    description: "Storage solutions that double as decor. Acrylic, woven, and modular.",
    defaultImage: "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=900&q=85",
    gridSpan: "md:col-span-4 row-span-1 h-[220px] md:h-[280px]",
  },
  {
    slug: "smart-home",
    name: "Smart Home",
    navLabel: "Smart Home",
    overline: "Effortless luxury, automated",
    description: "The tech that disappears into your life. Voice-controlled, app-connected, beautifully designed.",
    defaultImage: "https://images.unsplash.com/photo-1558002038-1055907df827?w=900&q=85",
    gridSpan: "md:col-span-6 row-span-2 h-[340px] md:h-[480px]",
  },
  {
    slug: "decor",
    name: "Decor",
    navLabel: "Decor",
    overline: "Quietly stunning pieces",
    description: "Sculptural objects, soft textures, and timeless silhouettes for the home you dream about.",
    defaultImage: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e6?w=900&q=85",
    gridSpan: "md:col-span-3 row-span-1 h-[220px] md:h-[230px]",
  },
  {
    slug: "daily-essentials",
    name: "Daily Essentials",
    navLabel: "Daily Essentials",
    overline: "Everyday must-haves",
    description: "The practical pieces you reach for daily — curated for comfort, utility, and style.",
    defaultImage: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=900&q=85",
    gridSpan: "md:col-span-8 row-span-1 h-[260px] md:h-[280px]",
  },
];

export const CATEGORY_SLUGS = SITE_CATEGORIES.map((c) => c.slug);

export const getCategoryBySlug = (slug) =>
  SITE_CATEGORIES.find((c) => c.slug === slug);

export const categoryPath = (slug) => `/category/${slug}`;

/** Parse /category/{slug} from banner CTA link */
export const slugFromCtaLink = (link) => {
  if (!link) return null;
  const match = String(link).match(/\/category\/([a-z0-9-]+)/i);
  return match ? match[1] : null;
};

export const NAV_CATEGORY_LINKS = [
  { label: "Home", to: "/" },
  { label: "Shop", to: "/products" },
  ...SITE_CATEGORIES.map((c) => ({ label: c.navLabel, to: categoryPath(c.slug) })),
  { label: "Deals", to: "/deals" },
];
