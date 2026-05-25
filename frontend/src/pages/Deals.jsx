import { useEffect, useState, useCallback } from "react";
import { api } from "../lib/api";
import ProductGrid from "../components/ProductGrid";
import DailyDeals from "../components/DailyDeals";
import { PageLoading, PageError, PageEmpty } from "../components/PageState";

const Deals = () => {
  const [products, setProducts] = useState([]);
  const [campaign, setCampaign] = useState(null);
  const [status, setStatus] = useState("loading");

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const { data } = await api.get("/flash-deals/active");
      setCampaign(data.campaign || null);
      setProducts(data.products || []);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const title = campaign?.title || "Limited Time Offers";

  return (
    <div data-testid="deals-page">
      <section className="container-px mx-auto max-w-[1400px] pt-12 sm:pt-20 pb-0">
        <p className="overline text-muted-foreground mb-3">Exclusive</p>
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight max-w-3xl leading-[0.95]">
          {title}
        </h1>
        <p className="mt-5 text-muted-foreground max-w-xl">
          {campaign?.subtitle ||
            "Hand-picked premium pieces at unbeatable prices — while the timer lasts."}
        </p>
      </section>

      {status === "loading" && <PageLoading message="Loading deals…" />}
      {status === "error" && (
        <PageError message="Unable to load deals. Please try again." onRetry={load} />
      )}
      {status === "success" && products.length === 0 && (
        <PageEmpty
          message="No active deals right now. Check back soon or browse the full collection."
          testId="deals-empty"
        />
      )}
      {status === "success" && products.length > 0 && campaign && (
        <>
          <DailyDeals products={products} campaign={campaign} />
        </>
      )}
      {status === "success" && products.length > 0 && !campaign && (
        <ProductGrid title="Current deals" products={products} />
      )}
    </div>
  );
};

export default Deals;
