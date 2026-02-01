import { useWindowDimensions } from 'react-native';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
} as const;

export const useBreakpoint = (): Breakpoint => {
  const { width } = useWindowDimensions();

  if (width >= BREAKPOINTS.desktop) return 'desktop';
  if (width >= BREAKPOINTS.tablet) return 'tablet';
  return 'mobile';
};

export const useResponsiveColumns = (): number => {
  const breakpoint = useBreakpoint();
  switch (breakpoint) {
    case 'desktop': return 3;
    case 'tablet': return 2;
    default: return 1;
  }
};
