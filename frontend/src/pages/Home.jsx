import { useEffect, useState, useCallback } from "react";
import { api } from "../lib/api";
import { useSettings } from "../lib/settings";
import { SITE_CATEGORIES, categoryPath } from "../lib/categories";
import Hero from "../components/Hero";
import TrustBadges from "../components/TrustBadges";
import ProductGrid from "../components/ProductGrid";
import CategoryBento from "../components/CategoryBento";
import DailyDeals from "../components/DailyDeals";
import Testimonials from "../components/Testimonials";
import { ProductGridSkeleton, InlineErrorBanner } from "../components/PageState";

const categoryKeys = SITE_CATEGORIES.reduce((acc, c) => {
  acc[c.slug] = [];
  return acc;
}, {});

const EMPTY = {
  trending: [],
  bestSellers: [],
  flash: { campaign: null, products: [] },
  ...categoryKeys,
};

const Home = () => {
  const { countdown_enabled } = useSettings();
  const [data, setData] = useState(EMPTY);
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");

  const load = useCallback(async () => {
    setStatus("loading");
    setErrorMsg("");
    try {
      const categoryRequests = SITE_CATEGORIES.map((c) =>
        api.get("/products", { params: { category: c.slug, limit: 4 } })
      );
      const [trending, bestSellers, flashRes, ...categoryResults] = await Promise.all([
        api.get("/products", { params: { trending: true, limit: 8 } }),
        api.get("/products", { params: { best_seller: true, limit: 8 } }),
        api.get("/flash-deals/active"),
        ...categoryRequests,
      ]);
      const byCategory = {};
      SITE_CATEGORIES.forEach((c, i) => {
        byCategory[c.slug] = categoryResults[i].data;
      });
      setData({
        trending: trending.data,
        bestSellers: bestSellers.data,
        flash: {
          campaign: flashRes.data?.campaign || null,
          products: flashRes.data?.products || [],
        },
        ...byCategory,
      });
      setStatus("success");
    } catch {
      setErrorMsg("Unable to load products. Check your connection and try again.");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loading = status === "loading";
  const flashProducts = data.flash?.products || [];

  return (
    <div data-testid="home-page">
      <Hero />
      <TrustBadges />
      {status === "error" && <InlineErrorBanner message={errorMsg} onRetry={load} />}
      {loading ? (
        <>
          <section className="container-px mx-auto max-w-[1400px] py-16 sm:py-24">
            <ProductGridSkeleton count={8} />
          </section>
          <CategoryBento />
          <section className="container-px mx-auto max-w-[1400px] py-16 sm:py-24">
            <ProductGridSkeleton count={4} />
          </section>
        </>
      ) : (
        <>
          <ProductGrid
            title="Trending Now"
            overline="What's hot this week"
            subtitle="The pieces flying off shelves. Don't sleep on these."
            products={data.trending}
            viewAllLink="/products"
          />
          <CategoryBento />
          <ProductGrid
            title="Best Sellers"
            overline="Customer favorites"
            products={data.bestSellers}
            viewAllLink="/products"
          />
          {flashProducts.length > 0 && countdown_enabled && (
            <DailyDeals products={flashProducts} campaign={data.flash.campaign} />
          )}
          {SITE_CATEGORIES.map((c) => {
            const products = data[c.slug] || [];
            if (products.length === 0) return null;
            return (
              <ProductGrid
                key={c.slug}
                title={c.name}
                overline={c.overline}
                products={products}
                viewAllLink={categoryPath(c.slug)}
              />
            );
          })}
        </>
      )}
      {!loading && <Testimonials />}
    </div>
  );
};

export default Home;
