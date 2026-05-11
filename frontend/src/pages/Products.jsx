import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import ProductGrid from "../components/ProductGrid";

const Products = () => {
  const [params] = useSearchParams();
  const search = params.get("search") || "";
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    api.get("/products", { params: { search, limit: 100 } }).then((r) => setProducts(r.data));
  }, [search]);

  const sources = ["all", "amazon", "temu", "shein"];
  const filtered = filter === "all" ? products : products.filter((p) => p.source === filter);

  return (
    <div data-testid="products-page">
      <section className="container-px mx-auto max-w-[1400px] pt-12 sm:pt-16 pb-6">
        <p className="overline text-muted-foreground mb-3">{search ? `Results for "${search}"` : "Full Collection"}</p>
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
          The <span className="italic font-medium">Edit</span>
        </h1>
        <div className="mt-8 flex items-center gap-2 flex-wrap">
          {sources.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 text-xs uppercase tracking-[0.18em] border transition-colors ${
                filter === s ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground"
              }`}
              data-testid={`filter-${s}`}
            >
              {s}
            </button>
          ))}
        </div>
      </section>
      <ProductGrid products={filtered} />
      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-20" data-testid="no-products">No products found.</p>
      )}
    </div>
  );
};

export default Products;
