import { Keypoint } from '../types';
import { calculateAngle, calculateDistance, getMidpoint, KeypointName } from './poseDetector';

// Pose evaluation result
export interface PoseEvaluation {
  overallScore: number;
  alignmentScore: number;
  stabilityScore: number;
  feedback: PoseFeedback[];
  isCorrectPose: boolean;
}

export interface PoseFeedback {
  joint: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  correction?: string;
}

// Rule configuration for angle-based checks
interface AngleRule {
  joint: KeypointName;
  points: [KeypointName, KeypointName, KeypointName];
  targetAngle: number;
  tolerance: number;
  feedback: {
    tooSmall: string;
    tooLarge: string;
    correction: string;
  };
}

// Rule configuration for alignment checks
interface AlignmentRule {
  type: 'horizontal' | 'vertical' | 'line';
  points: KeypointName[];
  tolerance: number;
  feedback: string;
  correction: string;
}

// Pose definition with rules
interface PoseRuleSet {
  name: string;
  requiredKeypoints: KeypointName[];
  angleRules: AngleRule[];
  alignmentRules: AlignmentRule[];
  minConfidence: number;
}

// Helper to get keypoint by name
function getKeypoint(keypoints: Keypoint[], name: KeypointName): Keypoint | null {
  const kp = keypoints.find(k => k.name === name);
  return kp && kp.confidence > 0.3 ? kp : null;
}

// Warrior II Pose Rules
const warriorIIRules: PoseRuleSet = {
  name: 'Warrior II',
  requiredKeypoints: [
    'left_shoulder', 'right_shoulder',
    'left_elbow', 'right_elbow',
    'left_wrist', 'right_wrist',
    'left_hip', 'right_hip',
    'left_knee', 'right_knee',
    'left_ankle', 'right_ankle',
  ],
  angleRules: [
    {
      joint: 'left_knee',
      points: ['left_hip', 'left_knee', 'left_ankle'],
      targetAngle: 90,
      tolerance: 20,
      feedback: {
        tooSmall: 'Bend your front knee more',
        tooLarge: 'Don\'t let your front knee collapse inward',
        correction: 'Keep your front knee at 90 degrees, aligned over your ankle',
      },
    },
    {
      joint: 'right_knee',
      points: ['right_hip', 'right_knee', 'right_ankle'],
      targetAngle: 170,
      tolerance: 15,
      feedback: {
        tooSmall: 'Straighten your back leg more',
        tooLarge: 'Keep your back leg engaged',
        correction: 'Your back leg should be nearly straight',
      },
    },
    {
      joint: 'left_elbow',
      points: ['left_shoulder', 'left_elbow', 'left_wrist'],
      targetAngle: 170,
      tolerance: 15,
      feedback: {
        tooSmall: 'Straighten your front arm',
        tooLarge: 'Keep arm extended',
        correction: 'Extend your front arm fully, parallel to the ground',
      },
    },
    {
      joint: 'right_elbow',
      points: ['right_shoulder', 'right_elbow', 'right_wrist'],
      targetAngle: 170,
      tolerance: 15,
      feedback: {
        tooSmall: 'Straighten your back arm',
        tooLarge: 'Keep arm extended',
        correction: 'Extend your back arm fully, parallel to the ground',
      },
    },
  ],
  alignmentRules: [
    {
      type: 'horizontal',
      points: ['left_shoulder', 'right_shoulder'],
      tolerance: 0.1,
      feedback: 'Keep your shoulders level',
      correction: 'Align your shoulders parallel to the ground',
    },
    {
      type: 'horizontal',
      points: ['left_wrist', 'right_wrist'],
      tolerance: 0.15,
      feedback: 'Keep your arms at the same height',
      correction: 'Extend both arms to the same level',
    },
    {
      type: 'horizontal',
      points: ['left_hip', 'right_hip'],
      tolerance: 0.1,
      feedback: 'Square your hips',
      correction: 'Keep your hips level and facing forward',
    },
  ],
  minConfidence: 0.4,
};

