# Yogifi AI

Real-time yoga coaching app with live pose detection, AI feedback, and personalized plans.

---

## Architecture

```
Browser / React Native app
        │
        ▼
Spring Boot API  (port 8080)  ←── JWT auth, sessions, AI plans
        │
        ▼
Python Pose Service  (port 8001)  ←── BlazePose + TFLite classifier
        │
        ▼
PostgreSQL  (port 5433 via Docker)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Web frontend | React 18, Vite, TypeScript, Tailwind CSS |
| Mobile | React Native 0.81.5, Expo 54, TypeScript |
| Web ML | TensorFlow.js 4.22 — MoveNet Thunder (in-browser) |
| Pose service | Python 3.11, FastAPI, BlazePose, TFLite classifier |
| Backend | Java 17, Spring Boot 3.2.5, Spring Security (JWT) |
| Database | PostgreSQL 16 (prod) / H2 in-memory (dev) |
| Auth | JWT + httpOnly refresh cookie |
| AI plans | Gemini 2.0 Flash / Anthropic Claude (configurable) |
| Containerisation | Docker Compose |

---

## Project Structure

```
yogifi-ai/
├── web/                        # Vite + React web app
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Session.tsx     # Live pose detection screen
│   │   │   ├── Dashboard.tsx   # Sidebar layout
│   │   │   ├── Login.tsx / Signup.tsx / Onboarding.tsx
│   │   │   └── dashboard/      # AI chat, poses, fitness, nutrition views
│   │   ├── components/         # BrutalistCursor, BrutalistMarquee, etc.
│   │   ├── lib/api.ts          # Axios client + token interceptors
│   │   └── index.css           # Wellness Brutalism design tokens
│   └── public/poses/           # Reference pose images (jpg)
├── src/                        # React Native / Expo app
│   ├── screens/
│   │   ├── CameraScreen.tsx    # Native pose session
│   │   └── WebCameraScreen.tsx # Web camera session
│   ├── services/
│   │   ├── poseDetector.ts     # Mock pose engine
│   │   ├── webPoseDetector.ts  # TF.js MoveNet (web)
│   │   └── poseRules.ts        # Angle + alignment scoring
│   └── constants/config.ts     # Feature flags
├── pose-service/
│   └── main.py                 # FastAPI — BlazePose + TFLite
├── yogifi-backend/             # Spring Boot API
│   ├── src/main/java/com/yogifi/
│   │   ├── controller/         # REST endpoints
│   │   ├── service/            # Business logic + AI integration
│   │   ├── security/           # JWT filter
│   │   └── config/             # CORS, security, DataLoader
│   └── docker-compose.yml
└── pose_detection_poc.py       # MediaPipe webcam demo (Python)
```

---

## Quick Start

### 1. Spring Boot backend

```bash
cd yogifi-backend

# Dev (H2 in-memory, no DB setup needed)
JWT_SECRET=<64-char-secret> AI_API_KEY=<key> ./mvnw spring-boot:run

# Production (PostgreSQL via Docker)
cp .env.example .env          # fill in secrets
docker-compose up --build -d
```

### 2. Python pose service

```bash
cd pose-service
pip install fastapi uvicorn opencv-python mediapipe numpy
python main.py                # listens on :8001
```

### 3. Web frontend

```bash
cd web
npm install
npm run dev                   # http://localhost:5173
```

### 4. React Native (Expo)

```bash
npm install
npx expo start                # all platforms
npx expo start --web          # web only
npx expo run:ios              # iOS simulator
npx expo run:android          # Android emulator
```

---

## Environment Variables

```bash
# Backend (.env in yogifi-backend/)
JWT_SECRET=          # min 64 chars — openssl rand -base64 64
DB_PASSWORD=
AI_PROVIDER=gemini   # or: anthropic
AI_API_KEY=
AI_API_URL=          # Gemini or Anthropic endpoint

