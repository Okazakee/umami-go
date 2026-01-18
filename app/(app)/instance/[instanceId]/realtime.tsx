import { router, useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function InstanceRealtimeScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ instanceId?: string | string[] }>();
  const instanceId = Array.isArray(params.instanceId) ? params.instanceId[0] : params.instanceId;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'bottom']}
    >
      <View style={styles.content}>
        <Text variant="headlineMedium">Realtime</Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Instance: {instanceId ?? '(missing)'}
        </Text>
        <Button mode="outlined" onPress={() => router.back()} style={styles.button}>
          Back
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  button: {
    marginTop: 8,
  },
});
