import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, BackHandler, StyleSheet, View } from 'react-native';
import { Button, Icon, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UmamiApiClient, type UmamiApiError } from '../../lib/api/umami';
import { saveCredentials, saveInstance, type SavedCredentials } from '../../lib/storage/credentials';
import { useOnboarding } from '../../contexts/OnboardingContext';

export default function VerifyScreen() {
  const theme = useTheme();
  const { completeOnboarding, selectedSetupType } = useOnboarding();
  const params = useLocalSearchParams<{
    host?: string;
    username?: string;
    password?: string;
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
    }, [error]),
  );

  // Run verification only once on mount
  React.useEffect(() => {
    if (hasVerifiedRef.current) return;

    const verifyConnection = async () => {
      if (!params.host || !params.username || !params.password) {
        setError('Missing connection credentials');
        setIsVerifying(false);
        return;
      }

      setIsVerifying(true);
      setError(null);

      try {
        const client = new UmamiApiClient(params.host);
        const response = await client.login({
          host: params.host,
          username: params.username,
          password: params.password,
        });

        // Save credentials and instance info
        const savedCredentials: SavedCredentials = {
          host: params.host,
          username: params.username,
          password: params.password,
          setupType: 'self-hosted',
          token: response.token,
          userId: response.user.id,
        };

        await saveCredentials(savedCredentials);
        await saveInstance({
          id: response.user.id,
          name: `${params.host || ''} (${params.username || ''})`,
          host: params.host || '',
          setupType: 'self-hosted',
          token: response.token,
        });

        // Complete onboarding and navigate to home
        await completeOnboarding();
        router.replace('/(app)/home');
      } catch (err) {
        const apiError = err as UmamiApiError;
        let errorMessage = 'Failed to connect to Umami instance';

        if (apiError.status === 401) {
          errorMessage = 'Invalid username or password';
        } else if (apiError.status === 0) {
          errorMessage = 'Unable to reach server. Please check the host URL and your internet connection.';
        } else if (apiError.message) {
          errorMessage = apiError.message;
        }

        setError(errorMessage);
        setIsVerifying(false);
      }
    };

    if (selectedSetupType === 'self-hosted' && params.host && params.username && params.password) {
      hasVerifiedRef.current = true;
      verifyConnection();
    } else if (!params.host || !params.username || !params.password) {
      setError('Missing connection credentials');
      setIsVerifying(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {isVerifying ? (
          <>
            <Icon source="connection" size={64} color={theme.colors.primary} />
            <ActivityIndicator size="large" color={theme.colors.primary} style={styles.spinner} />
            <Text variant="headlineSmall" style={styles.title}>
              Verifying Connection
            </Text>
            <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
              Please wait while we connect to your Umami instance...
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
