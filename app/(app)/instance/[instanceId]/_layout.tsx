import { Tabs, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import { Icon, Snackbar, useTheme } from 'react-native-paper';
import { ensureInstanceSession } from '../../../../lib/session/instanceSession';

export default function InstanceTabsLayout() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ instanceId?: string | string[] }>();
  const instanceId = Array.isArray(params.instanceId) ? params.instanceId[0] : params.instanceId;

  const [snack, setSnack] = React.useState<string | null>(null);
  const [snackAction, setSnackAction] = React.useState<{
    label: string;
    onPress: () => void;
  } | null>(null);

  const revalidate = React.useCallback(async () => {
    if (!instanceId) {
      router.replace('/(app)/home');
      return;
    }
    const result = await ensureInstanceSession(instanceId);
    if (!result.ok) {
      if (result.code === 'missing_instance') {
        router.replace('/(app)/home');
        return;
      }

      if (result.code === 'host_down') {
        setSnackAction(null);
        setSnack('Host is unreachable. Check your connection/URL.');
      } else if (result.code === 'invalid_credentials') {
        setSnackAction({
          label: 'Reconnect',
          onPress: () => router.push('/(onboarding)/choice'),
        });
        setSnack('Authentication failed. Your username/password may have changed.');
      } else if (result.code === 'missing_secrets') {
        setSnackAction({
          label: 'Reconnect',
          onPress: () => router.push('/(onboarding)/choice'),
        });
        setSnack('Missing stored credentials. Please reconnect this instance.');
      }
    }
  }, [instanceId]);

  useFocusEffect(
    React.useCallback(() => {
      revalidate();
    }, [revalidate])
  );

  return (
    <>
      <Tabs
        // Ensure "back" exits the instance instead of navigating to hidden routes (like index)
        // or switching tabs.
        backBehavior="none"
        // Avoid defaulting to the hidden index route.
        initialRouteName="overview"
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.colors.primary,
          tabBarStyle: {
            backgroundColor: '#1e1e2e',
            borderTopColor: '#1e1e2e',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            // Hide the default route from the tab bar; it only redirects to "overview".
            href: null,
          }}
        />
        <Tabs.Screen
          name="overview"
          options={{
            title: 'Overview',
            tabBarIcon: ({ color, size }) => (
              <Icon source="view-dashboard-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="websites"
          options={{
            title: 'Websites',
            tabBarIcon: ({ color, size }) => <Icon source="web" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="realtime"
          options={{
            title: 'Realtime',
            tabBarIcon: ({ color, size }) => (
              <Icon source="access-point" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, size }) => <Icon source="cog" color={color} size={size} />,
          }}
        />
      </Tabs>

      <Snackbar
        visible={!!snack}
        onDismiss={() => {
          setSnack(null);
          setSnackAction(null);
        }}
        duration={5000}
        action={snackAction ?? undefined}
      >
        {snack ?? ''}
      </Snackbar>
    </>
  );
}
