import { RankedRow, ScreenHeader, SectionHeader } from '@/components/details';
import * as React from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Card, SegmentedButtons, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

type Tab = 'referrers' | 'channels';

export default function SourcesDetailsScreen() {
  const theme = useTheme();
  const [tab, setTab] = React.useState<Tab>('referrers');
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [snack, setSnack] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setIsRefreshing(true);
    await new Promise((r) => setTimeout(r, 500));
    setSnack('Refreshed.');
    setIsRefreshing(false);
  }, []);

  const title = tab === 'referrers' ? 'Sources' : 'Channels';

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
                { value: 'referrers', label: 'Referrers' },
                { value: 'channels', label: 'Channels' },
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
            {tab === 'referrers' ? (
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
                <RankedRow
                  badgeText="L"
                  label="linkedin.com"
                  value="2.2k"
                  fraction={0.25}
                  onPress={() => setSnack('linkedin.com')}
                />
              </>
            ) : (
              <>
                <RankedRow
                  badgeText="O"
                  label="Organic Search"
                  value="48%"
                  fraction={0.48}
                  onPress={() => setSnack('Organic Search')}
                />
                <RankedRow
                  badgeText="D"
                  label="Direct"
                  value="22%"
                  fraction={0.22}
                  onPress={() => setSnack('Direct')}
                />
                <RankedRow
                  badgeText="S"
                  label="Social"
                  value="18%"
                  fraction={0.18}
                  onPress={() => setSnack('Social')}
                />
                <RankedRow
                  badgeText="R"
                  label="Referral"
                  value="12%"
                  fraction={0.12}
                  onPress={() => setSnack('Referral')}
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
