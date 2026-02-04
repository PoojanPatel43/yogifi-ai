// Yogifi AI Premium Wellness Platform — Theme System
// Deep Wine / Burgundy / Muted Rose / Dusty Pink / Soft Blush palette

export const theme = {
  colors: {
    // Primary - Muted Rose
    primary: '#a4546e',
    primaryLight: '#c78a9d',
    primaryDark: '#6d003f',
    primaryMuted: 'rgba(164, 84, 110, 0.12)',
    primaryGlow: 'rgba(164, 84, 110, 0.25)',

    // Secondary - Dusty Pink
    secondary: '#c78a9d',
    secondaryLight: '#f7ccdb',
    secondaryDark: '#a4546e',
    secondaryMuted: 'rgba(199, 138, 157, 0.12)',

    // Accent - Deep Wine (high-energy CTA)
    accent: '#6d003f',
    accentLight: '#f7ccdb',
    accentMuted: 'rgba(109, 0, 63, 0.10)',

    // Semantic
    success: '#4a8c6f',
    successLight: '#e8f5ee',
    successMuted: 'rgba(74, 140, 111, 0.12)',
    error: '#8a2f2e',
    errorLight: 'rgba(138, 47, 46, 0.10)',
    errorMuted: 'rgba(138, 47, 46, 0.06)',
    warning: '#b8860b',
    warningLight: 'rgba(184, 134, 11, 0.10)',
    warningMuted: 'rgba(184, 134, 11, 0.06)',

    // Neutrals
    background: '#ffffff',
    surface: '#ffffff',
    surfaceElevated: '#ffffff',
    card: '#faf7f8',
    border: 'rgba(109, 0, 63, 0.08)',
    borderLight: 'rgba(109, 0, 63, 0.05)',

    // Text
    text: '#1a1a1a',
    textSecondary: '#4a4a4a',
    textTertiary: '#8a8a8a',
    textInverse: '#ffffff',

    // Overlay / Glass
    overlay: 'rgba(26, 26, 26, 0.8)',
    glass: 'rgba(255, 255, 255, 0.95)',
    glassBorder: 'rgba(109, 0, 63, 0.06)',
    glassDark: 'rgba(26, 26, 26, 0.3)',
  },

  gradients: {
    primary: ['#a4546e', '#c78a9d'] as readonly string[],
    primaryToSecondary: ['#a4546e', '#c78a9d'] as readonly string[],
    hero: ['#ffffff', '#f7ccdb'] as readonly string[],
    splash: ['#6d003f', '#a4546e', '#f7ccdb'] as readonly string[],
    surface: ['#ffffff', '#faf7f8'] as readonly string[],
    sunset: ['#a4546e', '#f7ccdb'] as readonly string[],
    success: ['#4a8c6f', '#6aab8e'] as readonly string[],
    card: ['rgba(164, 84, 110, 0.04)', 'rgba(199, 138, 157, 0.02)'] as readonly string[],
    accent: ['#6d003f', '#a4546e'] as readonly string[],
    dark: ['#1a1a1a', '#2d2d2d'] as readonly string[],
    mesh: ['#6d003f', '#a4546e', '#c78a9d', '#f7ccdb'] as readonly string[],
  },

  typography: {
    display: {
      fontFamily: 'Inter_800ExtraBold',
      fontSize: 56,
      fontWeight: '800' as const,
      letterSpacing: -2,
      lineHeight: 64,
    },
    hero: {
      fontFamily: 'Inter_800ExtraBold',
      fontSize: 48,
      fontWeight: '800' as const,
      letterSpacing: -1.5,
      lineHeight: 56,
    },
    h1: {
      fontFamily: 'Inter_700Bold',
      fontSize: 40,
      fontWeight: '700' as const,
      letterSpacing: -1,
      lineHeight: 48,
    },
    h2: {
      fontFamily: 'Inter_700Bold',
      fontSize: 32,
      fontWeight: '700' as const,
      letterSpacing: -0.5,
      lineHeight: 40,
    },
    h3: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 24,
      fontWeight: '600' as const,
      letterSpacing: -0.3,
      lineHeight: 32,
    },
    h4: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 20,
      fontWeight: '600' as const,
      letterSpacing: -0.2,
      lineHeight: 28,
    },
    bodyLarge: {
      fontFamily: 'DMSans_400Regular',
      fontSize: 20,
      fontWeight: '400' as const,
      letterSpacing: 0,
      lineHeight: 32,
    },
    body: {
      fontFamily: 'DMSans_400Regular',
      fontSize: 16,
      fontWeight: '400' as const,
      letterSpacing: 0,
      lineHeight: 26,
    },
    bodyMedium: {
      fontFamily: 'DMSans_500Medium',
      fontSize: 16,
      fontWeight: '500' as const,
      letterSpacing: 0,
      lineHeight: 26,
    },
    bodySm: {
      fontFamily: 'DMSans_400Regular',
      fontSize: 14,
      fontWeight: '400' as const,
      letterSpacing: 0,
      lineHeight: 22,
    },
    bodySmMedium: {
      fontFamily: 'DMSans_500Medium',
      fontSize: 14,
      fontWeight: '500' as const,
      letterSpacing: 0,
      lineHeight: 22,
    },
    caption: {
      fontFamily: 'Inter_500Medium',
      fontSize: 12,
      fontWeight: '500' as const,
      letterSpacing: 1,
      textTransform: 'uppercase' as const,
    },
    button: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 16,
      fontWeight: '600' as const,
      letterSpacing: 0.3,
    },
    buttonLg: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 18,
      fontWeight: '600' as const,
      letterSpacing: 0.3,
    },
    label: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 11,
      fontWeight: '600' as const,
      letterSpacing: 1,
      textTransform: 'uppercase' as const,
    },
  },

  spacing: {
    xs: 8,
    sm: 16,
    md: 24,
    lg: 40,
    xl: 64,
    '2xl': 96,
    '3xl': 128,
    '4xl': 160,
    '5xl': 192,
    screen: 24,
  },

  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    full: 9999,
  },

  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.10,
      shadowRadius: 16,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.14,
      shadowRadius: 24,
      elevation: 8,
    },
    glow: (color: string) => ({
      shadowColor: color,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
    }),
    colored: (color: string) => ({
      shadowColor: color,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 8,
    }),
  },

  animation: {
    spring: { damping: 15, stiffness: 150 },
    springBouncy: { damping: 12, stiffness: 180 },
    springGentle: { damping: 20, stiffness: 120 },
    duration: {
      fast: 200,
      normal: 300,
      slow: 500,
      entrance: 600,
    },
    stagger: 80,
  },
} as const;

export type Theme = typeof theme;
export default theme;
