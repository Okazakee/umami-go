import { useOnboarding } from '@/contexts/OnboardingContext';
import {
  type DefaultTimeRange,
  type RefreshIntervalSeconds,
  getAppSettings,
  patchAppSettings,
} from '@/lib/storage/settings';
import { type SingleInstanceRecord, getInstance } from '@/lib/storage/singleInstance';
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

  const [rangeDialogOpen, setRangeDialogOpen] = React.useState(false);
  const [refreshDialogOpen, setRefreshDialogOpen] = React.useState(false);
  const [confirmDisconnectOpen, setConfirmDisconnectOpen] = React.useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = React.useState(false);
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
    setConfirmDisconnectOpen(false);
    await resetOnboarding();
    router.replace('/(onboarding)/welcome');
  }, [resetOnboarding]);

  const handleClearInstances = React.useCallback(async () => {
    setConfirmClearOpen(false);
    await resetOnboarding();
    router.replace('/(onboarding)/welcome');
  }, [resetOnboarding]);

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
            App preferences and troubleshooting.
          </Text>
        </View>

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
          <Card.Title title="Troubleshooting" />
          <Card.Content style={styles.cardContent}>
            <Button
              mode="outlined"
              onPress={() =>
                instance ? setConfirmDisconnectOpen(true) : router.push('/(onboarding)/choice')
              }
            >
              Connect / change instance
            </Button>
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
              <Button mode="outlined" onPress={() => setConfirmClearOpen(true)}>
                Clear instances + secrets
              </Button>
              <Button mode="contained" onPress={() => setConfirmResetOpen(true)}>
                Reset onboarding + instances
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

        {__DEV__ ? (
          <>
            <Dialog
              visible={confirmClearOpen}
              onDismiss={() => setConfirmClearOpen(false)}
              style={dialogStyle}
            >
              <Dialog.Title>Clear instances?</Dialog.Title>
              <Dialog.Content>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  This removes all saved instances and their secrets from this device.
                </Text>
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setConfirmClearOpen(false)}>Cancel</Button>
                <Button onPress={handleClearInstances}>Clear</Button>
              </Dialog.Actions>
            </Dialog>

            <Dialog
              visible={confirmResetOpen}
              onDismiss={() => setConfirmResetOpen(false)}
              style={dialogStyle}
            >
              <Dialog.Title>Reset the app?</Dialog.Title>
              <Dialog.Content>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  This clears instances and restarts onboarding.
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
