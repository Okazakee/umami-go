import { router, useFocusEffect, useGlobalSearchParams } from 'expo-router';
import * as React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, IconButton, Snackbar, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listWebsitesCached, type UmamiWebsite } from '@/lib/api/umamiData';
import { getSelectedWebsiteId, setSelectedWebsiteId } from '@/lib/storage/websiteSelection';

export default function InstanceWebsitesScreen() {
  const theme = useTheme();
  const params = useGlobalSearchParams<{ instanceId?: string | string[] }>();
  const instanceId = Array.isArray(params.instanceId) ? params.instanceId[0] : params.instanceId;

  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [websites, setWebsites] = React.useState<UmamiWebsite[]>([]);
  const [fromCache, setFromCache] = React.useState(false);
  const [selectedWebsiteId, setSelectedWebsiteIdState] = React.useState<string | null>(null);
  const [snack, setSnack] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    if (!instanceId) return;
    setIsLoading(true);
    setError(null);
    try {
      const selected = await getSelectedWebsiteId(instanceId);
      setSelectedWebsiteIdState(selected);

      const res = await listWebsitesCached(instanceId);
      setWebsites(res.data);
      setFromCache(res.fromCache);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load websites');
    } finally {
      setIsLoading(false);
    }
  }, [instanceId]);

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh])
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'bottom']}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text variant="headlineMedium">Websites</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {isLoading ? 'Loading…' : error ? error : `${websites.length} website(s)`}
            {fromCache ? ' (cached)' : ''}
          </Text>
        </View>

        <View style={styles.actions}>
          <Button mode="outlined" onPress={refresh} disabled={!instanceId || isLoading}>
            Refresh
          </Button>
        </View>

        {websites.map((w) => (
          <Card
            key={w.id}
            mode="contained"
            style={[
              styles.card,
              { backgroundColor: w.id === selectedWebsiteId ? '#262642' : theme.colors.surface },
            ]}
            onPress={async () => {
              if (!instanceId) return;
              await setSelectedWebsiteId(instanceId, w.id);
              setSelectedWebsiteIdState(w.id);
              setSnack(`Selected: ${w.domain}`);
              router.push({
                pathname: '/(app)/instance/[instanceId]/overview',
                params: { instanceId },
              });
            }}
          >
            <Card.Content style={styles.cardContent}>
              <View style={styles.websiteRow}>
                <View style={styles.websiteLeft}>
                  <Text variant="titleMedium">{w.name}</Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {w.domain}
                  </Text>
                </View>
                {w.id === selectedWebsiteId ? (
                  <IconButton icon="check" size={18} />
                ) : (
                  <IconButton icon="circle-outline" size={18} />
                )}
              </View>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                ID: {w.id}
              </Text>
            </Card.Content>
          </Card>
        ))}

        {!isLoading && !error && websites.length === 0 ? (
          <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.cardContent}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                No websites found for this instance.
              </Text>
            </Card.Content>
          </Card>
        ) : null}
      </ScrollView>

      <Snackbar visible={!!snack} onDismiss={() => setSnack(null)} duration={2500}>
        {snack ?? ''}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: 16,
    gap: 12,
  },
  header: {
    gap: 4,
    paddingVertical: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardContent: {
    gap: 4,
  },
  websiteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  websiteLeft: {
    flex: 1,
    gap: 2,
  },
});
