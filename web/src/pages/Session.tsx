import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';
import { ArrowLeft, Video, Activity, Loader2, AlertTriangle } from 'lucide-react';
import api from '../lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface PoseData {
  id: string;
  name: string;
  sanskritName: string;
  // imageUrl from the backend is a root-relative path e.g. "/poses/warrior2.jpg"
  // served from web/public — it resolves correctly against the Vite dev-server
  // origin without any transformation needed.
  imageUrl?: string;
  // mlModelKey is the short identifier used by the backend (e.g. "warrior2",
  // "tree", "downdog") and also used as a key into LOCAL_POSE_IMAGES below.
  mlModelKey?: string;
  targetDurationSeconds: number;
}

// Client-side image fallback map — keyed by mlModelKey (matches DataLoader.java).
// Used when targetPose.imageUrl is absent or the backend is offline.
// Files must exist in web/public/poses/.
const LOCAL_POSE_IMAGES: Record<string, string> = {
  warrior2: '/poses/warrior2.jpg',
  tree:     '/poses/tree.jpg',
  downdog:  '/poses/downdog.jpg',
  goddess:  '/poses/goddess.jpg',
  plank:    '/poses/plank.jpg',
};

// Pose metadata fallback — used to build a stub PoseData when backend is offline.
const LOCAL_POSE_META: Record<string, { name: string; sanskritName: string; targetDurationSeconds: number }> = {
  warrior2: { name: 'Warrior II',    sanskritName: 'Virabhadrasana II',    targetDurationSeconds: 30 },
  tree:     { name: 'Tree Pose',     sanskritName: 'Vrksasana',            targetDurationSeconds: 30 },
  downdog:  { name: 'Downward Dog',  sanskritName: 'Adho Mukha Svanasana', targetDurationSeconds: 45 },
  goddess:  { name: 'Goddess Pose',  sanskritName: 'Utkata Konasana',      targetDurationSeconds: 30 },
  plank:    { name: 'Plank Pose',    sanskritName: 'Phalakasana',          targetDurationSeconds: 30 },
};

interface Correction {
  joint: string;
  severity: 'minor' | 'moderate' | 'major';
  instruction: string;
}

