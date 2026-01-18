import { router } from 'expo-router';
import * as React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Icon, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from '../../contexts/OnboardingContext';

export default function ChoiceScreen() {
  const theme = useTheme();
  const { setSelectedSetupType, selectedSetupType } = useOnboarding();
  const [localSelection, setLocalSelection] = React.useState<'self-hosted' | 'cloud'>(
    selectedSetupType || 'self-hosted'
  );

  const handleSelect = (option: 'self-hosted' | 'cloud') => {
    setLocalSelection(option);
    setSelectedSetupType(option);
  };

  const handleContinue = () => {
    // Ensure the selection is saved to context before navigating
    setSelectedSetupType(localSelection);
    router.push('/(onboarding)/complete');
  };

  const handleMoreInfo = () => {
    Linking.openURL('https://umami.is/docs/cloud/api-key');
  };

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
          <Icon source="cog-outline" size={64} color={theme.colors.primary} />
          <Text variant="displaySmall" style={styles.title}>
            Choose Your Setup
          </Text>
          <Text
            variant="bodyLarge"
            style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
          >
            Select how you want to use Umami
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          <Pressable
            onPress={() => handleSelect('self-hosted')}
            style={({ pressed }) => [
              styles.optionCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor:
                  localSelection === 'self-hosted' ? theme.colors.primary : theme.colors.outline,
                borderWidth: localSelection === 'self-hosted' ? 2 : 1,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Icon source="server" size={48} color={theme.colors.primary} />
            <Text variant="titleMedium" style={styles.optionText}>
              Self-Hosted
            </Text>
            <Text
              variant="bodySmall"
              style={[styles.optionDescription, { color: theme.colors.onSurfaceVariant }]}
            >
              Connect to your own instance
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleSelect('cloud')}
            style={({ pressed }) => [
              styles.optionCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor:
                  localSelection === 'cloud' ? theme.colors.primary : theme.colors.outline,
                borderWidth: localSelection === 'cloud' ? 2 : 1,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Icon source="cloud" size={48} color={theme.colors.primary} />
            <Text variant="titleMedium" style={styles.optionText}>
              Umami Cloud
            </Text>
            <Text
              variant="bodySmall"
              style={[styles.optionDescription, { color: theme.colors.onSurfaceVariant }]}
            >
              Use Umami's cloud service
            </Text>
          </Pressable>
        </View>

        <View style={styles.descriptionContainer}>
          <Text
            variant="bodyMedium"
            style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
          >
            {localSelection === 'self-hosted'
              ? 'You will need: Host, Username, and Password'
              : 'You will need: Host and API Key'}
          </Text>
          {localSelection === 'cloud' && (
            <Pressable
              onPress={handleMoreInfo}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <Text variant="bodySmall" style={[styles.linkText, { color: theme.colors.primary }]}>
                More info...
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Button mode="contained" onPress={handleContinue} style={styles.button}>
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
  optionsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  optionCard: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    minHeight: 160,
    maxHeight: 200,
  },
  optionText: {
    textAlign: 'center',
    marginTop: 4,
  },
  optionDescription: {
    textAlign: 'center',
    lineHeight: 18,
  },
  descriptionContainer: {
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  description: {
    textAlign: 'center',
    lineHeight: 20,
  },
  linkText: {
    textAlign: 'center',
    textDecorationLine: 'underline',
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
