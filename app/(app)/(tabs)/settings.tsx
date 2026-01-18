import { SkeletonBlock } from '@/components/skeleton';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { UmamiApiClient, type UmamiApiError } from '@/lib/api/umami';
import { clearAllCached } from '@/lib/cache/queryCache';
import { rgbaFromHex } from '@/lib/color';
import { invalidateSession } from '@/lib/session/session';
import {
  type ColorSchemePreference,
  type DefaultTimeRange,
  type RefreshIntervalSeconds,
  type ThemePresetId,
  getAppSettings,
  patchAppSettings,
} from '@/lib/storage/settings';
import {
  type SetupType,
  type SingleInstanceRecord,
  getInstance as getStoredInstance,
  setInstance as setStoredInstance,
  setSecrets as setStoredSecrets,
} from '@/lib/storage/singleInstance';
import { clearSelectedWebsiteId } from '@/lib/storage/websiteSelection';
import { THEME_PRESETS } from '@/lib/theme';
import { router } from 'expo-router';
import * as React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Card,
  Dialog,
  Divider,
  Icon,
  Portal,
  RadioButton,
  SegmentedButtons,
  Snackbar,
  Switch,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

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

function normalizeCloudHost(host: string): string {
  const trimmed = host.trim().replace(/\/$/, '');
  if (trimmed.includes('cloud.umami.is')) return 'https://api.umami.is';
  if (trimmed.endsWith('/v1')) return trimmed.slice(0, -3);
  return trimmed;
}

