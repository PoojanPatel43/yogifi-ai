import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { theme } from '../../constants/theme';

interface ShimmerLoaderProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

const ShimmerLoader: React.FC<ShimmerLoaderProps> = ({
  width,
  height,
  borderRadius = theme.radius.md,
  style,
}) => {
  return (
    <Animatable.View
      animation="pulse"
      iterationCount="infinite"
      duration={1200}
      style={[
        styles.container,
        {
          width: width as any,
          height,
          borderRadius,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    overflow: 'hidden',
  },
});

export default ShimmerLoader;
