import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import ProductGrid from "../components/ProductGrid";
import { PageLoading, PageError, PageEmpty } from "../components/PageState";

const SOURCES = [
  { key: "all", label: "All" },
  { key: "amazon", label: "Amazon" },
  { key: "aliexpress", label: "AliExpress" },
  { key: "shein", label: "SHEIN" },
];

const EXTRA_FILTERS = [{ slug: "trending", name: "Trending" }];

const Products = () => {
  const [params] = useSearchParams();
  const search = params.get("search") || "";
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [source, setSource] = useState("all");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("loading");

  const loadProducts = useCallback(async () => {
    setStatus("loading");
    try {
      const { data } = await api.get("/products", { params: { search, limit: 200 } });
      setProducts(data);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }, [search]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    api.get("/categories").then((r) => setCategories(r.data?.categories || [])).catch(() => setCategories([]));
  }, []);

  const categoryFilters = useMemo(
    () => [{ slug: "all", name: "All" }, ...categories, ...EXTRA_FILTERS],
    [categories]
  );

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (source !== "all" && p.source !== source) return false;
      if (category === "all") return true;
      if (category === "trending") return p.is_trending === true;
      return p.category === category;
    });
  }, [products, source, category]);

  return (
    <div data-testid="products-page">
      <section className="container-px mx-auto max-w-[1400px] pt-12 sm:pt-16 pb-6">
        <p className="overline text-muted-foreground mb-3">{search ? `Results for "${search}"` : "Full Collection"}</p>
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
          The <span className="italic font-medium">Edit</span>
        </h1>

        {status === "success" && (
          <>
            <div className="mt-8" data-testid="source-filters">
              <p className="overline text-muted-foreground text-[10px] mb-3">Platform</p>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x scroll-px-1">
                {SOURCES.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setSource(s.key)}
                    className={`shrink-0 snap-start px-4 py-2 text-xs uppercase tracking-[0.18em] border transition-all duration-200 ${
                      source === s.key
                        ? "bg-foreground text-background border-foreground"
                        : "border-border hover:border-foreground"
                    }`}
                    data-testid={`filter-source-${s.key}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5" data-testid="category-filters">
              <p className="overline text-muted-foreground text-[10px] mb-3">Category</p>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x scroll-px-1">
                {categoryFilters.map((c) => (
                  <button
                    key={c.slug}
                    onClick={() => setCategory(c.slug)}
                    className={`shrink-0 snap-start px-4 py-2 text-xs uppercase tracking-[0.18em] border transition-all duration-200 ${
                      category === c.slug
                        ? "bg-foreground text-background border-foreground"
                        : "border-border hover:border-foreground"
                    }`}
                    data-testid={`filter-category-${c.slug}`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <p className="overline text-muted-foreground text-[10px] mt-5" data-testid="filter-count">
              Showing {filtered.length} of {products.length}
            </p>
          </>
        )}
      </section>

      {status === "loading" && <PageLoading message="Loading collection…" />}
      {status === "error" && (
        <PageError message="Unable to load products. Please check your connection." onRetry={loadProducts} />
      )}
      {status === "success" && (
        <>
          <div key={`${source}-${category}`} className="fade-up">
            <ProductGrid products={filtered} />
          </div>
          {filtered.length === 0 && (
            <PageEmpty message="No products match these filters." testId="no-products" />
          )}
        </>
      )}
    </div>
  );
};

export default Products;
