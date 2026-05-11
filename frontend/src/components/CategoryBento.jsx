import { Link } from "react-router-dom";

const TILES = [
  { slug: "smart-home", title: "Smart Home", img: "https://images.unsplash.com/photo-1558002038-1055907df827?w=900&q=85", span: "md:col-span-6 row-span-2 h-[340px] md:h-[480px]" },
  { slug: "kitchen", title: "Kitchen Essentials", img: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=900&q=85", span: "md:col-span-6 row-span-1 h-[220px] md:h-[230px]" },
  { slug: "decor", title: "Home Decor", img: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e6?w=900&q=85", span: "md:col-span-3 row-span-1 h-[220px] md:h-[230px]" },
  { slug: "tiktok", title: "Viral TikTok Finds", img: "https://images.unsplash.com/photo-1620396748669-46bd3128ccce?w=900&q=85", span: "md:col-span-3 row-span-1 h-[220px] md:h-[230px]" },
  { slug: "organization", title: "Organization", img: "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=900&q=85", span: "md:col-span-4 row-span-1 h-[220px] md:h-[280px]" },
  { slug: "fashion", title: "SHEIN Fashion", img: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=900&q=85", span: "md:col-span-8 row-span-1 h-[260px] md:h-[280px]" },
];

const CategoryBento = () => {
  return (
    <section className="container-px mx-auto max-w-[1400px] py-16 sm:py-24" data-testid="categories-section">
      <div className="flex items-end justify-between mb-10 sm:mb-14 gap-4 flex-wrap">
        <div>
          <p className="overline text-muted-foreground mb-3">Shop by Mood</p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-none max-w-xl">
            Categories that <span className="italic font-medium">feel</span> like you.
          </h2>
        </div>
        <Link to="/products" className="text-sm font-medium underline-offset-4 hover:underline">
          Browse everything →
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 auto-rows-auto">
        {TILES.map((t) => (
          <Link
            key={t.slug}
            to={`/category/${t.slug}`}
            className={`relative overflow-hidden group ${t.span}`}
            data-testid={`category-tile-${t.slug}`}
          >
            <img src={t.img} alt={t.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent" />
            <div className="absolute inset-0 p-5 sm:p-7 flex flex-col justify-end text-background">
              <p className="overline text-[10px] opacity-80">Shop</p>
              <h3 className="font-display font-bold text-2xl sm:text-3xl mt-1 leading-tight">{t.title}</h3>
              <span className="mt-3 inline-flex items-center text-xs font-medium opacity-90 group-hover:translate-x-1 transition-transform">Explore →</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default CategoryBento;
