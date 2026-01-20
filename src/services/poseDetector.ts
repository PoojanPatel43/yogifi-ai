import { TensorflowModel, loadTensorflowModel } from 'react-native-fast-tflite';
import { Keypoint, PoseData } from '../types';

// MoveNet keypoint indices
export const KEYPOINT_NAMES = [
  'nose',
  'left_eye',
  'right_eye',
  'left_ear',
  'right_ear',
  'left_shoulder',
  'right_shoulder',
  'left_elbow',
  'right_elbow',
  'left_wrist',
  'right_wrist',
  'left_hip',
  'right_hip',
  'left_knee',
  'right_knee',
  'left_ankle',
  'right_ankle',
] as const;

export type KeypointName = typeof KEYPOINT_NAMES[number];

// Keypoint connections for skeleton drawing
export const KEYPOINT_CONNECTIONS: [KeypointName, KeypointName][] = [
  ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_elbow'],
  ['left_elbow', 'left_wrist'],
  ['right_shoulder', 'right_elbow'],
  ['right_elbow', 'right_wrist'],
  ['left_shoulder', 'left_hip'],
  ['right_shoulder', 'right_hip'],
  ['left_hip', 'right_hip'],
  ['left_hip', 'left_knee'],
  ['left_knee', 'left_ankle'],
  ['right_hip', 'right_knee'],
  ['right_knee', 'right_ankle'],
];

// Configuration
const MODEL_INPUT_SIZE = 192; // MoveNet Lightning input size
const MIN_CONFIDENCE_THRESHOLD = 0.3;

class PoseDetector {
  private model: TensorflowModel | null = null;
  private isLoading = false;
  private loadPromise: Promise<void> | null = null;

  async loadModel(): Promise<void> {
    if (this.model) {
      return;
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.isLoading = true;
    this.loadPromise = this._loadModelInternal();

    try {
      await this.loadPromise;
    } finally {
      this.isLoading = false;
      this.loadPromise = null;
    }
  }

  private async _loadModelInternal(): Promise<void> {
    try {
      console.log('[PoseDetector] Loading MoveNet model...');
      this.model = await loadTensorflowModel(
        require('../../assets/models/movenet_singlepose_lightning.tflite')
      );
      console.log('[PoseDetector] Model loaded successfully');
    } catch (error) {
      console.error('[PoseDetector] Failed to load model:', error);
      throw error;
    }
  }

  isModelLoaded(): boolean {
    return this.model !== null;
  }

  isModelLoading(): boolean {
    return this.isLoading;
  }

  async detectPose(frameData: ArrayBuffer, width: number, height: number): Promise<PoseData | null> {
    if (!this.model) {
      console.warn('[PoseDetector] Model not loaded');
      return null;
    }

    try {
      // The frame data should be preprocessed to match model input
      // MoveNet expects 192x192x3 RGB input normalized to [-1, 1] or [0, 255]
      const inputTensor = this.preprocessFrame(frameData, width, height);

      // Run inference
      const outputs = await this.model.run([inputTensor]);

      // Process outputs - MoveNet outputs [1, 1, 17, 3] tensor
      // Each keypoint has [y, x, confidence]
      const keypoints = this.processOutputs(outputs[0] as Float32Array);

      // Calculate overall confidence
      const validKeypoints = keypoints.filter(kp => kp.confidence >= MIN_CONFIDENCE_THRESHOLD);
      const avgConfidence = validKeypoints.length > 0
        ? validKeypoints.reduce((sum, kp) => sum + kp.confidence, 0) / validKeypoints.length
        : 0;

      return {
        keypoints,
        timestamp: Date.now(),
        confidence: avgConfidence,
      };
    } catch (error) {
      console.error('[PoseDetector] Detection error:', error);
      return null;
    }
  }

  private preprocessFrame(frameData: ArrayBuffer, width: number, height: number): Float32Array {
    // Create input tensor for MoveNet (192x192x3)
    const inputSize = MODEL_INPUT_SIZE * MODEL_INPUT_SIZE * 3;
    const inputTensor = new Float32Array(inputSize);

    const uint8Data = new Uint8Array(frameData);

    // Calculate scaling factors
    const scaleX = width / MODEL_INPUT_SIZE;
    const scaleY = height / MODEL_INPUT_SIZE;

    // Resize and normalize
    for (let y = 0; y < MODEL_INPUT_SIZE; y++) {
      for (let x = 0; x < MODEL_INPUT_SIZE; x++) {
        const srcX = Math.floor(x * scaleX);
        const srcY = Math.floor(y * scaleY);
        const srcIdx = (srcY * width + srcX) * 4; // RGBA
        const dstIdx = (y * MODEL_INPUT_SIZE + x) * 3; // RGB

        // Normalize to [0, 255] range (MoveNet int8 model expects this)
        inputTensor[dstIdx] = uint8Data[srcIdx] || 0;     // R
        inputTensor[dstIdx + 1] = uint8Data[srcIdx + 1] || 0; // G
        inputTensor[dstIdx + 2] = uint8Data[srcIdx + 2] || 0; // B
      }
    }

    return inputTensor;
  }

  private processOutputs(outputData: Float32Array): Keypoint[] {
    const keypoints: Keypoint[] = [];

    // MoveNet output format: [1, 1, 17, 3] -> flattened to [17 * 3]
    // Each keypoint: [y, x, confidence]
    for (let i = 0; i < KEYPOINT_NAMES.length; i++) {
      const baseIdx = i * 3;
      const y = outputData[baseIdx];
      const x = outputData[baseIdx + 1];
      const confidence = outputData[baseIdx + 2];

      keypoints.push({
        name: KEYPOINT_NAMES[i],
        x: x, // Normalized [0, 1]
        y: y, // Normalized [0, 1]
        confidence: confidence,
      });
    }

    return keypoints;
  }

  getKeypointByName(keypoints: Keypoint[], name: KeypointName): Keypoint | undefined {
    return keypoints.find(kp => kp.name === name);
  }

  dispose(): void {
    // Clean up model resources if needed
    this.model = null;
  }
}

// Singleton instance
export const poseDetector = new PoseDetector();

// Utility functions for pose analysis
export function calculateAngle(
  point1: { x: number; y: number },
  point2: { x: number; y: number },
  point3: { x: number; y: number }
): number {
  const radians = Math.atan2(point3.y - point2.y, point3.x - point2.x) -
                  Math.atan2(point1.y - point2.y, point1.x - point2.x);
  let angle = Math.abs(radians * 180.0 / Math.PI);

  if (angle > 180.0) {
    angle = 360.0 - angle;
  }

  return angle;
}

export function calculateDistance(
  point1: { x: number; y: number },
  point2: { x: number; y: number }
): number {
  return Math.sqrt(
    Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
  );
}

export function getMidpoint(
  point1: { x: number; y: number },
  point2: { x: number; y: number }
): { x: number; y: number } {
  return {
    x: (point1.x + point2.x) / 2,
    y: (point1.y + point2.y) / 2,
  };
}

export default poseDetector;
