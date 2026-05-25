import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import {
  SITE_CATEGORIES,
  categoryPath,
  slugFromCtaLink,
} from "../lib/categories";

const buildTiles = (banners) => {
  const bySlug = {};
  (banners || []).forEach((b) => {
    const slug = slugFromCtaLink(b.cta_link);
    if (slug) bySlug[slug] = b;
  });

  return SITE_CATEGORIES.map((cat) => {
    const b = bySlug[cat.slug];
    return {
      slug: cat.slug,
      title: b?.title || cat.name,
      subtitle: b?.subtitle || cat.overline,
      img: b?.image_url || cat.defaultImage,
      span: cat.gridSpan,
      to: b?.cta_link?.startsWith("http") ? b.cta_link : categoryPath(cat.slug),
      external: /^https?:\/\//i.test(b?.cta_link || ""),
    };
  });
};

const CategoryBento = () => {
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    api
      .get("/banners", { params: { active: true, position: "category" } })
      .then((r) => setBanners(r.data || []))
      .catch(() => setBanners([]));
  }, []);

  const tiles = useMemo(() => buildTiles(banners), [banners]);

  return (
    <section className="container-px mx-auto max-w-[1400px] py-16 sm:py-24" data-testid="categories-section">
      <div className="flex items-end justify-between mb-10 sm:mb-14 gap-4 flex-wrap">
        <div>
          <p className="overline text-muted-foreground mb-3">Shop by Mood</p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-none max-w-xl">
            Categories that <span className="italic font-medium">feel</span> like you.
          </h2>
        </div>
        <Link to="/products" className="text-sm font-medium underline-offset-4 hover:underline">
          Browse everything →
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 auto-rows-auto">
        {tiles.map((t) => {
          const inner = (
            <>
              <img
                src={t.img}
                alt={t.title}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent" />
              <div className="absolute inset-0 p-5 sm:p-7 flex flex-col justify-end text-background">
                <p className="overline text-[10px] opacity-80">{t.subtitle}</p>
                <h3 className="font-display font-bold text-2xl sm:text-3xl mt-1 leading-tight">{t.title}</h3>
                <span className="mt-3 inline-flex items-center text-xs font-medium opacity-90 group-hover:translate-x-1 transition-transform">
                  Explore →
                </span>
              </div>
            </>
          );

          if (t.external) {
            return (
              <a
                key={t.slug}
                href={t.to}
                target="_blank"
                rel="noopener noreferrer"
                className={`relative overflow-hidden group ${t.span}`}
                data-testid={`category-tile-${t.slug}`}
              >
                {inner}
              </a>
            );
          }

          return (
            <Link
              key={t.slug}
              to={t.to}
              className={`relative overflow-hidden group ${t.span}`}
              data-testid={`category-tile-${t.slug}`}
            >
              {inner}
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default CategoryBento;
