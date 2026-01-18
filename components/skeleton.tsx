import { type DimensionValue, StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';

export function SkeletonBlock({
  height,
  width = '100%',
  radius = 12,
}: {
  height: number;
  width?: DimensionValue;
  radius?: number;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.block,
        {
          height,
          width,
          borderRadius: radius,
          backgroundColor: theme.colors.surfaceVariant,
          opacity: 0.55,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  block: {},
});
