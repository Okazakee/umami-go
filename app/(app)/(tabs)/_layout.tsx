import { Tabs } from 'expo-router';
import * as React from 'react';
import { Icon, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AppTabsLayout() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarStyle: {
          backgroundColor: '#1e1e2e',
          borderTopColor: '#1e1e2e',
          paddingTop: 8,
          paddingBottom: 10 + insets.bottom,
          height: 78 + insets.bottom,
        },
      }}
    >
      <Tabs.Screen
        name="overview"
        options={{
          title: 'Overview',
          tabBarIcon: ({ color, size }) => <Icon source="chart-line" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, size }) => <Icon source="dots-grid" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="websites"
        options={{
          title: 'Websites',
          tabBarIcon: ({ color, size }) => <Icon source="web" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Icon source="cog" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