// Tree Pose Rules
const treePoseRules: PoseRuleSet = {
  name: 'Tree Pose',
  requiredKeypoints: [
    'left_shoulder', 'right_shoulder',
    'left_hip', 'right_hip',
    'left_knee', 'right_knee',
    'left_ankle', 'right_ankle',
  ],
  angleRules: [
    {
      joint: 'left_knee',
      points: ['left_hip', 'left_knee', 'left_ankle'],
      targetAngle: 170,
      tolerance: 15,
      feedback: {
        tooSmall: 'Straighten your standing leg',
        tooLarge: 'Don\'t hyperextend',
        correction: 'Keep your standing leg straight but not locked',
      },
    },
  ],
  alignmentRules: [
    {
      type: 'vertical',
      points: ['nose', 'left_hip', 'left_ankle'],
      tolerance: 0.15,
      feedback: 'Keep your body centered over your standing leg',
      correction: 'Stack your head over your hips and standing foot',
    },
  ],
  minConfidence: 0.4,
};

// Mountain Pose Rules
const mountainPoseRules: PoseRuleSet = {
  name: 'Mountain Pose',
  requiredKeypoints: [
    'left_shoulder', 'right_shoulder',
    'left_hip', 'right_hip',
    'left_ankle', 'right_ankle',
  ],
  angleRules: [],
  alignmentRules: [
    {
      type: 'vertical',
      points: ['nose', 'left_hip', 'left_ankle'],
      tolerance: 0.1,
      feedback: 'Stand tall and straight',
      correction: 'Align your head, spine, and feet in one line',
    },
    {
      type: 'horizontal',
      points: ['left_shoulder', 'right_shoulder'],
      tolerance: 0.08,
      feedback: 'Keep your shoulders level',
      correction: 'Relax and level your shoulders',
    },
  ],
  minConfidence: 0.4,
};

// Map pose IDs/names to rule sets
const poseRuleMap: Record<string, PoseRuleSet> = {
  'warrior-ii': warriorIIRules,
  'warrior_ii': warriorIIRules,
  'virabhadrasana_ii': warriorIIRules,
  'tree': treePoseRules,
  'tree_pose': treePoseRules,
  'vrksasana': treePoseRules,
  'mountain': mountainPoseRules,
  'mountain_pose': mountainPoseRules,
  'tadasana': mountainPoseRules,
};

// Default rules for unknown poses
const defaultRules: PoseRuleSet = {
  name: 'General Pose',
  requiredKeypoints: ['left_shoulder', 'right_shoulder', 'left_hip', 'right_hip'],
  angleRules: [],
  alignmentRules: [
    {
      type: 'horizontal',
      points: ['left_shoulder', 'right_shoulder'],
      tolerance: 0.15,
      feedback: 'Keep your shoulders balanced',
      correction: 'Try to keep your shoulders level',
    },
  ],
  minConfidence: 0.3,
};

