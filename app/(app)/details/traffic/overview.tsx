import { ScreenHeader } from '@/components/details';
import { router } from 'expo-router';
import * as React from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Card, Icon, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TrafficOverviewScreen() {
  const theme = useTheme();
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [snack, setSnack] = React.useState<string | null>(null);

  const go = React.useCallback((section: string) => {
    router.push(`/(app)/details/traffic/${section}`);
  }, []);

  const refresh = React.useCallback(async () => {
    setIsRefreshing(true);
    await new Promise((r) => setTimeout(r, 500));
    setSnack('Refreshed.');
    setIsRefreshing(false);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        <ScreenHeader title="Traffic" subtitle="Mock data" />

        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Title title="Traffic" subtitle="Pick a section" />
          <Card.Content style={styles.cardContent}>
            <PressRow
              icon="chart-areaspline"
              title="Overview"
              subtitle="Trend + heatmap + top pages"
              onPress={() => go('overview')}
            />
            <PressRow
              icon="cursor-default-click"
              title="Events"
              subtitle="Custom events analytics"
              onPress={() => go('events')}
            />
            <PressRow
              icon="timeline-clock-outline"
              title="Sessions"
              subtitle="Session-level insights"
              onPress={() => go('sessions')}
            />
            <PressRow
              icon="speedometer"
              title="Runtime"
              subtitle="Performance buckets"
              onPress={() => go('runtime')}
            />
            <PressRow
              icon="compare"
              title="Compare"
              subtitle="Period A vs period B"
              onPress={() => go('compare')}
            />
            <PressRow
              icon="view-grid-outline"
              title="Breakdown"
              subtitle="Slice by dimension"
              onPress={() => go('breakdown')}
            />
          </Card.Content>
        </Card>

        {snack ? (
          <View style={styles.snackWrap}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {snack}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function PressRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Card
      mode="contained"
      style={[styles.rowCard, { backgroundColor: '#1a1930' }]}
      onPress={onPress}
    >
      <Card.Content style={styles.row}>
        <View style={[styles.rowIcon, { backgroundColor: '#262642' }]}>
          <Icon source={icon} size={18} color={theme.colors.onSurface} />
        </View>
        <View style={styles.rowText}>
          <Text variant="titleMedium">{title}</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {subtitle}
          </Text>
        </View>
        <Icon source="chevron-right" size={22} color={theme.colors.onSurfaceVariant} />
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: 16,
    paddingBottom: 24,
    gap: 14,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardContent: {
    gap: 10,
  },
  snackWrap: {
    paddingTop: 8,
    paddingHorizontal: 4,
  },
  rowCard: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
});