interface PoseAnalysis {
  pose_detected: boolean;
  pose_name: string;
  confidence: number;
  score: number;
  corrections: Correction[];
  full_body_visible: boolean;
  supported_pose: boolean;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const ANALYSIS_INTERVAL_MS  = 500;
const CONFIDENCE_THRESHOLD  = 0.65;
const SCORE_EMA_ALPHA       = 0.25;

// Camera resolution — 1280×720 gives MoveNet better accuracy than 640×480.
const CAM_WIDTH  = 1280;
const CAM_HEIGHT = 720;

// Minimum keypoint score before a joint is drawn (MoveNet Thunder is reliable at 0.3+).
const KP_DRAW_THRESHOLD = 0.3;

const SEVERITY_COLORS: Record<string, string> = {
  major:    '#C9472F',
  moderate: '#D4813A',
  minor:    '#B5A642',
};
const SEVERITY_ICONS: Record<string, string> = {
  major: '●', moderate: '●', minor: '●',
};

// ---------------------------------------------------------------------------
// Local scoring — runs entirely in the browser using the MoveNet keypoints.
// This provides a fallback score when the Python pose-service is offline.
// It mirrors the weight system in src/services/poseRules.ts:
//   Angle 40% + Alignment 35% + Stability 20% + Symmetry 5%
// ---------------------------------------------------------------------------

/** Compute the angle at vertex B formed by points A–B–C (degrees). */
function calcAngle(
  ax: number, ay: number,
  bx: number, by: number,
  cx: number, cy: number
): number {
  const abx = ax - bx, aby = ay - by;
  const cbx = cx - bx, cby = cy - by;
  const dot = abx * cbx + aby * cby;
  const cross = Math.hypot(abx, aby) * Math.hypot(cbx, cby);
  if (cross === 0) return 0;
  return (Math.acos(Math.max(-1, Math.min(1, dot / cross))) * 180) / Math.PI;
}

/** Weighted joint-angle score — 0-100. */
function localAngleScore(kps: poseDetection.Keypoint[]): number {
  const get = (i: number) => kps[i];
  const ok  = (i: number) => (get(i).score ?? 0) > KP_DRAW_THRESHOLD;

  // Angle rules: [pointA, vertex, pointC, target°, tolerance°]
  const rules: [number, number, number, number, number][] = [
    // Shoulders — flat arms (Warrior II / general)
    [5, 7, 9,   175, 30],   // L elbow: shoulder → elbow → wrist
    [6, 8, 10,  175, 30],   // R elbow
    // Hips
    [5, 11, 13, 160, 40],   // L hip angle
    [6, 12, 14, 160, 40],   // R hip angle
    // Knees
    [11, 13, 15, 160, 40],  // L knee
    [12, 14, 16, 160, 40],  // R knee
  ];

  let sum = 0, count = 0;
  for (const [a, b, c, target, tol] of rules) {
    if (!ok(a) || !ok(b) || !ok(c)) continue;
    const angle = calcAngle(get(a).x, get(a).y, get(b).x, get(b).y, get(c).x, get(c).y);
    const dev = Math.abs(angle - target);
    const score = Math.max(0, 100 - (dev / tol) * 100);
    sum += score;
    count++;
  }
  return count > 0 ? sum / count : 50;
}

/** Shoulder + hip horizontal alignment score — 0-100. */
function localAlignmentScore(kps: poseDetection.Keypoint[]): number {
  const ok = (i: number) => (kps[i].score ?? 0) > KP_DRAW_THRESHOLD;
  const yDiff = (a: number, b: number) => Math.abs(kps[a].y - kps[b].y);

  const pairs: [number, number, number][] = [
    [5,  6,  0.06],   // shoulders, tolerance 6% of frame height
    [11, 12, 0.06],   // hips
    [9,  10, 0.10],   // wrists (arms extended)
  ];

  let sum = 0, count = 0;
  for (const [a, b, tol] of pairs) {
    if (!ok(a) || !ok(b)) continue;
    const diff = yDiff(a, b);
    const score = Math.max(0, 100 - (diff / tol) * 100);
    sum += score;
    count++;
  }
  return count > 0 ? sum / count : 50;
}

/** Left–right keypoint symmetry score — 0-100. */
function localSymmetryScore(kps: poseDetection.Keypoint[]): number {
  const ok = (i: number) => (kps[i].score ?? 0) > KP_DRAW_THRESHOLD;
  // Pairs: [left, right]
  const pairs: [number, number][] = [[5, 6], [7, 8], [9, 10], [11, 12], [13, 14], [15, 16]];
  let sum = 0, count = 0;
  for (const [l, r] of pairs) {
    if (!ok(l) || !ok(r)) continue;
    // Mirror: left.x + right.x should ≈ 1 (since x is normalized 0-1 in video space)
    // We score based on how symmetric the Y positions are (same height = symmetric)
    const yDiff = Math.abs(kps[l].y - kps[r].y);
    const score = Math.max(0, 100 - yDiff * 500); // penalise >0.2 height difference
    sum += score;
    count++;
  }
  return count > 0 ? sum / count : 50;
}

/**
 * Compute a local pose score (0-100) directly from MoveNet keypoints.
 * Used as a fallback when the Python pose-service is offline.
 * Weights: Angle 40%, Alignment 35%, Symmetry 25% (stability omitted — single frame).
 */
function computeLocalScore(kps: poseDetection.Keypoint[]): number | null {
  const visible = kps.filter(k => (k.score ?? 0) > KP_DRAW_THRESHOLD).length;
  if (visible < 8) return null; // not enough keypoints to score meaningfully

  const angle     = localAngleScore(kps);
  const alignment = localAlignmentScore(kps);
  const symmetry  = localSymmetryScore(kps);

  return Math.round(angle * 0.40 + alignment * 0.35 + symmetry * 0.25);
}

// ---------------------------------------------------------------------------
// Model lifecycle states — drives the header status pill and loading overlay.
// Only one of these is active at a time; transitions are strictly forward
// (idle → loading → camera-pending → ready) except for error, which can be
// reached from any stage.
type ModelStatus =
  | 'idle'            // component mounted, setup not yet started
  | 'loading'         // tf.ready() + createDetector in progress
  | 'camera-pending'  // detector ready, waiting for getUserMedia grant
  | 'ready'           // camera streaming + detection loop running
  | 'error';          // unrecoverable failure during setup

const MODEL_STATUS_LABEL: Record<ModelStatus, string> = {
  idle:           'Initializing...',
  loading:        'Loading Model...',
  'camera-pending': 'Requesting Camera...',
  ready:          'Live · Ready',
  error:          'Model Error',
};

const MODEL_STATUS_COLOR: Record<ModelStatus, string> = {
  idle:           'rgba(247,244,238,0.25)',
  loading:        'rgba(210,232,35,0.6)',    // acid yellow — in progress
  'camera-pending': 'rgba(212,129,58,0.75)', // amber — waiting for permission
  ready:          '#4CAF50',                 // green — tracking
  error:          '#C9472F',                 // coral — error
};

// ---------------------------------------------------------------------------
const Session: React.FC = () => {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Replaces the old boolean cameraActive + string loadingMsg combo.
  // modelStatus drives the header pill AND the loading overlay text.
  const [modelStatus, setModelStatus] = useState<ModelStatus>('idle');

  // cameraActive is derived: true only when status === 'ready'.
  // We keep it as a separate boolean so existing logic that depends on
  // cameraActive (analysis interval, bottom-left corrections block) is
  // unchanged without needing to thread modelStatus everywhere.
  const [cameraActive, setCameraActive] = useState(false);

  const [searchParams] = useSearchParams();
  const poseId = searchParams.get('poseId');
  // mk = mlModelKey passed from PosesView (e.g. "warrior2") — used as offline fallback
  const mk     = searchParams.get('mk') ?? '';
  const [targetPose, setTargetPose] = useState<PoseData | null>(null);

  const [imageLoaded,   setImageLoaded]   = useState(false);
  const [displayScore,  setDisplayScore]  = useState<number | null>(null);
  const [detectedPose,  setDetectedPose]  = useState<string>('');
  const [confidence,    setConfidence]    = useState(0);
  const [corrections,   setCorrections]   = useState<Correction[]>([]);
  const [isBodyVisible, setIsBodyVisible] = useState(true);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [scoreSource,   setScoreSource]   = useState<'backend' | 'local' | null>(null);

  const isAnalyzingRef      = useRef(false);
  const analysisIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // EMA state — null means "not yet seeded"; first real score bypasses blending.
  const smoothedScoreRef = useRef<number | null>(null);

  // Shared latest keypoints from the rAF loop — used by the analysis interval.
  const latestKeypointsRef = useRef<poseDetection.Keypoint[]>([]);

  // Track whether backend was last seen as down — used in captureAndAnalyze catch
  // to log the "switching to local" warning only once per mode change (not every 500ms).
  const backendDownRef = useRef(false);

  // Load target pose from backend; fall back to local metadata when offline.
  useEffect(() => {
    if (!poseId) return;
    api.get(`/poses/${poseId}`)
      .then(res => { if (res.data?.data) setTargetPose(res.data.data); })
      .catch(() => {
        // Backend offline — build a stub from the mlModelKey URL param so the
        // local reference image (/poses/<mk>.jpg) can still be shown.
        if (mk && LOCAL_POSE_META[mk]) {
          const meta = LOCAL_POSE_META[mk];
          setTargetPose({
            id: poseId,
            name: meta.name,
            sanskritName: meta.sanskritName,
            mlModelKey: mk,
            imageUrl: LOCAL_POSE_IMAGES[mk],
            targetDurationSeconds: meta.targetDurationSeconds,
          });
        }
      });
  }, [poseId, mk]);

  // Reset imageLoaded whenever the resolved image source changes.
  useEffect(() => { setImageLoaded(false); }, [targetPose?.imageUrl, targetPose?.mlModelKey]);

  // ── EMA helper ───────────────────────────────────────────────────────────
  const applyEMA = useCallback((newScore: number): number => {
    if (smoothedScoreRef.current === null) {
      // First sample — seed directly so the display responds immediately.
      smoothedScoreRef.current = newScore;
    } else {
      smoothedScoreRef.current =
        SCORE_EMA_ALPHA * newScore + (1 - SCORE_EMA_ALPHA) * smoothedScoreRef.current;
    }
    return Math.round(smoothedScoreRef.current);
  }, []);

  // ── Frame capture → backend analysis (runs every ANALYSIS_INTERVAL_MS) ──
  const captureAndAnalyze = useCallback(async () => {
    if (isAnalyzingRef.current) return;
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;

    isAnalyzingRef.current = true;
    try {
      const offscreen = document.createElement('canvas');
      offscreen.width  = video.videoWidth;
      offscreen.height = video.videoHeight;
      const ctx = offscreen.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0);
      const dataUrl = offscreen.toDataURL('image/jpeg', 0.4);
      const base64  = dataUrl.split(',')[1];
      if (!base64) return;

      const response = await api.post('/pose/analyze-frame', { frame: base64, sessionId: null });
      if (!response.data?.success) return;
      const data: PoseAnalysis = response.data.data;

      setIsBodyVisible(data.full_body_visible ?? true);

      if (data.pose_detected && data.confidence >= CONFIDENCE_THRESHOLD) {
        const smoothed = applyEMA(data.score);
        setDisplayScore(smoothed);
        setDetectedPose(data.pose_name);
        setConfidence(data.confidence);
        setCorrections(data.corrections ?? []);
        setAnalysisError(null);
        if (backendDownRef.current) {
          backendDownRef.current = false;
          console.info('[yogifi] pose-service reconnected — resuming backend scoring.');
        }
        setScoreSource('backend');
      } else if (!data.pose_detected) {
        setCorrections([]);
        setDetectedPose('');
      }
    } catch (err: unknown) {
      const apiErr = err as { response?: { status?: number }; code?: string; message?: string };
      const status  = apiErr?.response?.status;
      if (status === 401) {
        setAnalysisError('Log in to enable AI scoring');
      } else {
        // Backend unreachable (network error, 404 missing endpoint, 5xx, etc.)
        // Log only once per mode-switch (not every 500 ms) using a ref to avoid stale closure.
        if (!backendDownRef.current) {
          backendDownRef.current = true;
          console.warn(
            '[yogifi] pose-service unavailable — switching to local MoveNet scoring.',
            `HTTP status: ${status ?? 'network error'}`,
            apiErr?.code ? `code: ${apiErr.code}` : '',
            apiErr?.message ? `msg: ${apiErr.message}` : '',
          );
        }
        // Use local MoveNet keypoints for scoring; auto-recovers when backend returns.
        const kps = latestKeypointsRef.current;
        if (kps.length > 0) {
          const localScore = computeLocalScore(kps);
          if (localScore !== null) {
            const smoothed = applyEMA(localScore);
            setDisplayScore(smoothed);
          }
        }
        setScoreSource('local');
        // Clear any previous auth error; the calm "local mode" badge is shown via scoreSource.
        setAnalysisError(null);
      }
    } finally {
      isAnalyzingRef.current = false;
    }
  }, [applyEMA]);

