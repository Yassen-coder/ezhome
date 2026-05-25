import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Star, ExternalLink } from "lucide-react";
import { api, getAffiliateClickUrl } from "../lib/api";
import { useCurrency } from "../lib/currencyContext";
import { getCategoryBySlug } from "../lib/categories";
import { getProductImages } from "../lib/productImages";
import ProductImageSlider from "../components/ProductImageSlider";
import { PageError } from "../components/PageState";

const SOURCE_LABEL = {
  amazon: "Amazon",
  temu: "Temu",
  shein: "SHEIN",
};

const ProductPage = () => {
  const { id } = useParams();
  const { formatPrice } = useCurrency();
  const [product, setProduct] = useState(null);
  const [status, setStatus] = useState("loading");

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const { data } = await api.get(`/products/${id}`);
      setProduct(data);
      setStatus("success");
      document.title = `${data.title} | EzHome`;
    } catch {
      setProduct(null);
      setStatus("error");
      document.title = "Product | EzHome";
    }
  }, [id]);

  useEffect(() => {
    load();
    return () => {
      document.title = "EzHome — Curated Home Essentials";
    };
  }, [load]);

  if (status === "loading") {
    return (
      <div className="container-px mx-auto max-w-lg py-12 animate-pulse" data-testid="product-page-loading">
        <div className="rounded-2xl bg-muted aspect-[3/4] w-full" />
        <div className="mt-4 h-6 bg-muted rounded w-3/4" />
        <div className="mt-2 h-4 bg-muted rounded w-1/2" />
      </div>
    );
  }

  if (status === "error" || !product) {
    return (
      <PageError
        message="This product could not be found."
        onRetry={load}
      />
    );
  }

  const images = getProductImages(product);
  const discount =
    product.original_price > 0
      ? Math.round(
          ((product.original_price - product.discounted_price) / product.original_price) * 100
        )
      : 0;
  const category = getCategoryBySlug(product.category);
  const shopUrl = getAffiliateClickUrl(product.id);
  const sourceName = SOURCE_LABEL[product.source] || product.source;

  return (
    <div className="pb-28 sm:pb-12" data-testid={`product-page-${product.id}`}>
      <div className="container-px mx-auto max-w-lg sm:max-w-2xl lg:max-w-4xl pt-4 sm:pt-8">
        <Link
          to={category ? `/category/${product.category}` : "/products"}
          className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground mb-4"
          data-testid="product-back-link"
        >
          <ArrowLeft className="w-4 h-4" /> Back to shop
        </Link>

        <div className="lg:grid lg:grid-cols-2 lg:gap-10 lg:items-start">
          <ProductImageSlider
            images={images}
            alt={product.title}
            rounded="rounded-2xl"
            autoPlay
            intervalMs={4500}
            enableMotion
            className="w-full"
          />

          <div className="mt-5 lg:mt-0">
            {category && (
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">
                {category.name}
              </p>
            )}
            <h1
              className="text-xl sm:text-2xl font-semibold leading-snug text-neutral-900 dark:text-neutral-50"
              style={{ fontFamily: "Satoshi, system-ui, sans-serif" }}
              data-testid="product-title"
            >
              {product.title}
            </h1>

            <div className="flex items-center gap-2 mt-3">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i <= Math.round(product.rating)
                        ? "fill-[#FA6338] text-[#FA6338]"
                        : "text-neutral-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-neutral-600">
                {product.rating.toFixed(1)} · {product.review_count.toLocaleString()} reviews
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-3 mt-4">
              <span className="text-3xl font-bold text-[#FA6338]">
                {formatPrice(product.discounted_price)}
              </span>
              {product.original_price > product.discounted_price && (
                <>
                  <span className="text-lg text-neutral-400 line-through">
                    {formatPrice(product.original_price)}
                  </span>
                  {discount > 0 && (
                    <span className="rounded-md bg-[#FA6338]/10 text-[#FA6338] px-2 py-0.5 text-sm font-semibold">
                      -{discount}%
                    </span>
                  )}
                </>
              )}
            </div>

            {product.badges?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {product.badges.map((b) => (
                  <span
                    key={b}
                    className="rounded-full border border-border px-3 py-1 text-[11px] font-medium"
                  >
                    {b}
                  </span>
                ))}
              </div>
            )}

            <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
              {product.short_description}
            </p>

            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              {product.description}
            </p>

            <a
              href={shopUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="hidden lg:inline-flex mt-8 items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 bg-[#FA6338] hover:bg-[#e8552d] text-white text-sm font-semibold rounded-full transition-colors"
              data-testid="product-shop-cta-desktop"
            >
              Shop on {sourceName}
              <ExternalLink className="w-4 h-4" />
            </a>

            <p className="mt-6 text-[11px] text-muted-foreground hidden lg:block">
              You'll be redirected to {sourceName} to complete your purchase. EzHome may earn a
              commission at no extra cost to you.
            </p>
          </div>
        </div>
      </div>

      {/* Sticky mobile CTA — SHEIN-style */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-border bg-background/95 backdrop-blur-md p-3 safe-area-pb">
        <a
          href={shopUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#FA6338] hover:bg-[#e8552d] text-white text-sm font-semibold rounded-full transition-colors"
          data-testid="product-shop-cta-mobile"
        >
          Shop on {sourceName}
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};

export default ProductPage;
