import { useEffect, useState, useCallback } from "react";
import { api } from "../lib/api";
import { useSettings } from "../lib/settings";
import Hero from "../components/Hero";
import TrustBadges from "../components/TrustBadges";
import ProductGrid from "../components/ProductGrid";
import CategoryBento from "../components/CategoryBento";
import DailyDeals from "../components/DailyDeals";
import Testimonials from "../components/Testimonials";
import { ProductGridSkeleton, InlineErrorBanner } from "../components/PageState";

const EMPTY = {
  trending: [], bestSellers: [], smartHome: [], kitchen: [],
  decor: [], organization: [], tiktok: [], fashion: [], deals: [],
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
      const [trending, bestSellers, smartHome, kitchen, decor, organization, tiktok, fashion, deals] = await Promise.all([
        api.get("/products", { params: { trending: true, limit: 8 } }),
        api.get("/products", { params: { best_seller: true, limit: 8 } }),
        api.get("/products", { params: { category: "smart-home", limit: 4 } }),
        api.get("/products", { params: { category: "kitchen", limit: 4 } }),
        api.get("/products", { params: { category: "decor", limit: 4 } }),
        api.get("/products", { params: { category: "organization", limit: 4 } }),
        api.get("/products", { params: { category: "tiktok", limit: 8 } }),
        api.get("/products", { params: { category: "fashion", limit: 8 } }),
        api.get("/products", { params: { daily_deal: true, limit: 4 } }),
      ]);
      setData({
        trending: trending.data,
        bestSellers: bestSellers.data,
        smartHome: smartHome.data,
        kitchen: kitchen.data,
        decor: decor.data,
        organization: organization.data,
        tiktok: tiktok.data,
        fashion: fashion.data,
        deals: deals.data,
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

  return (
    <div data-testid="home-page">
      <Hero featured={data.trending} />
      <TrustBadges />
      {status === "error" && (
        <InlineErrorBanner message={errorMsg} onRetry={load} />
      )}
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
          <ProductGrid title="Trending Now" overline="What's hot this week" subtitle="The pieces flying off shelves. Don't sleep on these." products={data.trending} viewAllLink="/products" />
          <CategoryBento />
          <ProductGrid title="Best Sellers" overline="Customer favorites" products={data.bestSellers} viewAllLink="/products" />
          {data.deals.length > 0 && countdown_enabled && <DailyDeals products={data.deals} />}
          <ProductGrid title="Smart Home" overline="Effortless luxury, automated" products={data.smartHome} viewAllLink="/category/smart-home" />
          <ProductGrid title="Kitchen Essentials" overline="For the modern cook" products={data.kitchen} viewAllLink="/category/kitchen" />
          <ProductGrid title="Home Decor" overline="Quietly stunning pieces" products={data.decor} viewAllLink="/category/decor" />
          <ProductGrid title="Organization & Storage" overline="Order, beautifully" products={data.organization} viewAllLink="/category/organization" />
          <ProductGrid title="Viral TikTok Finds" overline="As seen on your FYP" products={data.tiktok} viewAllLink="/category/tiktok" />
          <ProductGrid title="SHEIN Fashion Picks" overline="Style, curated" products={data.fashion} viewAllLink="/category/fashion" />
        </>
      )}
      {!loading && <Testimonials />}
    </div>
  );
};

export default Home;
