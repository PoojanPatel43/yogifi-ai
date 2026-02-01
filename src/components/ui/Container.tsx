import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';

interface ContainerProps {
  children: React.ReactNode;
  maxWidth?: number;
  style?: ViewStyle;
}

const Container: React.FC<ContainerProps> = ({
  children,
  maxWidth = 1200,
  style,
}) => (
  <View style={[styles.container, { maxWidth }, style]}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginHorizontal: 'auto',
    paddingHorizontal: theme.spacing.screen,
  },
});

export default Container;
