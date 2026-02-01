import React, { useState, useRef, useEffect } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

interface AnimatedInputProps extends TextInputProps {
  icon?: string;
  label: string;
  error?: boolean;
  errorMessage?: string;
  isPassword?: boolean;
}

const AnimatedInput: React.FC<AnimatedInputProps> = ({
  icon,
  label,
  error = false,
  errorMessage,
  isPassword = false,
  value,
  onChangeText,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    if (value && labelAnim) {
      Animated.timing(labelAnim, {
        toValue: 1,
        duration: 0,
        useNativeDriver: true,
      }).start();
    }
  }, []);

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(labelAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (!value) {
      Animated.timing(labelAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  const labelTranslateY = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -24],
  });

  const labelScale = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.85],
  });

  const labelOpacity = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  const borderColor = error
    ? theme.colors.error
    : isFocused
    ? theme.colors.primary
    : theme.colors.border;

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.container,
          {
            borderColor,
            borderWidth: isFocused ? 1.5 : 1,
          },
        ]}
      >
        {icon && (
          <View style={styles.iconContainer}>
            <Ionicons
              name={icon as any}
              size={20}
              color={isFocused ? theme.colors.primary : theme.colors.textTertiary}
            />
          </View>
        )}
        <View style={styles.inputWrapper}>
          <Animated.Text
            style={[
              styles.label,
              {
                transform: [
                  { translateY: labelTranslateY },
                  { scale: labelScale },
                ],
                opacity: labelOpacity,
              },
            ]}
          >
            {label}
          </Animated.Text>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            secureTextEntry={isPassword && !showPassword}
            placeholderTextColor="transparent"
            {...rest}
          />
        </View>
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={theme.colors.textTertiary}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && errorMessage && (
        <Text style={styles.errorText}>{errorMessage}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: theme.spacing.lg,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.lg,
    minHeight: 56,
  },
  iconContainer: {
    marginRight: theme.spacing.md,
  },
  inputWrapper: {
    flex: 1,
    justifyContent: 'center',
    height: 56,
  },
  label: {
    position: 'absolute',
    left: 0,
    top: 18,
    fontSize: 16,
    color: theme.colors.textTertiary,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    paddingTop: 8,
  },
  eyeButton: {
    padding: theme.spacing.sm,
    marginLeft: theme.spacing.sm,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 12,
    marginTop: theme.spacing.xs,
    marginLeft: theme.spacing.lg,
  },
});

export default AnimatedInput;
