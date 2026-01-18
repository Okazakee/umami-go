import { Tabs } from 'expo-router';
import * as React from 'react';
import { Icon, useTheme } from 'react-native-paper';

export default function InstanceTabsLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
      }}
    >
      <Tabs.Screen
        name="overview"
        options={{
          title: 'Overview',
          tabBarIcon: ({ color, size }) => (
            <Icon source="view-dashboard-outline" color={color} size={size} />
          ),
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
        name="realtime"
        options={{
          title: 'Realtime',
          tabBarIcon: ({ color, size }) => <Icon source="access-point" color={color} size={size} />,
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
