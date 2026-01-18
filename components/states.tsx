import type { RequestError } from '@/lib/session/fetch';
import { router } from 'expo-router';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, Text, useTheme } from 'react-native-paper';

export function EmptyState({
  title,
  description,
  primaryLabel,
  onPrimaryPress,
  secondaryLabel,
  onSecondaryPress,
}: {
  title: string;
  description?: string;
  primaryLabel?: string;
  onPrimaryPress?: () => void;
  secondaryLabel?: string;
  onSecondaryPress?: () => void;
}) {
  const theme = useTheme();
  return (
    <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content style={styles.content}>
        <Text variant="titleLarge">{title}</Text>
        {description ? (
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {description}
          </Text>
        ) : null}
        {primaryLabel && onPrimaryPress ? (
          <Button mode="contained" onPress={onPrimaryPress}>
            {primaryLabel}
          </Button>
        ) : null}
        {secondaryLabel && onSecondaryPress ? (
          <Button mode="outlined" onPress={onSecondaryPress}>
            {secondaryLabel}
          </Button>
        ) : null}
      </Card.Content>
    </Card>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  primaryLabel = 'Retry',
  secondaryLabel,
  onSecondaryPress,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
  primaryLabel?: string;
  secondaryLabel?: string;
  onSecondaryPress?: () => void;
}) {
  const theme = useTheme();
  return (
    <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content style={styles.content}>
        <Text variant="titleLarge">{title}</Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {message}
        </Text>
        {onRetry ? (
          <Button mode="contained" onPress={onRetry}>
            {primaryLabel}
          </Button>
        ) : null}
        {secondaryLabel && onSecondaryPress ? (
          <Button mode="outlined" onPress={onSecondaryPress}>
            {secondaryLabel}
          </Button>
        ) : null}
      </Card.Content>
    </Card>
  );
}

export function InlineNotice({
  title,
  message,
  actionLabel,
  onPress,
}: {
  title: string;
  message: string;
  actionLabel?: string;
  onPress?: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.notice, { backgroundColor: theme.colors.surfaceVariant }]}>
      <View style={styles.noticeText}>
        <Text variant="titleSmall">{title}</Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {message}
        </Text>
      </View>
      {actionLabel && onPress ? (
        <Button mode="text" onPress={onPress}>
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}

export function LoadingState({
  title = 'Loading…',
  description,
}: {
  title?: string;
  description?: string;
}) {
  const theme = useTheme();
  return (
    <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content style={[styles.content, { alignItems: 'flex-start' }]}>
        <ActivityIndicator />
        <Text variant="titleLarge">{title}</Text>
        {description ? (
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {description}
          </Text>
        ) : null}
      </Card.Content>
    </Card>
  );
}

export function mapRequestErrorToUi(err: unknown): {
  title: string;
  message: string;
  primaryLabel?: string;
  onPrimaryPress?: () => void;
} {
  const e = err as Partial<RequestError> & { code?: string; message?: string };
  const code = e?.code;
  const message = e?.message || 'Request failed.';

  if (code === 'missing_instance') {
    return {
      title: 'Not connected',
      message: 'Connect your Umami to start viewing analytics.',
      primaryLabel: 'Connect',
      onPrimaryPress: () => router.push('/(onboarding)/welcome'),
    };
  }

  if (code === 'missing_secrets' || code === 'invalid_credentials') {
    return {
      title: 'Connection issue',
      message: message || 'Credentials are missing or invalid.',
      primaryLabel: 'Open Settings',
      onPrimaryPress: () => router.push('/(app)/settings'),
    };
  }

  if (code === 'host_down') {
    return {
      title: 'Host unreachable',
      message: 'Unable to reach the server. Check the host and your connection, then retry.',
      primaryLabel: 'Retry',
    };
  }

  return {
    title: 'Error',
    message,
    primaryLabel: 'Retry',
  };
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  content: {
    gap: 10,
  },
  notice: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  noticeText: {
    flex: 1,
    gap: 2,
  },
});
