import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, BackHandler, StyleSheet, View } from 'react-native';
import { Button, Icon, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { UmamiApiClient, type UmamiApiError } from '../../lib/api/umami';
import { setInstanceSecrets, upsertInstance } from '../../lib/storage/instances';

function hashBase36(value: string): string {
  let hash = 5381;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 33) ^ value.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

function stableSelfHostedInstanceId(umamiUserId: string, host: string): string {
  // Avoid collisions across different Umami hosts with same user id.
  return `${umamiUserId}_${hashBase36(host)}`;
}

function normalizeCloudHost(host: string): string {
  const trimmed = host.replace(/\/$/, '');
  if (trimmed.includes('cloud.umami.is')) return 'https://api.umami.is';
  if (trimmed.endsWith('/v1')) return trimmed.slice(0, -3);
  return trimmed;
}

export default function VerifyScreen() {
  const theme = useTheme();
  const { completeOnboarding, selectedSetupType } = useOnboarding();
  const params = useLocalSearchParams<{
    host?: string;
    username?: string;
    password?: string;
    apiKey?: string;
  }>();

  const [isVerifying, setIsVerifying] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const hasVerifiedRef = React.useRef(false);

  // Prevent back navigation unless there's an error
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        // Only allow back navigation if there's an error
        if (error) {
          return false; // Allow default back behavior
        }
        // Prevent back navigation during verification
        return true;
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => backHandler.remove();
    }, [error])
  );

  // Run verification only once on mount
  React.useEffect(() => {
    if (hasVerifiedRef.current) return;

    const verifyConnection = async () => {
      setIsVerifying(true);
      setError(null);

      try {
        if (selectedSetupType === 'self-hosted') {
          if (!params.host || !params.username || !params.password) {
            setError('Missing connection credentials');
            setIsVerifying(false);
            return;
          }

          const client = new UmamiApiClient(params.host);
          const response = await client.login({
            host: params.host,
            username: params.username,
            password: params.password,
          });

          const instanceId = stableSelfHostedInstanceId(response.user.id, params.host);
          await upsertInstance({
            id: instanceId,
            name: `${params.host} (${params.username})`,
            host: params.host,
            username: params.username,
            umamiUserId: response.user.id,
            setupType: 'self-hosted',
            makeActive: true,
          });
          await setInstanceSecrets(instanceId, {
            token: response.token,
            password: params.password,
          });
        } else if (selectedSetupType === 'cloud') {
          if (!params.host || !params.apiKey) {
            setError('Missing connection credentials');
            setIsVerifying(false);
            return;
          }

          const apiHost = normalizeCloudHost(params.host);
          const apiKey = params.apiKey;

          const response = await fetch(`${apiHost}/v1/me`, {
            method: 'GET',
            headers: {
              Accept: 'application/json',
              'x-umami-api-key': apiKey,
            },
          });

          if (!response.ok) {
            let message = `Request failed with status ${response.status}`;
            try {
              const data = await response.json();
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
            const err: UmamiApiError = { message, status: response.status };
            throw err;
          }

          const data = (await response.json()) as unknown;
          const user =
            data &&
            typeof data === 'object' &&
            'user' in data &&
            data.user &&
            typeof data.user === 'object'
              ? (data.user as { id?: string; username?: string })
              : (data as { id?: string; username?: string });

          const cloudInstanceId = `cloud_${hashBase36(`${apiHost}|${apiKey}`)}`;
          await upsertInstance({
            id: cloudInstanceId,
            name: user.username ? `Umami Cloud (${user.username})` : 'Umami Cloud',
            host: apiHost,
            username: user.username ?? null,
            umamiUserId: user.id ?? null,
            setupType: 'cloud',
            makeActive: true,
          });
          await setInstanceSecrets(cloudInstanceId, { apiKey });
        } else {
          setError('Missing setup type selection');
          setIsVerifying(false);
          return;
        }

        // Complete onboarding and navigate to home
        await completeOnboarding();
        router.replace('/(app)/home');
      } catch (err) {
        const apiError = err as UmamiApiError;
        let errorMessage = 'Failed to connect to Umami instance';

        if (apiError.status === 401 || apiError.status === 403) {
          errorMessage =
            selectedSetupType === 'cloud' ? 'Invalid API key' : 'Invalid username or password';
        } else if (apiError.status === 0) {
          errorMessage =
            'Unable to reach server. Please check the host URL and your internet connection.';
        } else if (apiError.message) {
          errorMessage = apiError.message;
        }

        setError(errorMessage);
        setIsVerifying(false);
      }
    };

    hasVerifiedRef.current = true;
    verifyConnection();
  }, [
    completeOnboarding,
    params.apiKey,
    params.host,
    params.password,
    params.username,
    selectedSetupType,
  ]);

  const handleGoBack = () => {
    router.back();
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'bottom']}
    >
      <View style={styles.content}>
        {isVerifying ? (
          <>
            <Icon source="connection" size={64} color={theme.colors.primary} />
            <ActivityIndicator size="large" color={theme.colors.primary} style={styles.spinner} />
            <Text variant="headlineSmall" style={styles.title}>
              Verifying Connection
            </Text>
            <Text
              variant="bodyMedium"
              style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
            >
              Please wait while we verify your connection...
            </Text>
          </>
        ) : error ? (
          <>
            <Icon source="alert-circle" size={64} color={theme.colors.error} />
            <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.error }]}>
              Connection Failed
            </Text>
            <Text variant="bodyMedium" style={[styles.errorMessage, { color: theme.colors.error }]}>
              {error}
            </Text>
            <Button mode="contained" onPress={handleGoBack} style={styles.button}>
              Go Back to Form
            </Button>
          </>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 24,
  },
  spinner: {
    marginTop: 16,
  },
  title: {
    textAlign: 'center',
    marginTop: 16,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 24,
  },
  errorMessage: {
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 8,
  },
  button: {
    marginTop: 16,
    paddingVertical: 6,
  },
});
