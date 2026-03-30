import React, { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/theme';
import { Platform } from 'react-native';
import { useUser } from '../utils/UserContext';

export default function StudentLayout() {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!user || user.role !== 'Student') {
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
        name="attendance"
        options={{
          title: 'My Attendance',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart" size={size} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: 'My Requests',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text" size={size} color={color} />
          )
        }}
      />
    </Tabs>
  );
}
