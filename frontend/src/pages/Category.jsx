import { useEffect, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { getCategoryBySlug } from "../lib/categories";
import ProductGrid from "../components/ProductGrid";
import { PageLoading, PageError, PageEmpty } from "../components/PageState";

const Category = () => {
  const { slug } = useParams();
  const meta = getCategoryBySlug(slug);
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("loading");

  const load = useCallback(async () => {
    if (!meta) {
      setStatus("notfound");
      return;
    }
    setStatus("loading");
    try {
      const { data } = await api.get("/products", { params: { category: slug, limit: 100 } });
      setProducts(data);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }, [slug, meta]);

  useEffect(() => {
    load();
  }, [load]);

  if (!meta) {
    return (
      <div className="container-px mx-auto max-w-[1400px] py-24 text-center" data-testid="category-not-found">
        <h1 className="font-display text-3xl font-bold">Category not found</h1>
        <p className="mt-4 text-muted-foreground">This category is no longer available.</p>
        <Link to="/products" className="inline-block mt-8 text-sm font-medium underline">
          Browse all products
        </Link>
      </div>
    );
  }

  return (
    <div data-testid={`category-page-${slug}`}>
      <section className="container-px mx-auto max-w-[1400px] pt-12 sm:pt-20 pb-6">
        <p className="overline text-muted-foreground mb-3">{meta.overline}</p>
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight max-w-3xl leading-[0.95]">
          {meta.name}
        </h1>
        <p className="mt-5 text-muted-foreground max-w-xl">{meta.description}</p>
      </section>

      {status === "loading" && <PageLoading message="Loading products…" />}
      {status === "error" && (
        <PageError message="Unable to load this category. Please try again." onRetry={load} />
      )}
      {status === "success" && (
        <>
          <ProductGrid products={products} />
          {products.length === 0 && (
            <PageEmpty message="No products in this category yet." testId={`category-empty-${slug}`} />
          )}
        </>
      )}
    </div>
  );
};

export default Category;
