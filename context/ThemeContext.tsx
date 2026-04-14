import React, { createContext, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { useConvexAuth } from 'convex/react';

export const lightColors = {
  bg: '#F8F9FB',
  white: '#FFFFFF',
  text: '#0F172A',
  textMuted: '#64748B',
  textLight: '#94A3B8',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  azure: '#2563EB',
  azureLight: '#EFF6FF',
  lily: '#C084FC',
  lilyLight: '#FAF5FF',
  lilyDark: '#7C3AED',
  success: '#16A34A',
  error: '#DC2626',
  warning: '#D97706',
  card: '#FFFFFF',
};

export const darkColors = {
  bg: '#0F172A',
  white: '#1E293B',
  text: '#F1F5F9',
  textMuted: '#94A3B8',
  textLight: '#64748B',
  border: '#334155',
  borderLight: '#1E293B',
  azure: '#3B82F6',
  azureLight: '#1E3A5F',
  lily: '#C084FC',
  lilyLight: '#2D1B4E',
  lilyDark: '#A78BFA',
  success: '#22C55E',
  error: '#F87171',
  warning: '#FBBF24',
  card: '#1E293B',
};

type ThemeColors = typeof lightColors;

interface ThemeContextType {
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  colors: lightColors,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useConvexAuth();
  const profile = useQuery(api.users.getMyProfile, isAuthenticated ? {} : 'skip');
  const updateTheme = useMutation(api.users.updateTheme);
  const systemScheme = useColorScheme();

  const isDark = profile?.theme ? profile.theme === 'dark' : systemScheme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark';
    updateTheme({ theme: next }).catch(() => {});
  };

  return (
    <ThemeContext.Provider value={{ isDark, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
