import { Tabs } from 'expo-router';
import * as React from 'react';
import { Icon, useTheme } from 'react-native-paper';

export default function AppTabsLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Instances',
          tabBarIcon: ({ color, size }) => <Icon source="server" color={color} size={size} />,
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
