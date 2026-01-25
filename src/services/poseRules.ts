/**
 * Pose Rules Engine - Calibrated for accurate yoga pose detection
 *
 * This module evaluates yoga poses against anatomically correct rules
 * with configurable tolerances for green/yellow/red zones.
 */

import { Keypoint } from '../types';
import { calculateAngle, calculateDistance, KeypointName } from './poseDetector';

// ============ Types ============

export interface PoseEvaluation {
  overallScore: number;
  alignmentScore: number;
  stabilityScore: number;
  feedback: PoseFeedback[];
  isCorrectPose: boolean;
  phase: PosePhase;
  holdProgress: number; // 0-100, percentage of hold time completed
  debugInfo?: PoseDebugInfo;
}

export interface PoseFeedback {
  joint: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  correction?: string;
  currentValue?: number;
  targetValue?: number;
  priority: number; // 1 = highest priority (safety), 3 = lowest (fine-tuning)
}

export type PosePhase = 'setup' | 'adjustment' | 'hold' | 'complete';

export interface PoseDebugInfo {
  angleChecks: AngleCheckResult[];
  alignmentChecks: AlignmentCheckResult[];
  keypointConfidences: { name: string; confidence: number }[];
  phase: PosePhase;
  holdSeconds: number;
  scoreBreakdown: {
    angleScore: number;
    alignmentScore: number;
    stabilityScore: number;
    weights: { angle: number; alignment: number; stability: number };
  };
}

interface AngleCheckResult {
  name: string;
  joint: string;
  currentAngle: number;
  targetAngle: number;
  deviation: number;
  score: number;
  zone: 'green' | 'yellow' | 'red';
  passed: boolean;
}

interface AlignmentCheckResult {
  name: string;
  currentDiff: number;
  tolerance: number;
  score: number;
  zone: 'green' | 'yellow' | 'red';
  passed: boolean;
}

// ============ Rule Configurations ============

interface AngleRule {
  name: string;
  joint: KeypointName;
  points: [KeypointName, KeypointName, KeypointName];
  targetAngle: number;
  greenZone: number;   // ± degrees for perfect score
  yellowZone: number;  // ± degrees for acceptable
  weight: number;      // 0-1, importance
  priority: number;    // 1 = safety, 2 = major, 3 = fine-tuning
  feedback: {
    tooSmall: string;
    tooLarge: string;
    perfect: string;
  };
}

interface AlignmentRule {
  name: string;
  type: 'horizontal' | 'vertical' | 'distance';
  points: KeypointName[];
  tolerance: number;
  yellowTolerance: number;
  weight: number;
  priority: number;
  feedback: {
    issue: string;
    perfect: string;
  };
}

interface PositionRule {
  name: string;
  point1: KeypointName;
  point2: KeypointName;
  axis: 'x' | 'y';
  shouldBeGreater: boolean;
  tolerance: number;
  priority: number;
  feedback: string;
}

interface PoseRuleSet {
  name: string;
  sanskritName: string;
  requiredKeypoints: KeypointName[];
  angleRules: AngleRule[];
  alignmentRules: AlignmentRule[];
  positionRules: PositionRule[];
  minConfidence: number;
  holdDuration: number; // seconds required to hold
  phases: {
    setup: string[];
    adjustment: string[];
    hold: string[];
  };
}

// ============ Warrior II Rules (Calibrated) ============

