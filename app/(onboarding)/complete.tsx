import Constants from 'expo-constants';
import { router } from 'expo-router';
import * as React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Icon, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from '../../contexts/OnboardingContext';

interface DevCredentials {
  selfHosted?: {
    host: string;
    username: string;
    password: string;
  };
  cloud?: {
    host: string;
    apiKey: string;
  };
}

// Get dev credentials from app.config.js extra (only available in dev mode)
// In production, extra.devCredentials will be undefined/empty
function getDevCredentials(): DevCredentials | null {
  if (!__DEV__) return null;
  
  const extra = Constants.expoConfig?.extra;
  return (extra?.devCredentials as DevCredentials) || null;
}

// Check if dev credentials are available
function hasDevCredentials(setupType: 'self-hosted' | 'cloud'): boolean {
  if (!__DEV__) return false;
  
  const credentials = getDevCredentials();
  if (!credentials) return false;

  if (setupType === 'self-hosted') {
    return !!(
      credentials.selfHosted?.host &&
      credentials.selfHosted?.username &&
      credentials.selfHosted?.password
    );
  } else {
    return !!(
      credentials.cloud?.host &&
      credentials.cloud?.apiKey
    );
  }
}

// Get a specific credential value
function getDevCredential(
  setupType: 'self-hosted' | 'cloud',
  key: 'host' | 'username' | 'password' | 'apiKey',
): string | undefined {
  if (!__DEV__) return undefined;
  
  const credentials = getDevCredentials();
  if (!credentials) return undefined;

  if (setupType === 'self-hosted' && credentials.selfHosted) {
    return credentials.selfHosted[key as keyof typeof credentials.selfHosted];
  } else if (setupType === 'cloud' && credentials.cloud) {
    return credentials.cloud[key as keyof typeof credentials.cloud];
  }

  return undefined;
}

