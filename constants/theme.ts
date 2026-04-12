// Global design tokens for Sinko
export const Colors = {
  // Brand
  azure: '#2563EB',
  azureLight: '#EFF6FF',
  azureMid: '#BFDBFE',
  azureDark: '#1D4ED8',
  lily: '#C4B5FD',
  lilyLight: '#F5F3FF',
  lilyDark: '#7C3AED',

  // Neutrals
  white: '#FFFFFF',
  bg: '#FAFAFA',
  surface: '#FFFFFF',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  
  // Text
  text: '#111827',
  textMuted: '#6B7280',
  textLight: '#9CA3AF',
  
  // Status
  success: '#16A34A',
  warning: '#D97706',
  error: '#DC2626',
  info: '#0891B2',

  // Study mode colors
  again: '#DC2626',
  hard: '#D97706',
  good: '#16A34A',
  easy: '#2563EB',
};

export const Typography = {
  h1: { fontSize: 26, fontWeight: '700' as const, color: Colors.text },
  h2: { fontSize: 22, fontWeight: '700' as const, color: Colors.text },
  h3: { fontSize: 18, fontWeight: '600' as const, color: Colors.text },
  h4: { fontSize: 16, fontWeight: '600' as const, color: Colors.text },
  body: { fontSize: 15, fontWeight: '400' as const, color: Colors.text },
  bodySmall: { fontSize: 13, fontWeight: '400' as const, color: Colors.textMuted },
  caption: { fontSize: 11, fontWeight: '400' as const, color: Colors.textLight },
  label: { fontSize: 12, fontWeight: '500' as const, color: Colors.textMuted },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 999,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
};
