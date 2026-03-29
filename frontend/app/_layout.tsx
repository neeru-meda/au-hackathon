import React from 'react';
import { Stack } from 'expo-router';
import { UserProvider } from './utils/UserContext';

export default function RootLayout() {
  return (
    <UserProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="screens/LoginScreen" />
      </Stack>
    </UserProvider>
  );
}
