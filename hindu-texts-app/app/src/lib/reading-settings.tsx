import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type ThemeName = 'light' | 'dark';

export type Theme = {
  name: ThemeName;
  background: string;
  surface: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
};

export const THEMES: Record<ThemeName, Theme> = {
  light: {
    name: 'light',
    background: '#FFFBF3',
    surface: '#FFFFFF',
    border: '#E8DFCE',
    text: '#241C10',
    muted: '#6B5B44',
    accent: '#A2410A',
  },
  dark: {
    name: 'dark',
    background: '#14110C',
    surface: '#1E1A14',
    border: '#332C22',
    text: '#F2EADC',
    muted: '#B4A692',
    accent: '#F0A868',
  },
};

export const MIN_FONT_SIZE = 14;
export const MAX_FONT_SIZE = 34;

const SETTINGS_KEY = 'reading-settings/v1';
const POSITION_KEY_PREFIX = 'last-read/v1/';

type ReadingSettings = {
  fontSize: number;
  themeName: ThemeName;
};

type ReadingSettingsValue = ReadingSettings & {
  theme: Theme;
  ready: boolean;
  setFontSize: (size: number) => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  toggleTheme: () => void;
};

const DEFAULTS: ReadingSettings = { fontSize: 18, themeName: 'light' };

const ReadingSettingsContext = createContext<ReadingSettingsValue | null>(null);

const clamp = (size: number) => Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, size));

export function ReadingSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<ReadingSettings>(DEFAULTS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(SETTINGS_KEY)
      .then((raw) => {
        if (cancelled || !raw) return;
        const parsed = JSON.parse(raw) as Partial<ReadingSettings>;
        setSettings({
          fontSize: clamp(parsed.fontSize ?? DEFAULTS.fontSize),
          themeName: parsed.themeName === 'dark' ? 'dark' : 'light',
        });
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((next: ReadingSettings) => {
    setSettings(next);
    void AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  }, []);

  const value = useMemo<ReadingSettingsValue>(
    () => ({
      ...settings,
      theme: THEMES[settings.themeName],
      ready,
      setFontSize: (size) => persist({ ...settings, fontSize: clamp(size) }),
      increaseFontSize: () => persist({ ...settings, fontSize: clamp(settings.fontSize + 2) }),
      decreaseFontSize: () => persist({ ...settings, fontSize: clamp(settings.fontSize - 2) }),
      toggleTheme: () => persist({ ...settings, themeName: settings.themeName === 'dark' ? 'light' : 'dark' }),
    }),
    [persist, ready, settings],
  );

  return <ReadingSettingsContext.Provider value={value}>{children}</ReadingSettingsContext.Provider>;
}

export function useReadingSettings(): ReadingSettingsValue {
  const value = useContext(ReadingSettingsContext);
  if (!value) throw new Error('useReadingSettings must be used inside ReadingSettingsProvider');
  return value;
}

export type LastReadPosition = {
  chapterIndex: number;
  scrollOffset: number;
  updatedAt: number;
};

export async function loadLastRead(workId: string): Promise<LastReadPosition | null> {
  try {
    const raw = await AsyncStorage.getItem(POSITION_KEY_PREFIX + workId);
    return raw ? (JSON.parse(raw) as LastReadPosition) : null;
  } catch {
    return null;
  }
}

export async function saveLastRead(workId: string, position: Omit<LastReadPosition, 'updatedAt'>): Promise<void> {
  const payload: LastReadPosition = { ...position, updatedAt: Date.now() };
  try {
    await AsyncStorage.setItem(POSITION_KEY_PREFIX + workId, JSON.stringify(payload));
  } catch {
    // Storage is best-effort: losing a bookmark must never break reading.
  }
}
