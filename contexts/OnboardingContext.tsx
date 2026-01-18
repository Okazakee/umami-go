import AsyncStorage from '@react-native-async-storage/async-storage';
import * as React from 'react';

const ONBOARDING_KEY = '@umami-go:onboarding-complete';

interface OnboardingContextType {
  isOnboardingComplete: boolean;
  isLoading: boolean;
  selectedSetupType: 'self-hosted' | 'cloud' | null;
  setSelectedSetupType: (type: 'self-hosted' | 'cloud') => void;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
}

const OnboardingContext = React.createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOnboardingComplete, setIsOnboardingComplete] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedSetupType, setSelectedSetupType] = React.useState<'self-hosted' | 'cloud' | null>(
    'self-hosted'
  );

  React.useEffect(() => {
    loadOnboardingStatus();
  }, []);

  const loadOnboardingStatus = async () => {
    try {
      const value = await AsyncStorage.getItem(ONBOARDING_KEY);
      setIsOnboardingComplete(value === 'true');
    } catch (error) {
      console.error('Error loading onboarding status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      setIsOnboardingComplete(true);
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  const resetOnboarding = async () => {
    try {
      await AsyncStorage.removeItem(ONBOARDING_KEY);
      setIsOnboardingComplete(false);
      setSelectedSetupType(null);
    } catch (error) {
      console.error('Error resetting onboarding status:', error);
    }
  };

  return (
    <OnboardingContext.Provider
      value={{
        isOnboardingComplete,
        isLoading,
        selectedSetupType,
        setSelectedSetupType,
        completeOnboarding,
        resetOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = React.useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
}
