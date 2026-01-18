import { router, useFocusEffect } from 'expo-router';
import * as React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  type InstanceRecord,
  getActiveInstance,
  listInstances,
  setActiveInstance,
} from '../../../lib/storage/instances';

export default function HomeScreen() {
  const theme = useTheme();
  const [instances, setInstances] = React.useState<InstanceRecord[]>([]);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [all, active] = await Promise.all([listInstances(), getActiveInstance()]);
      setInstances(all);
      setActiveId(active?.id ?? null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleAddInstance = () => {
    router.push('/(onboarding)/choice');
  };

  const handleOpenInstance = async (instanceId: string) => {
    await setActiveInstance(instanceId);
    setActiveId(instanceId);
    router.push({
      pathname: '/(app)/instance/[instanceId]',
      params: { instanceId },
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text variant="headlineMedium">Instances</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Add and switch between self-hosted and cloud instances.
          </Text>
        </View>

        <View style={styles.actions}>
          <Button mode="contained" onPress={handleAddInstance}>
            Add instance
          </Button>
          {__DEV__ ? (
            <Button mode="outlined" onPress={() => router.push('/(app)/debug')}>
              Debug
            </Button>
          ) : null}
        </View>

        {isLoading ? (
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Loading…
          </Text>
        ) : instances.length > 0 ? (
          instances.map((i) => (
            <Card
              key={i.id}
              mode="outlined"
              style={[
                styles.instanceCard,
                i.id === activeId ? { borderColor: theme.colors.primary, borderWidth: 2 } : null,
              ]}
              onPress={() => handleOpenInstance(i.id)}
            >
              <Card.Title
                title={i.name}
                subtitle={`${i.setupType} — ${i.host}${i.username ? ` — ${i.username}` : ''}`}
              />
            </Card>
          ))
        ) : (
          <Card mode="outlined">
            <Card.Title title="No instances yet" />
            <Card.Content>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Tap “Add instance” to connect to self-hosted Umami or Umami Cloud.
              </Text>
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  instanceCard: {
    overflow: 'hidden',
  },
});
