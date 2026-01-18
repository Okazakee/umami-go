import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useRootNavigationState, useSegments } from 'expo-router';
import * as React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Divider, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { type SavedCredentials, getCredentials } from '../../lib/storage/credentials';
import {
  type InstanceRecord,
  type InstanceSecrets,
  getActiveInstance,
  getInstanceSecrets,
  listInstances,
} from '../../lib/storage/instances';

type DevCredentials = {
  selfHosted?: {
    host: string;
    username: string;
    password: string;
  };
  cloud?: {
    host: string;
    apiKey: string;
  };
};

function mask(value: string, reveal: boolean): string {
  if (reveal) return value;
  const trimmed = value ?? '';
  if (trimmed.length === 0) return '(empty)';
  if (trimmed.length <= 4) return '****';
  return `****${trimmed.slice(-4)} (len=${trimmed.length})`;
}

export default function DebugScreen() {
  const theme = useTheme();
  const { isLoading, isOnboardingComplete, selectedSetupType } = useOnboarding();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [showSecrets, setShowSecrets] = React.useState(false);
  const [lastError, setLastError] = React.useState<string | null>(null);

  const [onboardingKeyValue, setOnboardingKeyValue] = React.useState<string | null>(null);
  const [savedCredentials, setSavedCredentials] = React.useState<SavedCredentials | null>(null);
  const [instances, setInstances] = React.useState<InstanceRecord[]>([]);
  const [activeInstance, setActiveInstance] = React.useState<InstanceRecord | null>(null);
  const [activeSecrets, setActiveSecrets] = React.useState<InstanceSecrets | null>(null);

  const devCredentials =
    (__DEV__
      ? (Constants.expoConfig?.extra?.devCredentials as DevCredentials | undefined)
      : undefined) ?? undefined;

  const refresh = React.useCallback(async () => {
    setIsRefreshing(true);
    setLastError(null);
    try {
      const [onboardingRaw, creds, allInstances, active] = await Promise.all([
        AsyncStorage.getItem('@umami-go:onboarding-complete'),
        getCredentials(),
        listInstances(),
        getActiveInstance(),
      ]);
      setOnboardingKeyValue(onboardingRaw);
      setSavedCredentials(creds);
      setInstances(allInstances);
      setActiveInstance(active);

      if (active) {
        const secrets = await getInstanceSecrets(active.id);
        setActiveSecrets(secrets);
      } else {
        setActiveSecrets(null);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : typeof err === 'string' ? err : 'Unknown error';
      setLastError(message);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

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
          <Text variant="headlineMedium">Debug</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Dev-only diagnostics
          </Text>
        </View>

        {lastError ? (
          <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Title title="Last error" />
            <Card.Content style={styles.cardContent}>
              <Text variant="bodyMedium" style={{ color: theme.colors.error }}>
                {lastError}
              </Text>
            </Card.Content>
          </Card>
        ) : null}

        <View style={styles.actions}>
          <Button mode="outlined" onPress={refresh} loading={isRefreshing} disabled={isRefreshing}>
            Refresh
          </Button>
          <Button
            mode={showSecrets ? 'contained' : 'outlined'}
            onPress={() => setShowSecrets((v) => !v)}
          >
            {showSecrets ? 'Hide secrets' : 'Reveal secrets'}
          </Button>
        </View>

        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Title title="Runtime" />
          <Card.Content style={styles.cardContent}>
            <Text variant="bodyMedium">__DEV__: {String(__DEV__)}</Text>
            <Text variant="bodyMedium">Segments: {segments.join(' / ') || '(none)'}</Text>
            <Text variant="bodyMedium">Root nav key: {navigationState?.key ?? '(null)'}</Text>
          </Card.Content>
        </Card>

        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Title title="Onboarding state" />
          <Card.Content style={styles.cardContent}>
            <Text variant="bodyMedium">isLoading: {String(isLoading)}</Text>
            <Text variant="bodyMedium">isOnboardingComplete: {String(isOnboardingComplete)}</Text>
            <Text variant="bodyMedium">selectedSetupType: {selectedSetupType ?? '(null)'}</Text>
            <Divider style={styles.divider} />
            <Text variant="bodyMedium">
              AsyncStorage @umami-go:onboarding-complete: {onboardingKeyValue ?? '(null)'}
            </Text>
          </Card.Content>
        </Card>

        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Title title="Instances (SQLite)" />
          <Card.Content style={styles.cardContent}>
            {instances.length > 0 ? (
              instances.map((i) => (
                <View key={i.id} style={styles.instanceRow}>
                  <Text variant="bodyMedium">
                    {i.isActive ? '• (active) ' : '• '}
                    {i.name}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {i.setupType} — {i.host}
                  </Text>
                </View>
              ))
            ) : (
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                (none)
              </Text>
            )}
          </Card.Content>
        </Card>

        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Title title="Active instance secrets (SecureStore)" />
          <Card.Content style={styles.cardContent}>
            {activeInstance ? (
              <>
                <Text variant="bodyMedium">id: {activeInstance.id}</Text>
                <Text variant="bodyMedium">name: {activeInstance.name}</Text>
                <Text variant="bodyMedium">
                  token: {activeSecrets?.token ? mask(activeSecrets.token, showSecrets) : '(none)'}
                </Text>
                <Text variant="bodyMedium">
                  apiKey:{' '}
                  {activeSecrets?.apiKey ? mask(activeSecrets.apiKey, showSecrets) : '(none)'}
                </Text>
              </>
            ) : (
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                (none)
              </Text>
            )}
          </Card.Content>
        </Card>

        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Title title="Stored credentials (SecureStore)" />
          <Card.Content style={styles.cardContent}>
            {savedCredentials ? (
              <>
                <Text variant="bodyMedium">host: {savedCredentials.host}</Text>
                <Text variant="bodyMedium">username: {savedCredentials.username}</Text>
                <Text variant="bodyMedium">
                  password: {mask(savedCredentials.password, showSecrets)}
                </Text>
                <Text variant="bodyMedium">setupType: {savedCredentials.setupType}</Text>
                <Text variant="bodyMedium">userId: {savedCredentials.userId ?? '(none)'}</Text>
                <Text variant="bodyMedium">
                  token:{' '}
                  {savedCredentials.token ? mask(savedCredentials.token, showSecrets) : '(none)'}
                </Text>
              </>
            ) : (
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                (none)
              </Text>
            )}
          </Card.Content>
        </Card>

        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Title title="Dev credentials (app.config.ts extra)" />
          <Card.Content style={styles.cardContent}>
            {devCredentials ? (
              <>
                <Text variant="bodyMedium">
                  selfHosted.host: {devCredentials.selfHosted?.host ?? '(none)'}
                </Text>
                <Text variant="bodyMedium">
                  selfHosted.username: {devCredentials.selfHosted?.username ?? '(none)'}
                </Text>
                <Text variant="bodyMedium">
                  selfHosted.password:{' '}
                  {devCredentials.selfHosted?.password
                    ? mask(devCredentials.selfHosted.password, showSecrets)
                    : '(none)'}
                </Text>
                <Divider style={styles.divider} />
                <Text variant="bodyMedium">
                  cloud.host: {devCredentials.cloud?.host ?? '(none)'}
                </Text>
                <Text variant="bodyMedium">
                  cloud.apiKey:{' '}
                  {devCredentials.cloud?.apiKey
                    ? mask(devCredentials.cloud.apiKey, showSecrets)
                    : '(none)'}
                </Text>
              </>
            ) : (
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                (none)
              </Text>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: 16,
    gap: 12,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
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
  cardContent: {
    gap: 6,
  },
  instanceRow: {
    gap: 2,
    paddingVertical: 6,
  },
  divider: {
    marginVertical: 8,
  },
});
