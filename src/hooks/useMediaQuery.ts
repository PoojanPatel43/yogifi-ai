import { useWindowDimensions } from 'react-native';

export const useMediaQuery = () => {
  const { width } = useWindowDimensions();

  return {
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024 && width < 1440,
    isLargeDesktop: width >= 1440,
  };
};
