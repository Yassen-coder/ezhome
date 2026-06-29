import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "./api";

const DEFAULTS = {
  announcement_text: "FREE GLOBAL SHIPPING ON ORDERS $50+ · NEW DROPS WEEKLY",
  hero_overline: "The Curated Home, Reimagined",
  hero_eyebrow_enabled: true,
  newsletter_enabled: true,
  countdown_enabled: true,
};

const SettingsContext = createContext({ ...DEFAULTS, refetchSettings: async () => {}, settingsLoading: true });

export const SettingsProvider = ({ children }) => {
  // Start with null so no stale value renders before the first fetch completes
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const refetchSettings = useCallback(async () => {
    try {
      const { data } = await api.get("/settings");
      setSettings({ ...DEFAULTS, ...data });
    } catch {
      // On failure, use DEFAULTS so the UI is never blank
      setSettings((prev) => prev ?? DEFAULTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetchSettings();
  }, [refetchSettings]);

  // Poll every 60s so public pages pick up admin changes without manual refresh
  useEffect(() => {
    const interval = setInterval(refetchSettings, 60000);
    return () => clearInterval(interval);
  }, [refetchSettings]);

  // While loading and no data yet, expose DEFAULTS so hooks never get undefined fields
  const resolved = settings ?? DEFAULTS;
  const value = { ...resolved, refetchSettings, settingsLoading: loading };
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => useContext(SettingsContext);
