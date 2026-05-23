import { useEffect, useState, useCallback } from "react";
import { api } from "../lib/api";
import ProductGrid from "../components/ProductGrid";
import DailyDeals from "../components/DailyDeals";
import { PageLoading, PageError, PageEmpty } from "../components/PageState";

const Deals = () => {
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("loading");

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const { data } = await api.get("/products", { params: { daily_deal: true, limit: 50 } });
      setProducts(data);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div data-testid="deals-page">
      <section className="container-px mx-auto max-w-[1400px] pt-12 sm:pt-20 pb-0">
        <p className="overline text-muted-foreground mb-3">Today Only</p>
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight max-w-3xl leading-[0.95]">
          Daily Deals & <span className="italic font-medium">Discounts</span>
        </h1>
        <p className="mt-5 text-muted-foreground max-w-xl">Hand-picked premium pieces at unbeatable prices. Refreshed every 24 hours.</p>
      </section>

      {status === "loading" && <PageLoading message="Loading today's deals…" />}
      {status === "error" && (
        <PageError message="Unable to load deals. Please try again." onRetry={load} />
      )}
      {status === "success" && products.length === 0 && (
        <PageEmpty message="No daily deals right now. Check back tomorrow." testId="deals-empty" />
      )}
      {status === "success" && products.length > 0 && (
        <>
          <DailyDeals products={products.slice(0, 4)} />
          {products.length > 4 && (
            <ProductGrid title="More Deals" overline="Save more" products={products.slice(4)} />
          )}
        </>
      )}
    </div>
  );
};

export default Deals;