// Evaluate pose against rules
export function evaluatePose(
  keypoints: Keypoint[],
  poseName: string,
  previousKeypoints?: Keypoint[]
): PoseEvaluation {
  // Get rules for this pose
  const normalizedName = poseName.toLowerCase().replace(/\s+/g, '_');
  const rules = poseRuleMap[normalizedName] || defaultRules;

  const feedback: PoseFeedback[] = [];
  let angleScoreSum = 0;
  let angleScoreCount = 0;
  let alignmentScoreSum = 0;
  let alignmentScoreCount = 0;

  // Check required keypoints are visible
  const visibleKeypoints = rules.requiredKeypoints.filter(name => {
    const kp = getKeypoint(keypoints, name);
    return kp !== null;
  });

  const keypointCoverage = visibleKeypoints.length / rules.requiredKeypoints.length;
  const isCorrectPose = keypointCoverage > 0.7;

  if (keypointCoverage < 0.5) {
    feedback.push({
      joint: 'body',
      message: 'Move so your full body is visible',
      severity: 'error',
      correction: 'Step back or adjust camera angle',
    });

    return {
      overallScore: 0,
      alignmentScore: 0,
      stabilityScore: 0,
      feedback,
      isCorrectPose: false,
    };
  }

  // Evaluate angle rules
  for (const rule of rules.angleRules) {
    const p1 = getKeypoint(keypoints, rule.points[0]);
    const p2 = getKeypoint(keypoints, rule.points[1]);
    const p3 = getKeypoint(keypoints, rule.points[2]);

    if (p1 && p2 && p3) {
      const angle = calculateAngle(p1, p2, p3);
      const deviation = Math.abs(angle - rule.targetAngle);
      const score = Math.max(0, 100 - (deviation / rule.tolerance) * 50);

      angleScoreSum += score;
      angleScoreCount++;

      if (deviation > rule.tolerance) {
        const isAngleTooSmall = angle < rule.targetAngle;
        feedback.push({
          joint: rule.joint,
          message: isAngleTooSmall ? rule.feedback.tooSmall : rule.feedback.tooLarge,
          severity: deviation > rule.tolerance * 2 ? 'error' : 'warning',
          correction: rule.feedback.correction,
        });
      }
    }
  }

  // Evaluate alignment rules
  for (const rule of rules.alignmentRules) {
    const points = rule.points.map(name => getKeypoint(keypoints, name)).filter(p => p !== null);

    if (points.length >= 2) {
      let alignmentScore = 100;

      if (rule.type === 'horizontal') {
        // Check if points are at the same Y level
        const yValues = points.map(p => p!.y);
        const yRange = Math.max(...yValues) - Math.min(...yValues);
        alignmentScore = Math.max(0, 100 - (yRange / rule.tolerance) * 50);
      } else if (rule.type === 'vertical') {
        // Check if points are at the same X level
        const xValues = points.map(p => p!.x);
        const xRange = Math.max(...xValues) - Math.min(...xValues);
        alignmentScore = Math.max(0, 100 - (xRange / rule.tolerance) * 50);
      }

      alignmentScoreSum += alignmentScore;
      alignmentScoreCount++;

      if (alignmentScore < 70) {
        feedback.push({
          joint: rule.points[0],
          message: rule.feedback,
          severity: alignmentScore < 40 ? 'error' : 'warning',
          correction: rule.correction,
        });
      }
    }
  }

  // Calculate stability score by comparing with previous keypoints
  let stabilityScore = 100;
  if (previousKeypoints && previousKeypoints.length > 0) {
    let totalMovement = 0;
    let movementCount = 0;

    for (const currentKp of keypoints) {
      const prevKp = previousKeypoints.find(p => p.name === currentKp.name);
      if (prevKp && currentKp.confidence > 0.3 && prevKp.confidence > 0.3) {
        const distance = calculateDistance(currentKp, prevKp);
        totalMovement += distance;
        movementCount++;
      }
    }

    if (movementCount > 0) {
      const avgMovement = totalMovement / movementCount;
      // Normalize: 0.01 movement = full stability, 0.1 movement = no stability
      stabilityScore = Math.max(0, 100 - avgMovement * 1000);
    }
  }

  // Calculate final scores
  const angleScore = angleScoreCount > 0 ? angleScoreSum / angleScoreCount : 100;
  const alignmentScore = alignmentScoreCount > 0 ? alignmentScoreSum / alignmentScoreCount : 100;

  // Overall score is weighted average
  const overallScore = Math.round(
    angleScore * 0.4 +
    alignmentScore * 0.35 +
    stabilityScore * 0.25
  );

  // Add positive feedback if doing well
  if (feedback.length === 0 && overallScore > 80) {
    feedback.push({
      joint: 'body',
      message: 'Great form! Hold the pose steady.',
      severity: 'info',
    });
  }

  return {
    overallScore,
    alignmentScore: Math.round(alignmentScore),
    stabilityScore: Math.round(stabilityScore),
    feedback,
    isCorrectPose,
  };
}

// Get pose-specific tips
export function getPoseTips(poseName: string): string[] {
  const normalizedName = poseName.toLowerCase().replace(/\s+/g, '_');

  const tips: Record<string, string[]> = {
    'warrior_ii': [
      'Keep your front knee bent at 90 degrees',
      'Extend arms parallel to the ground',
      'Gaze over your front fingertips',
      'Keep your hips open and facing the side',
    ],
    'tree_pose': [
      'Find a focal point to help with balance',
      'Press your foot into your thigh, not your knee',
      'Engage your core for stability',
      'Keep your standing leg straight',
    ],
    'mountain_pose': [
      'Stand with feet hip-width apart',
      'Distribute weight evenly on both feet',
      'Engage your thighs and core',
      'Relax your shoulders down and back',
    ],
  };

  return tips[normalizedName] || [
    'Focus on your breath',
    'Keep your core engaged',
    'Maintain steady balance',
  ];
}

export default evaluatePose;
