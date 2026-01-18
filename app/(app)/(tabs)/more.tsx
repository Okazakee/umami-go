import { router } from 'expo-router';
import * as React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Card, Icon, Snackbar, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

function MoreRow({
  title,
  subtitle,
  icon,
  onPress,
}: {
  title: string;
  subtitle?: string;
  icon: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} style={styles.rowPressable}>
      <View style={styles.row}>
        <View style={[styles.rowIcon, { backgroundColor: '#262642' }]}>
          <Icon source={icon} size={18} color={theme.colors.onSurface} />
        </View>
        <View style={styles.rowText}>
          <Text variant="titleMedium">{title}</Text>
          {subtitle ? (
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <Icon source="chevron-right" size={22} color={theme.colors.onSurfaceVariant} />
      </View>
    </Pressable>
  );
}

export default function MoreScreen() {
  const theme = useTheme();
  const [snack, setSnack] = React.useState<string | null>(null);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'bottom']}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text variant="headlineMedium">More</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Explore deeper analytics sections.
          </Text>
        </View>

        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Title title="Traffic" />
          <Card.Content style={styles.cardContent}>
            <MoreRow
              title="Events"
              subtitle="Custom event analytics"
              icon="cursor-default-click"
              onPress={() => router.push('/(app)/details/traffic/events')}
            />
            <MoreRow
              title="Sessions"
              subtitle="Session-level insights"
              icon="timeline-clock-outline"
              onPress={() => router.push('/(app)/details/traffic/sessions')}
            />
            <MoreRow
              title="Runtime"
              subtitle="Performance breakdown"
              icon="speedometer"
              onPress={() => router.push('/(app)/details/traffic/runtime')}
            />
            <MoreRow
              title="Compare"
              subtitle="Period A vs period B"
              icon="compare"
              onPress={() => router.push('/(app)/details/traffic/compare')}
            />
            <MoreRow
              title="Breakdown"
              subtitle="Slice by dimension"
              icon="view-grid-outline"
              onPress={() => router.push('/(app)/details/traffic/breakdown')}
            />
          </Card.Content>
        </Card>

        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Title title="Behavior" />
          <Card.Content style={styles.cardContent}>
            <MoreRow
              title="Pages"
              subtitle="Paths, entry, exit"
              icon="file-document-outline"
              onPress={() => router.push('/(app)/details/pages')}
            />
            <MoreRow
              title="Goals"
              subtitle="(Placeholder)"
              icon="target"
              onPress={() => setSnack('Goals (coming soon)')}
            />
            <MoreRow
              title="Funnels"
              subtitle="(Placeholder)"
              icon="filter-variant"
              onPress={() => setSnack('Funnels (coming soon)')}
            />
            <MoreRow
              title="Journeys"
              subtitle="(Placeholder)"
              icon="map-outline"
              onPress={() => setSnack('Journeys (coming soon)')}
            />
            <MoreRow
              title="Retention"
              subtitle="(Placeholder)"
              icon="repeat-variant"
              onPress={() => setSnack('Retention (coming soon)')}
            />
          </Card.Content>
        </Card>

        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Title title="Audience" />
          <Card.Content style={styles.cardContent}>
            <MoreRow
              title="Sources"
              subtitle="Referrers and channels"
              icon="share-variant-outline"
              onPress={() => router.push('/(app)/details/sources')}
            />
            <MoreRow
              title="Environment"
              subtitle="Browsers, OS, devices"
              icon="laptop"
              onPress={() => router.push('/(app)/details/environment')}
            />
            <MoreRow
              title="Location"
              subtitle="Countries, regions, cities"
              icon="map-marker-outline"
              onPress={() => router.push('/(app)/details/location')}
            />
            <MoreRow
              title="Segments"
              subtitle="(Placeholder)"
              icon="account-group-outline"
              onPress={() => setSnack('Segments (coming soon)')}
            />
            <MoreRow
              title="Cohorts"
              subtitle="(Placeholder)"
              icon="chart-box-outline"
              onPress={() => setSnack('Cohorts (coming soon)')}
            />
          </Card.Content>
        </Card>

        <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Title title="Growth" />
          <Card.Content style={styles.cardContent}>
            <MoreRow
              title="UTM"
              subtitle="(Placeholder)"
              icon="tag-outline"
              onPress={() => setSnack('UTM (coming soon)')}
            />
            <MoreRow
              title="Revenue"
              subtitle="(Placeholder)"
              icon="currency-usd"
              onPress={() => setSnack('Revenue (coming soon)')}
            />
            <MoreRow
              title="Attribution"
              subtitle="(Placeholder)"
              icon="source-branch"
              onPress={() => setSnack('Attribution (coming soon)')}
            />
          </Card.Content>
        </Card>
      </ScrollView>

      <Snackbar visible={!!snack} onDismiss={() => setSnack(null)} duration={2500}>
        {snack ?? ''}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: 16,
    paddingBottom: 24,
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
  rowPressable: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#1a1930',
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
});
