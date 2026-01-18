import { RankedRow, ScreenHeader, SectionHeader } from '@/components/details';
import { TrafficNav } from '@/components/trafficNav';
import * as React from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Card, SegmentedButtons, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

type Dimension = 'page' | 'referrer' | 'country' | 'device';

export default function TrafficBreakdownScreen() {
  const theme = useTheme();
  const [dimension, setDimension] = React.useState<Dimension>('page');
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
        <ScreenHeader title="Traffic" subtitle="Breakdown (mock)" />

        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.cardContent}>
            <TrafficNav value="breakdown" />
          </Card.Content>
        </Card>

        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.cardContent}>
            <SegmentedButtons
              value={dimension}
              onValueChange={(v) => setDimension(v as Dimension)}
              buttons={[
                { value: 'page', label: 'Page' },
                { value: 'referrer', label: 'Referrer' },
                { value: 'country', label: 'Country' },
                { value: 'device', label: 'Device' },
              ]}
            />
          </Card.Content>
        </Card>

        <SectionHeader
          title="Top"
          actionLabel="More"
          onPress={() => setSnack('More (coming soon)')}
        />
        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.list}>
            {dimension === 'page' ? (
              <>
                <RankedRow
                  rank={1}
                  label="/"
                  value="12.5k"
                  fraction={1}
                  onPress={() => setSnack('/')}
                />
                <RankedRow
                  rank={2}
                  label="/pricing"
                  value="3.2k"
                  fraction={0.26}
                  onPress={() => setSnack('/pricing')}
                />
                <RankedRow
                  rank={3}
                  label="/docs/installation"
                  value="2.1k"
                  fraction={0.18}
                  onPress={() => setSnack('/docs/installation')}
                />
              </>
            ) : dimension === 'referrer' ? (
              <>
                <RankedRow
                  badgeText="G"
                  label="google.com"
                  value="8.9k"
                  fraction={1}
                  onPress={() => setSnack('google.com')}
                />
                <RankedRow
                  badgeText="T"
                  label="t.co"
                  value="5.4k"
                  fraction={0.61}
                  onPress={() => setSnack('t.co')}
                />
                <RankedRow
                  badgeText="D"
                  label="(direct)"
                  value="3.1k"
                  fraction={0.35}
                  onPress={() => setSnack('(direct)')}
                />
              </>
            ) : dimension === 'country' ? (
              <>
                <RankedRow
                  badgeText="IT"
                  label="Italy"
                  value="64%"
                  fraction={0.64}
                  onPress={() => setSnack('Italy')}
                />
                <RankedRow
                  badgeText="US"
                  label="United States"
                  value="18%"
                  fraction={0.18}
                  onPress={() => setSnack('United States')}
                />
                <RankedRow
                  badgeText="DE"
                  label="Germany"
                  value="4%"
                  fraction={0.04}
                  onPress={() => setSnack('Germany')}
                />
              </>
            ) : (
              <>
                <RankedRow
                  badgeText="D"
                  label="Desktop"
                  value="58%"
                  fraction={0.58}
                  onPress={() => setSnack('Desktop')}
                />
                <RankedRow
                  badgeText="M"
                  label="Mobile"
                  value="38%"
                  fraction={0.38}
                  onPress={() => setSnack('Mobile')}
                />
                <RankedRow
                  badgeText="T"
                  label="Tablet"
                  value="4%"
                  fraction={0.04}
                  onPress={() => setSnack('Tablet')}
                />
              </>
            )}
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
