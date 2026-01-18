import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator } from 'react-native';
import { useTheme } from 'react-native-paper';

export default function InstanceIndex() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ instanceId?: string | string[] }>();

  const redirect = React.useCallback(() => {
    const instanceId = Array.isArray(params.instanceId) ? params.instanceId[0] : params.instanceId;
    if (!instanceId) return;
    router.replace({
      pathname: '/(app)/instance/[instanceId]/overview',
      params: { instanceId },
    });
  }, [params.instanceId]);

  // If this screen ever becomes visible (e.g. via back navigation), redirect again.
  useFocusEffect(
    React.useCallback(() => {
      redirect();
    }, [redirect])
  );

  return <ActivityIndicator size="large" color={theme.colors.primary} />;
}
