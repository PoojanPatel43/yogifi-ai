import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import Svg, { G, Circle, Line, Text as SvgText } from 'react-native-svg';
import Colors from '../constants/colors';

interface ReferencePoseOverlayProps {
  poseName: string;
  visible: boolean;
  opacity?: number;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Reference pose keypoints (normalized 0-1 coordinates)
// These represent the "ideal" position for each pose
const referencePoses: Record<string, { x: number; y: number; name: string }[]> = {
  'Warrior II': [
    // Head and torso
    { x: 0.5, y: 0.15, name: 'nose' },
    { x: 0.5, y: 0.22, name: 'neck' },
    { x: 0.5, y: 0.35, name: 'mid_spine' },
    { x: 0.5, y: 0.45, name: 'hip_center' },
    // Left side (front leg)
    { x: 0.35, y: 0.22, name: 'left_shoulder' },
    { x: 0.15, y: 0.22, name: 'left_elbow' },
    { x: 0.05, y: 0.22, name: 'left_wrist' },
    { x: 0.35, y: 0.45, name: 'left_hip' },
    { x: 0.25, y: 0.60, name: 'left_knee' },
    { x: 0.25, y: 0.85, name: 'left_ankle' },
    // Right side (back leg)
    { x: 0.65, y: 0.22, name: 'right_shoulder' },
    { x: 0.85, y: 0.22, name: 'right_elbow' },
    { x: 0.95, y: 0.22, name: 'right_wrist' },
    { x: 0.65, y: 0.45, name: 'right_hip' },
    { x: 0.75, y: 0.60, name: 'right_knee' },
    { x: 0.85, y: 0.85, name: 'right_ankle' },
  ],
  'Tree Pose': [
    // Head and torso
    { x: 0.5, y: 0.12, name: 'nose' },
    { x: 0.5, y: 0.18, name: 'neck' },
    { x: 0.5, y: 0.30, name: 'mid_spine' },
    { x: 0.5, y: 0.42, name: 'hip_center' },
    // Left side (raised leg)
    { x: 0.42, y: 0.18, name: 'left_shoulder' },
    { x: 0.42, y: 0.08, name: 'left_elbow' },
    { x: 0.48, y: 0.02, name: 'left_wrist' },
    { x: 0.45, y: 0.42, name: 'left_hip' },
    { x: 0.55, y: 0.55, name: 'left_knee' },
    { x: 0.55, y: 0.55, name: 'left_ankle' }, // Foot on inner thigh
    // Right side (standing leg)
    { x: 0.58, y: 0.18, name: 'right_shoulder' },
    { x: 0.58, y: 0.08, name: 'right_elbow' },
    { x: 0.52, y: 0.02, name: 'right_wrist' },
    { x: 0.55, y: 0.42, name: 'right_hip' },
    { x: 0.55, y: 0.62, name: 'right_knee' },
    { x: 0.55, y: 0.90, name: 'right_ankle' },
  ],
  'Mountain Pose': [
    // Head and torso
    { x: 0.5, y: 0.12, name: 'nose' },
    { x: 0.5, y: 0.18, name: 'neck' },
    { x: 0.5, y: 0.30, name: 'mid_spine' },
    { x: 0.5, y: 0.42, name: 'hip_center' },
    // Left side
    { x: 0.42, y: 0.18, name: 'left_shoulder' },
    { x: 0.40, y: 0.32, name: 'left_elbow' },
    { x: 0.38, y: 0.45, name: 'left_wrist' },
    { x: 0.45, y: 0.42, name: 'left_hip' },
    { x: 0.45, y: 0.62, name: 'left_knee' },
    { x: 0.45, y: 0.90, name: 'left_ankle' },
    // Right side
    { x: 0.58, y: 0.18, name: 'right_shoulder' },
    { x: 0.60, y: 0.32, name: 'right_elbow' },
    { x: 0.62, y: 0.45, name: 'right_wrist' },
    { x: 0.55, y: 0.42, name: 'right_hip' },
    { x: 0.55, y: 0.62, name: 'right_knee' },
    { x: 0.55, y: 0.90, name: 'right_ankle' },
  ],
};

// Skeleton connections for drawing lines
const skeletonConnections = [
  // Torso
  ['nose', 'neck'],
  ['neck', 'mid_spine'],
  ['mid_spine', 'hip_center'],
  // Left arm
  ['neck', 'left_shoulder'],
  ['left_shoulder', 'left_elbow'],
  ['left_elbow', 'left_wrist'],
  // Right arm
  ['neck', 'right_shoulder'],
  ['right_shoulder', 'right_elbow'],
  ['right_elbow', 'right_wrist'],
  // Left leg
  ['hip_center', 'left_hip'],
  ['left_hip', 'left_knee'],
  ['left_knee', 'left_ankle'],
  // Right leg
  ['hip_center', 'right_hip'],
  ['right_hip', 'right_knee'],
  ['right_knee', 'right_ankle'],
];

const ReferencePoseOverlay: React.FC<ReferencePoseOverlayProps> = ({
  poseName,
  visible,
  opacity = 0.4,
}) => {
  if (!visible) {
    return null;
  }

  const referenceKeypoints = referencePoses[poseName];

  if (!referenceKeypoints) {
    return null;
  }

  // Convert normalized coordinates to screen coordinates
  const scaledKeypoints = referenceKeypoints.map(kp => ({
    ...kp,
    screenX: kp.x * SCREEN_WIDTH,
    screenY: kp.y * SCREEN_HEIGHT,
  }));

  // Create a map for quick lookup
  const keypointMap = new Map(scaledKeypoints.map(kp => [kp.name, kp]));

  return (
    <View style={[styles.container, { opacity }]} pointerEvents="none">
      <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT}>
        {/* Draw skeleton lines */}
        <G>
          {skeletonConnections.map(([start, end], index) => {
            const startPoint = keypointMap.get(start);
            const endPoint = keypointMap.get(end);

            if (!startPoint || !endPoint) return null;

            return (
              <Line
                key={`line-${index}`}
                x1={startPoint.screenX}
                y1={startPoint.screenY}
                x2={endPoint.screenX}
                y2={endPoint.screenY}
                stroke={Colors.primary}
                strokeWidth={3}
                strokeLinecap="round"
                strokeDasharray="8,4"
              />
            );
          })}
        </G>

        {/* Draw keypoint circles */}
        <G>
          {scaledKeypoints.map((kp, index) => (
            <Circle
              key={`point-${index}`}
              cx={kp.screenX}
              cy={kp.screenY}
              r={8}
              fill={Colors.primary}
              stroke="#FFFFFF"
              strokeWidth={2}
            />
          ))}
        </G>

        {/* Label for reference */}
        <SvgText
          x={SCREEN_WIDTH / 2}
          y={40}
          fontSize={14}
          fontWeight="600"
          fill={Colors.primary}
          textAnchor="middle"
        >
          Reference Pose
        </SvgText>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
});

export default ReferencePoseOverlay;
