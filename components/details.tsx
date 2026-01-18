import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { IconButton, Text, useTheme } from 'react-native-paper';

export function ScreenHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.header}>
      <IconButton icon="arrow-left" onPress={() => router.back()} />
      <View style={styles.headerText}>
        <Text variant="headlineSmall">{title}</Text>
        {subtitle ? (
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.headerSpacer} />
    </View>
  );
}

export function SectionHeader({
  title,
  actionLabel = 'View All',
  onPress,
}: {
  title: string;
  actionLabel?: string;
  onPress?: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <Text variant="titleLarge">{title}</Text>
      <Pressable onPress={onPress} hitSlop={8}>
        <Text variant="titleSmall" style={{ color: theme.colors.primary, fontWeight: '600' }}>
          {actionLabel}
        </Text>
      </Pressable>
    </View>
  );
}

export function RankedRow({
  rank,
  label,
  value,
  fraction,
  onPress,
  badgeText,
}: {
  rank?: number;
  badgeText?: string;
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
            {badgeText ?? String(rank ?? '')}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  headerSpacer: {
    width: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginTop: 6,
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
  rankRowText: {
    flex: 1,
  },
});
