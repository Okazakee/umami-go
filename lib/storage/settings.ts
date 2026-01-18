import AsyncStorage from '@react-native-async-storage/async-storage';

export type DefaultTimeRange = '24h' | '7d' | '30d' | '90d';
export type RefreshIntervalSeconds = 0 | 30 | 60 | 300;

export type ThemePresetId = 'amethyst' | 'ocean' | 'emerald' | 'sunset' | 'rose' | 'mono';
export type ColorSchemePreference = 'dark' | 'light';

export type AppSettings = {
  defaultTimeRange: DefaultTimeRange;
  refreshIntervalSeconds: RefreshIntervalSeconds;
  wifiOnly: boolean;
  backgroundRefresh: boolean;
  colorScheme: ColorSchemePreference;
  useMaterialYou: boolean;
  themePreset: ThemePresetId;
};

const SETTINGS_KEY = '@umami-go:settings';

export const DEFAULT_SETTINGS: AppSettings = {
  defaultTimeRange: '7d',
  refreshIntervalSeconds: 300,
  wifiOnly: false,
  backgroundRefresh: false,
  colorScheme: 'dark',
  useMaterialYou: false,
  themePreset: 'amethyst',
};

type AppSettingsListener = (settings: AppSettings) => void;
const listeners = new Set<AppSettingsListener>();

export function subscribeAppSettings(listener: AppSettingsListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function getAppSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AppSettings> & {
      accentPalette?: 'purple' | 'blue' | 'teal' | 'green' | 'orange' | 'pink';
    };

    const legacy = parsed.accentPalette;
    const legacyMapped: ThemePresetId | undefined =
      legacy === 'purple'
        ? 'amethyst'
        : legacy === 'blue' || legacy === 'teal'
          ? 'ocean'
          : legacy === 'green'
            ? 'emerald'
            : legacy === 'orange'
              ? 'sunset'
              : legacy === 'pink'
                ? 'rose'
                : undefined;

    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      themePreset: parsed.themePreset ?? legacyMapped ?? DEFAULT_SETTINGS.themePreset,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function setAppSettings(next: AppSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  for (const l of listeners) l(next);
}

export async function patchAppSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getAppSettings();
  const next: AppSettings = { ...current, ...patch };
  await setAppSettings(next);
  return next;
}
