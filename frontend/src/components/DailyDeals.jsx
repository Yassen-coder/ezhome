import { useCountdown, getEndOfDay } from "../lib/useCountdown";
import ProductCard from "./ProductCard";
import { Flame } from "lucide-react";

const Cell = ({ value, label }) => (
  <div className="flex flex-col items-center" data-testid={`countdown-${label.toLowerCase()}`}>
    <div className="font-display font-bold text-2xl sm:text-4xl tabular-nums bg-foreground text-background px-3 sm:px-5 py-2 sm:py-3 min-w-[60px] sm:min-w-[80px] text-center">
      {String(value).padStart(2, "0")}
    </div>
    <p className="overline text-[10px] mt-2 text-muted-foreground">{label}</p>
  </div>
);

const DailyDeals = ({ products = [] }) => {
  const target = getEndOfDay();
  const { hours, minutes, seconds } = useCountdown(target);

  return (
    <section className="bg-secondary border-y border-border" data-testid="daily-deals-section">
      <div className="container-px mx-auto max-w-[1400px] py-16 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center mb-12 sm:mb-16">
          <div className="lg:col-span-6">
            <p className="overline text-muted-foreground mb-3 flex items-center gap-2"><Flame className="w-3.5 h-3.5" /> Today Only</p>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-none">
              Daily Deals.<br />
              <span className="italic font-medium">Gone by midnight.</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-md">
              Premium pieces at unbeatable prices. Once the clock hits zero, these deals disappear.
            </p>
          </div>
          <div className="lg:col-span-6 flex items-center justify-start lg:justify-end gap-3 sm:gap-4">
            <Cell value={hours} label="Hours" />
            <span className="font-display text-3xl sm:text-4xl">:</span>
            <Cell value={minutes} label="Minutes" />
            <span className="font-display text-3xl sm:text-4xl">:</span>
            <Cell value={seconds} label="Seconds" />
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 lg:gap-8">
          {products.slice(0, 4).map((p, i) => (
            <ProductCard key={p.id} product={p} ctaIndex={i + 1} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default DailyDeals;