export default function CompleteScreen() {
  const theme = useTheme();
  const { completeOnboarding, selectedSetupType } = useOnboarding();
  const isSelfHosted = selectedSetupType === 'self-hosted';

  // Check if dev credentials are available (only in dev mode, never in production)
  const hasSelfHostedEnvVars = hasDevCredentials('self-hosted');
  const hasCloudEnvVars = hasDevCredentials('cloud');


  const [host, setHost] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [apiKey, setApiKey] = React.useState('');

  const [hostError, setHostError] = React.useState('');
  const [usernameError, setUsernameError] = React.useState('');
  const [passwordError, setPasswordError] = React.useState('');
  const [apiKeyError, setApiKeyError] = React.useState('');

  const validateHost = (value: string) => {
    if (value.length === 0) {
      setHostError('');
      return true;
    }
    if (!value.trim()) {
      setHostError('Host is required');
      return false;
    }
    try {
      const url = new URL(value.startsWith('http') ? value : `https://${value}`);
      if (!url.hostname) {
        setHostError('Invalid host format');
        return false;
      }
      // Additional validation: hostname should contain at least a dot or be localhost
      // This catches cases like "a" which technically creates a URL but isn't valid
      if (url.hostname !== 'localhost' && !url.hostname.includes('.')) {
        setHostError('Invalid host format');
        return false;
      }
      setHostError('');
      return true;
    } catch {
      setHostError('Invalid URL format');
      return false;
    }
  };

  const validateUsername = (value: string) => {
    if (value.length === 0) {
      setUsernameError('');
      return true;
    }
    if (!value.trim()) {
      setUsernameError('Username is required');
      return false;
    }
    setUsernameError('');
    return true;
  };

  const validatePassword = (value: string) => {
    if (value.length === 0) {
      setPasswordError('');
      return true;
    }
    if (!value.trim()) {
      setPasswordError('Password is required');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const validateApiKey = (value: string) => {
    if (value.length === 0) {
      setApiKeyError('');
      return true;
    }
    if (!value.trim()) {
      setApiKeyError('API Key is required');
      return false;
    }
    setApiKeyError('');
    return true;
  };

  const handleHostChange = (value: string) => {
    setHost(value);
    if (value.length > 0) {
      validateHost(value);
    } else {
      setHostError('');
    }
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    if (value.length > 0) {
      validateUsername(value);
    } else {
      setUsernameError('');
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (value.length > 0) {
      validatePassword(value);
    } else {
      setPasswordError('');
    }
  };

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    if (value.length > 0) {
      validateApiKey(value);
    } else {
      setApiKeyError('');
    }
  };

  const handleFinish = async () => {
    // In dev mode, use dev credentials as fallback if inputs are empty
    let finalHost = host;
    let finalUsername = username;
    let finalPassword = password;
    let finalApiKey = apiKey;

    if (__DEV__) {
      if (isSelfHosted && hasSelfHostedEnvVars) {
        if (!finalHost) finalHost = getDevCredential('self-hosted', 'host') || '';
        if (!finalUsername) finalUsername = getDevCredential('self-hosted', 'username') || '';
        if (!finalPassword) finalPassword = getDevCredential('self-hosted', 'password') || '';
      } else if (!isSelfHosted && hasCloudEnvVars) {
        if (!finalHost) finalHost = getDevCredential('cloud', 'host') || '';
        if (!finalApiKey) finalApiKey = getDevCredential('cloud', 'apiKey') || '';
      }
    }

    let isValid = true;

    if (isSelfHosted) {
      isValid = validateHost(finalHost) && validateUsername(finalUsername) && validatePassword(finalPassword);
    } else {
      isValid = validateHost(finalHost) && validateApiKey(finalApiKey);
    }

    if (isValid) {
      // Navigate to verification screen with credentials
      if (isSelfHosted) {
        router.push({
          pathname: '/(onboarding)/verify',
          params: {
            host: finalHost,
            username: finalUsername,
            password: finalPassword,
          },
        });
      } else {
        // For cloud, we'll handle it later
        // For now, just complete onboarding
        await completeOnboarding();
        router.replace('/(app)/home');
      }
    }
  };

  const isFormValid = () => {
    // In dev mode, check if all required env vars are present
    if (__DEV__) {
      if (isSelfHosted) {
        // Check if ALL 3 env vars are present
        if (hasSelfHostedEnvVars) {
          // If all env vars are present, allow empty inputs OR filled inputs
          if (!host.trim() && !username.trim() && !password.trim()) {
            return true; // All empty, but env vars present - allow
          }
          // Some inputs filled - validate them (must be valid if filled)
          return (
            (host.trim() === '' || !hostError) &&
            (username.trim() === '' || !usernameError) &&
            (password.trim() === '' || !passwordError)
          );
        }
        // If env vars are missing, require form completion
        return (
          host.trim() !== '' &&
          username.trim() !== '' &&
          password.trim() !== '' &&
          !hostError &&
          !usernameError &&
          !passwordError
        );
      } else {
        // Check if ALL 2 env vars are present
        if (hasCloudEnvVars) {
          // If all env vars are present, allow empty inputs OR filled inputs
          if (!host.trim() && !apiKey.trim()) {
            return true; // All empty, but env vars present - allow
          }
          // Some inputs filled - validate them (must be valid if filled)
          return (host.trim() === '' || !hostError) && (apiKey.trim() === '' || !apiKeyError);
        }
        // If env vars are missing, require form completion
        return host.trim() !== '' && apiKey.trim() !== '' && !hostError && !apiKeyError;
      }
    }

    // Production mode: always require form completion
    if (isSelfHosted) {
      return (
        host.trim() !== '' &&
        username.trim() !== '' &&
        password.trim() !== '' &&
        !hostError &&
        !usernameError &&
        !passwordError
      );
    }
    return host.trim() !== '' && apiKey.trim() !== '' && !hostError && !apiKeyError;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Icon
            source={isSelfHosted ? 'server-network' : 'cloud'}
            size={64}
            color={theme.colors.primary}
          />
          <Text variant="displaySmall" style={styles.title}>
            {isSelfHosted ? 'Connect to Self-Hosted' : 'Connect to Umami Cloud'}
          </Text>
          <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Enter your connection details
          </Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.form}>
            <View style={styles.inputWrapper}>
              <TextInput
                label="Host"
                value={host}
                onChangeText={handleHostChange}
                onBlur={() => {
                  if (host.length > 0) {
                    validateHost(host);
                  }
                }}
                mode="outlined"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                error={!!hostError}
                style={styles.input}
              />
              {hostError ? (
                <Text variant="bodySmall" style={[styles.errorText, { color: theme.colors.error }]}>
                  {hostError}
                </Text>
              ) : (
                <Text variant="bodySmall" style={[styles.exampleText, { color: theme.colors.onSurfaceVariant }]}>
                  Example: https://umami.example.com
                </Text>
              )}
            </View>

            {isSelfHosted ? (
              <>
                <View style={styles.inputWrapper}>
                  <TextInput
                    label="Username"
                    value={username}
                    onChangeText={handleUsernameChange}
                    onBlur={() => {
                      if (username.length > 0) {
                        validateUsername(username);
                      }
                    }}
                    mode="outlined"
                    autoCapitalize="none"
                    autoCorrect={false}
                    error={!!usernameError}
                    style={styles.input}
                  />
                  {usernameError ? (
                    <Text variant="bodySmall" style={[styles.errorText, { color: theme.colors.error }]}>
                      {usernameError}
                    </Text>
                  ) : (
                    <Text variant="bodySmall" style={[styles.exampleText, { color: theme.colors.onSurfaceVariant }]}>
                      Example: admin
                    </Text>
                  )}
                </View>
                <View style={styles.inputWrapper}>
                  <TextInput
                    label="Password"
                    value={password}
                    onChangeText={handlePasswordChange}
                    onBlur={() => {
                      if (password.length > 0) {
                        validatePassword(password);
                      }
                    }}
                    mode="outlined"
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    error={!!passwordError}
                    style={styles.input}
                  />
                  {passwordError ? (
                    <Text variant="bodySmall" style={[styles.errorText, { color: theme.colors.error }]}>
                      {passwordError}
                    </Text>
                  ) : (
                    <Text variant="bodySmall" style={[styles.exampleText, { color: theme.colors.onSurfaceVariant }]}>
                      Example: your-secure-password
                    </Text>
                  )}
                </View>
              </>
            ) : (
              <View style={styles.inputWrapper}>
                <TextInput
                  label="API Key"
                  value={apiKey}
                  onChangeText={handleApiKeyChange}
                  onBlur={() => {
                    if (apiKey.length > 0) {
                      validateApiKey(apiKey);
                    }
                  }}
                  mode="outlined"
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry
                  error={!!apiKeyError}
                  style={styles.input}
                />
                {apiKeyError ? (
                  <Text variant="bodySmall" style={[styles.errorText, { color: theme.colors.error }]}>
                    {apiKeyError}
                  </Text>
                ) : (
                  <Text variant="bodySmall" style={[styles.exampleText, { color: theme.colors.onSurfaceVariant }]}>
                    Example: um_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleFinish}
          style={styles.button}
          disabled={!isFormValid()}
        >
          Finish
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    justifyContent: 'center',
    gap: 32,
  },
  header: {
    alignItems: 'center',
    gap: 20,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 24,
  },
  formContainer: {
    width: '100%',
    alignItems: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 400,
    gap: 16,
  },
  inputWrapper: {
    width: '100%',
    marginBottom: 4,
  },
  input: {
    width: '100%',
  },
  exampleText: {
    marginTop: 4,
    marginLeft: 16,
    fontSize: 12,
  },
  errorText: {
    marginTop: 4,
    marginLeft: 16,
    fontSize: 12,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
  },
  button: {
    paddingVertical: 6,
  },
});
