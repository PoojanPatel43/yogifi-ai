export const STAGGER_DELAY = 80;

export const getStaggerDelay = (index: number): number => index * STAGGER_DELAY;

export const enterFromToAnimation = (
  enterFrom: 'bottom' | 'left' | 'right' | 'scale'
): string => {
  switch (enterFrom) {
    case 'bottom':
      return 'fadeInUp';
    case 'left':
      return 'fadeInLeft';
    case 'right':
      return 'fadeInRight';
    case 'scale':
      return 'zoomIn';
    default:
      return 'fadeIn';
  }
};

export const ANIMATION_DURATION = {
  fast: 200,
  normal: 400,
  slow: 600,
  entrance: 600,
};
