import { Pressable, StyleSheet, View } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';

export type DeltaTone = 'up' | 'down';

export function DeltaChip({ tone, value }: { tone: DeltaTone; value: string }) {
  return (
    <View style={[styles.deltaChip, tone === 'up' ? styles.deltaChipUp : styles.deltaChipDown]}>
      <Text variant="labelSmall" style={styles.deltaChipText}>
        {tone === 'up' ? '↑ ' : '↓ '}
        {value}
      </Text>
    </View>
  );
}

export function KpiCard({
  title,
  icon,
  value,
  delta,
  deltaTone,
  onPress,
}: {
  title: string;
  icon: string;
  value: string;
  delta?: string;
  deltaTone?: DeltaTone;
  onPress?: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} style={styles.kpiPressable}>
      <View style={[styles.kpiCard, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.kpiTopRow}>
          <Text variant="titleSmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {title}
          </Text>
          <Icon source={icon} size={18} color={theme.colors.onSurfaceVariant} />
        </View>
        <View style={styles.kpiBottomRow}>
          <Text variant="headlineMedium" style={styles.kpiValue}>
            {value}
          </Text>
          {delta && deltaTone ? <DeltaChip tone={deltaTone} value={delta} /> : null}
        </View>
      </View>
    </Pressable>
  );
}

export function SectionHeader({
  title,
  actionLabel = 'View All',
  onPress,
  hideAction,
  showAction,
}: {
  title: string;
  actionLabel?: string;
  onPress?: () => void;
  hideAction?: boolean;
  showAction?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <Text variant="titleLarge">{title}</Text>
      {!hideAction && onPress ? (
        <Pressable onPress={onPress} hitSlop={8}>
          <Text variant="titleSmall" style={{ color: theme.colors.primary, fontWeight: '600' }}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : !hideAction && showAction ? (
        <Text
          variant="titleSmall"
          style={{ color: theme.colors.onSurfaceVariant, fontWeight: '600' }}
        >
          {actionLabel}
        </Text>
      ) : null}
    </View>
  );
}

export function RankedRow({
  rank,
  label,
  value,
  fraction,
  onPress,
}: {
  rank: number;
  label: string;
  value: string;
  fraction: number;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const clamped = Math.max(0, Math.min(1, fraction));
  return (
    <Pressable onPress={onPress} style={styles.rankRowPressable}>
      <View style={styles.rankRow}>
        <View style={[styles.rankRowFill, { width: `${Math.round(clamped * 100)}%` }]} />
        <View style={[styles.rankBadge, { backgroundColor: '#262642' }]}>
          <Text variant="labelMedium" style={{ color: theme.colors.onSurface }}>
            {rank}
          </Text>
        </View>
        <View style={styles.rankRowText}>
          <Text variant="titleMedium" numberOfLines={1}>
            {label}
          </Text>
        </View>
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
          {value}
        </Text>
      </View>
    </Pressable>
  );
}

export function ReferrerRow({
  label,
  value,
  fraction,
  iconText,
  onPress,
}: {
  label: string;
  value: string;
  fraction: number;
  iconText: string;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const clamped = Math.max(0, Math.min(1, fraction));
  return (
    <Pressable onPress={onPress} style={styles.rankRowPressable}>
      <View style={styles.rankRow}>
        <View style={[styles.rankRowFill, { width: `${Math.round(clamped * 100)}%` }]} />
        <View style={[styles.refBadge, { backgroundColor: '#262642' }]}>
          <Text variant="labelMedium" style={{ color: theme.colors.onSurface }}>
            {iconText}
          </Text>
        </View>
        <View style={styles.rankRowText}>
          <Text variant="titleMedium" numberOfLines={1}>
            {label}
          </Text>
        </View>
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
          {value}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginTop: 6,
  },
  kpiPressable: {
    width: '48%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  kpiCard: {
    borderRadius: 16,
    overflow: 'hidden',
    padding: 12,
    gap: 10,
  },
  kpiTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kpiBottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
  },
  kpiValue: {
    fontWeight: '800',
  },
  deltaChip: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
  },
  deltaChipUp: {
    backgroundColor: 'rgba(0, 200, 155, 0.18)',
  },
  deltaChipDown: {
    backgroundColor: 'rgba(255, 135, 60, 0.18)',
  },
  deltaChipText: {
    color: '#d6d4ff',
    fontWeight: '700',
  },
  rankRowPressable: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  rankRow: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#1a1930',
  },
  rankRowFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(75, 55, 254, 0.22)',
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refBadge: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankRowText: {
    flex: 1,
  },
});
