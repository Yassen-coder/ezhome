import { Link } from "react-router-dom";
import ProductCard from "./ProductCard";

/** SHEIN-inspired tight masonry grid on mobile */
const GRID_CLASS = {
  compact:
    "grid grid-cols-2 gap-x-1.5 gap-y-3 sm:gap-x-2 sm:gap-y-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
  wide: "grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-4 lg:gap-6",
};

const ProductGrid = ({
  products,
  title,
  overline,
  subtitle,
  viewAllLink,
  variant = "compact",
}) => {
  const gridClass = GRID_CLASS[variant] || GRID_CLASS.compact;

  return (
    <section
      className="container-px mx-auto max-w-[1400px] py-8 sm:py-16 lg:py-20"
      data-testid="product-grid-section"
    >
      {(title || overline) && (
        <div className="flex items-end justify-between mb-5 sm:mb-8 gap-4 flex-wrap">
          <div>
            {overline && (
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2 font-medium">
                {overline}
              </p>
            )}
            {title && (
              <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-none">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-2 text-sm text-muted-foreground max-w-xl">{subtitle}</p>
            )}
          </div>
          {viewAllLink && (
            <Link
              to={viewAllLink}
              className="text-xs sm:text-sm font-medium text-neutral-600 hover:text-foreground"
            >
              View all →
            </Link>
          )}
        </div>
      )}
      <div className={gridClass}>
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
};

export default ProductGrid;
