import { Star } from "lucide-react";
import { getAffiliateClickUrl } from "../lib/api";
import { useCurrency } from "../lib/currencyContext";

const SOURCE_LABEL = {
  amazon: "Amazon",
  temu: "Temu",
  shein: "SHEIN",
};

const CATEGORY_LABELS = {
  "smart-home": "Smart Home",
  "kitchen": "Kitchen",
  "decor": "Decor",
  "organization": "Organization",
  "tiktok": "TikTok Finds",
  "fashion": "Fashion",
};

const CTA_LABELS = ["Shop Now", "View Deal", "Get Yours"];

const ProductCard = ({ product, ctaIndex = 0 }) => {
  const { formatPrice } = useCurrency();
  const discount = Math.round(
    ((product.original_price - product.discounted_price) / product.original_price) * 100
  );
  const cta = CTA_LABELS[ctaIndex % CTA_LABELS.length];
  const categoryLabel = CATEGORY_LABELS[product.category] || product.category.replaceAll("-", " ");

  return (
    <article
      className="group relative flex flex-col bg-card border border-border hover-lift overflow-hidden"
      data-testid={`product-card-${product.id}`}
    >
      {/* Image */}
      <a
        href={getAffiliateClickUrl(product.id)}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="relative block aspect-[4/5] overflow-hidden bg-muted"
        data-testid={`product-image-link-${product.id}`}
      >
        <img
          src={product.image_url}
          alt={product.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col items-start gap-2">
          {product.badges?.slice(0, 2).map((b) => (
            <span
              key={b}
              className="px-2.5 py-1 bg-foreground text-background text-[10px] tracking-[0.15em] font-semibold"
            >
              {b}
            </span>
          ))}
          {discount > 0 && !product.badges?.some((b) => b.includes("%")) && (
            <span className="px-2.5 py-1 bg-destructive text-destructive-foreground text-[10px] tracking-[0.15em] font-semibold">
              {discount}% OFF
            </span>
          )}
        </div>

        {/* Source pill */}
        <span className="absolute top-3 right-3 px-2.5 py-1 bg-background/90 backdrop-blur text-foreground text-[10px] tracking-[0.15em] font-semibold border border-border">
          {SOURCE_LABEL[product.source] || product.source}
        </span>
      </a>

      {/* Body */}
      <div className="flex flex-col gap-2 p-4 sm:p-5">
        <p className="overline text-muted-foreground text-[10px]">{categoryLabel}</p>
        <h3 className="font-display font-medium text-base sm:text-lg leading-snug line-clamp-2">
          {product.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {product.short_description}
        </p>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mt-1">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${
                  i <= Math.round(product.rating)
                    ? "fill-foreground text-foreground"
                    : "text-muted-foreground"
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {product.rating.toFixed(1)} ({product.review_count.toLocaleString()})
          </span>
        </div>

        {/* Price — يستخدم formatPrice للتحويل التلقائي */}
        <div className="flex flex-wrap items-baseline gap-2 mt-1">
          <span className="font-display text-2xl font-black tracking-tight">
            {formatPrice(product.discounted_price)}
          </span>
          {product.original_price > product.discounted_price && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(product.original_price)}
            </span>
          )}
          {product.original_price > product.discounted_price && (
            <span className="ml-auto text-[10px] overline text-accent font-bold">
              SAVE {formatPrice(product.original_price - product.discounted_price)}
            </span>
          )}
        </div>

        {/* CTA */}
        <a
          href={getAffiliateClickUrl(product.id)}
          target="_blank"
          rel="noopener noreferrer sponsored"
          aria-label={`${cta} — ${product.title}`}
          className="group/btn mt-3 inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-foreground text-background text-sm font-semibold tracking-wide transition-all duration-300 hover:bg-accent hover:text-accent-foreground hover:-translate-y-[1px]"
          data-testid={`product-cta-${product.id}`}
        >
          {cta}
          <span className="transition-transform duration-300 group-hover/btn:translate-x-1">→</span>
        </a>
      </div>
    </article>
  );
};

export default ProductCard;          className="group/btn mt-3 inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-foreground text-background text-sm font-semibold tracking-wide transition-all duration-300 hover:bg-accent hover:text-accent-foreground hover:-translate-y-[1px]"
          data-testid={`product-cta-${product.id}`}
        >
          {cta}
          <span className="transition-transform duration-300 group-hover/btn:translate-x-1">→</span>
        </a>
      </div>
    </article>
  );
};

export default ProductCard;
