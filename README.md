# Yogifi AI - Yoga Pose Correction App

AI-powered yoga coaching app with real-time pose detection and correction.

---

## PART A: AI MODEL RESEARCH & VALIDATION

### Model Comparison Table

| Model | Accuracy (AP) | FPS iPhone 12 | FPS Galaxy S21 | FPS Mid-range | Size (Original) | Size (Quantized) | Keypoints | Mobile Ready | RN Integration |
|-------|---------------|---------------|----------------|---------------|-----------------|------------------|-----------|--------------|----------------|
| **MediaPipe Pose Full** | ~75 AP | 30-45 | 30-40 | 20-30 | ~3 MB | ~1.5 MB | **33** | ✅ Excellent | ⭐⭐⭐⭐⭐ |
| MediaPipe Pose Lite | ~70 AP | 45-60 | 40-50 | 25-35 | ~1.5 MB | ~0.8 MB | **33** | ✅ Excellent | ⭐⭐⭐⭐⭐ |
| MoveNet Thunder | ~72 AP | 25-35 | 20-30 | 15-20 | ~6 MB | ~2 MB | 17 | ✅ Good | ⭐⭐⭐⭐ |
| MoveNet Lightning | ~66 AP | 50-60 | 45-55 | 30-40 | ~3.5 MB | ~1 MB | 17 | ✅ Good | ⭐⭐⭐⭐ |
| RTMPose-l | **~76 AP** | 15-25 | 12-20 | 8-15 | ~25 MB | ~7 MB | 17/133* | ⚠️ Complex | ⭐⭐ |
| RTMPose-s | ~70 AP | 35-45 | 30-40 | 20-30 | ~5 MB | ~2 MB | 17/133* | ⚠️ Complex | ⭐⭐ |

*RTMPose supports 17 keypoints (COCO format) or 133 keypoints (Whole-body) depending on model variant.

### 🏆 RECOMMENDATION: MediaPipe Pose (Full)

**Why MediaPipe Pose Full is BEST for Yogifi AI:**

1. **33 Keypoints (Critical for Yoga)**
   - Includes hands: wrist, pinky, index, thumb
   - Includes feet: ankle, heel, foot_index
   - Face landmarks for head alignment
   - This is ESSENTIAL for yoga poses like Warrior, Tree, Downward Dog

2. **3D Pose Estimation**
   - Z-depth coordinates for form correction
   - Can detect if arm is forward/backward relative to body
   - Crucial for proper yoga alignment feedback

3. **Performance**
   - 30-45 FPS on iPhone 12 ✅ (meets your 30 FPS requirement)
   - 30-40 FPS on Samsung Galaxy S21 ✅
   - Only ~3 MB model size

4. **React Native Integration (Best-in-class)**
   - `react-native-mediapipe` library available
   - Works with Expo Dev Client
   - Official Google SDKs for iOS/Android

5. **Production Ready**
   - Used by Google Fit, YouTube, and major fitness apps
   - Well-documented, stable API
   - Active community support

### Why NOT the Others?

| Model | Issue for Yogifi AI |
|-------|---------------------|
| RTMPose-l | Highest accuracy but only 17 keypoints in COCO format. No dedicated RN library. |
| RTMPose-s | Same 17-keypoint limitation. Complex ONNX setup for mobile. |
| MoveNet Thunder | Only 17 keypoints - missing hand/foot details critical for yoga. |
| MoveNet Lightning | Lower accuracy (66 AP) struggles with complex poses. 17 keypoints only. |

---

### Deployment Format Comparison

| Feature | TensorFlow Lite | ONNX Runtime Mobile |
|---------|----------------|---------------------|
| React Native Support | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐ Good |
| Expo Compatibility | Dev Client required | Dev Client required |
| Model Availability | More pre-trained | Growing |
| Documentation | Extensive | Growing |
| MediaPipe Integration | Native (uses TFLite) | Requires conversion |
| Community Support | Large | Medium |

**Winner: TensorFlow Lite** (MediaPipe uses TFLite internally)

### Recommended React Native Stack

```
react-native-vision-camera    # Camera access & frame processing
react-native-mediapipe        # Pose detection (uses TFLite internally)
expo-dev-client               # Required for native modules
```

⚠️ **CRITICAL:** You MUST use Expo Dev Client, NOT Expo Go. Expo Go does not support native ML modules.

---

## Python Proof of Concept

### Installation

```bash
# Navigate to project directory
cd ~/Projects/yogifi-ai

# Install dependencies
pip install mediapipe opencv-python numpy
```

### Run the Demo

```bash
python pose_detection_poc.py
```

### Controls
- **Q** - Quit the application
- **S** - Save current frame as image
- **L** - Toggle between skeleton and points-only view

### What It Does
1. Captures real-time webcam feed
2. Detects pose using MediaPipe Pose (Full model)
3. Draws skeleton overlay with 33 keypoints
4. Displays FPS counter
5. Prints keypoint coordinates with confidence scores every second
6. Shows pose detection status (detected/not detected)

