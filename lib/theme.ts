import type { AppSettings, ThemePresetId } from '@/lib/storage/settings';
import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from 'react-native-paper';

export const THEME_PRESETS: Array<{
  id: ThemePresetId;
  label: string;
  dark: {
    primary: string;
    background: string;
    surface: string;
    surfaceVariant: string;
    outline: string;
  };
  light: {
    primary: string;
    background: string;
    surface: string;
    surfaceVariant: string;
    outline: string;
  };
}> = [
  {
    id: 'amethyst',
    label: 'Amethyst',
    dark: {
      primary: '#4b37fe',
      background: '#121022',
      surface: '#1c1c2c',
      surfaceVariant: '#242339',
      outline: '#2c2c44',
    },
    light: {
      primary: '#4b37fe',
      background: '#faf8ff',
      surface: '#ffffff',
      surfaceVariant: '#f1eeff',
      outline: '#d1cee7',
    },
  },
  {
    id: 'ocean',
    label: 'Ocean',
    dark: {
      primary: '#4aa3ff',
      background: '#0f1422',
      surface: '#182235',
      surfaceVariant: '#1d2a40',
      outline: '#2c3a54',
    },
    light: {
      primary: '#1b74d6',
      background: '#f7fbff',
      surface: '#ffffff',
      surfaceVariant: '#eaf3ff',
      outline: '#cfe0f6',
    },
  },
  {
    id: 'emerald',
    label: 'Emerald',
    dark: {
      primary: '#22c55e',
      background: '#0f1a16',
      surface: '#172622',
      surfaceVariant: '#1b2e29',
      outline: '#2a3c36',
    },
    light: {
      primary: '#16a34a',
      background: '#f7fffb',
      surface: '#ffffff',
      surfaceVariant: '#e9fbf0',
      outline: '#cfeedd',
    },
  },
  {
    id: 'sunset',
    label: 'Sunset',
    dark: {
      primary: '#fb923c',
      background: '#1a120f',
      surface: '#2a1c16',
      surfaceVariant: '#332018',
      outline: '#4a2f24',
    },
    light: {
      primary: '#ea580c',
      background: '#fff8f4',
      surface: '#ffffff',
      surfaceVariant: '#ffe9db',
      outline: '#f2cdb6',
    },
  },
  {
    id: 'rose',
    label: 'Rose',
    dark: {
      primary: '#f472b6',
      background: '#1a1020',
      surface: '#26162e',
      surfaceVariant: '#2f1a3a',
      outline: '#3f2a4a',
    },
    light: {
      primary: '#db2777',
      background: '#fff7fb',
      surface: '#ffffff',
      surfaceVariant: '#ffe7f2',
      outline: '#f0c4da',
    },
  },
  {
    id: 'mono',
    label: 'Mono',
    dark: {
      primary: '#a6a6b3',
      background: '#101012',
      surface: '#1b1b1f',
      surfaceVariant: '#23232a',
      outline: '#34343f',
    },
    light: {
      primary: '#3a3a44',
      background: '#fbfbfd',
      surface: '#ffffff',
      surfaceVariant: '#f1f1f6',
      outline: '#d5d5df',
    },
  },
];

function presetFor(id: ThemePresetId) {
  return THEME_PRESETS.find((p) => p.id === id) ?? THEME_PRESETS[0];
}

export function buildAppTheme(
  settings: Pick<AppSettings, 'colorScheme' | 'useMaterialYou' | 'themePreset'>,
  opts?: { dynamicAccentColor?: string }
): MD3Theme {
  const isDark = settings.colorScheme === 'dark';
  const base = isDark ? MD3DarkTheme : MD3LightTheme;

  const preset = presetFor(settings.themePreset) ?? THEME_PRESETS[0];
  const colors = isDark ? preset.dark : preset.light;
  const accent = settings.useMaterialYou
    ? (opts?.dynamicAccentColor ?? colors.primary)
    : colors.primary;

  const onBackground = isDark ? '#f3f1ff' : '#1b1b2b';
  const onSurface = isDark ? '#f3f1ff' : '#1b1b2b';
  const onSurfaceVariant = isDark ? '#b6b3d8' : '#5e5b78';

  return {
    ...base,
    roundness: 16,
    colors: {
      ...base.colors,
      primary: accent,
      onPrimary: '#ffffff',
      primaryContainer: accent,
      onPrimaryContainer: '#ffffff',
      background: colors.background,
      onBackground,
      surface: colors.surface,
      onSurface,
      surfaceVariant: colors.surfaceVariant,
      onSurfaceVariant,
      outline: colors.outline,
      elevation: {
        ...base.colors.elevation,
        level0: colors.background,
        level1: colors.surface,
        level2: colors.surface,
        level3: colors.surface,
        level4: colors.surface,
        level5: colors.surface,
      },
    },
  };
}
