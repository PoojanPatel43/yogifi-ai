// Yogifi AI Wellness Theme System
// Single source of truth for all design tokens

export const theme = {
  colors: {
    // Primary - Lavender
    primary: '#cfc8e9',
    primaryLight: '#ddd8f0',
    primaryDark: '#b8afd9',
    primaryMuted: 'rgba(207, 200, 233, 0.2)',
    primaryGlow: 'rgba(207, 200, 233, 0.35)',

    // Secondary - Sky Blue
    secondary: '#d3e6ed',
    secondaryLight: '#e1eef3',
    secondaryDark: '#b8d4e0',
    secondaryMuted: 'rgba(211, 230, 237, 0.2)',

    // Accent - Taupe
    accent: '#d4bdae',
    accentLight: '#e2d2c7',
    accentMuted: 'rgba(212, 189, 174, 0.2)',

    // Semantic
    success: '#caddbc',
    successLight: '#e0ecd4',
    successMuted: 'rgba(202, 221, 188, 0.2)',
    error: '#e8a19c',
    errorLight: '#f5d5d3',
    errorMuted: 'rgba(232, 161, 156, 0.2)',
    warning: '#d4bdae',
    warningLight: '#e8dbd2',
    warningMuted: 'rgba(212, 189, 174, 0.2)',

    // Neutrals
    background: '#f4ece0',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    card: '#faf7f2',
    border: '#e0d5c8',
    borderLight: '#ede6dc',

    // Text
    text: '#2d2a32',
    textSecondary: '#5c5662',
    textTertiary: '#8a8490',
    textInverse: '#FFFFFF',

    // Overlay / Glass
    overlay: 'rgba(0, 0, 0, 0.5)',
    glass: 'rgba(255, 255, 255, 0.75)',
    glassBorder: 'rgba(255, 255, 255, 0.3)',
    glassDark: 'rgba(0, 0, 0, 0.3)',
  },

  gradients: {
    primary: ['#cfc8e9', '#b8afd9'] as readonly string[],
    primaryToSecondary: ['#cfc8e9', '#d3e6ed'] as readonly string[],
    hero: ['#cfc8e9', '#d3e6ed', '#caddbc'] as readonly string[],
    splash: ['#cfc8e9', '#d3e6ed', '#f4ece0'] as readonly string[],
    surface: ['#FFFFFF', '#faf7f2'] as readonly string[],
    sunset: ['#d4bdae', '#e8a19c'] as readonly string[],
    success: ['#caddbc', '#d3e6ed'] as readonly string[],
    card: ['rgba(207, 200, 233, 0.1)', 'rgba(211, 230, 237, 0.06)'] as readonly string[],
  },

  typography: {
    hero: { fontSize: 40, fontWeight: '800' as const, letterSpacing: -1.5 },
    h1: { fontSize: 32, fontWeight: '700' as const, letterSpacing: -1 },
    h2: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.5 },
    h3: { fontSize: 20, fontWeight: '600' as const, letterSpacing: -0.3 },
    body: { fontSize: 16, fontWeight: '400' as const, letterSpacing: 0 },
    bodyMedium: { fontSize: 16, fontWeight: '500' as const, letterSpacing: 0 },
    bodySm: { fontSize: 14, fontWeight: '400' as const, letterSpacing: 0 },
    bodySmMedium: { fontSize: 14, fontWeight: '500' as const, letterSpacing: 0 },
    caption: { fontSize: 12, fontWeight: '500' as const, letterSpacing: 0.2 },
    button: { fontSize: 16, fontWeight: '600' as const, letterSpacing: 0.3 },
    buttonLg: { fontSize: 18, fontWeight: '600' as const, letterSpacing: 0.3 },
    label: {
      fontSize: 11,
      fontWeight: '600' as const,
      letterSpacing: 0.5,
      textTransform: 'uppercase' as const,
    },
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
    '5xl': 48,
    screen: 20,
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
      shadowColor: '#2d2a32',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    md: {
      shadowColor: '#2d2a32',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    lg: {
      shadowColor: '#2d2a32',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
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
