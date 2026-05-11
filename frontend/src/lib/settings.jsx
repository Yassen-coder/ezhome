import { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api";

const DEFAULTS = {
  announcement_text: "FREE GLOBAL SHIPPING ON ORDERS $50+ · NEW DROPS WEEKLY",
  hero_overline: "The Curated Home, Reimagined",
  hero_eyebrow_enabled: true,
  newsletter_enabled: true,
  countdown_enabled: true,
};

const SettingsContext = createContext(DEFAULTS);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULTS);
  useEffect(() => {
    api.get("/settings").then((r) => setSettings({ ...DEFAULTS, ...r.data })).catch(() => {});
  }, []);
  return <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => useContext(SettingsContext);
