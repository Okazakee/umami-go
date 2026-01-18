import AsyncStorage from '@react-native-async-storage/async-storage';

export type DefaultTimeRange = '24h' | '7d' | '30d' | '90d';
export type RefreshIntervalSeconds = 0 | 30 | 60 | 300;

export type AppSettings = {
  defaultTimeRange: DefaultTimeRange;
  refreshIntervalSeconds: RefreshIntervalSeconds;
  wifiOnly: boolean;
  backgroundRefresh: boolean;
};

const SETTINGS_KEY = '@umami-go:settings';

const DEFAULT_SETTINGS: AppSettings = {
  defaultTimeRange: '7d',
  refreshIntervalSeconds: 300,
  wifiOnly: false,
  backgroundRefresh: false,
};

export async function getAppSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function setAppSettings(next: AppSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
}

export async function patchAppSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getAppSettings();
  const next: AppSettings = { ...current, ...patch };
  await setAppSettings(next);
  return next;
}
