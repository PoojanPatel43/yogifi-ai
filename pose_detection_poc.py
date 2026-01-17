#!/usr/bin/env python3
"""
Yogifi AI - Pose Detection Proof of Concept
============================================
This script demonstrates real-time pose detection using MediaPipe Pose.

Recommended model: MediaPipe Pose (Full)
- 33 keypoints including hands and feet (crucial for yoga poses)
- 3D pose estimation with z-depth coordinates
- Optimized for mobile deployment
- Best React Native integration options

Requirements:
    pip install mediapipe opencv-python numpy

Usage:
    python pose_detection_poc.py

Controls:
    - Press 'q' to quit
    - Press 's' to save current frame
    - Press 'l' to toggle landmark display (points only vs full skeleton)
"""

import cv2
import mediapipe as mp
import numpy as np
import time
from collections import deque
from typing import Optional, Tuple, List

# MediaPipe drawing utilities
mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles

# Keypoint names for MediaPipe's 33-point model
POSE_LANDMARKS = [
    "nose", "left_eye_inner", "left_eye", "left_eye_outer",
    "right_eye_inner", "right_eye", "right_eye_outer",
    "left_ear", "right_ear", "mouth_left", "mouth_right",
    "left_shoulder", "right_shoulder", "left_elbow", "right_elbow",
    "left_wrist", "right_wrist", "left_pinky", "right_pinky",
    "left_index", "right_index", "left_thumb", "right_thumb",
    "left_hip", "right_hip", "left_knee", "right_knee",
    "left_ankle", "right_ankle", "left_heel", "right_heel",
    "left_foot_index", "right_foot_index"
]

# Color definitions (BGR format for OpenCV)
COLORS = {
    'primary': (255, 99, 108),      # #6C63FF in BGR (purple/blue)
    'secondary': (107, 107, 255),    # #FF6B6B in BGR (coral red)
    'success': (80, 175, 76),        # Green
    'warning': (0, 165, 255),        # Orange
    'text': (255, 255, 255),         # White
    'background': (51, 51, 51),      # Dark gray
}


class FPSCalculator:
    """Calculates frames per second with smoothing."""

    def __init__(self, buffer_size: int = 30):
        self.timestamps = deque(maxlen=buffer_size)

    def update(self) -> float:
        """Update with current timestamp and return smoothed FPS."""
        self.timestamps.append(time.time())
        if len(self.timestamps) < 2:
            return 0.0
        time_diff = self.timestamps[-1] - self.timestamps[0]
        return (len(self.timestamps) - 1) / time_diff if time_diff > 0 else 0.0


