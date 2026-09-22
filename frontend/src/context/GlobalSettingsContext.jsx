import { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  getGlobalSettings,
  saveGlobalSettings,
  subscribeGlobalSettings,
} from "../utils/settings";

const GlobalSettingsContext = createContext(null);

export function GlobalSettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => getGlobalSettings());

  useEffect(() => subscribeGlobalSettings(() => setSettings(getGlobalSettings())), []);

  const updateSettings = useCallback((partial) => {
    saveGlobalSettings(partial);
    setSettings(getGlobalSettings());
  }, []);

  return (
    <GlobalSettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </GlobalSettingsContext.Provider>
  );
}

export function useGlobalSettings() {
  const ctx = useContext(GlobalSettingsContext);
  if (!ctx) return { settings: getGlobalSettings(), updateSettings: () => {} };
  return ctx;
}
