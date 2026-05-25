import { createContext, useCallback, useContext, useEffect, useState } from "react";

const FALLBACK_RATES = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  CZK: 23.5,
  CAD: 1.36,
  AUD: 1.53,
};

export const CURRENCIES = [
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "GBP", symbol: "£", label: "British Pound" },
  { code: "CZK", symbol: "Kč", label: "Czech Koruna" },
  { code: "CAD", symbol: "CA$", label: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", label: "Australian Dollar" },
];

const CACHE_KEY = "ezhome_fx_rates";
const CACHE_TTL = 60 * 60 * 1000; // 1 hour — fresher live rates
const API_URL = "https://open.er-api.com/v6/latest/USD";
const STORAGE_KEY = "ezhome_currency";

const CurrencyContext = createContext(null);

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrencyState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const match = CURRENCIES.find((c) => c.code === saved);
      return match || CURRENCIES[0];
    } catch {
      return CURRENCIES[0];
    }
  });

  const [rates, setRates] = useState(FALLBACK_RATES);
  const [loading, setLoading] = useState(true);
  const [ratesUpdatedAt, setRatesUpdatedAt] = useState(null);

  const fetchRates = useCallback(async (force = false) => {
    try {
      if (!force) {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_TTL) {
            setRates(data);
            setRatesUpdatedAt(timestamp);
            setLoading(false);
            return;
          }
        }
      }

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
        const now = Date.now();
        setRates(freshRates);
        setRatesUpdatedAt(now);
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ data: freshRates, timestamp: now })
        );
      }
    } catch {
      setRates(FALLBACK_RATES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
    const interval = setInterval(() => fetchRates(true), CACHE_TTL);
    return () => clearInterval(interval);
  }, [fetchRates]);

  const setCurrency = (currencyCode) => {
    const match = CURRENCIES.find((c) => c.code === currencyCode);
    if (!match) return;
    setCurrencyState(match);
    try {
      localStorage.setItem(STORAGE_KEY, currencyCode);
    } catch {
      /* ignore */
    }
  };

  const formatPrice = (usdPrice) => {
    if (typeof usdPrice !== "number" || isNaN(usdPrice)) return "—";
    const rate = rates[currency.code] ?? 1;
    const converted = usdPrice * rate;

    const formatted = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: currency.code === "CZK" ? 0 : 2,
      maximumFractionDigits: currency.code === "CZK" ? 0 : 2,
    }).format(converted);

    if (currency.code === "CZK") return `${formatted} ${currency.symbol}`;
    return `${currency.symbol}${formatted}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        formatPrice,
        rates,
        loading,
        ratesUpdatedAt,
        refreshRates: () => fetchRates(true),
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used inside CurrencyProvider");
  return ctx;
};
