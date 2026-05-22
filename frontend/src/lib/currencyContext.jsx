import { createContext, useContext, useEffect, useState } from "react";

// ============================================================
// الأسعار الافتراضية — تُستخدم إذا فشل API
// ============================================================
const FALLBACK_RATES = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  CZK: 23.5,
  CAD: 1.36,
  AUD: 1.53,
};

export const CURRENCIES = [
  { code: "USD", symbol: "$", label: "US Dollar",      flag: "🇺🇸" },
  { code: "EUR", symbol: "€", label: "Euro",           flag: "🇪🇺" },
  { code: "GBP", symbol: "£", label: "British Pound",  flag: "🇬🇧" },
  { code: "CZK", symbol: "Kč", label: "Czech Koruna",  flag: "🇨🇿" },
  { code: "CAD", symbol: "CA$", label: "Canadian Dollar", flag: "🇨🇦" },
  { code: "AUD", symbol: "A$", label: "Australian Dollar", flag: "🇦🇺" },
];

const CACHE_KEY   = "ezhome_fx_rates";
const CACHE_TTL   = 24 * 60 * 60 * 1000; // 24 ساعة
const API_URL     = "https://open.er-api.com/v6/latest/USD";
const STORAGE_KEY = "ezhome_currency";

// ============================================================
// Context
// ============================================================
const CurrencyContext = createContext(null);

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrencyState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const match = CURRENCIES.find((c) => c.code === saved);
      return match || CURRENCIES[0]; // default: USD
    } catch {
      return CURRENCIES[0];
    }
  });

  const [rates, setRates] = useState(FALLBACK_RATES);
  const [loading, setLoading] = useState(true);

  // جلب أسعار الصرف مع caching
  useEffect(() => {
    const fetchRates = async () => {
      try {
        // تحقق من الـ cache أولاً
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_TTL) {
            setRates(data);
            setLoading(false);
            return;
          }
        }

        // جلب من API
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("API error");
        const json = await res.json();

        if (json.result === "success" && json.rates) {
          const freshRates = {
            USD: 1,
            EUR: json.rates.EUR ?? FALLBACK_RATES.EUR,
            GBP: json.rates.GBP ?? FALLBACK_RATES.GBP,
            CZK: json.rates.CZK ?? FALLBACK_RATES.CZK,
            CAD: json.rates.CAD ?? FALLBACK_RATES.CAD,
            AUD: json.rates.AUD ?? FALLBACK_RATES.AUD,
          };
          setRates(freshRates);
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            data: freshRates,
            timestamp: Date.now(),
          }));
        }
      } catch {
        // فشل API → نبقى على الأسعار الافتراضية (صامت)
        setRates(FALLBACK_RATES);
      } finally {
        setLoading(false);
      }
    };

    fetchRates();
  }, []);

  // حفظ اختيار المستخدم
  const setCurrency = (currencyCode) => {
    const match = CURRENCIES.find((c) => c.code === currencyCode);
    if (!match) return;
    setCurrencyState(match);
    try { localStorage.setItem(STORAGE_KEY, currencyCode); } catch {}
  };

  // دالة تحويل السعر
  const formatPrice = (usdPrice) => {
    if (typeof usdPrice !== "number" || isNaN(usdPrice)) return "—";
    const rate   = rates[currency.code] ?? 1;
    const converted = usdPrice * rate;

    // تنسيق حسب العملة
    const formatted = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: currency.code === "CZK" ? 0 : 2,
      maximumFractionDigits: currency.code === "CZK" ? 0 : 2,
    }).format(converted);

    // وضع الرمز في المكان الصحيح
    if (currency.code === "CZK") return `${formatted} ${currency.symbol}`;
    return `${currency.symbol}${formatted}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice, rates, loading }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used inside CurrencyProvider");
  return ctx;
};
