import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

function hourLabel(h: number): string {
  if (h === 0) return '12am';
  if (h < 12) return `${h}am`;
  if (h === 12) return '12pm';
  return `${h - 12}pm`;
}

function intensityAt(dayIndex: number, hour: number): number {
  // Deterministic mock “traffic” that looks realistic.
  // Peak around midday/afternoon, with a few extra spikes.
  const base =
    Math.exp(-(((hour - 15) / 4.8) ** 2)) * 0.9 + Math.exp(-(((hour - 11) / 7.0) ** 2)) * 0.35;
  const dayMod = [0.75, 0.9, 1.0, 1.05, 1.1, 1.0, 0.8][dayIndex] ?? 1;
  const noise = (((dayIndex + 3) * 17 + (hour + 1) * 23) % 13) / 13; // 0..1 deterministic
  const spike = noise > 0.92 ? 0.35 : noise > 0.86 ? 0.18 : 0;
  return Math.max(0, Math.min(1, (base * dayMod + spike) * 0.9));
}

export function TrafficDotHeatmap() {
  const theme = useTheme();

  const hours = React.useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <View style={styles.axisSpacer} />
        {DAYS.map((d) => (
          <View key={d} style={styles.dayColHeader}>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {d}
            </Text>
          </View>
        ))}
      </View>

      {hours.map((h) => (
        <View key={`h-${h}`} style={styles.row}>
          <View style={styles.axisCell}>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {hourLabel(h)}
            </Text>
          </View>
          {DAYS.map((d, dayIdx) => {
            const v = intensityAt(dayIdx, h);
            const size = 6 + Math.round(v * 10); // 6..16
            const opacity = 0.12 + v * 0.85;
            return (
              <View key={`${d}-${h}`} style={styles.cell}>
                <View
                  style={[
                    styles.dot,
                    {
                      width: size,
                      height: size,
                      opacity,
                      backgroundColor: theme.colors.primary,
                    },
                  ]}
                />
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  axisSpacer: {
    width: 44,
  },
  dayColHeader: {
    flex: 1,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  axisCell: {
    width: 44,
    paddingRight: 6,
    alignItems: 'flex-end',
  },
  cell: {
    flex: 1,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    borderRadius: 999,
  },
});
