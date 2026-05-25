import { Link } from "react-router-dom";
import ProductCard from "./ProductCard";

const ProductGrid = ({ products, title, overline, subtitle, viewAllLink, columns = 4 }) => {
  const cols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  }[columns];

  return (
    <section className="container-px mx-auto max-w-[1400px] py-16 sm:py-24" data-testid="product-grid-section">
      {(title || overline) && (
        <div className="flex items-end justify-between mb-10 sm:mb-14 gap-4 flex-wrap">
          <div>
            {overline && <p className="overline text-muted-foreground mb-3">{overline}</p>}
            {title && (
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-none">
                {title}
              </h2>
            )}
            {subtitle && <p className="mt-3 text-muted-foreground max-w-xl">{subtitle}</p>}
          </div>
          {viewAllLink && (
            <Link to={viewAllLink} className="text-sm font-medium underline-offset-4 hover:underline">
              View all →
            </Link>
          )}
        </div>
      )}
      <div className={`grid ${cols} gap-5 sm:gap-6 lg:gap-8`}>
        {products.map((p, idx) => (
          <ProductCard key={p.id} product={p} ctaIndex={idx} />
        ))}
      </div>
    </section>
  );
};

export default ProductGrid;
