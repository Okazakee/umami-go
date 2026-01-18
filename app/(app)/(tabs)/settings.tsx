import { SkeletonBlock } from '@/components/skeleton';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { clearAllCached } from '@/lib/cache/queryCache';
import {
  type DefaultTimeRange,
  type RefreshIntervalSeconds,
  getAppSettings,
  patchAppSettings,
} from '@/lib/storage/settings';
import { type SingleInstanceRecord, getInstance } from '@/lib/storage/singleInstance';
import { clearSelectedWebsiteId } from '@/lib/storage/websiteSelection';
import { router } from 'expo-router';
import * as React from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Card,
  Dialog,
  Divider,
  Portal,
  RadioButton,
  Snackbar,
  Switch,
  Text,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

function labelForRange(r: DefaultTimeRange): string {
  switch (r) {
    case '24h':
      return 'Last 24 hours';
    case '7d':
      return 'Last 7 days';
    case '30d':
      return 'Last 30 days';
    case '90d':
      return 'Last 90 days';
  }
}

function labelForInterval(s: RefreshIntervalSeconds): string {
  switch (s) {
    case 0:
      return 'Off';
    case 30:
      return 'Every 30 seconds';
    case 60:
      return 'Every 1 minute';
    case 300:
      return 'Every 5 minutes';
  }
}

