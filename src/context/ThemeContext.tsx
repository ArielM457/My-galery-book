/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { ThemeMode } from '../utils/enums';

interface ThemeContextValue {
  currentThemeMode: ThemeMode;
  toggleThemeMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const THEME_PREFERENCE_STORAGE_KEY = 'unilibrary-theme-preference';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [currentThemeMode, setCurrentThemeMode] = useState<ThemeMode>(() => {
    const persistedThemePreference = localStorage.getItem(THEME_PREFERENCE_STORAGE_KEY);
    return persistedThemePreference === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentThemeMode);
    localStorage.setItem(THEME_PREFERENCE_STORAGE_KEY, currentThemeMode);
  }, [currentThemeMode]);

  function toggleThemeMode() {
    setCurrentThemeMode(previousTheme => (previousTheme === 'light' ? 'dark' : 'light'));
  }

  return (
    <ThemeContext.Provider value={{ currentThemeMode, toggleThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const contextValue = useContext(ThemeContext);
  if (!contextValue) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return contextValue;
}