class PoseDetector:
    """
    Real-time pose detector using MediaPipe Pose.

    MediaPipe Pose provides 33 keypoints including:
    - Face landmarks (nose, eyes, ears, mouth)
    - Upper body (shoulders, elbows, wrists, hands)
    - Lower body (hips, knees, ankles, feet)

    This is ideal for yoga pose detection as it captures:
    - Hand positions (palm orientation, finger positions)
    - Foot positions (heel vs toe, foot angle)
    - 3D depth for pose alignment
    """

    def __init__(
        self,
        model_complexity: int = 1,  # 0=Lite, 1=Full, 2=Heavy
        min_detection_confidence: float = 0.5,
        min_tracking_confidence: float = 0.5,
        enable_segmentation: bool = False
    ):
        """
        Initialize the pose detector.

        Args:
            model_complexity: 0=Lite (fast), 1=Full (balanced), 2=Heavy (accurate)
            min_detection_confidence: Minimum confidence for pose detection
            min_tracking_confidence: Minimum confidence for pose tracking
            enable_segmentation: Whether to output segmentation mask
        """
        self.pose = mp_pose.Pose(
            static_image_mode=False,
            model_complexity=model_complexity,
            smooth_landmarks=True,
            enable_segmentation=enable_segmentation,
            smooth_segmentation=True,
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence
        )
        self.fps_calculator = FPSCalculator()
        self.show_skeleton = True  # Toggle between skeleton and points-only

    def process_frame(self, frame: np.ndarray) -> Tuple[np.ndarray, Optional[object], float]:
        """
        Process a single frame for pose detection.

        Args:
            frame: BGR image from OpenCV

        Returns:
            Tuple of (annotated_frame, pose_landmarks, fps)
        """
        # Convert BGR to RGB for MediaPipe
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # Run pose detection
        results = self.pose.process(rgb_frame)

        # Calculate FPS
        fps = self.fps_calculator.update()

        # Create annotated frame
        annotated_frame = frame.copy()

        if results.pose_landmarks:
            if self.show_skeleton:
                # Draw full skeleton with connections
                mp_drawing.draw_landmarks(
                    annotated_frame,
                    results.pose_landmarks,
                    mp_pose.POSE_CONNECTIONS,
                    landmark_drawing_spec=mp_drawing_styles.get_default_pose_landmarks_style()
                )
            else:
                # Draw only keypoints (no connections)
                for idx, landmark in enumerate(results.pose_landmarks.landmark):
                    h, w, _ = frame.shape
                    cx, cy = int(landmark.x * w), int(landmark.y * h)
                    # Color based on visibility/confidence
                    if landmark.visibility > 0.7:
                        color = COLORS['success']
                    elif landmark.visibility > 0.5:
                        color = COLORS['warning']
                    else:
                        color = COLORS['secondary']
                    cv2.circle(annotated_frame, (cx, cy), 5, color, -1)

        return annotated_frame, results.pose_landmarks, fps

    def get_keypoints_dict(
        self,
        landmarks: object,
        frame_shape: Tuple[int, int, int]
    ) -> List[dict]:
        """
        Convert landmarks to a list of keypoint dictionaries.

        Args:
            landmarks: MediaPipe pose landmarks
            frame_shape: (height, width, channels) of the frame

        Returns:
            List of dicts with keypoint info
        """
        if not landmarks:
            return []

        h, w, _ = frame_shape
        keypoints = []

        for idx, landmark in enumerate(landmarks.landmark):
            keypoints.append({
                'id': idx,
                'name': POSE_LANDMARKS[idx],
                'x': landmark.x,  # Normalized [0-1]
                'y': landmark.y,  # Normalized [0-1]
                'z': landmark.z,  # Depth relative to hips
                'x_pixel': int(landmark.x * w),
                'y_pixel': int(landmark.y * h),
                'visibility': landmark.visibility,
                'confidence': round(landmark.visibility, 3)
            })

        return keypoints

    def toggle_skeleton(self):
        """Toggle between skeleton view and points-only view."""
        self.show_skeleton = not self.show_skeleton


