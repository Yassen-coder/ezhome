import { useCountdown } from "../lib/useCountdown";
import ProductCard from "./ProductCard";
import { Flame } from "lucide-react";
import { Link } from "react-router-dom";

const Cell = ({ value, label }) => (
  <div className="flex flex-col items-center" data-testid={`countdown-${label.toLowerCase()}`}>
    <div className="font-display font-bold text-2xl sm:text-4xl tabular-nums bg-foreground text-background px-3 sm:px-5 py-2 sm:py-3 min-w-[60px] sm:min-w-[80px] text-center">
      {String(value).padStart(2, "0")}
    </div>
    <p className="overline text-[10px] mt-2 text-muted-foreground">{label}</p>
  </div>
);

const DailyDeals = ({
  products = [],
  campaign = null,
}) => {
  const endsAt = campaign?.ends_at ? new Date(campaign.ends_at).getTime() : null;
  const { days, hours, minutes, seconds, done } = useCountdown(
    endsAt || Date.now()
  );

  if (!products.length || done) return null;

  const title = campaign?.title || "Daily Deals";
  const subtitle = campaign?.subtitle || "Gone when the timer hits zero.";

  return (
    <section className="bg-secondary border-y border-border" data-testid="daily-deals-section">
      <div className="container-px mx-auto max-w-[1400px] py-16 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center mb-12 sm:mb-16">
          <div className="lg:col-span-6">
            <p className="overline text-muted-foreground mb-3 flex items-center gap-2">
              <Flame className="w-3.5 h-3.5" /> Limited time
            </p>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-none">
              {title}
            </h2>
            <p className="mt-4 text-muted-foreground max-w-md">{subtitle}</p>
            <Link
              to="/deals"
              className="inline-block mt-4 text-sm font-medium underline-offset-4 hover:underline"
            >
              View all deals →
            </Link>
          </div>
          <div className="lg:col-span-6 flex items-center justify-start lg:justify-end gap-2 sm:gap-4 flex-wrap">
            {days > 0 && (
              <>
                <Cell value={days} label="Days" />
                <span className="font-display text-3xl sm:text-4xl hidden sm:inline">:</span>
              </>
            )}
            <Cell value={hours} label="Hours" />
            <span className="font-display text-3xl sm:text-4xl">:</span>
            <Cell value={minutes} label="Minutes" />
            <span className="font-display text-3xl sm:text-4xl">:</span>
            <Cell value={seconds} label="Seconds" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-1.5 gap-y-3 sm:gap-x-2 sm:gap-y-4 md:grid-cols-3 lg:grid-cols-4">
          {products.slice(0, 8).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default DailyDeals;
