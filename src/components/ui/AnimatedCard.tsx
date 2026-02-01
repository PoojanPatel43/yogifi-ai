import React from 'react';
import { ViewStyle } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { enterFromToAnimation, getStaggerDelay, ANIMATION_DURATION } from '../../utils/animations';

interface AnimatedCardProps {
  children: React.ReactNode;
  index?: number;
  style?: ViewStyle;
  delay?: number;
  enterFrom?: 'bottom' | 'left' | 'right' | 'scale';
  distance?: number;
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  index = 0,
  style,
  delay,
  enterFrom = 'bottom',
}) => {
  const animationName = enterFromToAnimation(enterFrom);
  const totalDelay = delay ?? getStaggerDelay(index);

  return (
    <Animatable.View
      animation={animationName}
      duration={ANIMATION_DURATION.entrance}
      delay={totalDelay}
      useNativeDriver
      style={style}
    >
      {children}
    </Animatable.View>
  );
};

export default AnimatedCard;
