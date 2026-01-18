import { router } from 'expo-router';
import * as React from 'react';
import { SegmentedButtons } from 'react-native-paper';

export type TrafficSection =
  | 'overview'
  | 'events'
  | 'sessions'
  | 'runtime'
  | 'compare'
  | 'breakdown';

export function TrafficNav({ value }: { value: TrafficSection }) {
  const onValueChange = React.useCallback((v: string) => {
    router.replace(`/(app)/details/traffic/${v}`);
  }, []);

  return (
    <SegmentedButtons
      value={value}
      onValueChange={onValueChange}
      buttons={[
        { value: 'overview', label: 'Overview' },
        { value: 'events', label: 'Events' },
        { value: 'sessions', label: 'Sessions' },
        { value: 'runtime', label: 'Runtime' },
        { value: 'compare', label: 'Compare' },
        { value: 'breakdown', label: 'Breakdown' },
      ]}
    />
  );
}