export default function SettingsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { resetOnboarding } = useOnboarding();
  const dialogStyle = React.useMemo(() => ({ borderRadius: 12 }), []);

  const [isLoading, setIsLoading] = React.useState(true);
  const [instance, setInstance] = React.useState<SingleInstanceRecord | null>(null);
  const [defaultTimeRange, setDefaultTimeRange] = React.useState<DefaultTimeRange>('7d');
  const [refreshIntervalSeconds, setRefreshIntervalSeconds] =
    React.useState<RefreshIntervalSeconds>(300);
  const [wifiOnly, setWifiOnly] = React.useState(false);
  const [backgroundRefresh, setBackgroundRefresh] = React.useState(false);
  const [colorScheme, setColorScheme] = React.useState<ColorSchemePreference>('dark');
  const [, setUseMaterialYou] = React.useState(false);
  const [themePreset, setThemePreset] = React.useState<ThemePresetId>('amethyst');

  const [snack, setSnack] = React.useState<string | null>(null);

  const [rangeDialogOpen, setRangeDialogOpen] = React.useState(false);
  const [refreshDialogOpen, setRefreshDialogOpen] = React.useState(false);
  const [themeDialogOpen, setThemeDialogOpen] = React.useState(false);
  const [confirmClearCacheOpen, setConfirmClearCacheOpen] = React.useState(false);
  const [confirmClearWebsiteOpen, setConfirmClearWebsiteOpen] = React.useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = React.useState(false);

  const [changeUserOpen, setChangeUserOpen] = React.useState(false);
  const [changeUserSaving, setChangeUserSaving] = React.useState(false);
  const [changeUserError, setChangeUserError] = React.useState<string | null>(null);
  const [nextUsername, setNextUsername] = React.useState('');
  const [nextPassword, setNextPassword] = React.useState('');
  const [nextApiKey, setNextApiKey] = React.useState('');

  const [changeInstanceOpen, setChangeInstanceOpen] = React.useState(false);
  const [changeInstanceSaving, setChangeInstanceSaving] = React.useState(false);
  const [changeInstanceError, setChangeInstanceError] = React.useState<string | null>(null);
  const [nextSetupType, setNextSetupType] = React.useState<SetupType>('self-hosted');
  const [nextHost, setNextHost] = React.useState('');
  const [nextInstanceUsername, setNextInstanceUsername] = React.useState('');
  const [nextInstancePassword, setNextInstancePassword] = React.useState('');
  const [nextInstanceApiKey, setNextInstanceApiKey] = React.useState('');

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const [s, inst] = await Promise.all([getAppSettings(), getStoredInstance()]);
      if (!mounted) return;
      setInstance(inst);
      setDefaultTimeRange(s.defaultTimeRange);
      setRefreshIntervalSeconds(s.refreshIntervalSeconds);
      setWifiOnly(s.wifiOnly);
      setBackgroundRefresh(s.backgroundRefresh);
      setColorScheme(s.colorScheme);
      setUseMaterialYou(s.useMaterialYou);
      setThemePreset(s.themePreset);
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
      colorScheme?: ColorSchemePreference;
      useMaterialYou?: boolean;
      themePreset?: ThemePresetId;
    }) => {
      const next = await patchAppSettings(patch);
      setDefaultTimeRange(next.defaultTimeRange);
      setRefreshIntervalSeconds(next.refreshIntervalSeconds);
      setWifiOnly(next.wifiOnly);
      setBackgroundRefresh(next.backgroundRefresh);
      setColorScheme(next.colorScheme);
      setUseMaterialYou(next.useMaterialYou);
      setThemePreset(next.themePreset);
    },
    []
  );

  const disconnectAndRoute = React.useCallback(async () => {
    await resetOnboarding();
    router.replace('/(onboarding)/welcome');
  }, [resetOnboarding]);

  const handleClearCache = React.useCallback(async () => {
    setConfirmClearCacheOpen(false);
    await clearAllCached();
    setSnack('Cache cleared.');
  }, []);

  const handleClearWebsiteSelection = React.useCallback(async () => {
    setConfirmClearWebsiteOpen(false);
    await clearSelectedWebsiteId();
    setSnack('Website selection cleared.');
  }, []);

  const handleResetApp = React.useCallback(async () => {
    setConfirmResetOpen(false);
    // Reset should be stronger than a normal disconnect: clear cached analytics too.
    await clearAllCached();
    await disconnectAndRoute();
  }, [disconnectAndRoute]);

  const openChangeUser = React.useCallback(() => {
    if (!instance) return;
    setChangeUserError(null);
    setNextUsername(instance.username ?? '');
    setNextPassword('');
    setNextApiKey('');
    setChangeUserOpen(true);
  }, [instance]);

  const openChangeInstance = React.useCallback(() => {
    setChangeInstanceError(null);
    setNextSetupType(instance?.setupType ?? 'self-hosted');
    setNextHost(instance?.host ?? '');
    setNextInstanceUsername(instance?.username ?? '');
    setNextInstancePassword('');
    setNextInstanceApiKey('');
    setChangeInstanceOpen(true);
  }, [instance]);

  const saveSelfHosted = React.useCallback(
    async (input: { host: string; username: string; password: string; createdAt?: number }) => {
      const client = new UmamiApiClient(input.host);
      const login = await client.login({
        host: input.host,
        username: input.username,
        password: input.password,
      });

      await setStoredInstance({
        name: 'Self-hosted',
        host: input.host,
        setupType: 'self-hosted',
        username: login.user.username ?? input.username,
        umamiUserId: login.user.id ?? null,
        createdAt: input.createdAt,
      });
      await setStoredSecrets({
        token: login.token,
        password: input.password,
        apiKey: '',
      });
    },
    []
  );

  const saveCloud = React.useCallback(
    async (input: { host: string; apiKey: string; createdAt?: number }) => {
      const apiHost = normalizeCloudHost(input.host);
      const res = await fetch(`${apiHost.replace(/\/$/, '')}/v1/me`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'x-umami-api-key': input.apiKey,
        },
      });

      if (!res.ok) {
        let message = `Request failed with status ${res.status}`;
        try {
          const data = (await res.json()) as unknown;
          if (data && typeof data === 'object') {
            const maybeMessage =
              'message' in data && typeof data.message === 'string'
                ? data.message
                : 'error' in data && typeof data.error === 'string'
                  ? data.error
                  : undefined;
            if (maybeMessage) message = maybeMessage;
          }
        } catch {
          // ignore
        }
        const err: UmamiApiError = { message, status: res.status };
        throw err;
      }

      const data = (await res.json()) as unknown;
      const user =
        data &&
        typeof data === 'object' &&
        'user' in data &&
        data.user &&
        typeof data.user === 'object'
          ? (data.user as { id?: string; username?: string })
          : (data as { id?: string; username?: string });

      await setStoredInstance({
        name: 'Umami Cloud',
        host: apiHost,
        setupType: 'cloud',
        username: user.username ?? null,
        umamiUserId: user.id ?? null,
        createdAt: input.createdAt,
      });
      await setStoredSecrets({
        apiKey: input.apiKey,
        token: '',
        password: '',
      });
    },
    []
  );

  const handleSubmitChangeUser = React.useCallback(async () => {
    if (!instance) return;
    setChangeUserSaving(true);
    setChangeUserError(null);

    try {
      if (instance.setupType === 'self-hosted') {
        if (!nextUsername.trim() || !nextPassword) {
          setChangeUserError('Username and password are required.');
          setChangeUserSaving(false);
          return;
        }
        await saveSelfHosted({
          host: instance.host,
          username: nextUsername.trim(),
          password: nextPassword,
          createdAt: instance.createdAt,
        });
      } else {
        if (!nextApiKey.trim()) {
          setChangeUserError('API key is required.');
          setChangeUserSaving(false);
          return;
        }
        await saveCloud({
          host: instance.host,
          apiKey: nextApiKey.trim(),
          createdAt: instance.createdAt,
        });
      }

      invalidateSession();
      const updated = await getStoredInstance();
      setInstance(updated);
      setChangeUserOpen(false);
      setSnack('Credentials updated.');
    } catch (err) {
      const apiErr = err as UmamiApiError;
      let message = apiErr.message || 'Failed to update credentials.';
      if (apiErr.status === 401 || apiErr.status === 403) {
        message =
          instance.setupType === 'cloud' ? 'Invalid API key' : 'Invalid username or password';
      } else if (apiErr.status === 0) {
        message = 'Unable to reach server. Please check the host and your internet connection.';
      }
      setChangeUserError(message);
    } finally {
      setChangeUserSaving(false);
    }
  }, [instance, nextApiKey, nextPassword, nextUsername, saveCloud, saveSelfHosted]);

  const handleSubmitChangeInstance = React.useCallback(async () => {
    setChangeInstanceSaving(true);
    setChangeInstanceError(null);

    try {
      const createdAt = instance?.createdAt;

      if (nextSetupType === 'self-hosted') {
        if (!nextHost.trim() || !nextInstanceUsername.trim() || !nextInstancePassword) {
          setChangeInstanceError('Host, username, and password are required.');
          setChangeInstanceSaving(false);
          return;
        }
        await saveSelfHosted({
          host: nextHost.trim(),
          username: nextInstanceUsername.trim(),
          password: nextInstancePassword,
          createdAt,
        });
      } else {
        if (!nextHost.trim() || !nextInstanceApiKey.trim()) {
          setChangeInstanceError('Host and API key are required.');
          setChangeInstanceSaving(false);
          return;
        }
        await saveCloud({
          host: nextHost.trim(),
          apiKey: nextInstanceApiKey.trim(),
          createdAt,
        });
      }

      invalidateSession();
      await Promise.all([clearAllCached(), clearSelectedWebsiteId()]);

      const updated = await getStoredInstance();
      setInstance(updated);
      setChangeInstanceOpen(false);
      setSnack('Instance updated. Select a website again.');
    } catch (err) {
      const apiErr = err as UmamiApiError;
      let message = apiErr.message || 'Failed to update instance.';
      if (apiErr.status === 401 || apiErr.status === 403) {
        message = nextSetupType === 'cloud' ? 'Invalid API key' : 'Invalid username or password';
      } else if (apiErr.status === 0) {
        message = 'Unable to reach server. Please check the host and your internet connection.';
      }
      setChangeInstanceError(message);
    } finally {
      setChangeInstanceSaving(false);
    }
  }, [
    instance?.createdAt,
    nextHost,
    nextInstanceApiKey,
    nextInstancePassword,
    nextInstanceUsername,
    nextSetupType,
    saveCloud,
    saveSelfHosted,
  ]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 24 + 78 + insets.bottom }]}
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
            {instance ? (
              <>
                <View style={styles.connectionTopRow}>
                  <View
                    style={[
                      styles.connectionIcon,
                      { backgroundColor: rgbaFromHex(theme.colors.primary, 0.18) },
                    ]}
                  >
                    <Icon source="link-variant" size={20} color={theme.colors.primary} />
                  </View>
                  <View style={styles.connectionText}>
                    <Text variant="titleMedium">
                      {instance.setupType === 'cloud' ? 'Umami Cloud' : 'Self-hosted'}
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {instance.host}
                    </Text>
                  </View>
                </View>

                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Change credentials for this host, or replace the connection entirely.
                </Text>

                <View style={styles.connectionActions}>
                  <Button mode="outlined" onPress={openChangeUser}>
                    Change user
                  </Button>
                  <Button mode="contained" onPress={openChangeInstance}>
                    Change instance
                  </Button>
                </View>
              </>
            ) : (
              <>
                <View style={styles.connectionTopRow}>
                  <View
                    style={[
                      styles.connectionIcon,
                      { backgroundColor: 'rgba(182, 179, 216, 0.12)' },
                    ]}
                  >
                    <Icon
                      source="link-variant-off"
                      size={20}
                      color={theme.colors.onSurfaceVariant}
                    />
                  </View>
                  <View style={styles.connectionText}>
                    <Text variant="titleMedium">Not connected</Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      Connect your Umami Cloud or self-hosted instance.
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.connectionPill,
                      { backgroundColor: 'rgba(182, 179, 216, 0.12)' },
                    ]}
                  >
                    <Text
                      variant="labelSmall"
                      style={{ color: theme.colors.onSurfaceVariant, fontWeight: '700' }}
                    >
                      OFFLINE
                    </Text>
                  </View>
                </View>

                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Only one connection is supported.
                </Text>

                <Button mode="contained" onPress={() => router.push('/(onboarding)/choice')}>
                  Connect
                </Button>
              </>
            )}
          </Card.Content>
        </Card>

        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Title title="Preferences" />
          <Card.Content style={styles.cardContent}>
            <SettingsRow
              title="Default time range"
              value={labelForRange(defaultTimeRange)}
              onPress={() => setRangeDialogOpen(true)}
              disabled={isLoading}
            />
            <SettingsRow
              title="Refresh interval"
              value={labelForInterval(refreshIntervalSeconds)}
              onPress={() => setRefreshDialogOpen(true)}
              disabled={isLoading}
            />
          </Card.Content>
        </Card>

        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Title title="Appearance" />
          <Card.Content style={styles.cardContent}>
            <View style={styles.row}>
              <View style={styles.rowText}>
                <Text variant="titleMedium">Dark mode</Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Switch between light and dark theme.
                </Text>
              </View>
              <Switch
                value={colorScheme === 'dark'}
                onValueChange={(v) => updateSettings({ colorScheme: v ? 'dark' : 'light' })}
                disabled={isLoading}
              />
            </View>
            <Divider />
            <View style={styles.row}>
              <View style={styles.rowText}>
                <Text variant="titleMedium">Material You</Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Coming soon. Dynamic colors aren’t wired yet.
                </Text>
              </View>
              <Switch value={false} onValueChange={() => {}} disabled />
            </View>

            <Divider />
            <SettingsRow
              title="Theme"
              value={THEME_PRESETS.find((p) => p.id === themePreset)?.label ?? 'Theme'}
              onPress={() => setThemeDialogOpen(true)}
              disabled={isLoading}
            />
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
                  Store your preference for background refresh.
                </Text>
              </View>
              <Switch
                value={backgroundRefresh}
                onValueChange={(v) => updateSettings({ backgroundRefresh: v })}
                disabled={isLoading}
              />
            </View>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Note: background refresh isn’t implemented yet.
            </Text>
          </Card.Content>
        </Card>

        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Title title="Maintenance" />
          <Card.Content style={styles.cardContent}>
            <Button mode="outlined" onPress={() => setConfirmClearCacheOpen(true)}>
              Clear analytics cache
            </Button>
            <Button mode="outlined" onPress={() => setConfirmClearWebsiteOpen(true)}>
              Clear website selection
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

        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Title title="Danger zone" />
          <Card.Content style={styles.cardContent}>
            <Button
              mode="outlined"
              textColor={theme.colors.error}
              onPress={() => setConfirmResetOpen(true)}
            >
              Reset app data
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
            </Card.Content>
          </Card>
        ) : null}
      </ScrollView>

      <Portal>
        <Dialog
          visible={changeUserOpen}
          onDismiss={() => setChangeUserOpen(false)}
          style={dialogStyle}
        >
          <Dialog.Title>Change user</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {instance
                ? `${instance.setupType === 'cloud' ? 'Umami Cloud' : 'Self-hosted'} • ${instance.host}`
                : ''}
            </Text>

            <View style={{ gap: 10, marginTop: 10 }}>
              {instance?.setupType === 'self-hosted' ? (
                <>
                  <TextInput
                    mode="outlined"
                    label="Username"
                    value={nextUsername}
                    onChangeText={setNextUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TextInput
                    mode="outlined"
                    label="Password"
                    value={nextPassword}
                    onChangeText={setNextPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </>
              ) : instance?.setupType === 'cloud' ? (
                <TextInput
                  mode="outlined"
                  label="API key"
                  value={nextApiKey}
                  onChangeText={setNextApiKey}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              ) : null}
            </View>

            {changeUserError ? (
              <Text variant="bodySmall" style={{ color: theme.colors.error }}>
                {changeUserError}
              </Text>
            ) : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setChangeUserOpen(false)} disabled={changeUserSaving}>
              Cancel
            </Button>
            <Button
              onPress={handleSubmitChangeUser}
              loading={changeUserSaving}
              disabled={!instance}
            >
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={changeInstanceOpen}
          onDismiss={() => setChangeInstanceOpen(false)}
          style={dialogStyle}
        >
          <Dialog.Title>Change instance</Dialog.Title>
          <Dialog.Content>
            <View style={{ gap: 10 }}>
              <SegmentedButtons
                value={nextSetupType}
                onValueChange={(v) => setNextSetupType(v as SetupType)}
                buttons={[
                  { value: 'self-hosted', label: 'Self-hosted' },
                  { value: 'cloud', label: 'Umami Cloud' },
                ]}
              />

              <TextInput
                mode="outlined"
                label="Host"
                value={nextHost}
                onChangeText={setNextHost}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                placeholder={
                  nextSetupType === 'cloud' ? 'https://api.umami.is' : 'https://umami.example.com'
                }
              />

              {nextSetupType === 'self-hosted' ? (
                <>
                  <TextInput
                    mode="outlined"
                    label="Username"
                    value={nextInstanceUsername}
                    onChangeText={setNextInstanceUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TextInput
                    mode="outlined"
                    label="Password"
                    value={nextInstancePassword}
                    onChangeText={setNextInstancePassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </>
              ) : (
                <TextInput
                  mode="outlined"
                  label="API key"
                  value={nextInstanceApiKey}
                  onChangeText={setNextInstanceApiKey}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              )}
            </View>

            {changeInstanceError ? (
              <Text variant="bodySmall" style={{ color: theme.colors.error }}>
                {changeInstanceError}
              </Text>
            ) : (
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                This replaces the current connection and clears cached analytics and website
                selection.
              </Text>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setChangeInstanceOpen(false)} disabled={changeInstanceSaving}>
              Cancel
            </Button>
            <Button onPress={handleSubmitChangeInstance} loading={changeInstanceSaving}>
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>

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
          visible={themeDialogOpen}
          onDismiss={() => setThemeDialogOpen(false)}
          style={dialogStyle}
        >
          <Dialog.Title>Theme</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group
              value={themePreset}
              onValueChange={(v) => {
                const next = v as ThemePresetId;
                setThemeDialogOpen(false);
                updateSettings({ themePreset: next });
              }}
            >
              {THEME_PRESETS.map((p) => (
                <RadioButton.Item key={p.id} label={p.label} value={p.id} />
              ))}
            </RadioButton.Group>
          </Dialog.Content>
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

        <Dialog
          visible={confirmClearWebsiteOpen}
          onDismiss={() => setConfirmClearWebsiteOpen(false)}
          style={dialogStyle}
        >
          <Dialog.Title>Clear website selection?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Clears the currently selected website for this device.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmClearWebsiteOpen(false)}>Cancel</Button>
            <Button onPress={handleClearWebsiteSelection}>Clear</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={confirmResetOpen}
          onDismiss={() => setConfirmResetOpen(false)}
          style={dialogStyle}
        >
          <Dialog.Title>Reset app data?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              This disconnects Umami, clears website selection, and clears cached analytics data.
              You’ll be returned to onboarding.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmResetOpen(false)}>Cancel</Button>
            <Button onPress={handleResetApp}>Reset</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar visible={!!snack} onDismiss={() => setSnack(null)} duration={2500}>
        {snack ?? ''}
      </Snackbar>
    </SafeAreaView>
  );
}

function SettingsRow({
  title,
  value,
  onPress,
  disabled,
}: {
  title: string;
  value: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.settingsRowPressable,
        { opacity: disabled ? 0.5 : pressed ? 0.7 : 1 },
      ]}
    >
      <View style={[styles.settingsRow, { backgroundColor: theme.colors.surfaceVariant }]}>
        <View style={styles.settingsRowText}>
          <Text variant="titleMedium">{title}</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {value}
          </Text>
        </View>
        <Icon source="chevron-right" size={20} color={theme.colors.onSurfaceVariant} />
      </View>
    </Pressable>
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
  connectionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  connectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectionText: {
    flex: 1,
    gap: 2,
  },
  connectionPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  connectionActions: {
    gap: 10,
    marginTop: 2,
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
  settingsRowPressable: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  settingsRowText: {
    flex: 1,
    gap: 2,
  },
});
