import { MD3DarkTheme, type MD3Theme } from 'react-native-paper';

export const appTheme: MD3Theme = {
  ...MD3DarkTheme,
  roundness: 16,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#4b37fe',
    onPrimary: '#ffffff',
    primaryContainer: '#4b37fe',
    onPrimaryContainer: '#ffffff',
    background: '#121022',
    onBackground: '#f3f1ff',
    surface: '#1c1c2c',
    onSurface: '#f3f1ff',
    surfaceVariant: '#1c1c2c',
    onSurfaceVariant: '#b6b3d8',
    outline: '#2c2c44',
    elevation: {
      ...MD3DarkTheme.colors.elevation,
      level0: '#121022',
      level1: '#1c1c2c',
      level2: '#1c1c2c',
      level3: '#1c1c2c',
      level4: '#1c1c2c',
      level5: '#1c1c2c',
    },
  },
};

