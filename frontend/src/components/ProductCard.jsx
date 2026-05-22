import { Star } from "lucide-react";
import { Link } from "react-router-dom";
import { getAffiliateClickUrl } from "../lib/api";
import { useCurrency } from "../lib/currencyContext";

const SOURCE_LABEL = {
  amazon: "Amazon",
  temu: "Temu",
  shein: "SHEIN",
};

const ProductCard = ({ product, ctaIndex = 0 }) => {
  const { formatPrice } = useCurrency();
  const discount = product.original_price > product.discounted_price
    ? Math.round(((product.original_price - product.discounted_price) / product.original_price) * 100)
    : 0;

  return (
    <article
      className="group flex flex-col bg-card overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300"
      data-testid={`product-card-${product.id}`}
    >
      {/* ── صورة المنتج ── */}
      <Link
        to={`/product/${product.id}`}
        className="relative block aspect-square overflow-hidden bg-muted"
        data-testid={`product-image-link-${product.id}`}
      >
        <img
          src={product.image_url}
          alt={product.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />

        {/* خصم فقط — بسيط وصغير */}
        {discount > 0 && (
          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-destructive text-destructive-foreground text-[11px] font-bold rounded-full">
            -{discount}%
          </span>
        )}

        {/* المتجر */}
        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-background/85 backdrop-blur-sm text-foreground text-[11px] font-semibold rounded-full border border-border/50">
          {SOURCE_LABEL[product.source] || product.source}
        </span>
      </Link>

      {/* ── معلومات المنتج ── */}
      <div className="flex flex-col gap-1.5 p-3">
        {/* الاسم */}
        <Link to={`/product/${product.id}`}>
          <h3 className="text-sm font-semibold leading-snug line-clamp-2 hover:opacity-70 transition-opacity">
            {product.title}
          </h3>
        </Link>

        {/* تقييم بسيط */}
        <div className="flex items-center gap-1">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          <span className="text-xs text-muted-foreground">
            {product.rating.toFixed(1)}
            <span className="ml-1 opacity-60">({product.review_count.toLocaleString()})</span>
          </span>
        </div>

        {/* السعر */}
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span className="text-base font-bold tracking-tight">
            {formatPrice(product.discounted_price)}
          </span>
          {product.original_price > product.discounted_price && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(product.original_price)}
            </span>
          )}
        </div>

        {/* زر الشراء */}
        <a
          href={getAffiliateClickUrl(product.id)}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="mt-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-foreground text-background text-xs font-semibold rounded-lg transition-all duration-200 hover:opacity-80 hover:-translate-y-[1px] active:scale-[0.98]"
          data-testid={`product-cta-${product.id}`}
        >
          Shop Now
          <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
        </a>
      </div>
    </article>
  );
};

export default ProductCard;          )}
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

export default ProductCard;
