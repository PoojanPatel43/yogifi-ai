"""
pose-service/main.py
FastAPI microservice wrapping the trained Yogifi TFLite pose model.
Exposes REST endpoints consumed by the Spring Boot backend.

Endpoints:
  GET  /health              → liveness check
  GET  /poses               → list of supported pose names
  POST /predict             → classify from pre-extracted keypoints
  POST /analyze-frame       → extract BlazePose keypoints from base64 JPEG + classify

Run: python main.py   (port 8001)
"""

import sys
import json
import time
import base64
import pickle
import logging
from pathlib import Path
from typing import Any, List, Optional

import cv2
import numpy as np
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# Resolve the pose_detection project path
# pose-service is at: yogifi-ai/pose-service/main.py
# pose_detection is at: Projects/pose_detection/
# ---------------------------------------------------------------------------
POSE_DETECTION_ROOT = str(Path(__file__).parent.parent.parent / "pose_detection")
sys.path.insert(0, POSE_DETECTION_ROOT)

try:
    from models.keypoint_extractor import BlazePoseExtractor, LANDMARK_NAMES
    from data.normalizer import PoseNormalizer
    from features.angle_features import build_feature_vector, extract_angle_features
    from inference.tflite_converter import TFLiteInference
    from models.correction_engine import PoseCorrectionEngine
except ImportError as e:
    print(f"ERROR: Cannot import pose_detection modules from {POSE_DETECTION_ROOT}")
    print(f"  Cause: {e}")
    print("  Make sure /Projects/pose_detection exists and dependencies are installed.")
    sys.exit(1)

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
MODEL_DIR = Path(POSE_DETECTION_ROOT) / "models"
CONFIG_DIR = Path(POSE_DETECTION_ROOT) / "config"

TFLITE_MODEL_PATH = str(MODEL_DIR / "yogifi_pose_fp32.tflite")
LABEL_ENCODER_PATH = str(MODEL_DIR / "label_encoder.pkl")
POSE_REFERENCES_PATH = str(CONFIG_DIR / "pose_references.json")
VISIBILITY_THRESHOLD = 0.5  # minimum visibility for body landmark detection

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("pose-service")

# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
app = FastAPI(title="Yogifi Pose Detection Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Global model instances — loaded once on startup
# ---------------------------------------------------------------------------
extractor: Optional[BlazePoseExtractor] = None
normalizer: Optional[PoseNormalizer] = None
tflite_model: Optional[TFLiteInference] = None
label_encoder: Any = None
corrector: Optional[PoseCorrectionEngine] = None
supported_poses: List[str] = []
models_ready: bool = False


@app.on_event("startup")
async def load_models():
    global extractor, normalizer, tflite_model, label_encoder, corrector, supported_poses, models_ready

    log.info("Loading BlazePose keypoint extractor (model_complexity=1)...")
    extractor = BlazePoseExtractor(model_complexity=1)

    log.info("Loading pose normalizer...")
    normalizer = PoseNormalizer()

    log.info("Loading TFLite model: %s", TFLITE_MODEL_PATH)
    tflite_model = TFLiteInference(TFLITE_MODEL_PATH)

    log.info("Loading label encoder: %s", LABEL_ENCODER_PATH)
    with open(LABEL_ENCODER_PATH, "rb") as f:
        label_encoder = pickle.load(f)

    log.info("Loading pose references: %s", POSE_REFERENCES_PATH)
    with open(POSE_REFERENCES_PATH) as f:
        pose_refs = json.load(f)
    supported_poses = list(pose_refs["poses"].keys())

    log.info("Initializing correction engine...")
    corrector = PoseCorrectionEngine()

    models_ready = True
    log.info("✅ Models ready. Supported poses: %s", supported_poses)


# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------
class KeypointsRequest(BaseModel):
    """33 BlazePose landmarks, each [x, y, z, visibility] normalized 0–1."""
    keypoints: List[List[float]]


class FrameRequest(BaseModel):
    """Base64-encoded JPEG frame (frontend sends this)."""
    frame: str
    session_id: Optional[str] = None


# ---------------------------------------------------------------------------
# Core inference helper
# ---------------------------------------------------------------------------
# Map label encoder class names → correction engine / pose_references keys
_POSE_NAME_MAP = {
    'downdog':  'downward_dog',
    'tree':     'tree_pose',
    'warrior2': 'warrior_2',
    'warrior1': 'warrior_1',
    'goddess':  'goddess',
    'plank':    'plank',
    'child':    'child_pose',
}

# Minimum confidence to consider a classification reliable
MIN_CONFIDENCE_THRESHOLD = 0.3


def _run_inference(kps_raw: np.ndarray) -> dict:
    """
    kps_raw: (33, 3) float32 — raw x/y/z coords (already extracted)
    Returns classification + corrections dict.
    """
    # Build normalised feature vector: (99,) normalised coords + (12,) angles = (111,)
    kps_norm = normalizer.normalize({
        **{f"{LANDMARK_NAMES[i]}_x": float(kps_raw[i, 0]) for i in range(33)},
        **{f"{LANDMARK_NAMES[i]}_y": float(kps_raw[i, 1]) for i in range(33)},
        **{f"{LANDMARK_NAMES[i]}_z": float(kps_raw[i, 2]) for i in range(33)},
    })
    features = build_feature_vector(kps_norm, kps_raw)

    # Temporal smoothing is handled per-session on the client; pipeline is stateless here.
    probs = tflite_model.predict(features)
    pose_idx = int(np.argmax(probs))
    raw_pose_name = label_encoder.classes_[pose_idx]
    confidence = float(probs[pose_idx])

    # Normalise to correction engine naming convention
    pose_name = _POSE_NAME_MAP.get(raw_pose_name, raw_pose_name)

    if confidence < MIN_CONFIDENCE_THRESHOLD:
        log.debug("Low confidence prediction: %s (%.3f)", pose_name, confidence)

    angles = extract_angle_features(kps_raw)
    corrections = corrector.analyze(pose_name, angles)
    score = corrector.get_accuracy_score(pose_name, angles)

    return {
        "pose_name": pose_name,
        "confidence": round(confidence, 3),
        "score": score,
        "corrections": [vars(c) for c in corrections[:3]],
        "supported_pose": pose_name in supported_poses,
        "angles": {k: round(v, 1) for k, v in angles.items()},
    }


def _empty_response(reason: str = "") -> dict:
    return {
        "pose_detected": False,
        "pose_name": "",
        "confidence": 0.0,
        "score": 0.0,
        "corrections": [],
        "keypoints": [],
        "supported_pose": False,
        "reason": reason,
    }


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/health")
async def health():
    return {"status": "ok", "models_loaded": models_ready, "supported_poses": supported_poses}


@app.get("/poses")
async def get_poses():
    return {"poses": supported_poses, "count": len(supported_poses)}


@app.post("/predict")
async def predict(request: KeypointsRequest):
    """Classify from 33 pre-extracted BlazePose keypoints [[x,y,z,visibility] × 33]."""
    if not models_ready:
        raise HTTPException(status_code=503, detail="Models not loaded yet")
    if len(request.keypoints) != 33:
        raise HTTPException(status_code=400, detail=f"Expected 33 keypoints, got {len(request.keypoints)}")

    try:
        kps_raw = np.array([[k[0], k[1], k[2]] for k in request.keypoints], dtype=np.float32)
        result = _run_inference(kps_raw)
        log.debug("Prediction: %s (confidence=%.3f)", result["pose_name"], result["confidence"])
        return result
    except Exception as e:
        log.exception("Inference failed")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze-frame")
async def analyze_frame(request: FrameRequest):
    """Decode base64 JPEG → extract BlazePose keypoints → classify → return analysis."""
    if not models_ready:
        raise HTTPException(status_code=503, detail="Models not loaded yet")

    try:
        start_time = time.time()
        # Decode base64 → numpy image
        img_bytes = base64.b64decode(request.frame)
        nparr = np.frombuffer(img_bytes, np.uint8)
        frame_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if frame_bgr is None:
            return _empty_response("Failed to decode image")

        # Extract BlazePose keypoints
        frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        kps_list = extractor.extract_from_array(frame_rgb)

        if kps_list is None:
            log.debug("No person detected in frame (session=%s)", request.session_id)
            return _empty_response("No person detected")

        # Run TFLite classification
        kps_raw = np.array([[k["x"], k["y"], k["z"]] for k in kps_list], dtype=np.float32)
        result = _run_inference(kps_raw)

        # Check full-body visibility (shoulders, hips, knees, ankles)
        body_indices = [11, 12, 23, 24, 25, 26, 27, 28]
        body_visibility = [kps_list[i]["visibility"] for i in body_indices]
        full_body_visible = all(v > VISIBILITY_THRESHOLD for v in body_visibility)

        elapsed_ms = (time.time() - start_time) * 1000
        log.info("Frame analyzed in %.0fms: %s (confidence=%.3f, score=%.1f)",
                 elapsed_ms, result["pose_name"], result["confidence"], result["score"])

        return {
            "pose_detected": True,
            "pose_name": result["pose_name"],
            "confidence": result["confidence"],
            "score": result["score"],
            "corrections": result["corrections"],
            "keypoints": [
                {"x": kp["x"], "y": kp["y"], "visibility": kp["visibility"]}
                for kp in kps_list
            ],
            "supported_pose": result["supported_pose"],
            "full_body_visible": full_body_visible,
            "angles": result["angles"],
        }

    except Exception as e:
        log.exception("Frame analysis failed")
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")
