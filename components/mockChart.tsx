import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';

export function MockBars({
  points,
  height = 160,
  color,
  backgroundColor = '#17162a',
}: {
  points: Array<{ id: string; value: number }>;
  height?: number;
  color?: string;
  backgroundColor?: string;
}) {
  const theme = useTheme();
  const barColor = color ?? theme.colors.primary;
  const safe = React.useMemo(
    () => points.map((p) => ({ id: p.id, value: Math.max(0.04, Math.min(1, p.value)) })),
    [points]
  );

  return (
    <View style={[styles.wrap, { height, backgroundColor }]}>
      <View style={styles.row}>
        {safe.map((p) => (
          <View key={p.id} style={styles.barSlot}>
            <View
              style={[
                styles.bar,
                { height: `${Math.round(p.value * 100)}%`, backgroundColor: barColor },
              ]}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 10,
    justifyContent: 'flex-end',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    flex: 1,
  },
  barSlot: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 6,
    opacity: 0.85,
  },
});