# Web frontend (web/.env)
VITE_API_URL=http://localhost:8080/api
```

---

## API Overview

All endpoints are under `/api`. Auth endpoints are public; everything else requires `Authorization: Bearer <token>`.

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/auth/register` | POST | Public | Create account |
| `/auth/login` | POST | Public | Get JWT + refresh cookie |
| `/auth/refresh` | POST | Cookie | Silent token refresh |
| `/auth/logout` | POST | JWT | Revoke session |
| `/poses/list` | GET | Public | All poses |
| `/poses/{id}` | GET | Public | Pose details + imageUrl |
| `/pose/analyze-frame` | POST | JWT | Frame → pose score (proxies to Python service) |
| `/pose/health` | GET | JWT | Python service liveness |
| `/sessions` | POST/GET | JWT | Start / list sessions |
| `/chat/ask` | POST | JWT | AI coach message |
| `/chat/history` | GET | JWT | Conversation history |
| `/fitness/generate-plan` | POST | JWT | AI fitness plan |
| `/nutrition/generate-plan` | POST | JWT | AI nutrition plan |

---

## Pose Detection Pipeline

```
Camera frame (1280×720 JPEG @ 40% quality)
    │
    ▼  [browser]
TF.js MoveNet Thunder → 17 keypoints
    │
    ├─ Skeleton overlay drawn on canvas
    │
    └─ POST /api/pose/analyze-frame (every 500 ms)
            │
            ▼  [Spring Boot → Python service]
        BlazePose → 33 keypoints → TFLite classifier
            │
            └─ pose_name, confidence, score, corrections
                    │
                    ▼  [browser]
                EMA smoothing → display score + HUD
```

**Local scoring fallback** (when backend offline):
angle (40%) + alignment (35%) + symmetry (25%) computed from MoveNet keypoints — no server needed.

### Supported Poses

| Pose | Sanskrit | mlModelKey |
|------|----------|------------|
| Warrior II | Virabhadrasana II | `warrior2` |
| Tree Pose | Vrksasana | `tree` |
| Downward Dog | Adho Mukha Svanasana | `downdog` |
| Goddess Pose | Utkata Konasana | `goddess` |
| Plank Pose | Phalakasana | `plank` |

---

## Feature Flags (`src/constants/config.ts`)

| Flag | Default | Effect |
|------|---------|--------|
| `USE_MOCK_POSE_DETECTION` | `true` | Toggle real vs mock pose engine |
| `ENABLE_POSE_DETECTION` | `true` | Master pose detection toggle |
| `USE_MOCK_SCORES` | `false` | Static scores for UI testing |
| `ENABLE_VOICE_FEEDBACK` | `true` | Expo Speech announcements |
| `ENABLE_SKELETON_OVERLAY` | `true` | Draw keypoints on camera |
| `ENABLE_DEBUG_OVERLAY` | `false` | Show debug panel |
| `CONFETTI_SCORE_THRESHOLD` | `80` | Score to trigger confetti |

---

## Design System — Wellness Brutalism

The web app uses a hybrid design language: editorial wellness base with neo-brutalist accents.

```css
--bg:      #F7F4EE   /* warm off-white */
--ink:     #1A1816   /* near-black */
--accent:  #C9472F   /* coral red */
--acid:    #D2E823   /* electric yellow-green */
--brutal:  #09090B   /* pure black (borders, shadows) */
--muted:   #6B6560
--line:    #E8E4DC
--surface: #EFECE5
```

Hard shadows: `box-shadow: 4px 4px 0 0 var(--brutal)`.
Hover: `translate(4px, 4px)` + shadow collapses to 0.

---

## Backend URL by Platform

| Platform | Base URL |
|----------|----------|
| Web dev | `http://localhost:8080/api` |
| Android emulator | `http://10.0.2.2:8080/api` |
| iOS device | `http://<your-local-ip>:8080/api` |

---

## Troubleshooting

**Pose service offline banner** — Spring Boot (Docker) cannot reach the Python service via `localhost`. The `docker-compose.yml` sets `POSE_SERVICE_URL=http://host.docker.internal:8001` to route to the host machine. Make sure `python main.py` is running before starting Docker.

**Camera permission (iOS)** — `NSCameraUsageDescription` is set in `app.json`. Expo Go does not support native ML modules; use `expo-dev-client` for real MediaPipe.

**Android emulator** — Use `10.0.2.2` not `localhost` for backend calls.

**MoveNet / WebGL** — TF.js requires WebGL. Initialise the backend (`await tf.ready()`) before calling `poseDetection.createDetector`.

**Metro bundler cache:**
```bash
npx expo start --clear
```

**TypeScript check:**
```bash
cd web && npx tsc --noEmit
```

---

## License

Proprietary — Yogifi AI
