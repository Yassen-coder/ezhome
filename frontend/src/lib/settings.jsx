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
  const [settings, setSettings] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const refetchSettings = useCallback(async () => {
    try {
      const { data } = await api.get("/settings");
      setSettings({ ...DEFAULTS, ...data });
    } catch {
      // Keep previous settings on fetch failure
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

  const value = { ...settings, refetchSettings, settingsLoading: loading };
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => useContext(SettingsContext);
