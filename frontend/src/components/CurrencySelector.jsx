import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useCurrency, CURRENCIES } from "../lib/currencyContext";

const CurrencySelector = ({ mobile = false }) => {
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // إغلاق عند الضغط خارج القائمة
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // نسخة الجوال — داخل Sheet Drawer
  if (mobile) {
    return (
      <div className="pt-2">
        <p className="overline text-muted-foreground text-[10px] mb-3">Currency</p>
        <div className="flex flex-wrap gap-2">
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              onClick={() => setCurrency(c.code)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm border transition-colors ${
                currency.code === c.code
                  ? "bg-foreground text-background border-foreground"
                  : "border-border hover:border-foreground"
              }`}
            >
              <span>{c.flag}</span>
              <span className="font-medium">{c.code}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // نسخة سطح المكتب — dropdown
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-border hover:border-foreground transition-colors"
        aria-label="Select currency"
        data-testid="currency-selector"
      >
        <span>{currency.flag}</span>
        <span>{currency.code}</span>
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-background border border-border shadow-lg z-[60]">
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              onClick={() => { setCurrency(c.code); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-secondary transition-colors ${
                currency.code === c.code ? "bg-secondary font-semibold" : ""
              }`}
              data-testid={`currency-option-${c.code}`}
            >
              <span className="text-base">{c.flag}</span>
              <span className="font-medium">{c.code}</span>
              <span className="text-muted-foreground text-xs ml-auto">{c.symbol}</span>
            </button>
          ))}
          <div className="border-t border-border px-4 py-2">
            <p className="text-[10px] text-muted-foreground">Rates updated daily</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrencySelector;
