import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { useSettings } from "../lib/settings";
import { api } from "../lib/api";

const FALLBACK_HERO =
  "https://images.unsplash.com/photo-1760072513442-9872656c1b07?w=1600&q=85";
const FALLBACK_SIDE1 =
  "https://images.unsplash.com/photo-1778373620793-a369943bf9b3?w=800&q=85";
const FALLBACK_SIDE2 =
  "https://images.unsplash.com/photo-1766431066919-9c11fbb6d3da?w=800&q=85";

const isExternalLink = (url) => /^https?:\/\//i.test(url || "");

const CtaLink = ({ to, children, className, testId }) => {
  if (!to) return <span className={className}>{children}</span>;
  if (isExternalLink(to)) {
    return (
      <a
        href={to}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        data-testid={testId}
      >
        {children}
      </a>
    );
  }
  return (
    <Link to={to} className={className} data-testid={testId}>
      {children}
    </Link>
  );
};

const Hero = ({ featured = [] }) => {
  const { hero_overline, hero_eyebrow_enabled } = useSettings();
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    api
      .get("/banners", { params: { active: true, position: "hero" } })
      .then((r) => setBanners(r.data || []))
      .catch(() => setBanners([]));
  }, []);

  const main = banners[0];
  const side1 = banners[1];
  const side2 = banners[2];
  const promo = banners[3];
  const trending = banners[4];

  const heroImg = main?.image_url || FALLBACK_HERO;
  const sideImg1 = side1?.image_url || featured[0]?.image_url || FALLBACK_SIDE1;
  const sideImg2 = side2?.image_url || featured[1]?.image_url || FALLBACK_SIDE2;

  const mainOverline = main?.subtitle || "Editor's Pick";
  const mainTitle = main?.title || "Sanctuary Edit";

  const promoOverline = promo?.subtitle || "New Drop";
  const promoTitle = promo?.title || "Up to 50% off this week";
  const promoLink = promo?.cta_link;

  const trendingOverline = trending?.subtitle || "Trending Now";
  const trendingTitle = trending?.title || "TikTok's #1 Home Aesthetic Finds";
  const trendingLink = trending?.cta_link;

  return (
    <section className="relative overflow-hidden" data-testid="hero-section">
      <div className="container-px mx-auto max-w-[1400px] pt-12 sm:pt-20 pb-16 sm:pb-24 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Copy */}
        <div className="lg:col-span-6 fade-up">
          {hero_eyebrow_enabled && (
            <p className="overline text-muted-foreground mb-5 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" /> {hero_overline}
            </p>
          )}
          <h1 className="font-display font-black text-5xl sm:text-6xl lg:text-7xl leading-[0.92] tracking-[-0.03em]">
            Live<br />
            <span className="italic font-medium">beautifully.</span>
            <br />
            Shop <span className="text-accent">smarter.</span>
          </h1>
          <p className="mt-6 sm:mt-8 text-base sm:text-lg text-muted-foreground max-w-md leading-relaxed">
            Hand-picked essentials from Amazon, Temu, and SHEIN — all the viral finds and
            timeless pieces, curated for the modern home.
          </p>
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3">
            {main?.cta_link ? (
              <CtaLink
                to={main.cta_link}
                className="inline-flex items-center justify-center gap-2 px-7 py-4 bg-foreground text-background font-medium text-sm tracking-wide transition-all duration-300 hover:bg-accent hover:text-accent-foreground hover:-translate-y-[2px]"
                testId="hero-cta-shop"
              >
                {main.cta_text || "Shop Now"} <ArrowRight className="w-4 h-4" />
              </CtaLink>
            ) : (
              <Link
                to="/products"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 bg-foreground text-background font-medium text-sm tracking-wide transition-all duration-300 hover:bg-accent hover:text-accent-foreground hover:-translate-y-[2px]"
                data-testid="hero-cta-shop"
              >
                Shop the Collection <ArrowRight className="w-4 h-4" />
              </Link>
            )}
            <Link
              to="/category/tiktok"
              className="inline-flex items-center justify-center px-7 py-4 border border-foreground text-foreground font-medium text-sm tracking-wide transition-all duration-300 hover:bg-foreground hover:text-background"
              data-testid="hero-cta-viral"
            >
              See Viral Finds
            </Link>
          </div>
          <div className="mt-10 sm:mt-14 grid grid-cols-3 gap-4 sm:gap-8 max-w-md">
            <div>
              <p className="font-display text-2xl sm:text-3xl font-bold">2.4M+</p>
              <p className="text-xs text-muted-foreground mt-1 tracking-wide">Happy shoppers</p>
            </div>
            <div>
              <p className="font-display text-2xl sm:text-3xl font-bold">15K+</p>
              <p className="text-xs text-muted-foreground mt-1 tracking-wide">Products curated</p>
            </div>
            <div>
              <p className="font-display text-2xl sm:text-3xl font-bold">4.9★</p>
              <p className="text-xs text-muted-foreground mt-1 tracking-wide">Avg rating</p>
            </div>
          </div>
        </div>

        {/* Bento images — driven by admin banners when available */}
        <div
          className="lg:col-span-6 grid grid-cols-6 grid-rows-6 gap-3 sm:gap-4 h-[420px] sm:h-[560px] fade-up fade-up-delay-2"
          data-testid="hero-bento"
        >
          <CtaLink
            to={main?.cta_link}
            className={`col-span-4 row-span-4 relative overflow-hidden bg-muted block ${main?.cta_link ? "group" : ""}`}
            testId="hero-banner-main"
          >
            <img
              src={heroImg}
              alt={mainTitle}
              loading="eager"
              fetchPriority="high"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute bottom-5 left-5 text-white">
              <p className="overline text-[10px] opacity-90">{mainOverline}</p>
              <p className="font-display font-bold text-lg sm:text-xl mt-1">{mainTitle}</p>
            </div>
          </CtaLink>
          <div className="col-span-2 row-span-2 relative overflow-hidden bg-muted">
            <img src={sideImg1} alt={side1?.title || "Featured"} loading="eager" className="w-full h-full object-cover" />
          </div>
          <div className="col-span-2 row-span-2 relative overflow-hidden bg-muted">
            <img src={sideImg2} alt={side2?.title || "Featured"} loading="eager" className="w-full h-full object-cover" />
          </div>
          <CtaLink
            to={promoLink}
            className="col-span-2 row-span-2 relative overflow-hidden bg-foreground text-background flex flex-col justify-end p-4 sm:p-5 hover:opacity-95 transition-opacity"
            testId="hero-banner-promo"
          >
            <p className="overline text-[10px] opacity-70">{promoOverline}</p>
            <p className="font-display font-bold text-base sm:text-xl leading-tight mt-2">{promoTitle}</p>
          </CtaLink>
          <CtaLink
            to={trendingLink}
            className="col-span-4 row-span-2 relative overflow-hidden bg-secondary flex items-center px-5 sm:px-8 hover:bg-secondary/80 transition-colors"
            testId="hero-banner-trending"
          >
            <div>
              <p className="overline text-[10px] text-muted-foreground">{trendingOverline}</p>
              <p className="font-display font-bold text-lg sm:text-2xl leading-tight mt-2">{trendingTitle}</p>
            </div>
          </CtaLink>
        </div>
      </div>

      <div className="border-y border-border bg-secondary/40 overflow-hidden py-4 sm:py-5">
        <div className="flex marquee-track whitespace-nowrap">
          {[...Array(2)].map((_, k) => (
            <div key={k} className="flex items-center shrink-0">
              {[
                "FREE SHIPPING $50+",
                "VERIFIED REVIEWS",
                "AMAZON ASSOCIATE",
                "TIKTOK FAVORITES",
                "DAILY NEW DROPS",
                "SHIPS WORLDWIDE",
                "30-DAY RETURNS",
              ].map((t) => (
                <span key={t} className="flex items-center">
                  <span className="overline text-xs sm:text-sm px-8">{t}</span>
                  <span className="w-1 h-1 rounded-full bg-foreground/40" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;