const warriorIIRules: PoseRuleSet = {
  name: 'Warrior II',
  sanskritName: 'Virabhadrasana II',
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
      name: 'Front Knee Bend',
      joint: 'left_knee',
      points: ['left_hip', 'left_knee', 'left_ankle'],
      targetAngle: 90,
      greenZone: 10,    // 80-100° is perfect
      yellowZone: 20,   // 70-110° is acceptable
      weight: 0.25,
      priority: 1,      // Safety - knee alignment is critical
      feedback: {
        tooSmall: 'Bend your front knee more toward 90°',
        tooLarge: 'Your front knee is too bent, straighten slightly',
        perfect: 'Front knee angle is perfect!',
      },
    },
    {
      name: 'Back Leg Straight',
      joint: 'right_knee',
      points: ['right_hip', 'right_knee', 'right_ankle'],
      targetAngle: 175,
      greenZone: 10,    // 165-185° is perfect
      yellowZone: 20,   // 155-195° is acceptable
      weight: 0.2,
      priority: 2,
      feedback: {
        tooSmall: 'Straighten your back leg more',
        tooLarge: 'Back leg is hyperextended',
        perfect: 'Back leg is nicely straight!',
      },
    },
    {
      name: 'Front Arm Extended',
      joint: 'left_elbow',
      points: ['left_shoulder', 'left_elbow', 'left_wrist'],
      targetAngle: 175,
      greenZone: 10,
      yellowZone: 20,
      weight: 0.15,
      priority: 3,
      feedback: {
        tooSmall: 'Extend your front arm fully',
        tooLarge: 'Keep slight bend in elbow',
        perfect: 'Front arm beautifully extended!',
      },
    },
    {
      name: 'Back Arm Extended',
      joint: 'right_elbow',
      points: ['right_shoulder', 'right_elbow', 'right_wrist'],
      targetAngle: 175,
      greenZone: 10,
      yellowZone: 20,
      weight: 0.15,
      priority: 3,
      feedback: {
        tooSmall: 'Extend your back arm fully',
        tooLarge: 'Keep slight bend in elbow',
        perfect: 'Back arm beautifully extended!',
      },
    },
  ],
  alignmentRules: [
    {
      name: 'Shoulders Level',
      type: 'horizontal',
      points: ['left_shoulder', 'right_shoulder'],
      tolerance: 0.03,      // 3% of body height
      yellowTolerance: 0.06,
      weight: 0.1,
      priority: 2,
      feedback: {
        issue: 'Level your shoulders - one is higher',
        perfect: 'Shoulders are level!',
      },
    },
    {
      name: 'Arms Same Height',
      type: 'horizontal',
      points: ['left_wrist', 'right_wrist'],
      tolerance: 0.05,
      yellowTolerance: 0.1,
      weight: 0.08,
      priority: 3,
      feedback: {
        issue: 'Raise/lower arms to same height',
        perfect: 'Arms at perfect height!',
      },
    },
    {
      name: 'Hips Level',
      type: 'horizontal',
      points: ['left_hip', 'right_hip'],
      tolerance: 0.03,
      yellowTolerance: 0.06,
      weight: 0.12,
      priority: 2,
      feedback: {
        issue: 'Square your hips - keep them level',
        perfect: 'Hips are nicely squared!',
      },
    },
  ],
  positionRules: [
    {
      name: 'Knee Over Ankle',
      point1: 'left_knee',
      point2: 'left_ankle',
      axis: 'x',
      shouldBeGreater: false, // knee x should be close to ankle x
      tolerance: 0.08,
      priority: 1, // Safety
      feedback: 'Align your front knee directly over your ankle',
    },
  ],
  minConfidence: 0.4,
  holdDuration: 5, // 5 seconds to hold
  phases: {
    setup: [
      'Stand with feet 3-4 feet apart',
      'Turn your front foot out 90°',
      'Raise your arms to shoulder height',
    ],
    adjustment: [
      'Bend your front knee to 90°',
      'Keep your back leg straight',
      'Extend through your fingertips',
    ],
    hold: [
      'Gaze over your front hand',
      'Keep breathing steadily',
      'Hold this position',
    ],
  },
};

// ============ Tree Pose Rules ============

