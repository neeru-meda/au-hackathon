import React, { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/theme';
import { Platform } from 'react-native';
import { useUser } from '../utils/UserContext';

export default function ClerkLayout() {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!user || user.role !== 'Clerk') {
      router.replace('/');
    }
  }, [user]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.darkGray,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 25 : 8,
          paddingTop: 8,
          paddingHorizontal: 8
        },
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600'
        }
      }}
    >
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan & Generate',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="barcode" size={size} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="queue"
        options={{
          title: 'Print Queue',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="print" size={size} color={color} />
          )
        }}
      />
    </Tabs>
  );
}