export default function SettingsScreen() {
  const theme = useTheme();
  const { resetOnboarding } = useOnboarding();
  const dialogStyle = React.useMemo(() => ({ borderRadius: 12 }), []);

  const [isLoading, setIsLoading] = React.useState(true);
  const [instance, setInstance] = React.useState<SingleInstanceRecord | null>(null);
  const [defaultTimeRange, setDefaultTimeRange] = React.useState<DefaultTimeRange>('7d');
  const [refreshIntervalSeconds, setRefreshIntervalSeconds] =
    React.useState<RefreshIntervalSeconds>(300);
  const [wifiOnly, setWifiOnly] = React.useState(false);
  const [backgroundRefresh, setBackgroundRefresh] = React.useState(false);

  const [snack, setSnack] = React.useState<string | null>(null);

  const [rangeDialogOpen, setRangeDialogOpen] = React.useState(false);
  const [refreshDialogOpen, setRefreshDialogOpen] = React.useState(false);
  const [confirmDisconnectOpen, setConfirmDisconnectOpen] = React.useState(false);
  const [disconnectTarget, setDisconnectTarget] = React.useState<'welcome' | 'choice'>('welcome');
  const [confirmClearCacheOpen, setConfirmClearCacheOpen] = React.useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const [s, inst] = await Promise.all([getAppSettings(), getInstance()]);
      if (!mounted) return;
      setInstance(inst);
      setDefaultTimeRange(s.defaultTimeRange);
      setRefreshIntervalSeconds(s.refreshIntervalSeconds);
      setWifiOnly(s.wifiOnly);
      setBackgroundRefresh(s.backgroundRefresh);
      setIsLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const updateSettings = React.useCallback(
    async (patch: {
      defaultTimeRange?: DefaultTimeRange;
      refreshIntervalSeconds?: RefreshIntervalSeconds;
      wifiOnly?: boolean;
      backgroundRefresh?: boolean;
    }) => {
      const next = await patchAppSettings(patch);
      setDefaultTimeRange(next.defaultTimeRange);
      setRefreshIntervalSeconds(next.refreshIntervalSeconds);
      setWifiOnly(next.wifiOnly);
      setBackgroundRefresh(next.backgroundRefresh);
    },
    []
  );

  const handleDisconnect = React.useCallback(async () => {
    const target = disconnectTarget;
    setConfirmDisconnectOpen(false);
    setDisconnectTarget('welcome');
    await resetOnboarding();
    router.replace(target === 'choice' ? '/(onboarding)/choice' : '/(onboarding)/welcome');
  }, [disconnectTarget, resetOnboarding]);

  const handleClearCache = React.useCallback(async () => {
    setConfirmClearCacheOpen(false);
    await clearAllCached();
    setSnack('Cache cleared.');
  }, []);

  const handleClearWebsiteSelection = React.useCallback(async () => {
    await clearSelectedWebsiteId();
    setSnack('Website selection cleared.');
  }, []);

  const handleResetApp = React.useCallback(async () => {
    setConfirmResetOpen(false);
    await resetOnboarding();
    router.replace('/(onboarding)/welcome');
  }, [resetOnboarding]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'bottom']}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text variant="headlineMedium">Settings</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Connection, preferences, and maintenance.
          </Text>
        </View>

        {isLoading ? (
          <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={[styles.cardContent, { gap: 12 }]}>
              <SkeletonBlock height={18} width="40%" radius={8} />
              <SkeletonBlock height={14} width="70%" radius={8} />
              <SkeletonBlock height={14} width="55%" radius={8} />
            </Card.Content>
          </Card>
        ) : null}

        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Title title="Connection" />
          <Card.Content style={styles.cardContent}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {instance
                ? `${instance.name} — ${instance.setupType === 'cloud' ? 'Cloud' : 'Self-hosted'}`
                : 'Not connected.'}
            </Text>
            {instance ? (
              <>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Host: {instance.host}
                </Text>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setDisconnectTarget('choice');
                    setConfirmDisconnectOpen(true);
                  }}
                >
                  Change connection
                </Button>
                <Button mode="contained" onPress={() => setConfirmDisconnectOpen(true)}>
                  Disconnect
                </Button>
              </>
            ) : (
              <Button mode="contained" onPress={() => router.push('/(onboarding)/choice')}>
                Connect
              </Button>
            )}
          </Card.Content>
        </Card>

        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Title title="Preferences" />
          <Card.Content style={styles.cardContent}>
            <Button mode="outlined" onPress={() => setRangeDialogOpen(true)} disabled={isLoading}>
              Default time range: {labelForRange(defaultTimeRange)}
            </Button>
            <Button mode="outlined" onPress={() => setRefreshDialogOpen(true)} disabled={isLoading}>
              Refresh interval: {labelForInterval(refreshIntervalSeconds)}
            </Button>
          </Card.Content>
        </Card>

        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Title title="Data & background" />
          <Card.Content style={styles.cardContent}>
            <View style={styles.row}>
              <View style={styles.rowText}>
                <Text variant="titleMedium">Wi‑Fi only</Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Reduce data usage by only refreshing over Wi‑Fi.
                </Text>
              </View>
              <Switch
                value={wifiOnly}
                onValueChange={(v) => updateSettings({ wifiOnly: v })}
                disabled={isLoading}
              />
            </View>
            <Divider />
            <View style={styles.row}>
              <View style={styles.rowText}>
                <Text variant="titleMedium">Background refresh</Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Allow periodic refresh while the app is not open.
                </Text>
              </View>
              <Switch
                value={backgroundRefresh}
                onValueChange={(v) => updateSettings({ backgroundRefresh: v })}
                disabled={isLoading}
              />
            </View>
          </Card.Content>
        </Card>

        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Title title="Maintenance" />
          <Card.Content style={styles.cardContent}>
            <Button mode="outlined" onPress={() => setConfirmClearCacheOpen(true)}>
              Clear analytics cache
            </Button>
            <Button mode="outlined" onPress={handleClearWebsiteSelection}>
              Clear current website selection
            </Button>
          </Card.Content>
        </Card>

        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Title title="Help" />
          <Card.Content style={styles.cardContent}>
            <Button mode="outlined" onPress={() => Linking.openURL('https://umami.is/docs')}>
              Open Umami docs
            </Button>
            <Button
              mode="outlined"
              onPress={() => Linking.openURL('https://umami.is/docs/cloud/api-key')}
            >
              Umami Cloud API key help
            </Button>
          </Card.Content>
        </Card>

        {__DEV__ ? (
          <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Title title="Debug" />
            <Card.Content style={styles.cardContent}>
              <Button mode="outlined" onPress={() => router.push('/(app)/debug')}>
                Open debug screen
              </Button>
              <Button mode="contained" onPress={() => setConfirmResetOpen(true)}>
                Reset app data
              </Button>
            </Card.Content>
          </Card>
        ) : null}
      </ScrollView>

      <Portal>
        <Dialog
          visible={rangeDialogOpen}
          onDismiss={() => setRangeDialogOpen(false)}
          style={dialogStyle}
        >
          <Dialog.Title>Default time range</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group
              value={defaultTimeRange}
              onValueChange={(v) => {
                const next = v as DefaultTimeRange;
                setRangeDialogOpen(false);
                updateSettings({ defaultTimeRange: next });
              }}
            >
              <RadioButton.Item label={labelForRange('24h')} value="24h" />
              <RadioButton.Item label={labelForRange('7d')} value="7d" />
              <RadioButton.Item label={labelForRange('30d')} value="30d" />
              <RadioButton.Item label={labelForRange('90d')} value="90d" />
            </RadioButton.Group>
          </Dialog.Content>
        </Dialog>

        <Dialog
          visible={refreshDialogOpen}
          onDismiss={() => setRefreshDialogOpen(false)}
          style={dialogStyle}
        >
          <Dialog.Title>Refresh interval</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group
              value={String(refreshIntervalSeconds)}
              onValueChange={(v) => {
                const next = Number(v) as RefreshIntervalSeconds;
                setRefreshDialogOpen(false);
                updateSettings({ refreshIntervalSeconds: next });
              }}
            >
              <RadioButton.Item label={labelForInterval(0)} value="0" />
              <RadioButton.Item label={labelForInterval(30)} value="30" />
              <RadioButton.Item label={labelForInterval(60)} value="60" />
              <RadioButton.Item label={labelForInterval(300)} value="300" />
            </RadioButton.Group>
          </Dialog.Content>
        </Dialog>

        <Dialog
          visible={confirmDisconnectOpen}
          onDismiss={() => setConfirmDisconnectOpen(false)}
          style={dialogStyle}
        >
          <Dialog.Title>Disconnect?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              This removes the current Umami connection from this device and restarts onboarding.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmDisconnectOpen(false)}>Cancel</Button>
            <Button onPress={handleDisconnect}>Disconnect</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={confirmClearCacheOpen}
          onDismiss={() => setConfirmClearCacheOpen(false)}
          style={dialogStyle}
        >
          <Dialog.Title>Clear cache?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Clears cached analytics responses stored on this device.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmClearCacheOpen(false)}>Cancel</Button>
            <Button onPress={handleClearCache}>Clear</Button>
          </Dialog.Actions>
        </Dialog>

        {__DEV__ ? (
          <>
            <Dialog
              visible={confirmResetOpen}
              onDismiss={() => setConfirmResetOpen(false)}
              style={dialogStyle}
            >
              <Dialog.Title>Reset the app?</Dialog.Title>
              <Dialog.Content>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  This clears the connection and restarts onboarding.
                </Text>
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setConfirmResetOpen(false)}>Cancel</Button>
                <Button onPress={handleResetApp}>Reset</Button>
              </Dialog.Actions>
            </Dialog>
          </>
        ) : null}
      </Portal>

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
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardContent: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
});
