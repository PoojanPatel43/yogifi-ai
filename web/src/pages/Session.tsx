import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';
import { ArrowLeft, Video, Activity, Loader2, AlertTriangle } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import api from '../lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface PoseData {
  id: string;
  name: string;
  sanskritName: string;
  imageUrl?: string;
  targetDurationSeconds: number;
}

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
const ANALYSIS_INTERVAL_MS = 500;  // Call backend every 500ms
const CONFIDENCE_THRESHOLD  = 0.65;
const SCORE_EMA_ALPHA       = 0.25; // smooth displayed score

const SEVERITY_COLORS: Record<string, string> = {
  major:    'text-red-400',
  moderate: 'text-orange-400',
  minor:    'text-yellow-400',
};
const SEVERITY_ICONS: Record<string, string> = {
  major: '🔴', moderate: '🟠', minor: '🟡',
};

// ---------------------------------------------------------------------------
const Session: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef     = useRef<HTMLVideoElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);

  // Camera / loading
  const [cameraActive, setCameraActive] = useState(false);
  const [loadingMsg, setLoadingMsg]     = useState('Initializing Neural Engine...');

  // Target pose from URL
  const [searchParams] = useSearchParams();
  const poseId = searchParams.get('poseId');
  const [targetPose, setTargetPose] = useState<PoseData | null>(null);

  // ── Real pose analysis state ──────────────────────────────────────────────
  const [displayScore,     setDisplayScore]     = useState<number | null>(null);
  const [detectedPose,     setDetectedPose]     = useState<string>('');
  const [confidence,       setConfidence]       = useState(0);
  const [corrections,      setCorrections]      = useState<Correction[]>([]);
  const [isBodyVisible,    setIsBodyVisible]    = useState(true);
  const [analysisError,    setAnalysisError]    = useState<string | null>(null);

  // Refs for analysis loop (avoid stale closures)
  const isAnalyzingRef     = useRef(false);
  const analysisIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const smoothedScoreRef   = useRef(0);

  // ── Load target pose ──────────────────────────────────────────────────────
  useEffect(() => {
    if (poseId) {
      api.get(`/poses/${poseId}`)
        .then(res => { if (res.data?.data) setTargetPose(res.data.data); })
        .catch(console.error);
    }
  }, [poseId]);

  // ── GSAP entrance animation ───────────────────────────────────────────────
  useGSAP(() => {
    gsap.from('.session-ui', {
      opacity: 0, y: 20, stagger: 0.1, duration: 1, ease: 'power3.out',
    });
  }, { scope: containerRef });

  // ── Frame capture → backend analysis ─────────────────────────────────────
  const captureAndAnalyze = useCallback(async () => {
    if (isAnalyzingRef.current) return; // skip if previous call pending
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;

    isAnalyzingRef.current = true;
    try {
      // Capture current video frame as JPEG base64
      const offscreen = document.createElement('canvas');
      offscreen.width  = video.videoWidth;
      offscreen.height = video.videoHeight;
      const ctx = offscreen.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0);
      const dataUrl = offscreen.toDataURL('image/jpeg', 0.4); // quality 0.4 → smaller payload
      const base64  = dataUrl.split(',')[1];
      if (!base64) return;

      const response = await api.post('/pose/analyze-frame', {
        frame: base64,
        sessionId: null,
      });

      if (!response.data?.success) return;
      const data: PoseAnalysis = response.data.data;

      // Visibility
      setIsBodyVisible(data.full_body_visible ?? true);

      if (data.pose_detected && data.confidence >= CONFIDENCE_THRESHOLD) {
        // EMA score smoothing
        smoothedScoreRef.current =
          SCORE_EMA_ALPHA * data.score +
          (1 - SCORE_EMA_ALPHA) * smoothedScoreRef.current;

        setDisplayScore(Math.round(smoothedScoreRef.current));
        setDetectedPose(data.pose_name);
        setConfidence(data.confidence);
        setCorrections(data.corrections ?? []);
        setAnalysisError(null);
      } else if (!data.pose_detected) {
        setCorrections([]);
        setDetectedPose('');
      }
    } catch (err: unknown) {
      const apiErr = err as { response?: { status?: number } };
      // 401 → not logged in; show once, don't spam
      if (apiErr?.response?.status === 401) {
        setAnalysisError('Log in to enable AI scoring');
      } else if (apiErr?.response?.status === 503 || !apiErr?.response) {
        setAnalysisError('Pose service offline');
      }
    } finally {
      isAnalyzingRef.current = false;
    }
  }, []);

  // ── MoveNet skeleton + camera setup ──────────────────────────────────────
  useEffect(() => {
    let detector: poseDetection.PoseDetector | null = null;
    let animationFrameId: number;

    const setupAI = async () => {
      try {
        setLoadingMsg('Loading MoveNet Model...');
        await tf.ready();
        const detectorConfig = {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER,
        };
        detector = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet, detectorConfig
        );
        setLoadingMsg('Model Ready. Requesting Camera...');
        await startCamera();
      } catch (err) {
        setLoadingMsg('Failed to initialize AI or Camera. Please allow camera permissions.');
        console.error(err);
      }
    };

    const startCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) return;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setCameraActive(true);
          setLoadingMsg('');
          detectPose();
        };
      }
    };

    const detectPose = async () => {
      if (detector && videoRef.current && canvasRef.current && videoRef.current.readyState === 4) {
        const poses = await detector.estimatePoses(videoRef.current);
        drawPose(poses);
      }
      animationFrameId = requestAnimationFrame(detectPose);
    };

    const drawPose = (poses: poseDetection.Pose[]) => {
      const canvas = canvasRef.current;
      const video  = videoRef.current;
      if (!canvas || !video) return;
      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (poses.length === 0) return;
      const pose = poses[0];

      // Bones
      const adjacentPairs = poseDetection.util.getAdjacentPairs(poseDetection.SupportedModels.MoveNet);
      ctx.strokeStyle = '#CC5833';
      ctx.lineWidth   = 4;
      adjacentPairs.forEach(([a, b]) => {
        const kp1 = pose.keypoints[a];
        const kp2 = pose.keypoints[b];
        if ((kp1.score ?? 0) > 0.4 && (kp2.score ?? 0) > 0.4) {
          ctx.beginPath();
          ctx.moveTo(kp1.x, kp1.y);
          ctx.lineTo(kp2.x, kp2.y);
          ctx.stroke();
        }
      });

      // Keypoints
      pose.keypoints.forEach(kp => {
        if ((kp.score ?? 0) > 0.4) {
          ctx.beginPath();
          ctx.arc(kp.x, kp.y, 6, 0, 2 * Math.PI);
          ctx.fillStyle   = '#2E4036';
          ctx.fill();
          ctx.strokeStyle = '#F2F0E9';
          ctx.lineWidth   = 2;
          ctx.stroke();
        }
      });
    };

    setupAI();

    const currentVideo = videoRef.current;
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (currentVideo?.srcObject) {
        (currentVideo.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // ── Start/stop analysis loop when camera becomes active ──────────────────
  useEffect(() => {
    if (cameraActive) {
      analysisIntervalRef.current = setInterval(captureAndAnalyze, ANALYSIS_INTERVAL_MS);
    }
    return () => {
      if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
    };
  }, [cameraActive, captureAndAnalyze]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const scoreColor = (s: number) =>
    s >= 80 ? 'text-[#00E676]' : s >= 60 ? 'text-yellow-400' : 'text-red-400';

  const formatPoseName = (name: string) =>
    name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#111111] text-cream font-sans flex flex-col pt-6 pb-6 px-6 relative overflow-hidden"
    >
      {/* Header */}
      <header className="session-ui flex items-center justify-between mb-8 z-20">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 text-cream/60 hover:text-clay transition-colors group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-outfit font-medium">End Session</span>
        </Link>
        <div className="font-mono text-xs tracking-widest uppercase text-moss bg-moss/10 px-4 py-2 rounded-full border border-moss/20 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-moss animate-pulse" />
          {targetPose ? `Tracking: ${targetPose.name}` : 'Live Telemetry'}
        </div>
      </header>

      {/* Main viewfinder */}
      <main className="session-ui flex-1 relative rounded-[3rem] overflow-hidden bg-[#0A0A0A] border-[3px] border-cream/5 shadow-2xl flex items-center justify-center isolate">

        {/* Loading overlay */}
        {!cameraActive && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#111111]/80 backdrop-blur-md">
            <Loader2 className="w-12 h-12 text-clay animate-spin mb-4" />
            <p className="font-mono text-cream/70 text-sm tracking-widest uppercase">{loadingMsg}</p>
          </div>
        )}

        {/* Video + skeleton canvas (CSS-mirrored to act as a mirror) */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover -scale-x-100 z-10"
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover -scale-x-100 z-20"
        />

        {/* ── Full-body visibility warning ─────────────────────────────── */}
        {cameraActive && !isBodyVisible && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-yellow-400/90 text-black px-4 py-2 rounded-full font-mono text-xs tracking-widest uppercase font-bold backdrop-blur-md">
            <AlertTriangle size={14} />
            Step back — full body not visible
          </div>
        )}

        {/* ── Error badge (auth / offline) ─────────────────────────────── */}
        {analysisError && (
          <div className="absolute top-6 right-6 z-40 bg-red-900/70 border border-red-500/30 backdrop-blur-md text-red-300 text-[11px] font-mono uppercase tracking-widest px-3 py-1.5 rounded-full">
            {analysisError}
          </div>
        )}

        {/* ── TOP-LEFT HUD: system info + pose info ────────────────────── */}
        <div className="absolute top-8 left-8 z-30 flex flex-col gap-2">
          <div className="font-mono text-[10px] tracking-widest text-cream/40">SYSTEM LOAD</div>
          <div className="font-outfit text-2xl font-light text-cream">TFJS-MoveNet Thunder</div>

          {/* Detected pose name from our model */}
          {detectedPose && confidence >= CONFIDENCE_THRESHOLD && (
            <div className="mt-1 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00E676] animate-pulse" />
              <span className="font-mono text-xs text-[#00E676] tracking-widest uppercase">
                {formatPoseName(detectedPose)}
              </span>
              <span className="font-mono text-[10px] text-cream/40">
                {Math.round(confidence * 100)}% conf.
              </span>
            </div>
          )}

          {targetPose && (
            <div className="mt-4 bg-charcoal/60 backdrop-blur-md border border-cream/10 p-4 rounded-2xl max-w-xs">
              <h3 className="font-serif italic text-xl text-clay mb-1">{targetPose.sanskritName}</h3>
              <p className="font-outfit text-sm text-cream/80">
                Goal Duration: {targetPose.targetDurationSeconds}s
              </p>
            </div>
          )}
        </div>

        {/* ── BOTTOM-RIGHT: score gauge ─────────────────────────────────── */}
        <div className="absolute bottom-8 right-8 z-30 flex items-end gap-6">
          {targetPose?.imageUrl && (
            <div className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-clay/30 shadow-2xl relative">
              <img
                src={targetPose.imageUrl}
                alt={targetPose.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-center text-[10px] font-mono tracking-widest text-clay uppercase">
                Target Form
              </div>
            </div>
          )}

          {/* Score display — real or loading */}
          <div className="flex flex-col items-center gap-1 bg-charcoal/60 p-5 rounded-2xl backdrop-blur-md border border-cream/10 min-w-[90px]">
            <Activity
              fill="currentColor"
              size={16}
              className={displayScore !== null ? scoreColor(displayScore) : 'text-cream/30'}
            />
            <span
              className={`font-sans font-black text-3xl leading-none transition-colors duration-500 ${
                displayScore !== null ? scoreColor(displayScore) : 'text-cream/30'
              }`}
            >
              {displayScore !== null ? displayScore : '—'}
            </span>
            <p className="font-mono text-[10px] tracking-widest text-cream/50 uppercase mt-1">
              Form Score
            </p>
          </div>
        </div>

        {/* ── BOTTOM-LEFT: real-time corrections panel ──────────────────── */}
        {corrections.length > 0 && (
          <div className="absolute bottom-8 left-8 z-30 flex flex-col gap-2 max-w-xs">
            <p className="font-mono text-[10px] tracking-widest text-cream/40 uppercase mb-1">
              Corrections
            </p>
            {corrections.slice(0, 3).map((c, i) => (
              <div
                key={i}
                className="flex items-start gap-2 bg-charcoal/70 backdrop-blur-md border border-cream/10 px-3 py-2 rounded-xl"
              >
                <span className="text-sm leading-5 flex-shrink-0">
                  {SEVERITY_ICONS[c.severity] ?? '🟡'}
                </span>
                <span className={`text-sm font-outfit leading-5 ${SEVERITY_COLORS[c.severity] ?? 'text-cream/80'}`}>
                  {c.instruction}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* No corrections — good form message */}
        {cameraActive && displayScore !== null && corrections.length === 0 && (
          <div className="absolute bottom-8 left-8 z-30">
            <div className="flex items-center gap-2 bg-[#00E676]/10 border border-[#00E676]/30 backdrop-blur-md px-4 py-2 rounded-xl">
              <span className="text-[#00E676] text-sm font-outfit font-medium">
                ✓ Great form — keep holding!
              </span>
            </div>
          </div>
        )}

      </main>

      {/* Footer controls */}
      <footer className="session-ui mt-8 flex items-center justify-center gap-6 z-20">
        <button className="w-14 h-14 rounded-full bg-cream/10 flex items-center justify-center text-cream hover:bg-cream/20 hover:text-clay transition-all hover:scale-105">
          <Video size={24} />
        </button>
      </footer>
    </div>
  );
};

export default Session;