const treePoseRules: PoseRuleSet = {
  name: 'Tree Pose',
  sanskritName: 'Vrksasana',
  requiredKeypoints: [
    'nose', 'left_shoulder', 'right_shoulder',
    'left_hip', 'right_hip',
    'left_knee', 'right_knee',
    'left_ankle', 'right_ankle',
  ],
  angleRules: [
    {
      name: 'Standing Leg Straight',
      joint: 'left_knee',
      points: ['left_hip', 'left_knee', 'left_ankle'],
      targetAngle: 175,
      greenZone: 10,
      yellowZone: 15,
      weight: 0.35,
      priority: 1,
      feedback: {
        tooSmall: 'Straighten your standing leg',
        tooLarge: 'Avoid hyperextending your knee',
        perfect: 'Standing leg is perfectly straight!',
      },
    },
  ],
  alignmentRules: [
    {
      name: 'Body Vertical',
      type: 'vertical',
      points: ['nose', 'left_hip'],
      tolerance: 0.05,
      yellowTolerance: 0.1,
      weight: 0.3,
      priority: 1,
      feedback: {
        issue: 'Keep your body upright and centered',
        perfect: 'Body is beautifully balanced!',
      },
    },
    {
      name: 'Hips Level',
      type: 'horizontal',
      points: ['left_hip', 'right_hip'],
      tolerance: 0.04,
      yellowTolerance: 0.08,
      weight: 0.2,
      priority: 2,
      feedback: {
        issue: 'Level your hips',
        perfect: 'Hips are level!',
      },
    },
  ],
  positionRules: [],
  minConfidence: 0.4,
  holdDuration: 5,
  phases: {
    setup: [
      'Stand tall on both feet',
      'Shift weight to your standing leg',
      'Find a focal point ahead',
    ],
    adjustment: [
      'Place foot on inner thigh (not knee!)',
      'Press foot and thigh together',
      'Bring hands to heart or overhead',
    ],
    hold: [
      'Engage your core',
      'Keep breathing',
      'Focus on your balance point',
    ],
  },
};

// ============ Mountain Pose Rules ============

const mountainPoseRules: PoseRuleSet = {
  name: 'Mountain Pose',
  sanskritName: 'Tadasana',
  requiredKeypoints: [
    'nose', 'left_shoulder', 'right_shoulder',
    'left_hip', 'right_hip',
    'left_ankle', 'right_ankle',
  ],
  angleRules: [],
  alignmentRules: [
    {
      name: 'Body Vertical',
      type: 'vertical',
      points: ['nose', 'left_hip', 'left_ankle'],
      tolerance: 0.04,
      yellowTolerance: 0.08,
      weight: 0.4,
      priority: 1,
      feedback: {
        issue: 'Stand straight - align head over feet',
        perfect: 'Perfect vertical alignment!',
      },
    },
    {
      name: 'Shoulders Level',
      type: 'horizontal',
      points: ['left_shoulder', 'right_shoulder'],
      tolerance: 0.03,
      yellowTolerance: 0.05,
      weight: 0.3,
      priority: 2,
      feedback: {
        issue: 'Relax and level your shoulders',
        perfect: 'Shoulders beautifully relaxed!',
      },
    },
    {
      name: 'Hips Level',
      type: 'horizontal',
      points: ['left_hip', 'right_hip'],
      tolerance: 0.03,
      yellowTolerance: 0.05,
      weight: 0.3,
      priority: 2,
      feedback: {
        issue: 'Keep hips level',
        perfect: 'Hips are level!',
      },
    },
  ],
  positionRules: [],
  minConfidence: 0.4,
  holdDuration: 5,
  phases: {
    setup: [
      'Stand with feet together or hip-width',
      'Arms by your sides',
      'Weight even on both feet',
    ],
    adjustment: [
      'Lift through your crown',
      'Engage thighs slightly',
      'Relax shoulders down',
    ],
    hold: [
      'Breathe deeply',
      'Feel grounded through feet',
      'Maintain stillness',
    ],
  },
};

// ============ Pose Map ============

const poseRuleMap: Record<string, PoseRuleSet> = {
  'warrior ii': warriorIIRules,
  'warrior_ii': warriorIIRules,
  'virabhadrasana ii': warriorIIRules,
  'virabhadrasana_ii': warriorIIRules,
  'tree pose': treePoseRules,
  'tree': treePoseRules,
  'tree_pose': treePoseRules,
  'vrksasana': treePoseRules,
  'mountain pose': mountainPoseRules,
  'mountain': mountainPoseRules,
  'mountain_pose': mountainPoseRules,
  'tadasana': mountainPoseRules,
};

const defaultRules: PoseRuleSet = {
  name: 'General Pose',
  sanskritName: '',
  requiredKeypoints: ['left_shoulder', 'right_shoulder', 'left_hip', 'right_hip'],
  angleRules: [],
  alignmentRules: [
    {
      name: 'Shoulders Level',
      type: 'horizontal',
      points: ['left_shoulder', 'right_shoulder'],
      tolerance: 0.05,
      yellowTolerance: 0.1,
      weight: 0.5,
      priority: 2,
      feedback: {
        issue: 'Keep shoulders level',
        perfect: 'Good shoulder alignment!',
      },
    },
  ],
  positionRules: [],
  minConfidence: 0.3,
  holdDuration: 5,
  phases: {
    setup: ['Get into position'],
    adjustment: ['Adjust your form'],
    hold: ['Hold the pose'],
  },
};

