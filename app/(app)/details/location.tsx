import { RankedRow, ScreenHeader, SectionHeader } from '@/components/details';
import * as React from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Card, SegmentedButtons, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

type Tab = 'countries' | 'regions' | 'cities';

export default function LocationDetailsScreen() {
  const theme = useTheme();
  const [tab, setTab] = React.useState<Tab>('countries');
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [snack, setSnack] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setIsRefreshing(true);
    await new Promise((r) => setTimeout(r, 500));
    setSnack('Refreshed.');
    setIsRefreshing(false);
  }, []);

  const title = tab === 'countries' ? 'Location' : tab === 'regions' ? 'Regions' : 'Cities';

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
                { value: 'countries', label: 'Countries' },
                { value: 'regions', label: 'Regions' },
                { value: 'cities', label: 'Cities' },
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
            {tab === 'countries' ? (
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
                <RankedRow
                  badgeText="GB"
                  label="United Kingdom"
                  value="3%"
                  fraction={0.03}
                  onPress={() => setSnack('United Kingdom')}
                />
              </>
            ) : tab === 'regions' ? (
              <>
                <RankedRow
                  badgeText="LAZ"
                  label="Lazio"
                  value="21%"
                  fraction={0.21}
                  onPress={() => setSnack('Lazio')}
                />
                <RankedRow
                  badgeText="LOM"
                  label="Lombardy"
                  value="17%"
                  fraction={0.17}
                  onPress={() => setSnack('Lombardy')}
                />
                <RankedRow
                  badgeText="CAM"
                  label="Campania"
                  value="12%"
                  fraction={0.12}
                  onPress={() => setSnack('Campania')}
                />
                <RankedRow
                  badgeText="SIC"
                  label="Sicily"
                  value="9%"
                  fraction={0.09}
                  onPress={() => setSnack('Sicily')}
                />
              </>
            ) : (
              <>
                <RankedRow
                  badgeText="RM"
                  label="Rome"
                  value="14%"
                  fraction={0.14}
                  onPress={() => setSnack('Rome')}
                />
                <RankedRow
                  badgeText="MI"
                  label="Milan"
                  value="10%"
                  fraction={0.1}
                  onPress={() => setSnack('Milan')}
                />
                <RankedRow
                  badgeText="NA"
                  label="Naples"
                  value="6%"
                  fraction={0.06}
                  onPress={() => setSnack('Naples')}
                />
                <RankedRow
                  badgeText="TO"
                  label="Turin"
                  value="4%"
                  fraction={0.04}
                  onPress={() => setSnack('Turin')}
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
