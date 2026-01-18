import { RankedRow, ScreenHeader, SectionHeader } from '@/components/details';
import * as React from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Card, SegmentedButtons, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

type Tab = 'browsers' | 'os' | 'devices';

export default function EnvironmentDetailsScreen() {
  const theme = useTheme();
  const [tab, setTab] = React.useState<Tab>('browsers');
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [snack, setSnack] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setIsRefreshing(true);
    await new Promise((r) => setTimeout(r, 500));
    setSnack('Refreshed.');
    setIsRefreshing(false);
  }, []);

  const title = tab === 'browsers' ? 'Environment' : tab === 'os' ? 'Operating systems' : 'Devices';

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
                { value: 'browsers', label: 'Browsers' },
                { value: 'os', label: 'OS' },
                { value: 'devices', label: 'Devices' },
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
            {tab === 'browsers' ? (
              <>
                <RankedRow
                  badgeText="C"
                  label="Chrome"
                  value="61%"
                  fraction={0.61}
                  onPress={() => setSnack('Chrome')}
                />
                <RankedRow
                  badgeText="F"
                  label="Firefox"
                  value="12%"
                  fraction={0.12}
                  onPress={() => setSnack('Firefox')}
                />
                <RankedRow
                  badgeText="S"
                  label="Safari"
                  value="10%"
                  fraction={0.1}
                  onPress={() => setSnack('Safari')}
                />
                <RankedRow
                  badgeText="E"
                  label="Edge"
                  value="5%"
                  fraction={0.05}
                  onPress={() => setSnack('Edge')}
                />
              </>
            ) : tab === 'os' ? (
              <>
                <RankedRow
                  badgeText="M"
                  label="macOS"
                  value="34%"
                  fraction={0.34}
                  onPress={() => setSnack('macOS')}
                />
                <RankedRow
                  badgeText="W"
                  label="Windows"
                  value="30%"
                  fraction={0.3}
                  onPress={() => setSnack('Windows')}
                />
                <RankedRow
                  badgeText="I"
                  label="iOS"
                  value="22%"
                  fraction={0.22}
                  onPress={() => setSnack('iOS')}
                />
                <RankedRow
                  badgeText="A"
                  label="Android"
                  value="14%"
                  fraction={0.14}
                  onPress={() => setSnack('Android')}
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
