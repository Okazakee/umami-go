import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { router, useRootNavigationState, useSegments } from 'expo-router';
import * as React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Divider, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from '../../contexts/OnboardingContext';
import {
  type SavedCredentials,
  type SavedInstance,
  clearCredentials,
  getCredentials,
  getInstance,
} from '../../lib/storage/credentials';

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
  const { isLoading, isOnboardingComplete, selectedSetupType, resetOnboarding } = useOnboarding();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [showSecrets, setShowSecrets] = React.useState(false);
  const [lastError, setLastError] = React.useState<string | null>(null);

  const [onboardingKeyValue, setOnboardingKeyValue] = React.useState<string | null>(null);
  const [savedInstance, setSavedInstance] = React.useState<SavedInstance | null>(null);
  const [savedCredentials, setSavedCredentials] = React.useState<SavedCredentials | null>(null);

  const devCredentials =
    (__DEV__
      ? (Constants.expoConfig?.extra?.devCredentials as DevCredentials | undefined)
      : undefined) ?? undefined;

  const refresh = React.useCallback(async () => {
    setIsRefreshing(true);
    setLastError(null);
    try {
      const [onboardingRaw, instance, creds] = await Promise.all([
        AsyncStorage.getItem('@umami-go:onboarding-complete'),
        getInstance(),
        getCredentials(),
      ]);
      setOnboardingKeyValue(onboardingRaw);
      setSavedInstance(instance);
      setSavedCredentials(creds);
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

  const handleClearSensitive = async () => {
    try {
      setLastError(null);
      await clearCredentials();
      await refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : typeof err === 'string' ? err : 'Unknown error';
      setLastError(message);
    }
  };

  const handleResetAll = async () => {
    try {
      setLastError(null);
      await clearCredentials();
      await resetOnboarding();
      await refresh();
      router.replace('/(onboarding)/welcome');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : typeof err === 'string' ? err : 'Unknown error';
      setLastError(message);
    }
  };

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
          <Card mode="outlined">
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

        <Card mode="outlined">
          <Card.Title title="Runtime" />
          <Card.Content style={styles.cardContent}>
            <Text variant="bodyMedium">__DEV__: {String(__DEV__)}</Text>
            <Text variant="bodyMedium">Segments: {segments.join(' / ') || '(none)'}</Text>
            <Text variant="bodyMedium">Root nav key: {navigationState?.key ?? '(null)'}</Text>
          </Card.Content>
        </Card>

        <Card mode="outlined">
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

        <Card mode="outlined">
          <Card.Title title="Stored instance (AsyncStorage)" />
          <Card.Content style={styles.cardContent}>
            {savedInstance ? (
              <>
                <Text variant="bodyMedium">id: {savedInstance.id}</Text>
                <Text variant="bodyMedium">name: {savedInstance.name}</Text>
                <Text variant="bodyMedium">host: {savedInstance.host}</Text>
                <Text variant="bodyMedium">setupType: {savedInstance.setupType}</Text>
                {'token' in savedInstance ? (
                  <Text variant="bodyMedium">
                    token: {savedInstance.token ? mask(savedInstance.token, showSecrets) : '(none)'}
                  </Text>
                ) : null}
                {'apiKey' in savedInstance ? (
                  <Text variant="bodyMedium">
                    apiKey:{' '}
                    {savedInstance.apiKey ? mask(savedInstance.apiKey, showSecrets) : '(none)'}
                  </Text>
                ) : null}
              </>
            ) : (
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                (none)
              </Text>
            )}
          </Card.Content>
        </Card>

        <Card mode="outlined">
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

        <Card mode="outlined">
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

        <View style={styles.footerActions}>
          <Button mode="outlined" onPress={handleClearSensitive}>
            Clear credentials
          </Button>
          <Button mode="contained" onPress={handleResetAll}>
            Reset onboarding + credentials
          </Button>
        </View>
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
  divider: {
    marginVertical: 8,
  },
  footerActions: {
    marginTop: 8,
    gap: 12,
  },
});
