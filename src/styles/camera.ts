import { StyleSheet, Dimensions } from 'react-native';
import Colors from '../constants/colors';

const { width, height } = Dimensions.get('window');

/**
 * Camera overlay and UI styles
 */
export const cameraStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  // Full screen camera
  camera: {
    flex: 1,
  },

  // Overlay container (sits on top of camera)
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },

  // Top bar with back button, timer, flip camera
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },

  // Bottom bar with session controls
  bottomBar: {
    paddingHorizontal: 20,
    paddingBottom: 50,
    paddingTop: 20,
  },

  // Glassmorphism button base
  glassButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  // Circle button (back, flip)
  circleButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },

  circleButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
  },

  // Timer display
  timerContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },

  timerText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },

  scoreText: {
    color: Colors.success,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },

  // Session status indicator
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'center',
    marginBottom: 16,
  },

  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },

  statusDotActive: {
    backgroundColor: Colors.success,
  },

  statusDotInactive: {
    backgroundColor: Colors.textMuted,
  },

  statusText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },

  // Start session button
  startButton: {
    backgroundColor: Colors.primary,
    borderRadius: 30,
    paddingVertical: 18,
    paddingHorizontal: 48,
    alignItems: 'center',
    alignSelf: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },

  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },

  // End session button
  endButton: {
    backgroundColor: Colors.secondary,
    borderRadius: 30,
    paddingVertical: 18,
    paddingHorizontal: 48,
    alignItems: 'center',
    alignSelf: 'center',
  },

  endButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },

  // FPS counter (for debugging)
  fpsCounter: {
    position: 'absolute',
    top: 120,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },

  fpsText: {
    color: Colors.success,
    fontSize: 12,
    fontFamily: 'monospace',
  },

  // Permission denied view
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 40,
  },

  permissionIcon: {
    fontSize: 64,
    marginBottom: 24,
  },

  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },

  permissionText: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },

  permissionButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginBottom: 16,
  },

  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  permissionSecondaryButton: {
    paddingVertical: 12,
  },

  permissionSecondaryButtonText: {
    color: Colors.primary,
    fontSize: 16,
  },

  // Loading state
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },

  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
  },
});

/**
 * Camera setup screen styles
 */
export const setupStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },

  backButtonText: {
    fontSize: 20,
    color: Colors.text,
  },

  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginRight: 40, // Balance the back button
  },

  // Camera preview section
  previewSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
  },

  previewContainer: {
    width: width - 80,
    height: (width - 80) * 1.2,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
  },

  previewCamera: {
    flex: 1,
  },

  // Body outline overlay
  bodyOutline: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },

  bodyOutlineSvg: {
    width: '60%',
    height: '80%',
    opacity: 0.5,
  },

  // Checklist section
  checklistSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },

  checklistTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },

  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },

  checklistItemActive: {
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    borderWidth: 1,
    borderColor: Colors.primary,
  },

  checklistIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  checklistIconSuccess: {
    backgroundColor: Colors.success,
  },

  checklistIconPending: {
    backgroundColor: Colors.textMuted,
  },

  checklistIconText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },

  checklistText: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },

  checklistTextPending: {
    color: Colors.textMuted,
  },

  // Tips section
  tipsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },

  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textLight,
    marginBottom: 12,
  },

  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  tipIcon: {
    marginRight: 8,
    fontSize: 16,
  },

  tipText: {
    fontSize: 14,
    color: Colors.textLight,
    flex: 1,
  },

  // Continue button
  continueButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    marginHorizontal: 20,
    alignItems: 'center',
    marginBottom: 40,
  },

  continueButtonDisabled: {
    backgroundColor: Colors.textMuted,
  },

  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default cameraStyles;
