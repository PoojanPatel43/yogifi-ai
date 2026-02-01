// Yogifi AI Color Palette
// Backward compatibility layer - re-exports from theme.ts
// New code should import { theme } from './theme' directly
import { theme } from './theme';

export const Colors = {
  primary: theme.colors.primary,
  primaryLight: theme.colors.primaryMuted,
  secondary: theme.colors.accent,
  secondaryLight: theme.colors.accentMuted,
  background: theme.colors.surface,
  text: theme.colors.text,
  textLight: theme.colors.textSecondary,
  textMuted: theme.colors.textTertiary,
  border: theme.colors.border,
  success: theme.colors.success,
  successLight: theme.colors.successLight,
  error: theme.colors.error,
  errorLight: theme.colors.errorLight,
  warning: theme.colors.warning,
  warningLight: theme.colors.warningLight,
  cardBackground: theme.colors.card,
  overlay: theme.colors.overlay,
};

export default Colors;