  // ── Suppress film-grain overlay on the session screen ───────────────────
  // The body::after grain sits at z-index:99998 and would obscure the skeleton
  // (z:20) and HUD panels (z:30-40).  We add a class to body while mounted and
  // remove it on unmount so other pages are unaffected.
  useEffect(() => {
    document.body.classList.add('session-active');
    return () => { document.body.classList.remove('session-active'); };
  }, []);

  // ── MoveNet skeleton + camera setup ──────────────────────────────────────
  useEffect(() => {
    let detector: poseDetection.PoseDetector | null = null;
    let animationFrameId: number;
    let active = true; // guard for cleanup

    const setupAI = async () => {
      try {
        setModelStatus('loading');
        await tf.ready();
        detector = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          { modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER }
        );
        setModelStatus('camera-pending');
        await startCamera();
      } catch (err) {
        setModelStatus('error');
        console.error('[Session] detector init failed:', err);
      }
    };

    const startCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setModelStatus('error');
        return;
      }
      // BUG FIX 1: use 1280×720 — higher resolution improves MoveNet accuracy.
      // ideal/min guards ensure we fall back gracefully on devices that don't
      // support 720p rather than throwing a hard OverconstrainedError.
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width:  { ideal: CAM_WIDTH,  min: 640 },
          height: { ideal: CAM_HEIGHT, min: 480 },
        },
        audio: false,
      });

      if (!active) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }

      const video = videoRef.current;
      if (!video) return;

      video.srcObject = stream;
      video.onloadedmetadata = () => {
        if (!active) return;
        video.play().then(() => {
          setCameraActive(true);
          setModelStatus('ready');
          startDetectionLoop();
        }).catch(err => {
          setModelStatus('error');
          console.error('[Session] video.play() error:', err);
        });
      };
    };

    const startDetectionLoop = () => {
      const detect = async () => {
        if (!active) return;

        const video  = videoRef.current;
        const canvas = canvasRef.current;

        if (detector && video && canvas && video.readyState === 4
            && video.videoWidth > 0 && video.videoHeight > 0) {
          try {
            const poses = await detector.estimatePoses(video);
            if (active) {
              drawPose(canvas, video, poses);
              if (poses.length > 0) {
                latestKeypointsRef.current = poses[0].keypoints;
              }
            }
          } catch {
            // Swallow per-frame errors; keep the loop alive.
          }
        }

        animationFrameId = requestAnimationFrame(detect);
      };
      animationFrameId = requestAnimationFrame(detect);
    };

    // BUG FIX 2: Skeleton coordinate system.
    //
    // MoveNet returns keypoints in VIDEO PIXEL coordinates: x in [0, videoWidth],
    // y in [0, videoHeight].  The canvas drawing buffer is set to match the video
    // dimensions each frame so the raw pixel coords can be used directly for
    // drawing — no scaling math is needed.
    //
    // HOWEVER: the canvas element is displayed via CSS width/height 100% which
    // stretches it to fill its container.  The "cover" behaviour is handled by
    // the container's overflow:hidden — we do NOT put objectFit:cover on the
    // canvas itself because that causes the browser to clip the rendered content
    // relative to the drawing buffer, making keypoints appear at wrong positions.
    //
    // Additionally: both the video and canvas carry transform:scaleX(-1) to
    // mirror the selfie feed.  Because CSS transforms are applied AFTER the
    // canvas has been painted, all drawing can use the raw (un-mirrored) coords.
    // The visual flip is handled by CSS alone.
    //
    // Summary of the fix:
    //   canvas.width  = video.videoWidth   (drawing buffer = video resolution)
    //   canvas.height = video.videoHeight
    //   canvas CSS:  width:100%, height:100% — NO objectFit:cover
    //   keypoints drawn at (kp.x, kp.y) without any scaling multiplier.

    const drawPose = (
      canvas: HTMLCanvasElement,
      video: HTMLVideoElement,
      poses: poseDetection.Pose[]
    ) => {
      // Sync drawing buffer to video resolution every frame.
      // This handles resolution changes (e.g. camera switches).
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width  = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (poses.length === 0) return;

      const pose = poses[0];

      // Draw skeleton bones — acid yellow.
      const adjacentPairs = poseDetection.util.getAdjacentPairs(
        poseDetection.SupportedModels.MoveNet
      );
      ctx.strokeStyle = '#D2E823'; // var(--acid)
      ctx.lineWidth   = 3;
      for (const [a, b] of adjacentPairs) {
        const kp1 = pose.keypoints[a];
        const kp2 = pose.keypoints[b];
        if ((kp1.score ?? 0) > KP_DRAW_THRESHOLD && (kp2.score ?? 0) > KP_DRAW_THRESHOLD) {
          ctx.beginPath();
          ctx.moveTo(kp1.x, kp1.y);
          ctx.lineTo(kp2.x, kp2.y);
          ctx.stroke();
        }
      }

      // Draw keypoint dots — ink fill, cream outline.
      for (const kp of pose.keypoints) {
        if ((kp.score ?? 0) > KP_DRAW_THRESHOLD) {
          ctx.beginPath();
          ctx.arc(kp.x, kp.y, 5, 0, 2 * Math.PI);
          ctx.fillStyle   = '#1A1816'; // var(--ink)
          ctx.fill();
          ctx.strokeStyle = '#F7F4EE'; // var(--bg)
          ctx.lineWidth   = 2;
          ctx.stroke();
        }
      }
    };

    setupAI();

    return () => {
      active = false;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      const video = videoRef.current;
      if (video?.srcObject) {
        (video.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
      if (detector) {
        detector.dispose();
      }
    };
  }, []);

  // ── Start / stop backend analysis loop ───────────────────────────────────
  useEffect(() => {
    if (!cameraActive) return;
    analysisIntervalRef.current = setInterval(captureAndAnalyze, ANALYSIS_INTERVAL_MS);
    return () => {
      if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
    };
  }, [cameraActive, captureAndAnalyze]);

  const scoreColor = (s: number) =>
    s >= 80 ? '#4CAF50' : s >= 60 ? '#D4813A' : '#C9472F';

  const formatPoseName = (name: string) =>
    name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    // BUG FIX 3 & 4: Viewport / container height.
    //
    // The original container used minHeight:100vh + flex:column + padding, then
    // `main` used flex:1.  On many screens this collapses to less than the
    // available height because flex:1 only expands within the parent's DEFINED
    // height — minHeight does not count as a defined height for children.
    //
    // Fix: outer container is height:100vh (exact, not min) so flex:1 on `main`
    // has a concrete parent height to expand against.  The header and footer are
    // fixed-height elements; `main` fills the remainder with minHeight:0 to
    // prevent flex overflow.
    //
    // Film-grain (body::after, z:99998) sits above everything inside this page.
    // We accept the grain overlaying the session UI — it is semi-transparent and
    // pointer-events:none, so it never blocks interaction.  Adding a z:99999
    // element here would require a stacking context that breaks position:fixed
    // overlays.  The grain opacity (0.35) is low enough to see the skeleton.
    <div
      style={{
        height: '100vh',            // exact height — enables flex:1 on main
        background: '#0E0D0C',
        color: '#F7F4EE',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          flexShrink: 0,       // never compress the header
          zIndex: 30,
          position: 'relative',
        }}
      >
        <Link
          to="/dashboard"
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            color: 'var(--brutal)', textDecoration: 'none',
            fontSize: '0.75rem', fontWeight: 700,
            fontFamily: '"Space Grotesk", sans-serif',
            letterSpacing: '0.06em', textTransform: 'uppercase',
            background: 'var(--acid)', border: '2px solid var(--bg)',
            padding: '0.4rem 0.875rem',
          }}
        >
          <ArrowLeft size={14} />
          <span>End Session</span>
        </Link>

        <div
          style={{
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: '0.65rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: MODEL_STATUS_COLOR[modelStatus],
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            border: '1px solid currentColor',
            padding: '0.375rem 0.875rem',
          }}
        >
          <span
            style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'currentColor',
              animation: modelStatus === 'ready' ? 'pulse 2s infinite' : 'none',
            }}
          />
          {modelStatus === 'ready' && targetPose
            ? `Tracking: ${targetPose.name}`
            : MODEL_STATUS_LABEL[modelStatus]}
        </div>
      </header>

      {/* Main viewfinder
          BUG FIX 4: minHeight:0 prevents the flex child from overflowing when
          the content inside is taller than the remaining space.  Without this,
          flex:1 alone can still allow the element to grow beyond the container
          on some browsers.
      */}
      <main
        style={{
          flex: 1,
          minHeight: 0,          // critical: allows flex:1 to actually shrink
          position: 'relative',
          background: '#0A0A0A',
          border: '1px solid rgba(247,244,238,0.05)',
          overflow: 'hidden',    // clips video/canvas to the viewfinder box
        }}
      >
        {/* Loading overlay */}
        {!cameraActive && (
          <div
            style={{
              position: 'absolute', inset: 0, zIndex: 30,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              background: 'rgba(14,13,12,0.9)', backdropFilter: 'blur(8px)',
              gap: '1rem',
            }}
          >
            <Loader2
              size={36}
              className={modelStatus === 'error' ? undefined : 'animate-spin'}
              style={{ color: MODEL_STATUS_COLOR[modelStatus] }}
            />
            <p
              style={{
                fontFamily: '"IBM Plex Mono", monospace', fontSize: '0.7rem',
                letterSpacing: '0.12em', textTransform: 'uppercase',
                color: 'rgba(247,244,238,0.5)',
              }}
            >
              {MODEL_STATUS_LABEL[modelStatus]}
            </p>
          </div>
        )}

        {/* Video feed (mirrored via CSS)
            position:absolute + inset:0 + width/height 100% fills the container.
            objectFit:cover on the VIDEO is correct — it covers the box while
            maintaining the native aspect ratio (letterbox-cropping the sides on
            narrow viewports).
        */}
        <video
          ref={videoRef}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            transform: 'scaleX(-1)',  // mirror selfie feed
            zIndex: 10,
          }}
          playsInline
          muted
        />

        {/* Canvas overlay for skeleton.
            BUG FIX 2 (continued): NO objectFit:cover here.
            The canvas drawing buffer is set to video.videoWidth × video.videoHeight
            each frame, and MoveNet keypoint coords are in video pixel space.
            Using objectFit:cover on the canvas would cause the browser to rescale
            the painted content in a way that misaligns keypoints with the body.

            Instead, the canvas CSS is width:100% + height:100% which stretches
            the drawing buffer to fill the container — the same stretch applies
            equally to all keypoints, so relative positions stay correct.

            The transform:scaleX(-1) mirrors the skeleton to match the video mirror.
        */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            // objectFit intentionally omitted — see comment above
            transform: 'scaleX(-1)',
            zIndex: 20,
          }}
        />

        {/* Full-body warning */}
        {cameraActive && !isBodyVisible && (
          <div
            style={{
              position: 'absolute', top: '1.5rem', left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 40,
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: 'rgba(212,129,58,0.9)', color: '#0E0D0C',
              padding: '0.5rem 1rem',
              fontFamily: '"IBM Plex Mono", monospace', fontSize: '0.65rem',
              letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700,
            }}
          >
            <AlertTriangle size={13} />
            Step back — full body not visible
          </div>
        )}

        {/* Auth error badge — shown for 401 "log in" errors only */}
        {analysisError && (
          <div
            style={{
              position: 'absolute', top: '1.5rem', right: '1.5rem',
              zIndex: 40,
              background: 'rgba(201,71,47,0.8)',
              color: '#F7F4EE',
              fontFamily: '"IBM Plex Mono", monospace', fontSize: '0.65rem',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              padding: '0.375rem 0.75rem',
              border: '1px solid rgba(201,71,47,0.5)',
            }}
          >
            {analysisError}
          </div>
        )}

        {/* Local mode badge — calm indicator, shown when backend scoring is unavailable */}
        {!analysisError && scoreSource === 'local' && (
          <div
            style={{
              position: 'absolute', top: '1.5rem', right: '1.5rem',
              zIndex: 40,
              background: 'rgba(247,244,238,0.06)',
              color: 'rgba(247,244,238,0.45)',
              fontFamily: '"IBM Plex Mono", monospace', fontSize: '0.6rem',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              padding: '0.3rem 0.625rem',
              border: '1px solid rgba(247,244,238,0.12)',
            }}
          >
            Local mode · MoveNet
          </div>
        )}

        {/* TOP-LEFT HUD */}
        <div
          style={{
            position: 'absolute', top: '2rem', left: '2rem',
            zIndex: 30,
            display: 'flex', flexDirection: 'column', gap: '0.5rem',
          }}
        >
          <p
            style={{
              fontFamily: '"IBM Plex Mono", monospace', fontSize: '0.6rem',
              letterSpacing: '0.1em', color: 'rgba(247,244,238,0.35)',
              textTransform: 'uppercase',
            }}
          >
            System
          </p>
          <p style={{ fontWeight: 300, fontSize: '1.1rem', color: '#F7F4EE' }}>
            TFJS-MoveNet Thunder
          </p>

          {detectedPose && confidence >= CONFIDENCE_THRESHOLD && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
              <span
                style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: '#4CAF50', animation: 'pulse 2s infinite',
                }}
              />
              <span
                style={{
                  fontFamily: '"Dela Gothic One", sans-serif',
                  fontSize: '0.85rem', color: '#D2E823',
                  letterSpacing: '0.04em', textTransform: 'uppercase',
                }}
              >
                {formatPoseName(detectedPose)}
              </span>
              <span
                style={{
                  fontFamily: '"IBM Plex Mono", monospace',
                  fontSize: '0.6rem', color: 'rgba(247,244,238,0.35)',
                }}
              >
                {Math.round(confidence * 100)}%
              </span>
            </div>
          )}

          {targetPose && (
            <div
              style={{
                marginTop: '0.75rem',
                background: 'rgba(26,24,22,0.75)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(247,244,238,0.08)',
                padding: '1rem', maxWidth: '260px',
              }}
            >
              <p
                style={{
                  fontFamily: '"Playfair Display", serif', fontStyle: 'italic',
                  fontSize: '1.1rem', color: '#C9472F', marginBottom: '0.25rem',
                }}
              >
                {targetPose.sanskritName}
              </p>
              <p style={{ fontWeight: 300, fontSize: '0.8rem', color: 'rgba(247,244,238,0.6)' }}>
                Goal: {targetPose.targetDurationSeconds}s hold
              </p>
            </div>
          )}
        </div>

        {/* BOTTOM-RIGHT: score + reference image
            BUG FIX 5: Yoga reference images.
            The backend seeds imageUrl as "/poses/warrior2.jpg" — a root-relative
            path.  The images live in web/public/poses/ and are served by the Vite
            dev server at the same origin as the app.  So `img src="/poses/warrior2.jpg"`
            resolves correctly.  No URL transformation is required.

            The image is ONLY shown when targetPose is populated (backend responded)
            AND targetPose.imageUrl is truthy.  When the backend is offline, targetPose
            remains null and the image panel is simply omitted — this is correct
            fallback behaviour.
        */}
        <div
          style={{
            position: 'absolute', bottom: '2rem', right: '2rem',
            zIndex: 30,
            display: 'flex', alignItems: 'flex-end', gap: '1rem',
          }}
        >
          {targetPose && (() => {
            // Resolve image URL: prefer backend value, fall back to local file
            // keyed by mlModelKey (e.g. "warrior2" → /poses/warrior2.jpg).
            const resolvedSrc =
              targetPose.imageUrl ||
              (targetPose.mlModelKey ? LOCAL_POSE_IMAGES[targetPose.mlModelKey] : undefined);

            return (
              <div
                style={{
                  width: '112px', height: '112px',
                  overflow: 'hidden',
                  border: '1px solid rgba(201,71,47,0.3)',
                  position: 'relative',
                  flexShrink: 0,
                }}
              >
                {resolvedSrc && (
                  <img
                    src={resolvedSrc}
                    alt={targetPose.name}
                    style={{
                      width: '100%', height: '100%', objectFit: 'cover',
                      display: imageLoaded ? 'block' : 'none',
                    }}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageLoaded(false)}
                  />
                )}

                {/* Fallback card — shown when image has not loaded or src is absent */}
                {!imageLoaded && (
                  <div
                    style={{
                      position: 'absolute', inset: 0,
                      background: 'rgba(201,71,47,0.15)',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      gap: '0.25rem', padding: '0.5rem',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: '"Dela Gothic One", sans-serif',
                        fontSize: '0.6rem', color: '#C9472F',
                        textAlign: 'center', textTransform: 'uppercase',
                        lineHeight: 1.2, letterSpacing: '0.05em',
                      }}
                    >
                      {targetPose.name}
                    </span>
                    <span
                      style={{
                        fontFamily: '"IBM Plex Mono", monospace',
                        fontSize: '0.45rem', color: 'rgba(247,244,238,0.4)',
                        textTransform: 'uppercase', letterSpacing: '0.08em',
                      }}
                    >
                      {targetPose.sanskritName}
                    </span>
                  </div>
                )}

                <div
                  style={{
                    position: 'absolute', bottom: 0, insetInline: 0,
                    background: 'linear-gradient(to top, rgba(14,13,12,0.9), transparent)',
                    padding: '0.5rem', textAlign: 'center',
                    fontFamily: '"IBM Plex Mono", monospace', fontSize: '0.55rem',
                    letterSpacing: '0.08em', color: '#C9472F', textTransform: 'uppercase',
                  }}
                >
                  Target Form
                </div>
              </div>
            );
          })()}

          {/* Score card */}
          <div
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem',
              background: 'rgba(26,24,22,0.75)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(247,244,238,0.08)',
              padding: '1.25rem 1.5rem', minWidth: '80px',
            }}
          >
            <Activity
              size={14}
              style={{
                color: displayScore !== null
                  ? scoreColor(displayScore)
                  : 'rgba(247,244,238,0.2)',
                fill: 'currentColor',
              }}
            />
            <span
              style={{
                fontWeight: 700, fontSize: '2rem', lineHeight: 1,
                color: displayScore !== null
                  ? scoreColor(displayScore)
                  : 'rgba(247,244,238,0.2)',
                transition: 'color 0.5s',
              }}
            >
              {displayScore !== null ? displayScore : '—'}
            </span>
            <p
              style={{
                fontFamily: '"IBM Plex Mono", monospace', fontSize: '0.55rem',
                letterSpacing: '0.1em', color: 'rgba(247,244,238,0.35)',
                textTransform: 'uppercase', marginTop: '0.2rem',
              }}
            >
              {scoreSource === 'local' ? 'Local Score' : 'Form Score'}
            </p>
          </div>
        </div>

        {/* BOTTOM-LEFT: corrections */}
        {corrections.length > 0 ? (
          <div
            style={{
              position: 'absolute', bottom: '2rem', left: '2rem',
              zIndex: 30,
              display: 'flex', flexDirection: 'column', gap: '0.5rem',
              maxWidth: '280px',
            }}
          >
            <p
              style={{
                fontFamily: '"IBM Plex Mono", monospace', fontSize: '0.6rem',
                letterSpacing: '0.1em', color: 'rgba(247,244,238,0.35)',
                textTransform: 'uppercase', marginBottom: '0.25rem',
              }}
            >
              Corrections
            </p>
            {corrections.slice(0, 3).map((c, i) => (
              <div
                key={i}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                  background: 'rgba(26,24,22,0.8)', backdropFilter: 'blur(6px)',
                  border: '1px solid rgba(247,244,238,0.06)',
                  padding: '0.625rem 0.875rem',
                  borderLeft: `2px solid ${SEVERITY_COLORS[c.severity] ?? '#C9472F'}`,
                }}
              >
                <span
                  style={{
                    color: SEVERITY_COLORS[c.severity] ?? '#C9472F',
                    fontSize: '0.6rem', marginTop: '0.1rem', flexShrink: 0,
                  }}
                >
                  {SEVERITY_ICONS[c.severity] ?? '●'}
                </span>
                <span style={{ fontSize: '0.8rem', fontWeight: 300, lineHeight: 1.5, color: 'rgba(247,244,238,0.85)' }}>
                  {c.instruction}
                </span>
              </div>
            ))}
          </div>
        ) : (
          cameraActive && displayScore !== null && (
            <div style={{ position: 'absolute', bottom: '2rem', left: '2rem', zIndex: 30 }}>
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: 'rgba(76,175,80,0.1)',
                  border: '1px solid rgba(76,175,80,0.3)',
                  backdropFilter: 'blur(6px)',
                  padding: '0.625rem 1rem',
                }}
              >
                <span style={{ color: '#4CAF50', fontSize: '0.875rem', fontWeight: 300 }}>
                  Great form — keep holding!
                </span>
              </div>
            </div>
          )
        )}
      </main>

      {/* Footer controls */}
      <footer
        style={{
          marginTop: '1.5rem',
          flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '1.5rem', zIndex: 20,
        }}
      >
        <button
          style={{
            width: '48px', height: '48px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(247,244,238,0.06)',
            border: '1px solid rgba(247,244,238,0.1)',
            color: 'rgba(247,244,238,0.7)',
            cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          <Video size={20} />
        </button>
      </footer>
    </div>
  );
};

export default Session;
