import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { useCurrency } from "../lib/currencyContext";
import { getProductImages, productLandingPath } from "../lib/productImages";
import ProductCardImage from "./ProductCardImage";
import AnimatedPromoBadge from "./AnimatedPromoBadge";

const SOURCE_LABEL = {
  amazon: "Amazon",
  aliexpress: "AliExpress",
  shein: "SHEIN",
};

const formatSold = (n) => {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k+ sold`;
  return `${n} sold`;
};

const ProductCard = ({ product }) => {
  const { formatPrice } = useCurrency();
  const images = getProductImages(product);
  const mainImage = images[0];
  const discount =
    product.original_price > 0
      ? Math.round(
          ((product.original_price - product.discounted_price) / product.original_price) * 100
        )
      : 0;

  return (
    <article className="group flex flex-col min-w-0" data-testid={`product-card-${product.id}`}>
      <Link
        to={productLandingPath(product.id)}
        className="block min-w-0"
        data-testid={`product-card-link-${product.id}`}
      >
        <div className="relative">
          <ProductCardImage src={mainImage} alt={product.title} />

          <AnimatedPromoBadge
            discount={discount}
            originalPrice={product.original_price}
            discountedPrice={product.discounted_price}
          />

          <span className="absolute top-2 right-2 z-10 rounded-md bg-white/95 dark:bg-black/80 px-1.5 py-0.5 text-[9px] font-medium text-neutral-800 dark:text-neutral-100 shadow-sm">
            {SOURCE_LABEL[product.source] || product.source}
          </span>
        </div>

        <div className="mt-2 px-0.5 space-y-1">
          <h3
            className="text-[12px] sm:text-[13px] leading-snug text-neutral-800 dark:text-neutral-100 line-clamp-2 font-normal"
            style={{ fontFamily: "Satoshi, system-ui, sans-serif" }}
          >
            {product.title}
          </h3>

          <div className="flex items-center gap-1 text-[10px] text-neutral-500">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={`w-2.5 h-2.5 ${
                    i <= Math.round(product.rating)
                      ? "fill-[#FA6338] text-[#FA6338]"
                      : "text-neutral-300"
                  }`}
                />
              ))}
            </div>
            <span>{product.rating.toFixed(1)}</span>
            <span className="text-neutral-300">|</span>
            <span>{formatSold(product.review_count)}</span>
          </div>

          <div className="flex flex-wrap items-baseline gap-1.5">
            <span className="text-[15px] sm:text-base font-bold text-[#FA6338] leading-none">
              {formatPrice(product.discounted_price)}
            </span>
            {product.original_price > product.discounted_price && (
              <span className="text-[11px] text-neutral-400 line-through">
                {formatPrice(product.original_price)}
              </span>
            )}
          </div>

          {product.badges?.[0] && (
            <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium truncate">
              {product.badges[0]}
            </p>
          )}
        </div>
      </Link>
    </article>
  );
};

export default ProductCard;
