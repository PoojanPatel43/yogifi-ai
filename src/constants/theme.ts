// Yogifi AI Premium Wellness Platform — Theme System
// Future.co-inspired design tokens

export const theme = {
  colors: {
    // Primary - Lavender
    primary: '#c9c1ea',
    primaryLight: '#ddd4f3',
    primaryDark: '#b0a6d6',
    primaryMuted: 'rgba(201, 193, 234, 0.15)',
    primaryGlow: 'rgba(201, 193, 234, 0.3)',

    // Secondary - Sky Blue
    secondary: '#aac7e2',
    secondaryLight: '#c5dbed',
    secondaryDark: '#8cb3d4',
    secondaryMuted: 'rgba(170, 199, 226, 0.15)',

    // Accent - Peach (high-energy CTA)
    accent: '#ffcdc1',
    accentLight: '#ffe0d8',
    accentMuted: 'rgba(255, 205, 193, 0.15)',

    // Semantic
    success: '#aac7e2',
    successLight: '#c5dbed',
    successMuted: 'rgba(170, 199, 226, 0.15)',
    error: '#f1bfd5',
    errorLight: '#f8dce8',
    errorMuted: 'rgba(241, 191, 213, 0.15)',
    warning: '#f1bfd5',
    warningLight: '#f8dce8',
    warningMuted: 'rgba(241, 191, 213, 0.15)',

    // Neutrals - White background (Future.co style)
    background: '#ffffff',
    surface: '#ffffff',
    surfaceElevated: '#ffffff',
    card: '#fafafa',
    border: 'rgba(0, 0, 0, 0.08)',
    borderLight: 'rgba(0, 0, 0, 0.05)',

    // Text - Black (Future.co style)
    text: '#0a0a0a',
    textSecondary: '#2d2d2d',
    textTertiary: '#6b6b6b',
    textInverse: '#ffffff',

    // Overlay / Glass
    overlay: 'rgba(10, 10, 10, 0.8)',
    glass: 'rgba(255, 255, 255, 0.95)',
    glassBorder: 'rgba(0, 0, 0, 0.06)',
    glassDark: 'rgba(10, 10, 10, 0.3)',
  },

  gradients: {
    primary: ['#c9c1ea', '#aac7e2'] as readonly string[],
    primaryToSecondary: ['#c9c1ea', '#aac7e2'] as readonly string[],
    hero: ['#ffffff', '#ece4c1'] as readonly string[],
    splash: ['#c9c1ea', '#aac7e2', '#ece4c1'] as readonly string[],
    surface: ['#ffffff', '#fafafa'] as readonly string[],
    sunset: ['#ffcdc1', '#f1bfd5'] as readonly string[],
    success: ['#aac7e2', '#c9c1ea'] as readonly string[],
    card: ['rgba(201, 193, 234, 0.06)', 'rgba(170, 199, 226, 0.03)'] as readonly string[],
    accent: ['#ffcdc1', '#f1bfd5'] as readonly string[],
    dark: ['#0a0a0a', '#2d2d2d'] as readonly string[],
    mesh: ['#c9c1ea', '#aac7e2', '#f1bfd5', '#ece4c1'] as readonly string[],
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
