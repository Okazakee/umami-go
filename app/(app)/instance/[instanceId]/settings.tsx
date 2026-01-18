import {
  deleteInstance,
  getInstanceById,
  getInstanceSecrets,
  setActiveInstance,
  setInstanceSecrets,
  upsertInstance,
} from '@/lib/storage/instances';
import { router, useFocusEffect, useGlobalSearchParams } from 'expo-router';
import * as React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Dialog, Portal, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function InstanceSettingsScreen() {
  const theme = useTheme();
  const dialogStyle = React.useMemo(() => ({ borderRadius: 12 }), []);
  const params = useGlobalSearchParams<{ instanceId?: string | string[] }>();
  const instanceId = Array.isArray(params.instanceId) ? params.instanceId[0] : params.instanceId;

  const [isLoading, setIsLoading] = React.useState(true);
  const [instance, setInstance] = React.useState<Awaited<ReturnType<typeof getInstanceById>>>(null);
  const [host, setHost] = React.useState('');
  const [name, setName] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [apiKey, setApiKey] = React.useState('');
  const [password, setPassword] = React.useState('');

  const [renameOpen, setRenameOpen] = React.useState(false);
  const [hostOpen, setHostOpen] = React.useState(false);
  const [credsOpen, setCredsOpen] = React.useState(false);
  const [removeOpen, setRemoveOpen] = React.useState(false);

  const refresh = React.useCallback(async () => {
    if (!instanceId) return;
    setIsLoading(true);
    const row = await getInstanceById(instanceId);
    setInstance(row);
    if (!row) {
      setIsLoading(false);
      return;
    }
    setHost(row.host);
    setName(row.name);
    setUsername(row.username ?? '');
    const secrets = await getInstanceSecrets(row.id);
    setApiKey(secrets.apiKey ?? '');
    setPassword(secrets.password ?? '');
    setIsLoading(false);
  }, [instanceId]);

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleMakeActive = React.useCallback(async () => {
    if (!instanceId) return;
    await setActiveInstance(instanceId);
    await refresh();
  }, [instanceId, refresh]);

  const handleSaveRename = React.useCallback(async () => {
    if (!instance) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    await upsertInstance({
      id: instance.id,
      name: trimmed,
      host: instance.host,
      username: instance.username,
      umamiUserId: instance.umamiUserId,
      setupType: instance.setupType,
    });
    setRenameOpen(false);
    await refresh();
  }, [instance, name, refresh]);

  const handleSaveHost = React.useCallback(async () => {
    if (!instance) return;
    const trimmed = host.trim();
    if (!trimmed) return;
    await upsertInstance({
      id: instance.id,
      name: instance.name,
      host: trimmed,
      username: instance.username,
      umamiUserId: instance.umamiUserId,
      setupType: instance.setupType,
    });
    setHostOpen(false);
    await refresh();
  }, [instance, host, refresh]);

  const handleSaveCreds = React.useCallback(async () => {
    if (!instance) return;

    if (instance.setupType === 'cloud') {
      const trimmed = apiKey.trim();
      if (!trimmed) return;
      await setInstanceSecrets(instance.id, { apiKey: trimmed });
      setCredsOpen(false);
      await refresh();
      return;
    }

    const nextUser = username.trim();
    const nextPass = password;
    if (!nextUser || !nextPass) return;

    // Update username and password and clear token so the next request re-logins.
    await upsertInstance({
      id: instance.id,
      name: instance.name,
      host: instance.host,
      username: nextUser,
      umamiUserId: instance.umamiUserId,
      setupType: instance.setupType,
    });
    await setInstanceSecrets(instance.id, { password: nextPass, token: '' });
    setCredsOpen(false);
    await refresh();
  }, [apiKey, instance, password, refresh, username]);

  const handleRemove = React.useCallback(async () => {
    if (!instanceId) return;
    await deleteInstance(instanceId);
    setRemoveOpen(false);
    router.replace('/(app)/home');
  }, [instanceId]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'bottom']}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text variant="headlineMedium">Instance Settings</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Manage this instance.
          </Text>
        </View>

        {!instanceId ? (
          <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Title title="Missing instance" />
            <Card.Content style={styles.cardContent}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                No instance id provided.
              </Text>
              <Button mode="contained" onPress={() => router.replace('/(app)/home')}>
                Back to Instances
              </Button>
            </Card.Content>
          </Card>
        ) : !instance ? (
          <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Title title={isLoading ? 'Loading…' : 'Instance not found'} />
            <Card.Content style={styles.cardContent}>
              <Button mode="contained" onPress={() => router.replace('/(app)/home')}>
                Back to Instances
              </Button>
            </Card.Content>
          </Card>
        ) : (
          <>
            <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              <Card.Title title="Instance" />
              <Card.Content style={styles.cardContent}>
                <Text variant="bodyMedium">Name: {instance.name}</Text>
                <Text variant="bodyMedium">Type: {instance.setupType}</Text>
                <Text variant="bodyMedium">Host: {instance.host}</Text>
                <Text variant="bodyMedium">
                  Username:{' '}
                  {instance.username ?? (instance.setupType === 'cloud' ? '(n/a)' : '(none)')}
                </Text>
                <Text variant="bodyMedium">Active: {String(instance.isActive)}</Text>
              </Card.Content>
            </Card>

            <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              <Card.Title title="Actions" />
              <Card.Content style={styles.cardContent}>
                <Button mode="outlined" onPress={handleMakeActive} disabled={instance.isActive}>
                  Make active
                </Button>
                <Button mode="outlined" onPress={() => setRenameOpen(true)}>
                  Rename
                </Button>
                <Button mode="outlined" onPress={() => setHostOpen(true)}>
                  Update host
                </Button>
                <Button mode="outlined" onPress={() => setCredsOpen(true)}>
                  {instance.setupType === 'cloud' ? 'Update API key' : 'Reconnect credentials'}
                </Button>
                <Button mode="contained" onPress={() => setRemoveOpen(true)}>
                  Remove instance
                </Button>
              </Card.Content>
            </Card>
          </>
        )}
      </ScrollView>

      <Portal>
        <Dialog visible={renameOpen} onDismiss={() => setRenameOpen(false)} style={dialogStyle}>
          <Dialog.Title>Rename instance</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Name"
              value={name}
              onChangeText={setName}
              autoCapitalize="sentences"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setRenameOpen(false)}>Cancel</Button>
            <Button onPress={handleSaveRename}>Save</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={hostOpen} onDismiss={() => setHostOpen(false)} style={dialogStyle}>
          <Dialog.Title>Update host</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Host"
              value={host}
              onChangeText={setHost}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setHostOpen(false)}>Cancel</Button>
            <Button onPress={handleSaveHost}>Save</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={credsOpen} onDismiss={() => setCredsOpen(false)} style={dialogStyle}>
          <Dialog.Title>
            {instance?.setupType === 'cloud' ? 'Update API key' : 'Reconnect'}
          </Dialog.Title>
          <Dialog.Content style={{ gap: 12 }}>
            {instance?.setupType === 'cloud' ? (
              <TextInput
                label="API key"
                value={apiKey}
                onChangeText={setApiKey}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
              />
            ) : (
              <>
                <TextInput
                  label="Username"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TextInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </>
            )}
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Saving will replace stored credentials on this device.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCredsOpen(false)}>Cancel</Button>
            <Button onPress={handleSaveCreds}>Save</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={removeOpen} onDismiss={() => setRemoveOpen(false)} style={dialogStyle}>
          <Dialog.Title>Remove instance?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              This removes the instance and its secrets from this device.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setRemoveOpen(false)}>Cancel</Button>
            <Button onPress={handleRemove}>Remove</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardContent: {
    gap: 10,
  },
});
