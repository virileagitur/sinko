import { Tabs, router } from 'expo-router';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { api } from '../../convex/_generated/api';
import { useTheme } from '../../context/ThemeContext';

export default function TabsLayout() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const profile = useQuery(api.users.getMyProfile);
  const ensureProfile = useMutation(api.users.ensureProfile);
  const { colors } = useTheme();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading]);

  // Auto-create profile once authenticated and profile doesn't exist yet
  useEffect(() => {
    if (isAuthenticated && profile === null) {
      ensureProfile({ name: 'Student' }).catch(() => {});
    }
  }, [isAuthenticated, profile]);

  if (!isAuthenticated) return null;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.azure,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 60,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: -2,
        },
        headerStyle: { backgroundColor: colors.white },
        headerShadowVisible: false,
        headerTitleStyle: { fontSize: 17, fontWeight: '700', color: colors.text },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
          headerTitle: 'sinko',
          headerTitleStyle: { fontSize: 24, fontWeight: '800', color: colors.azure, letterSpacing: -0.5 },
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'compass' : 'compass-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'people' : 'people-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="study"
        options={{
          title: 'Study',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'book' : 'book-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
