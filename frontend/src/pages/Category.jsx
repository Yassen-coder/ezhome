import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import ProductGrid from "../components/ProductGrid";

const CATEGORY_META = {
  "smart-home": { title: "Smart Home", overline: "Effortless luxury, automated", desc: "The tech that disappears into your life. Voice-controlled, app-connected, beautifully designed." },
  kitchen: { title: "Kitchen Essentials", overline: "For the modern cook", desc: "Tools that turn cooking into a ritual. Marble, ceramic, and Japanese steel." },
  decor: { title: "Home Decor", overline: "Quietly stunning pieces", desc: "Sculptural objects, soft textures, and timeless silhouettes for the home you dream about." },
  organization: { title: "Organization", overline: "Order, beautifully", desc: "Storage solutions that double as decor. Acrylic, woven, and modular." },
  tiktok: { title: "Viral TikTok Finds", overline: "As seen on your FYP", desc: "The products everyone is talking about. Real reviews, real obsession." },
  fashion: { title: "SHEIN Fashion Picks", overline: "Style, curated", desc: "Wardrobe essentials and viral pieces, hand-picked for the elevated everyday." },
};

const Category = () => {
  const { slug } = useParams();
  const [products, setProducts] = useState([]);
  const meta = CATEGORY_META[slug] || { title: slug, overline: "Shop", desc: "" };

  useEffect(() => {
    api.get("/products", { params: { category: slug, limit: 100 } }).then((r) => setProducts(r.data));
  }, [slug]);

  return (
    <div data-testid={`category-page-${slug}`}>
      <section className="container-px mx-auto max-w-[1400px] pt-12 sm:pt-20 pb-6">
        <p className="overline text-muted-foreground mb-3">{meta.overline}</p>
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight max-w-3xl leading-[0.95]">
          {meta.title}
        </h1>
        <p className="mt-5 text-muted-foreground max-w-xl">{meta.desc}</p>
      </section>
      <ProductGrid products={products} />
      {products.length === 0 && <p className="text-center text-muted-foreground py-20">Loading...</p>}
    </div>
  );
};

export default Category;