// ============ Helper Functions ============

function getKeypoint(keypoints: Keypoint[], name: KeypointName): Keypoint | null {
  const kp = keypoints.find(k => k.name === name);
  return kp && kp.confidence > 0.3 ? kp : null;
}

function getZone(deviation: number, greenZone: number, yellowZone: number): 'green' | 'yellow' | 'red' {
  if (deviation <= greenZone) return 'green';
  if (deviation <= yellowZone) return 'yellow';
  return 'red';
}

function getScoreForZone(deviation: number, greenZone: number, yellowZone: number): number {
  if (deviation <= greenZone) {
    // Green zone: 85-100
    return 100 - (deviation / greenZone) * 15;
  } else if (deviation <= yellowZone) {
    // Yellow zone: 50-85
    const yellowProgress = (deviation - greenZone) / (yellowZone - greenZone);
    return 85 - yellowProgress * 35;
  } else {
    // Red zone: 0-50
    const redProgress = Math.min(1, (deviation - yellowZone) / yellowZone);
    return Math.max(0, 50 - redProgress * 50);
  }
}

// ============ State for Hold Detection ============

let holdStartTime: number | null = null;
let consecutiveGoodFrames = 0;
const FRAMES_FOR_HOLD_START = 5; // ~0.3 seconds at 15fps
const GOOD_SCORE_THRESHOLD = 60;

export function resetHoldState(): void {
  holdStartTime = null;
  consecutiveGoodFrames = 0;
}

// ============ Main Evaluation Function ============

