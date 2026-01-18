import { RankedRow, ScreenHeader, SectionHeader } from '@/components/details';
import * as React from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Card, SegmentedButtons, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

type Tab = 'path' | 'entry' | 'exit';

export default function PagesDetailsScreen() {
  const theme = useTheme();
  const [tab, setTab] = React.useState<Tab>('path');
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [snack, setSnack] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setIsRefreshing(true);
    await new Promise((r) => setTimeout(r, 500));
    setSnack('Refreshed.');
    setIsRefreshing(false);
  }, []);

  const title = tab === 'path' ? 'Pages' : tab === 'entry' ? 'Entry pages' : 'Exit pages';

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
        <ScreenHeader title={title} subtitle="Mock data" />

        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.cardContent}>
            <SegmentedButtons
              value={tab}
              onValueChange={(v) => setTab(v as Tab)}
              buttons={[
                { value: 'path', label: 'Path' },
                { value: 'entry', label: 'Entry' },
                { value: 'exit', label: 'Exit' },
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
            <RankedRow
              rank={1}
              label="/"
              value="12.5k"
              fraction={1}
              onPress={() => setSnack('/')}
            />
            <RankedRow
              rank={2}
              label="/blog/design-trends-2024"
              value="8.2k"
              fraction={0.66}
              onPress={() => setSnack('/blog/design-trends-2024')}
            />
            <RankedRow
              rank={3}
              label="/docs/installation"
              value="5.1k"
              fraction={0.41}
              onPress={() => setSnack('/docs/installation')}
            />
            <RankedRow
              rank={4}
              label="/pricing"
              value="3.2k"
              fraction={0.26}
              onPress={() => setSnack('/pricing')}
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
