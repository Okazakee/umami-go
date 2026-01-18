import { RankedRow, ScreenHeader, SectionHeader } from '@/components/details';
import * as React from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TrafficEventsScreen() {
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
        <ScreenHeader title="Events" subtitle="Traffic (mock)" />

        <SectionHeader
          title="Top events"
          actionLabel="More"
          onPress={() => setSnack('More (coming soon)')}
        />

        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.list}>
            <RankedRow
              badgeText="E"
              label="signup"
              value="128"
              fraction={1}
              onPress={() => setSnack('signup')}
            />
            <RankedRow
              badgeText="E"
              label="purchase"
              value="44"
              fraction={0.34}
              onPress={() => setSnack('purchase')}
            />
            <RankedRow
              badgeText="E"
              label="cta_click"
              value="31"
              fraction={0.24}
              onPress={() => setSnack('cta_click')}
            />
            <RankedRow
              badgeText="E"
              label="newsletter_submit"
              value="19"
              fraction={0.15}
              onPress={() => setSnack('newsletter_submit')}
            />
          </Card.Content>
        </Card>

        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.cardContent}>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              (Mock) Event filters: name / property / time range
            </Text>
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