export function evaluatePose(
  keypoints: Keypoint[],
  poseName: string,
  previousKeypoints?: Keypoint[],
  includeDebug: boolean = false
): PoseEvaluation {
  const normalizedName = poseName.toLowerCase().replace(/\s+/g, '_');
  const rules = poseRuleMap[normalizedName] || defaultRules;

  const feedback: PoseFeedback[] = [];
  const angleChecks: AngleCheckResult[] = [];
  const alignmentChecks: AlignmentCheckResult[] = [];

  // Check keypoint visibility
  const visibleKeypoints = rules.requiredKeypoints.filter(name => {
    const kp = getKeypoint(keypoints, name);
    return kp !== null;
  });

  const keypointCoverage = visibleKeypoints.length / rules.requiredKeypoints.length;
  const isCorrectPose = keypointCoverage > 0.7;

  if (keypointCoverage < 0.5) {
    resetHoldState();
    feedback.push({
      joint: 'body',
      message: 'Move so your full body is visible',
      severity: 'error',
      correction: 'Step back or adjust camera angle',
      priority: 1,
    });

    return {
      overallScore: 0,
      alignmentScore: 0,
      stabilityScore: 0,
      feedback,
      isCorrectPose: false,
      phase: 'setup',
      holdProgress: 0,
      debugInfo: includeDebug ? {
        angleChecks: [],
        alignmentChecks: [],
        keypointConfidences: keypoints.map(kp => ({ name: kp.name, confidence: kp.confidence })),
        phase: 'setup',
        holdSeconds: 0,
        scoreBreakdown: { angleScore: 0, alignmentScore: 0, stabilityScore: 0, weights: { angle: 0.4, alignment: 0.35, stability: 0.25 } },
      } : undefined,
    };
  }

  // ============ Evaluate Angle Rules ============

  let angleScoreSum = 0;
  let angleWeightSum = 0;

  for (const rule of rules.angleRules) {
    const p1 = getKeypoint(keypoints, rule.points[0]);
    const p2 = getKeypoint(keypoints, rule.points[1]);
    const p3 = getKeypoint(keypoints, rule.points[2]);

    if (p1 && p2 && p3) {
      const angle = calculateAngle(p1, p2, p3);
      const deviation = Math.abs(angle - rule.targetAngle);
      const zone = getZone(deviation, rule.greenZone, rule.yellowZone);
      const score = getScoreForZone(deviation, rule.greenZone, rule.yellowZone);

      angleScoreSum += score * rule.weight;
      angleWeightSum += rule.weight;

      angleChecks.push({
        name: rule.name,
        joint: rule.joint,
        currentAngle: Math.round(angle),
        targetAngle: rule.targetAngle,
        deviation: Math.round(deviation),
        score: Math.round(score),
        zone,
        passed: zone !== 'red',
      });

      if (zone === 'red') {
        const isAngleTooSmall = angle < rule.targetAngle;
        feedback.push({
          joint: rule.joint,
          message: isAngleTooSmall ? rule.feedback.tooSmall : rule.feedback.tooLarge,
          severity: 'error',
          correction: `Target: ${rule.targetAngle}° (currently ${Math.round(angle)}°)`,
          currentValue: Math.round(angle),
          targetValue: rule.targetAngle,
          priority: rule.priority,
        });
      } else if (zone === 'yellow') {
        const isAngleTooSmall = angle < rule.targetAngle;
        feedback.push({
          joint: rule.joint,
          message: isAngleTooSmall ? rule.feedback.tooSmall : rule.feedback.tooLarge,
          severity: 'warning',
          currentValue: Math.round(angle),
          targetValue: rule.targetAngle,
          priority: rule.priority,
        });
      }
    }
  }

  const angleScore = angleWeightSum > 0 ? angleScoreSum / angleWeightSum : 100;

  // ============ Evaluate Alignment Rules ============

  let alignmentScoreSum = 0;
  let alignmentWeightSum = 0;

  for (const rule of rules.alignmentRules) {
    const points = rule.points.map(name => getKeypoint(keypoints, name)).filter(p => p !== null) as Keypoint[];

    if (points.length >= 2) {
      let diff = 0;

      if (rule.type === 'horizontal') {
        const yValues = points.map(p => p.y);
        diff = Math.max(...yValues) - Math.min(...yValues);
      } else if (rule.type === 'vertical') {
        const xValues = points.map(p => p.x);
        diff = Math.max(...xValues) - Math.min(...xValues);
      }

      const zone = getZone(diff, rule.tolerance, rule.yellowTolerance);
      const score = getScoreForZone(diff, rule.tolerance, rule.yellowTolerance);

      alignmentScoreSum += score * rule.weight;
      alignmentWeightSum += rule.weight;

      alignmentChecks.push({
        name: rule.name,
        currentDiff: diff,
        tolerance: rule.tolerance,
        score: Math.round(score),
        zone,
        passed: zone !== 'red',
      });

      if (zone === 'red') {
        feedback.push({
          joint: rule.points[0],
          message: rule.feedback.issue,
          severity: 'error',
          priority: rule.priority,
        });
      } else if (zone === 'yellow') {
        feedback.push({
          joint: rule.points[0],
          message: rule.feedback.issue,
          severity: 'warning',
          priority: rule.priority,
        });
      }
    }
  }

  const alignmentScore = alignmentWeightSum > 0 ? alignmentScoreSum / alignmentWeightSum : 100;

  // ============ Evaluate Position Rules ============

  for (const rule of rules.positionRules) {
    const p1 = getKeypoint(keypoints, rule.point1);
    const p2 = getKeypoint(keypoints, rule.point2);

    if (p1 && p2) {
      const diff = rule.axis === 'x' ? Math.abs(p1.x - p2.x) : Math.abs(p1.y - p2.y);

      if (diff > rule.tolerance) {
        feedback.push({
          joint: rule.point1,
          message: rule.feedback,
          severity: 'warning',
          priority: rule.priority,
        });
      }
    }
  }

  // ============ Calculate Stability ============

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
      // More lenient stability: 0.005 = full stability, 0.05 = no stability
      stabilityScore = Math.max(0, 100 - avgMovement * 2000);
    }
  }

  // ============ Calculate Overall Score ============

  const weights = { angle: 0.45, alignment: 0.35, stability: 0.2 };
  const overallScore = Math.round(
    angleScore * weights.angle +
    alignmentScore * weights.alignment +
    stabilityScore * weights.stability
  );

  // ============ Determine Phase & Hold Progress ============

  let phase: PosePhase = 'setup';
  let holdProgress = 0;
  let holdSeconds = 0;

  if (overallScore >= GOOD_SCORE_THRESHOLD && isCorrectPose) {
    consecutiveGoodFrames++;

    if (consecutiveGoodFrames >= FRAMES_FOR_HOLD_START) {
      if (holdStartTime === null) {
        holdStartTime = Date.now();
        phase = 'hold';
      } else {
        holdSeconds = (Date.now() - holdStartTime) / 1000;
        holdProgress = Math.min(100, (holdSeconds / rules.holdDuration) * 100);

        if (holdSeconds >= rules.holdDuration) {
          phase = 'complete';
        } else {
          phase = 'hold';
        }
      }
    } else {
      phase = 'adjustment';
    }
  } else {
    consecutiveGoodFrames = 0;
    holdStartTime = null;
    phase = overallScore >= 40 ? 'adjustment' : 'setup';
  }

  // ============ Sort & Limit Feedback ============

  // Sort by priority (1 first) then by severity (error first)
  feedback.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    const severityOrder = { error: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  // Add positive feedback if doing well
  if (feedback.filter(f => f.severity !== 'info').length === 0 && overallScore >= 80) {
    if (phase === 'hold') {
      const remaining = Math.ceil(rules.holdDuration - holdSeconds);
      feedback.unshift({
        joint: 'body',
        message: remaining > 0 ? `Hold for ${remaining} more seconds...` : 'Perfect! Keep holding!',
        severity: 'info',
        priority: 1,
      });
    } else {
      feedback.unshift({
        joint: 'body',
        message: 'Great form! Hold this position.',
        severity: 'info',
        priority: 1,
      });
    }
  }

  // Limit to top 3 feedback items
  const limitedFeedback = feedback.slice(0, 3);

  return {
    overallScore,
    alignmentScore: Math.round(alignmentScore),
    stabilityScore: Math.round(stabilityScore),
    feedback: limitedFeedback,
    isCorrectPose,
    phase,
    holdProgress,
    debugInfo: includeDebug ? {
      angleChecks,
      alignmentChecks,
      keypointConfidences: keypoints.map(kp => ({ name: kp.name, confidence: kp.confidence })),
      phase,
      holdSeconds,
      scoreBreakdown: {
        angleScore: Math.round(angleScore),
        alignmentScore: Math.round(alignmentScore),
        stabilityScore: Math.round(stabilityScore),
        weights,
      },
    } : undefined,
  };
}

