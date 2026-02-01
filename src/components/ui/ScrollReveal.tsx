import React from 'react';
import * as Animatable from 'react-native-animatable';
import { ViewStyle } from 'react-native';

interface ScrollRevealProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  animation?: string;
  style?: ViewStyle;
}

const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  delay = 0,
  duration = 600,
  animation = 'fadeInUp',
  style,
}) => (
  <Animatable.View
    animation={animation}
    delay={delay}
    duration={duration}
    useNativeDriver
    style={style}
  >
    {children}
  </Animatable.View>
);

export default ScrollReveal;
