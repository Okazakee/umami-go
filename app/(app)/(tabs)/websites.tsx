import { SkeletonBlock } from '@/components/skeleton';
import { type UmamiWebsite, listWebsitesCached } from '@/lib/api/umamiData';
import { getInstance } from '@/lib/storage/singleInstance';
import { getSelectedWebsiteId, setSelectedWebsiteId } from '@/lib/storage/websiteSelection';
import { router, useFocusEffect } from 'expo-router';
import * as React from 'react';
import { Image, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, IconButton, Snackbar, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WebsitesScreen() {
  const theme = useTheme();

  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [websites, setWebsites] = React.useState<UmamiWebsite[]>([]);
  const [selectedWebsiteId, setSelectedWebsiteIdState] = React.useState<string | null>(null);
  const [snack, setSnack] = React.useState<string | null>(null);
  const [faviconErrorById, setFaviconErrorById] = React.useState<Record<string, boolean>>({});

  const faviconUrlForDomain = React.useCallback((domain: string) => {
    const clean = domain
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .trim();
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(clean)}&sz=64`;
  }, []);

  const faviconFallbackText = React.useCallback((w: UmamiWebsite) => {
    const label = (w.name || w.domain || '?').trim();
    return label.slice(0, 1).toUpperCase();
  }, []);

  const refresh = React.useCallback(async (mode: 'initial' | 'pull' = 'initial') => {
    if (mode === 'pull') setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);
    try {
      const inst = await getInstance();
      if (!inst) {
        setError('Not connected.');
        setWebsites([]);
        setSelectedWebsiteIdState(null);
        return;
      }

      const selected = await getSelectedWebsiteId();
      setSelectedWebsiteIdState(selected);

      const res = await listWebsitesCached();
      setWebsites(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load websites');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh])
  );

  const showSkeletons = isLoading && websites.length === 0;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'bottom']}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => refresh('pull')}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        <View style={styles.header}>
          <Text variant="headlineMedium">Websites</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {isLoading ? 'Loading…' : error ? error : `${websites.length} website(s)`}
          </Text>
        </View>

        <View style={styles.actions}>
          {error === 'Not connected.' ? (
            <Button mode="contained" onPress={() => router.push('/(onboarding)/welcome')}>
              Connect
            </Button>
          ) : null}
        </View>

        {showSkeletons ? (
          <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={[styles.cardContent, { gap: 10 }]}>
              <SkeletonBlock height={18} width="55%" radius={8} />
              <SkeletonBlock height={14} width="35%" radius={8} />
            </Card.Content>
          </Card>
        ) : null}
        {showSkeletons ? (
          <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={[styles.cardContent, { gap: 10 }]}>
              <SkeletonBlock height={18} width="60%" radius={8} />
              <SkeletonBlock height={14} width="40%" radius={8} />
            </Card.Content>
          </Card>
        ) : null}
        {showSkeletons ? (
          <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={[styles.cardContent, { gap: 10 }]}>
              <SkeletonBlock height={18} width="50%" radius={8} />
              <SkeletonBlock height={14} width="30%" radius={8} />
            </Card.Content>
          </Card>
        ) : null}

        {websites.map((w) => (
          <Card
            key={w.id}
            mode="contained"
            style={[
              styles.card,
              { backgroundColor: w.id === selectedWebsiteId ? '#262642' : theme.colors.surface },
            ]}
            onPress={async () => {
              await setSelectedWebsiteId(w.id);
              setSelectedWebsiteIdState(w.id);
              setSnack(`Selected: ${w.domain}`);
            }}
          >
            <Card.Content style={styles.cardContent}>
              <View style={styles.websiteRow}>
                <View style={styles.faviconWrap}>
                  {faviconErrorById[w.id] ? (
                    <View style={[styles.faviconFallback, { backgroundColor: '#262642' }]}>
                      <Text variant="labelLarge" style={{ color: theme.colors.onSurface }}>
                        {faviconFallbackText(w)}
                      </Text>
                    </View>
                  ) : (
                    <Image
                      source={{ uri: faviconUrlForDomain(w.domain) }}
                      style={styles.favicon}
                      onError={() =>
                        setFaviconErrorById((prev) => ({
                          ...prev,
                          [w.id]: true,
                        }))
                      }
                    />
                  )}
                </View>
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
                No websites found.
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
  faviconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 2,
  },
  favicon: {
    width: 36,
    height: 36,
    borderRadius: 12,
  },
  faviconFallback: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  websiteLeft: {
    flex: 1,
    gap: 2,
  },
});
