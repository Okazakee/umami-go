import { router } from 'expo-router';
import * as React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Icon, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

const features = [
  {
    title: 'Manage Instances',
    description: 'Connect and manage multiple Umami analytics instances',
  },
  {
    title: 'View Analytics',
    description: 'Monitor your website statistics on the go',
  },
  {
    title: 'Quick Access',
    description: 'Fast and intuitive interface for all your analytics needs',
  },
];

export default function FeaturesScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'bottom']}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Icon source="star-outline" size={64} color={theme.colors.primary} />
          <Text variant="headlineMedium" style={styles.title}>
            Features
          </Text>
          <Text
            variant="bodyMedium"
            style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
          >
            Discover what you can do with Umami Go
          </Text>
        </View>
        <View style={styles.featuresContainer}>
          {features.map((feature) => (
            <Card key={feature.title} style={styles.card} mode="outlined">
              <Card.Content>
                <Text variant="titleMedium" style={styles.cardTitle}>
                  {feature.title}
                </Text>
                <Text
                  variant="bodyMedium"
                  style={[styles.cardDescription, { color: theme.colors.onSurfaceVariant }]}
                >
                  {feature.description}
                </Text>
              </Card.Content>
            </Card>
          ))}
        </View>
      </ScrollView>
      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={() => router.push('/(onboarding)/choice')}
          style={styles.button}
        >
          Continue
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
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    gap: 24,
  },
  header: {
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 20,
  },
  featuresContainer: {
    gap: 16,
  },
  card: {
    marginBottom: 0,
    borderRadius: 10,
    overflow: 'hidden',
  },
  cardTitle: {
    marginBottom: 4,
  },
  cardDescription: {
    lineHeight: 20,
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
