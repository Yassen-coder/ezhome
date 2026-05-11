import { Star } from "lucide-react";

const reviews = [
  {
    name: "Sophia R.",
    role: "Brooklyn, NY",
    text: "EzHome has completely changed how I shop. Every piece I've gotten feels like it was made for my apartment — and the prices are unreal.",
    product: "Marble Cutting Board",
  },
  {
    name: "Marcus T.",
    role: "Los Angeles, CA",
    text: "The TikTok finds section is dangerous in the best way. Already ordered 3 things this month. Quality is consistently better than expected.",
    product: "Aura Smart Lamp",
  },
  {
    name: "Aisha K.",
    role: "London, UK",
    text: "Finally an affiliate site that doesn't feel spammy. The curation is on another level — like having a stylist DM you finds.",
    product: "Linen Trousers",
  },
];

const Testimonials = () => (
  <section className="container-px mx-auto max-w-[1400px] py-16 sm:py-24" data-testid="testimonials-section">
    <div className="text-center mb-12 sm:mb-16">
      <p className="overline text-muted-foreground mb-3">Loved by 2.4M+ shoppers</p>
      <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-none max-w-2xl mx-auto">
        Words from <span className="italic font-medium">happy homes.</span>
      </h2>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
      {reviews.map((r, i) => (
        <article key={i} className="bg-card border border-border p-7 sm:p-9 flex flex-col" data-testid={`testimonial-${i}`}>
          <div className="flex gap-0.5 mb-5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="w-4 h-4 fill-foreground text-foreground" />
            ))}
          </div>
          <p className="font-display text-lg sm:text-xl leading-snug flex-1">"{r.text}"</p>
          <div className="mt-6 pt-6 border-t border-border">
            <p className="font-medium text-sm">{r.name}</p>
            <p className="text-xs text-muted-foreground mt-1">{r.role} · Bought {r.product}</p>
          </div>
        </article>
      ))}
    </div>
  </section>
);

export default Testimonials;
