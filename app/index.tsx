import { router, useSegments, useRootNavigationState } from 'expo-router';
import * as React from 'react';
import { useOnboarding } from '../contexts/OnboardingContext';

export default function Index() {
  const { isOnboardingComplete, isLoading } = useOnboarding();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const hasRedirectedRef = React.useRef(false);

  React.useEffect(() => {
    // Wait for navigation state and onboarding status to be ready
    if (isLoading || !navigationState?.key) return;

    const currentSegment = segments[0];
    const inOnboardingGroup = currentSegment === '(onboarding)';
    const inAppGroup = currentSegment === '(app)';

    // Check if we're already in the correct group - if so, don't redirect
    if (isOnboardingComplete && inAppGroup) {
      hasRedirectedRef.current = false; // Reset ref when in correct place
      return;
    }
    if (!isOnboardingComplete && inOnboardingGroup) {
      hasRedirectedRef.current = false; // Reset ref when in correct place
      return;
    }

    // Only redirect if we're not in the correct group
    // Use a small timeout to ensure navigation state is fully initialized
    if (hasRedirectedRef.current) return;
    
    const timeoutId = setTimeout(() => {
      hasRedirectedRef.current = true;

      if (isOnboardingComplete && !inAppGroup) {
        router.replace('/(app)/home');
      } else if (!isOnboardingComplete && !inOnboardingGroup) {
        router.replace('/(onboarding)/welcome');
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [isOnboardingComplete, isLoading, segments, navigationState?.key]);

  return null;
}
