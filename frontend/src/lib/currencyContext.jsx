import React, { createContext, useContext, useState, useEffect } from "react";

const CURRENCIES = {
  EUR: { symbol: "€", name: "Euro" },
  USD: { symbol: "$", name: "US Dollar" },
  GBP: { symbol: "£", name: "British Pound" },
  CZK: { symbol: "Kč", name: "Czech Koruna" },
  CAD: { symbol: "CA$", name: "Canadian Dollar" },
  AUD: { symbol: "A$", name: "Australian Dollar" },
};

const CACHE_KEY = "ezhome_exchange_rates";
const CACHE_DURATION = 24 * 60 * 60 * 1000;

const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState("EUR");
  const [rates, setRates] = useState({ EUR: 1 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION) {
            setRates(data);
            setLoading(false);
            return;
          }
        }
        const res = await fetch("https://open.er-api.com/v6/latest/EUR");
        const json = await res.json();
        if (json.rates) {
          setRates(json.rates);
          localStorage.setItem(CACHE_KEY, JSON.stringify({ data: json.rates, timestamp: Date.now() }));
        }
      } catch (err) {
        setRates({ EUR: 1, USD: 1.08, GBP: 0.86, CZK: 25.2, CAD: 1.47, AUD: 1.65 });
      } finally {
        setLoading(false);
      }
    };
    fetchRates();
  }, []);

  const convert = (priceUSD) => {
    if (!priceUSD || isNaN(priceUSD)) return "—";
    const inEUR = priceUSD / (rates["USD"] || 1.08);
    const inTarget = inEUR * (rates[currency] || 1);
    return inTarget.toFixed(2);
  };

  const format = (priceUSD) => {
    const { symbol } = CURRENCIES[currency] || CURRENCIES.EUR;
    return `${symbol}${convert(priceUSD)}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, currencies: CURRENCIES, rates, loading, convert, format }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used inside CurrencyProvider");
  return ctx;
}

export default CurrencyContext;
