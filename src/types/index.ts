// Navigation Types
export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  Home: undefined;
  PoseSelection: undefined;
  CameraSetup: CameraSetupParams | undefined;
  Camera: CameraParams | undefined;
  SessionComplete: SessionCompleteParams;
  History: undefined;
  SessionDetails: SessionDetailsParams;
  Profile: undefined;
};

// Camera Setup screen params
export interface CameraSetupParams {
  poseId?: string;
  poseName?: string;
}

// Camera screen params
export interface CameraParams {
  poseId?: string;
  poseName?: string;
  duration?: number;
}

// Session Complete screen params
export interface SessionCompleteParams {
  sessionId: string;
  poseName: string;
  duration: number;
  overallScore: number;
  stabilityScore?: number;
  alignmentScore?: number;
}

// Session Details screen params
export interface SessionDetailsParams {
  sessionId: string;
}

// Camera permission status
export type CameraPermissionStatus = 'granted' | 'denied' | 'undetermined';

// Camera state
export interface CameraState {
  isReady: boolean;
  facing: 'front' | 'back';
  permissionStatus: CameraPermissionStatus;
}

// Session state for camera screen
export interface CameraSessionState {
  isActive: boolean;
  startTime: number | null;
  elapsedSeconds: number;
  currentScore: number;
  poseDetected: boolean;
  sessionId: string | null;
}

// Setup checklist item
export interface SetupChecklistItem {
  id: string;
  label: string;
  isComplete: boolean;
}

// Frame processing result
export interface FrameProcessingResult {
  timestamp: number;
  processingTimeMs: number;
  poseData?: PoseData;
}

// User Types (matches backend)
export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  createdAt?: string | null;
}

// User Profile (matches backend ProfileResponse)
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  age?: number | null;
  height?: number | null;
  weight?: number | null;
  fitnessLevel?: string | null;
  goals?: string | null;
  avatarUrl?: string | null;
  createdAt?: string | null;
}

// User Stats (matches backend UserStatsResponse)
export interface UserStats {
  totalSessions: number;
  totalMinutes: number;
  averageScore: number;
  currentStreak?: number;
  longestStreak?: number;
  mostPracticedPose?: string | null;
  posesCompleted?: number;
}

// Pose Types (matches backend PoseResponse)
export interface Pose {
  id: string;
  name: string;
  sanskritName: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  description: string;
  instructions?: string;
  benefits?: string;
  precautions?: string;
  imageUrl?: string | null;
  targetDurationSeconds: number;
}

// Session Types (matches backend SessionResponse)
export interface Session {
  id: string;
  poseId: string;
  poseName: string;
  durationSeconds?: number | null;
  overallScore?: number | null;
  stabilityScore?: number | null;
  alignmentScore?: number | null;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdAt?: string | null;
  endedAt?: string | null;
  feedback?: string | null;
  metrics?: SessionMetric[];
  mistakes?: PoseMistake[];
}

export interface SessionMetric {
  id: string;
  metricType: string;
  metricValue: number;
  expectedValue?: number | null;
  deviation?: number | null;
  timestampSeconds?: number | null;
  jointName?: string | null;
}

export interface PoseMistake {
  id: string;
  joint: string;
  mistakeType: string;
  description?: string | null;
  correction?: string | null;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  occurrenceTimeSeconds?: number | null;
  durationSeconds?: number | null;
}

export interface PoseData {
  keypoints: Keypoint[];
  timestamp: number;
  confidence: number;
}

export interface Keypoint {
  name: string;
  x: number;
  y: number;
  confidence: number;
}

// API Response Types (matches backend ApiResponse)
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

// Auth Response (matches backend AuthResponse)
export interface AuthResponse {
  token: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

// Auth Context Types
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

// Profile Update Request
export interface ProfileUpdateRequest {
  name?: string;
  age?: number;
  height?: number;
  weight?: number;
  fitnessLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  goals?: string;
  avatarUrl?: string;
}

// Session End Request
export interface SessionEndRequest {
  sessionId: string;
  durationSeconds: number;
  overallScore?: number;
  stabilityScore?: number;
  alignmentScore?: number;
  feedback?: string;
  metrics?: Array<{
    metricType: string;
    metricValue: number;
    expectedValue?: number;
    timestampSeconds?: number;
    jointName?: string;
  }>;
  mistakes?: Array<{
    joint: string;
    mistakeType: string;
    description?: string;
    correction?: string;
    severity: string;
    occurrenceTimeSeconds?: number;
    durationSeconds?: number;
  }>;
}
