import { RankedRow, ScreenHeader, SectionHeader } from '@/components/details';
import * as React from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TrafficSessionsScreen() {
  const theme = useTheme();
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [snack, setSnack] = React.useState<string | null>(null);

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
        <ScreenHeader title="Sessions" subtitle="Traffic (mock)" />

        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.cardContent}>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              (Mock) Sessions list with duration, pages, referrer
            </Text>
          </Card.Content>
        </Card>

        <SectionHeader
          title="Recent sessions"
          actionLabel="More"
          onPress={() => setSnack('More (coming soon)')}
        />

        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.list}>
            <RankedRow
              badgeText="S"
              label="2m 41s • 5 pages • google.com"
              value="now"
              fraction={1}
              onPress={() => setSnack('session 1')}
            />
            <RankedRow
              badgeText="S"
              label="38s • 2 pages • (direct)"
              value="1m"
              fraction={0.6}
              onPress={() => setSnack('session 2')}
            />
            <RankedRow
              badgeText="S"
              label="4m 12s • 7 pages • t.co"
              value="3m"
              fraction={0.45}
              onPress={() => setSnack('session 3')}
            />
            <RankedRow
              badgeText="S"
              label="1m 09s • 3 pages • linkedin.com"
              value="6m"
              fraction={0.3}
              onPress={() => setSnack('session 4')}
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
  list: {
    gap: 10,
  },
  snackWrap: {
    paddingTop: 8,
    paddingHorizontal: 4,
  },
});
