import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useCurrency, CURRENCIES } from "../lib/currencyContext";

const formatRatesTime = (ts) => {
  if (!ts) return "Live rates";
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return "Rates updated just now";
  if (mins < 60) return `Rates updated ${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `Rates updated ${hrs}h ago`;
};

const CurrencySelector = ({ mobile = false }) => {
  const { currency, setCurrency, ratesUpdatedAt, loading } = useCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (mobile) {
    return (
      <div className="pt-2">
        <p className="overline text-muted-foreground text-[10px] mb-3">Currency</p>
        <div className="flex flex-wrap gap-2">
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => setCurrency(c.code)}
              className={`px-3 py-1.5 text-sm border transition-colors ${
                currency.code === c.code
                  ? "bg-foreground text-background border-foreground"
                  : "border-border hover:border-foreground"
              }`}
            >
              <span className="font-medium">{c.code}</span>
              <span className="text-muted-foreground ml-1">{c.symbol}</span>
            </button>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          {loading ? "Loading live rates…" : formatRatesTime(ratesUpdatedAt)}
        </p>
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-border hover:border-foreground transition-colors rounded-md"
        aria-label="Select currency"
        data-testid="currency-selector"
      >
        <span className="font-semibold">{currency.code}</span>
        <span className="text-muted-foreground">{currency.symbol}</span>
        <ChevronDown
          className={`w-3 h-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-background border border-border shadow-lg z-[60] rounded-md overflow-hidden">
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => {
                setCurrency(c.code);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-secondary transition-colors ${
                currency.code === c.code ? "bg-secondary font-semibold" : ""
              }`}
              data-testid={`currency-option-${c.code}`}
            >
              <span className="font-semibold w-10">{c.code}</span>
              <span className="text-muted-foreground text-xs flex-1">{c.label}</span>
              <span className="text-muted-foreground text-xs">{c.symbol}</span>
            </button>
          ))}
          <div className="border-t border-border px-4 py-2">
            <p className="text-[10px] text-muted-foreground">
              {loading ? "Loading live rates…" : formatRatesTime(ratesUpdatedAt)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrencySelector;
