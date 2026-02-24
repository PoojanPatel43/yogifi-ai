import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, G } from 'react-native-svg';

// ---------------------------------------------------------------------------
// BlazePose 33-landmark skeleton connections
// ---------------------------------------------------------------------------
const POSE_CONNECTIONS: [number, number][] = [
  // Arms
  [11, 13], [13, 15],  // left arm
  [12, 14], [14, 16],  // right arm
  // Torso
  [11, 12], [11, 23], [12, 24], [23, 24],
  // Left leg
  [23, 25], [25, 27], [27, 29], [27, 31], [29, 31],
  // Right leg
  [24, 26], [26, 28], [28, 30], [28, 32], [30, 32],
  // Hands
  [15, 17], [15, 19], [15, 21], [17, 19],
  [16, 18], [16, 20], [16, 22], [18, 20],
  // Face
  [0, 1], [1, 2], [2, 3], [3, 7],
  [0, 4], [4, 5], [5, 6], [6, 8],
  [9, 10],
];

// Key body landmark indices (must be visible for full-body check)
export const BODY_LANDMARK_INDICES = [11, 12, 23, 24, 25, 26, 27, 28];

// ---------------------------------------------------------------------------
// Joint → landmark index mapping (for coloring joints based on corrections)
// ---------------------------------------------------------------------------
const JOINT_TO_LANDMARKS: Record<string, number[]> = {
  left_elbow_angle:     [13],
  right_elbow_angle:    [14],
  left_shoulder_angle:  [11],
  right_shoulder_angle: [12],
  left_knee_angle:      [25],
  right_knee_angle:     [26],
  left_hip_angle:       [23],
  right_hip_angle:      [24],
  left_ankle_angle:     [27],
  right_ankle_angle:    [28],
  spine_angle:          [23, 24],
  torso_lean:           [11, 23],
};

const SEVERITY_COLORS = {
  major:    '#FF4444',
  moderate: '#FF8C00',
  minor:    '#FFD700',
} as const;

const COLOR_CORRECT  = '#00E676';  // green
const COLOR_SKELETON = 'rgba(255, 255, 255, 0.65)';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface BlazePoseKeypoint {
  x: number;         // normalized 0–1
  y: number;         // normalized 0–1
  visibility: number; // 0–1
}

export interface PoseCorrection {
  joint: string;
  severity: 'minor' | 'moderate' | 'major';
  instruction: string;
  current_angle?: number;
  target_angle?: number;
  deviation?: number;
}

interface PoseSkeletonProps {
  keypoints: BlazePoseKeypoint[];
  corrections: PoseCorrection[];
  screenWidth: number;
  screenHeight: number;
  /** Minimum visibility threshold to draw a landmark (default 0.4) */
  minVisibility?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getLandmarkColor(index: number, corrections: PoseCorrection[]): string {
  for (const correction of corrections) {
    const landmarks = JOINT_TO_LANDMARKS[correction.joint] ?? [];
    if (landmarks.includes(index)) {
      return SEVERITY_COLORS[correction.severity] ?? COLOR_CORRECT;
    }
  }
  return COLOR_CORRECT;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const PoseSkeleton: React.FC<PoseSkeletonProps> = ({
  keypoints,
  corrections,
  screenWidth,
  screenHeight,
  minVisibility = 0.4,
}) => {
  if (!keypoints || keypoints.length < 33) return null;

  const px = (kp: BlazePoseKeypoint) => ({
    x: kp.x * screenWidth,
    y: kp.y * screenHeight,
  });

  return (
    <Svg
      width={screenWidth}
      height={screenHeight}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    >
      <G>
        {/* Bone connections */}
        {POSE_CONNECTIONS.map(([a, b], i) => {
          const kpA = keypoints[a];
          const kpB = keypoints[b];
          if (!kpA || !kpB) return null;
          if (kpA.visibility < minVisibility || kpB.visibility < minVisibility) return null;
          const pA = px(kpA);
          const pB = px(kpB);
          return (
            <Line
              key={`bone-${i}`}
              x1={pA.x}
              y1={pA.y}
              x2={pB.x}
              y2={pB.y}
              stroke={COLOR_SKELETON}
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          );
        })}

        {/* Landmark dots */}
        {keypoints.map((kp, i) => {
          if (kp.visibility < minVisibility) return null;
          const p = px(kp);
          const color = getLandmarkColor(i, corrections);
          const isBodyJoint = BODY_LANDMARK_INDICES.includes(i);
          return (
            <Circle
              key={`kp-${i}`}
              cx={p.x}
              cy={p.y}
              r={isBodyJoint ? 7 : 4}
              fill={color}
              stroke="rgba(0,0,0,0.5)"
              strokeWidth={1.5}
            />
          );
        })}
      </G>
    </Svg>
  );
};

export default PoseSkeleton;
