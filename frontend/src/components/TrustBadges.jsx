import { Truck, Shield, RotateCcw, Headphones } from "lucide-react";

const items = [
  { icon: Truck, title: "Free Global Shipping", desc: "On all orders over $50" },
  { icon: Shield, title: "Secure Checkout", desc: "Powered by trusted partners" },
  { icon: RotateCcw, title: "30-Day Returns", desc: "Hassle-free, no questions" },
  { icon: Headphones, title: "Real Human Support", desc: "We reply within 24 hours" },
];

const TrustBadges = () => (
  <section className="border-y border-border" data-testid="trust-badges">
    <div className="container-px mx-auto max-w-[1400px] py-10 grid grid-cols-2 lg:grid-cols-4 gap-6">
      {items.map((it) => (
        <div key={it.title} className="flex items-center gap-4">
          <it.icon className="w-7 h-7 shrink-0 text-accent" strokeWidth={1.5} />
          <div>
            <p className="font-medium text-sm">{it.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{it.desc}</p>
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default TrustBadges;