// ============ Get Pose Instructions ============

export function getPoseInstructions(poseName: string): {
  name: string;
  sanskritName: string;
  phases: { setup: string[]; adjustment: string[]; hold: string[] };
  holdDuration: number;
} {
  const normalizedName = poseName.toLowerCase().replace(/\s+/g, '_');
  const rules = poseRuleMap[normalizedName] || defaultRules;

  return {
    name: rules.name,
    sanskritName: rules.sanskritName,
    phases: rules.phases,
    holdDuration: rules.holdDuration,
  };
}

// ============ Get Pose Tips ============

export function getPoseTips(poseName: string): string[] {
  const normalizedName = poseName.toLowerCase().replace(/\s+/g, '_');

  const tips: Record<string, string[]> = {
    'warrior_ii': [
      'Keep your front knee directly over your ankle - not past your toes',
      'Extend through both arms equally, like you\'re being pulled in opposite directions',
      'Turn your head to gaze over your front fingertips',
      'Keep your hips open and facing the side of the mat',
      'Press firmly through the outer edge of your back foot',
    ],
    'tree_pose': [
      'Find a fixed point to focus your gaze (drishti)',
      'Press your foot into your thigh AND your thigh into your foot',
      'Never place your foot on your knee joint',
      'Engage your standing leg muscles, especially the inner thigh',
      'Keep your hips level - don\'t let one side drop',
    ],
    'mountain_pose': [
      'Distribute your weight evenly across all four corners of your feet',
      'Engage your thighs by lifting your kneecaps slightly',
      'Draw your tailbone down and your navel gently in',
      'Roll your shoulders back and down, opening your chest',
      'Imagine a string pulling you up from the crown of your head',
    ],
  };

  return tips[normalizedName] || [
    'Focus on your breath throughout the pose',
    'Keep your core engaged for stability',
    'Move slowly and mindfully',
  ];
}

export default evaluatePose;