### Expected Output
```
============================================================
Frame 30 - Keypoint Coordinates
============================================================
ID   Name                        X        Y        Z   Conf
------------------------------------------------------------
0    nose                    0.5123   0.2341  -0.0234   0.99
11   left_shoulder           0.6234   0.3456  -0.0123   0.98
12   right_shoulder          0.3876   0.3421  -0.0156   0.97
...
============================================================
```

---

## Mobile Conversion Steps

### Step 1: MediaPipe is Already Optimized

MediaPipe Pose models are **already optimized for mobile**. No conversion needed!

The `react-native-mediapipe` library includes pre-built mobile-optimized models.

### Step 2: If You Need Custom Model (Optional)

For TFLite conversion (if using custom trained model):

```bash
# Install conversion tools
pip install tensorflow tf2onnx

# Convert to TFLite with INT8 quantization
import tensorflow as tf

# Load model
model = tf.keras.models.load_model('your_model.h5')

# Convert with quantization
converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = [tf.lite.Optimize.DEFAULT]
converter.target_spec.supported_types = [tf.int8]

# Representative dataset for calibration
def representative_dataset():
    for _ in range(100):
        yield [np.random.rand(1, 256, 256, 3).astype(np.float32)]

converter.representative_dataset = representative_dataset
tflite_model = converter.convert()

# Save
with open('model_quantized.tflite', 'wb') as f:
    f.write(tflite_model)
```

### Expected File Sizes After Quantization

| Model | Original | INT8 Quantized |
|-------|----------|----------------|
| MediaPipe Pose Full | ~3 MB | ~1.5 MB |
| MediaPipe Pose Lite | ~1.5 MB | ~0.8 MB |

---

## PART B: REACT NATIVE MOBILE APP

### Project Structure

```
yogifi-ai/
├── App.tsx                          # Main app entry
├── app.json                         # Expo configuration
├── package.json                     # Dependencies
├── tsconfig.json                    # TypeScript config
├── babel.config.js                  # Babel config
├── pose_detection_poc.py            # Python POC script
├── README.md                        # This file
├── assets/                          # App assets
└── src/
    ├── constants/
    │   └── colors.ts                # Color palette
    ├── types/
    │   └── index.ts                 # TypeScript interfaces
    ├── services/
    │   └── api.ts                   # API service with axios
    ├── navigation/
    │   └── AppNavigator.tsx         # Stack navigator
    └── screens/
        ├── index.ts                 # Screen exports
        ├── SplashScreen.tsx         # Logo + auto-navigate
        ├── LoginScreen.tsx          # Email/password form
        ├── HomeScreen.tsx           # Dashboard + Start Practice
        ├── CameraScreen.tsx         # Placeholder for pose detection
        └── ProfileScreen.tsx        # User profile + stats
```

### Setup Instructions

```bash
# 1. Navigate to project directory
cd ~/Projects/yogifi-ai

# 2. Install dependencies
npm install

# 3. Start Expo development server
npx expo start

# 4. Run on device/simulator
# Press 'i' for iOS simulator
# Press 'a' for Android emulator
# Or scan QR code with Expo Go app
```

### Navigation Flow

```
Splash (2 sec) → Login → Home ↔ Camera
                   ↓
                Profile
```

### API Endpoints (Configured)

Base URL: `http://localhost:8080/api`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/login` | POST | User login |
| `/auth/register` | POST | User registration |
| `/user/profile` | GET | Get user profile |
| `/sessions/start` | POST | Start yoga session |
| `/sessions/:id/end` | POST | End yoga session |

---

## Next Steps

### Phase 1: Test Current Setup
1. Run Python POC to verify pose detection works
2. Run React Native app to verify navigation works

### Phase 2: Integrate Pose Detection (Future)
```bash
# When ready to add real pose detection:
npx expo install expo-dev-client
npm install react-native-vision-camera react-native-mediapipe
```

### Phase 3: Add Animations (Future)
```bash
# When ready to add smooth animations:
npx expo install react-native-reanimated
```

---

## Troubleshooting

### Python Script Issues

**Webcam not opening:**
```bash
# Check if another app is using the camera
# On macOS, check System Preferences > Privacy > Camera
```

**Low FPS:**
```bash
# Reduce camera resolution in the script
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
```

### React Native Issues

**Metro bundler errors:**
```bash
# Clear cache and restart
npx expo start --clear
```

**TypeScript errors:**
```bash
# Check TypeScript compilation
npx tsc --noEmit
```

---

## Tech Stack Summary

| Component | Technology |
|-----------|------------|
| AI Model | MediaPipe Pose (Full) |
| Model Format | TensorFlow Lite (built-in) |
| Mobile Framework | React Native + Expo |
| Navigation | React Navigation 6 |
| State Management | React hooks (for now) |
| API Client | Axios |
| Secure Storage | expo-secure-store |
| Language | TypeScript |

---

## License

Proprietary - Yogifi AI