def draw_ui_overlay(
    frame: np.ndarray,
    fps: float,
    keypoints: List[dict],
    pose_detected: bool
) -> np.ndarray:
    """
    Draw UI overlay on the frame.

    Args:
        frame: The video frame
        fps: Current FPS
        keypoints: List of detected keypoints
        pose_detected: Whether a pose was detected

    Returns:
        Frame with UI overlay
    """
    h, w, _ = frame.shape

    # Semi-transparent overlay for top bar
    overlay = frame.copy()
    cv2.rectangle(overlay, (0, 0), (w, 80), (0, 0, 0), -1)
    cv2.addWeighted(overlay, 0.6, frame, 0.4, 0, frame)

    # FPS counter (top-left)
    fps_color = COLORS['success'] if fps >= 30 else COLORS['warning'] if fps >= 20 else COLORS['secondary']
    cv2.putText(
        frame, f"FPS: {fps:.1f}", (15, 35),
        cv2.FONT_HERSHEY_SIMPLEX, 1.0, fps_color, 2, cv2.LINE_AA
    )

    # Pose status (top-center)
    status_text = "POSE DETECTED" if pose_detected else "NO POSE"
    status_color = COLORS['success'] if pose_detected else COLORS['secondary']
    text_size = cv2.getTextSize(status_text, cv2.FONT_HERSHEY_SIMPLEX, 0.8, 2)[0]
    cv2.putText(
        frame, status_text, ((w - text_size[0]) // 2, 35),
        cv2.FONT_HERSHEY_SIMPLEX, 0.8, status_color, 2, cv2.LINE_AA
    )

    # Keypoint count (top-right)
    visible_count = sum(1 for kp in keypoints if kp['visibility'] > 0.5)
    cv2.putText(
        frame, f"Points: {visible_count}/33", (w - 180, 35),
        cv2.FONT_HERSHEY_SIMPLEX, 0.8, COLORS['text'], 2, cv2.LINE_AA
    )

    # Instructions (bottom)
    instructions = "Q: Quit | S: Save | L: Toggle Skeleton"
    text_size = cv2.getTextSize(instructions, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 1)[0]
    cv2.rectangle(frame, (0, h - 40), (w, h), (0, 0, 0), -1)
    cv2.putText(
        frame, instructions, ((w - text_size[0]) // 2, h - 15),
        cv2.FONT_HERSHEY_SIMPLEX, 0.6, COLORS['text'], 1, cv2.LINE_AA
    )

    return frame


def print_keypoints(keypoints: List[dict], frame_count: int):
    """
    Print keypoint coordinates to console.

    Args:
        keypoints: List of keypoint dictionaries
        frame_count: Current frame number
    """
    if frame_count % 30 != 0:  # Print every 30 frames (~1 second at 30fps)
        return

    print(f"\n{'='*60}")
    print(f"Frame {frame_count} - Keypoint Coordinates")
    print(f"{'='*60}")
    print(f"{'ID':<4} {'Name':<20} {'X':>8} {'Y':>8} {'Z':>8} {'Conf':>6}")
    print(f"{'-'*60}")

    for kp in keypoints:
        if kp['visibility'] > 0.5:  # Only show visible keypoints
            print(
                f"{kp['id']:<4} {kp['name']:<20} "
                f"{kp['x']:>8.4f} {kp['y']:>8.4f} {kp['z']:>8.4f} "
                f"{kp['confidence']:>6.2f}"
            )

    print(f"{'='*60}\n")


def main():
    """Main function to run the pose detection demo."""

    print("="*60)
    print("YOGIFI AI - Pose Detection Proof of Concept")
    print("="*60)
    print("\nModel: MediaPipe Pose (Full)")
    print("Keypoints: 33 (including hands, feet, and face)")
    print("Features: Real-time detection, 3D coordinates, skeleton overlay")
    print("\nStarting webcam capture...")
    print("-"*60)

    # Initialize webcam
    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("ERROR: Could not open webcam!")
        print("Please ensure your webcam is connected and not in use.")
        return

    # Set camera properties for better performance
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    cap.set(cv2.CAP_PROP_FPS, 30)

    # Get actual camera properties
    actual_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    actual_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    print(f"Camera resolution: {actual_width}x{actual_height}")

    # Initialize pose detector
    # model_complexity: 0=Lite, 1=Full, 2=Heavy
    # Using 1 (Full) for best balance of speed and accuracy
    detector = PoseDetector(
        model_complexity=1,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )

    print("Pose detector initialized!")
    print("\nControls:")
    print("  Q - Quit")
    print("  S - Save current frame")
    print("  L - Toggle skeleton/points display")
    print("-"*60 + "\n")

    frame_count = 0
    saved_count = 0

    try:
        while True:
            # Read frame from webcam
            ret, frame = cap.read()

            if not ret:
                print("ERROR: Failed to read frame from webcam")
                break

            # Flip frame horizontally for mirror view
            frame = cv2.flip(frame, 1)
            frame_count += 1

            # Process frame for pose detection
            annotated_frame, landmarks, fps = detector.process_frame(frame)

            # Get keypoints dictionary
            keypoints = detector.get_keypoints_dict(landmarks, frame.shape)

            # Draw UI overlay
            annotated_frame = draw_ui_overlay(
                annotated_frame,
                fps,
                keypoints,
                pose_detected=landmarks is not None
            )

            # Print keypoints to console (every 30 frames)
            if landmarks:
                print_keypoints(keypoints, frame_count)

            # Display the frame
            cv2.imshow('Yogifi AI - Pose Detection', annotated_frame)

            # Handle keyboard input
            key = cv2.waitKey(1) & 0xFF

            if key == ord('q'):
                print("\nQuitting...")
                break
            elif key == ord('s'):
                # Save current frame
                filename = f"pose_capture_{saved_count:04d}.jpg"
                cv2.imwrite(filename, annotated_frame)
                saved_count += 1
                print(f"Saved: {filename}")
            elif key == ord('l'):
                # Toggle skeleton display
                detector.toggle_skeleton()
                mode = "skeleton" if detector.show_skeleton else "points only"
                print(f"Display mode: {mode}")

    except KeyboardInterrupt:
        print("\nInterrupted by user")

    finally:
        # Cleanup
        cap.release()
        cv2.destroyAllWindows()
        print(f"\nSession ended. Total frames processed: {frame_count}")


if __name__ == "__main__":
    main()
