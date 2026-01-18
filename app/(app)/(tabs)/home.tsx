import {
  type InstanceRecord,
  getActiveInstance,
  getInstanceSecrets,
  listInstances,
  setActiveInstance,
} from '@/lib/storage/instances';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Card, FAB, IconButton, Snackbar, Text, useTheme } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

type Reachability = 'checking' | 'online' | 'offline';

function toBaseUrl(host: string): string {
  const trimmed = host.replace(/\/$/, '');
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://'))
    return `https://${trimmed}`;
  return trimmed;
}

function hostToDomain(host: string): string {
  try {
    const url = new URL(host.startsWith('http') ? host : `https://${host}`);
    return url.hostname;
  } catch {
    return host.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  }
}

export default function HomeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ notice?: string | string[] }>();
  const [instances, setInstances] = React.useState<InstanceRecord[]>([]);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [reachabilityById, setReachabilityById] = React.useState<Record<string, Reachability>>({});
  const [snack, setSnack] = React.useState<string | null>(null);
  const seenNoticeRef = React.useRef<string | null>(null);

  const refresh = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [all, active] = await Promise.all([listInstances(), getActiveInstance()]);
      setInstances(all);
      setActiveId(active?.id ?? null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh])
  );

  React.useEffect(() => {
    const raw = params.notice;
    const notice = Array.isArray(raw) ? raw[0] : raw;
    if (!notice) return;
    if (seenNoticeRef.current === notice) return;
    seenNoticeRef.current = notice;

    if (notice === 'instance_exists') {
      setSnack('Instance already exists — credentials updated.');
    }
  }, [params.notice]);

  const handleAddInstance = () => {
    router.push('/(onboarding)/choice');
  };

  const handleOpenInstance = async (instanceId: string) => {
    await setActiveInstance(instanceId);
    setActiveId(instanceId);
    router.push({
      // Go straight to a real tab screen; avoids landing on the blank `index` route.
      pathname: '/(app)/instance/[instanceId]/overview',
      params: { instanceId },
    });
  };

  React.useEffect(() => {
    if (isLoading) return;
    if (instances.length === 0) return;

    let cancelled = false;

    setReachabilityById((prev) => {
      const next: Record<string, Reachability> = { ...prev };
      for (const i of instances) {
        if (!next[i.id]) next[i.id] = 'checking';
      }
      return next;
    });

    (async () => {
      await Promise.all(
        instances.map(async (i) => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2500);

          try {
            const baseUrl = toBaseUrl(i.host);
            const secrets = await getInstanceSecrets(i.id);

            const endpoint = i.setupType === 'cloud' ? '/v1/me' : '/api/auth/verify';
            const method = i.setupType === 'cloud' ? 'GET' : 'POST';

            await fetch(`${baseUrl}${endpoint}`, {
              method,
              headers: {
                Accept: 'application/json',
                ...(i.setupType === 'cloud' && secrets.apiKey
                  ? { 'x-umami-api-key': secrets.apiKey }
                  : null),
                ...(i.setupType === 'self-hosted' && secrets.token
                  ? { Authorization: `Bearer ${secrets.token}` }
                  : null),
              } as HeadersInit,
              signal: controller.signal,
            });

            if (!cancelled) {
              setReachabilityById((prev) => ({ ...prev, [i.id]: 'online' }));
            }
          } catch {
            if (!cancelled) {
              setReachabilityById((prev) => ({ ...prev, [i.id]: 'offline' }));
            }
          } finally {
            clearTimeout(timeoutId);
          }
        })
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [instances, isLoading]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text variant="headlineMedium">Instances</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Add and switch between self-hosted and cloud instances.
          </Text>
        </View>

        {isLoading ? (
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Loading…
          </Text>
        ) : instances.length > 0 ? (
          instances.map((i) => (
            <Card
              key={i.id}
              mode="contained"
              style={[
                styles.instanceCard,
                {
                  backgroundColor: i.id === activeId ? '#262642' : '#1c1c2c',
                },
              ]}
              onPress={() => handleOpenInstance(i.id)}
            >
              <View style={styles.instanceInner}>
                <View style={styles.instanceTopRow}>
                  <View style={styles.instanceLeft}>
                    <Text variant="titleMedium" numberOfLines={1}>
                      {i.name}
                    </Text>
                    <Text
                      variant="bodySmall"
                      numberOfLines={1}
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      {hostToDomain(i.host)}
                    </Text>
                  </View>

                  <IconButton
                    icon="dots-vertical"
                    size={20}
                    style={styles.instanceMenuButton}
                    onPress={() =>
                      router.push({
                        pathname: '/(app)/instance/[instanceId]/settings',
                        params: { instanceId: i.id },
                      })
                    }
                  />
                </View>

                <View style={styles.instanceBottomRow}>
                  {(() => {
                    const status = reachabilityById[i.id] ?? 'checking';
                    const label =
                      status === 'online'
                        ? 'Online'
                        : status === 'offline'
                          ? 'Offline'
                          : 'Checking';
                    const dotColor =
                      status === 'online'
                        ? '#20d3a2'
                        : status === 'offline'
                          ? '#ff5a7a'
                          : theme.colors.onSurfaceVariant;
                    return (
                      <View style={[styles.pill, { backgroundColor: theme.colors.surfaceVariant }]}>
                        <View style={[styles.pillDot, { backgroundColor: dotColor }]} />
                        <Text variant="bodySmall">{label}</Text>
                      </View>
                    );
                  })()}
                </View>
              </View>
            </Card>
          ))
        ) : (
          <Card mode="contained" style={[styles.instanceCard, { backgroundColor: '#1c1c2c' }]}>
            <Card.Title title="No instances yet" />
            <Card.Content>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Tap “Add instance” to connect to self-hosted Umami or Umami Cloud.
              </Text>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      <FAB
        icon="plus"
        onPress={handleAddInstance}
        accessibilityLabel="Add instance"
        color={theme.colors.onPrimary}
        style={[
          styles.fab,
          {
            backgroundColor: theme.colors.primary,
            bottom: insets.bottom,
          },
        ]}
      />

      <Snackbar visible={!!snack} onDismiss={() => setSnack(null)} duration={4000}>
        {snack ?? ''}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  header: {
    gap: 4,
    paddingVertical: 4,
  },
  instanceCard: {
    overflow: 'hidden',
    borderRadius: 16,
  },
  instanceInner: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  instanceTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  instanceLeft: {
    flex: 1,
    gap: 2,
    paddingTop: 2,
  },
  instanceBottomRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  instanceMenuButton: {
    // Paper IconButton has built-in padding; remove it so it sits top-right.
    margin: 0,
    marginTop: -6,
    marginRight: -6,
    alignSelf: 'flex-start',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pillDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  fab: {
    position: 'absolute',
    right: 20,
    borderRadius: 18, // squircle-ish
    // Remove default Paper/Platform shadow.
    elevation: 0,
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
  },
});
