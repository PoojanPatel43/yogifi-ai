import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, Line, G } from 'react-native-svg';
import { Keypoint } from '../types';
import { KEYPOINT_CONNECTIONS, KeypointName } from '../services/poseDetector';
import Colors from '../constants/colors';

interface SkeletonOverlayProps {
  keypoints: Keypoint[];
  width: number;
  height: number;
  mirrored?: boolean;
  minConfidence?: number;
  highlightedJoints?: string[];
}

const KEYPOINT_RADIUS = 6;
const LINE_WIDTH = 3;
const MIN_CONFIDENCE_DEFAULT = 0.3;

// Colors for different body parts
const getKeypointColor = (name: string, highlighted: boolean): string => {
  if (highlighted) {
    return Colors.warning;
  }

  // Face keypoints
  if (['nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear'].includes(name)) {
    return Colors.primary;
  }

  // Arm keypoints
  if (['left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow', 'left_wrist', 'right_wrist'].includes(name)) {
    return Colors.success;
  }

  // Leg keypoints
  if (['left_hip', 'right_hip', 'left_knee', 'right_knee', 'left_ankle', 'right_ankle'].includes(name)) {
    return Colors.secondary;
  }

  return Colors.primary;
};

const getLineColor = (point1: string, point2: string): string => {
  // Arm connections
  if (['left_shoulder', 'left_elbow', 'left_wrist', 'right_shoulder', 'right_elbow', 'right_wrist'].includes(point1) &&
      ['left_shoulder', 'left_elbow', 'left_wrist', 'right_shoulder', 'right_elbow', 'right_wrist'].includes(point2)) {
    return Colors.success;
  }

  // Leg connections
  if (['left_hip', 'left_knee', 'left_ankle', 'right_hip', 'right_knee', 'right_ankle'].includes(point1) &&
      ['left_hip', 'left_knee', 'left_ankle', 'right_hip', 'right_knee', 'right_ankle'].includes(point2)) {
    return Colors.secondary;
  }

  // Torso connections
  return Colors.primary;
};

const SkeletonOverlay: React.FC<SkeletonOverlayProps> = ({
  keypoints,
  width,
  height,
  mirrored = true,
  minConfidence = MIN_CONFIDENCE_DEFAULT,
  highlightedJoints = [],
}) => {
  // Create a map of keypoints for quick lookup
  const keypointMap = useMemo(() => {
    const map = new Map<string, Keypoint>();
    keypoints.forEach(kp => {
      if (kp.confidence >= minConfidence) {
        map.set(kp.name, kp);
      }
    });
    return map;
  }, [keypoints, minConfidence]);

  // Transform coordinates from normalized [0,1] to screen coordinates
  const transformPoint = (kp: Keypoint): { x: number; y: number } => {
    let x = kp.x * width;
    const y = kp.y * height;

    // Mirror x coordinate for front-facing camera
    if (mirrored) {
      x = width - x;
    }

    return { x, y };
  };

  // Render connections (lines between keypoints)
  const renderConnections = () => {
    return KEYPOINT_CONNECTIONS.map(([start, end], index) => {
      const startKp = keypointMap.get(start);
      const endKp = keypointMap.get(end);

      if (!startKp || !endKp) {
        return null;
      }

      const startPoint = transformPoint(startKp);
      const endPoint = transformPoint(endKp);
      const color = getLineColor(start, end);

      return (
        <Line
          key={`line-${index}`}
          x1={startPoint.x}
          y1={startPoint.y}
          x2={endPoint.x}
          y2={endPoint.y}
          stroke={color}
          strokeWidth={LINE_WIDTH}
          strokeLinecap="round"
          opacity={0.8}
        />
      );
    });
  };

  // Render keypoints (circles)
  const renderKeypoints = () => {
    return Array.from(keypointMap.entries()).map(([name, kp]) => {
      const point = transformPoint(kp);
      const isHighlighted = highlightedJoints.includes(name);
      const color = getKeypointColor(name, isHighlighted);
      const radius = isHighlighted ? KEYPOINT_RADIUS * 1.5 : KEYPOINT_RADIUS;

      return (
        <G key={`point-${name}`}>
          {/* Outer glow for highlighted points */}
          {isHighlighted && (
            <Circle
              cx={point.x}
              cy={point.y}
              r={radius + 4}
              fill={color}
              opacity={0.3}
            />
          )}
          {/* Main point */}
          <Circle
            cx={point.x}
            cy={point.y}
            r={radius}
            fill={color}
            stroke="#FFFFFF"
            strokeWidth={2}
          />
        </G>
      );
    });
  };

  if (keypoints.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, { width, height }]} pointerEvents="none">
      <Svg width={width} height={height}>
        {renderConnections()}
        {renderKeypoints()}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});

export default SkeletonOverlay;
