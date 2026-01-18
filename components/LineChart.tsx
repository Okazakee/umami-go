import * as React from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';

export type LineChartPoint = { x: string; y: number };

export function LineChart({
  points,
  height = 120,
  strokeWidth = 2,
  showDots = false,
}: {
  points: LineChartPoint[];
  height?: number;
  strokeWidth?: number;
  showDots?: boolean;
}) {
  const theme = useTheme();
  const [width, setWidth] = React.useState(0);

  const onLayout = React.useCallback((e: LayoutChangeEvent) => {
    setWidth(Math.max(0, Math.round(e.nativeEvent.layout.width)));
  }, []);

  const normalized = React.useMemo(() => {
    const safe = (points ?? []).filter((p) => typeof p?.y === 'number' && Number.isFinite(p.y));
    if (safe.length < 2 || width <= 0) return { pts: [], segments: [], dots: [] };

    const minY = Math.min(...safe.map((p) => p.y));
    const maxY = Math.max(...safe.map((p) => p.y));
    const ySpan = Math.max(1, maxY - minY);
    const n = safe.length;

    const pts = safe.map((p, i) => {
      const x = n === 1 ? 0 : (i / (n - 1)) * width;
      const y = height - ((p.y - minY) / ySpan) * height;
      return { x, y };
    });

    const segments = pts.slice(1).map((p, idx) => {
      const a = pts[idx];
      const dx = p.x - a.x;
      const dy = p.y - a.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      const midX = (a.x + p.x) / 2;
      const midY = (a.y + p.y) / 2;
      const key = `${Math.round(a.x)}-${Math.round(a.y)}-${Math.round(p.x)}-${Math.round(p.y)}`;
      return { key, midX, midY, len, angle };
    });

    return { pts, segments, dots: pts };
  }, [height, points, width]);

  const lineColor = theme.colors.primary;

  return (
    <View style={[styles.root, { height }]} onLayout={onLayout}>
      {normalized.segments.map((s) => (
        <View
          key={s.key}
          pointerEvents="none"
          style={[
            styles.segment,
            {
              left: s.midX - s.len / 2,
              top: s.midY - strokeWidth / 2,
              width: s.len,
              height: strokeWidth,
              backgroundColor: lineColor,
              transform: [{ rotate: `${s.angle}deg` }],
              borderRadius: strokeWidth,
            },
          ]}
        />
      ))}

      {showDots
        ? normalized.dots.map((p) => (
            <View
              key={`${Math.round(p.x)}-${Math.round(p.y)}`}
              pointerEvents="none"
              style={[
                styles.dot,
                {
                  left: p.x - 2,
                  top: p.y - 2,
                  backgroundColor: lineColor,
                },
              ]}
            />
          ))
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
  },
  segment: {
    position: 'absolute',
  },
  dot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 99,
  },
});
