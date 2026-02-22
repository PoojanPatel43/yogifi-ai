import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';
import { ArrowLeft, Video, Activity, Loader2 } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import api from '../lib/api';

interface PoseData {
  id: string;
  name: string;
  sanskritName: string;
  imageUrl?: string;
  targetDurationSeconds: number;
}

const Session: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [cameraActive, setCameraActive] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('Initializing Neural Engine...');
  const [searchParams] = useSearchParams();
  const poseId = searchParams.get('poseId');
  const [targetPose, setTargetPose] = useState<PoseData | null>(null);

  useEffect(() => {
    if (poseId) {
      api.get(`/poses/${poseId}`).then(res => {
        if (res.data?.data) setTargetPose(res.data.data);
      }).catch(console.error);
    }
  }, [poseId]);

  useGSAP(() => {
    gsap.from('.session-ui', {
      opacity: 0,
      y: 20,
      stagger: 0.1,
      duration: 1,
      ease: 'power3.out'
    });
  }, { scope: containerRef });

  useEffect(() => {
    let detector: poseDetection.PoseDetector | null = null;
    let animationFrameId: number;

    const setupAI = async () => {
      try {
        setLoadingMsg('Loading MoveNet Model...');
        await tf.ready();
        
        const detectorConfig = { modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER };
        detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig);
        
        setLoadingMsg('Model Ready. Requesting Camera...');
        
        await startCamera();
      } catch (err) {
        setLoadingMsg('Failed to initialize AI or Camera. Please allow camera permissions.');
        console.error(err);
      }
    };

    const startCamera = async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
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
            // Start detection loop
            detectPose();
          };
        }
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
      const video = videoRef.current;
      if (!canvas || !video) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (poses.length > 0) {
        const pose = poses[0];
        
        // Draw Skeleton Lines
        const adjacentKeyPoints = poseDetection.util.getAdjacentPairs(poseDetection.SupportedModels.MoveNet);
        ctx.strokeStyle = '#CC5833'; // clay color
        ctx.lineWidth = 4;
        
        adjacentKeyPoints.forEach((pair) => {
          const kp1 = pose.keypoints[pair[0]];
          const kp2 = pose.keypoints[pair[1]];

          // Only draw if confidence is high enough
          if (kp1.score && kp1.score > 0.4 && kp2.score && kp2.score > 0.4) {
            ctx.beginPath();
            ctx.moveTo(kp1.x, kp1.y);
            ctx.lineTo(kp2.x, kp2.y);
            ctx.stroke();
          }
        });

        // Draw Keypoints
        pose.keypoints.forEach((keypoint) => {
          if (keypoint.score && keypoint.score > 0.4) {
            ctx.beginPath();
            ctx.arc(keypoint.x, keypoint.y, 6, 0, 2 * Math.PI);
            ctx.fillStyle = '#2E4036'; // moss color
            ctx.fill();
            ctx.strokeStyle = '#F2F0E9'; // cream color outline
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        });
      }
    };

    setupAI();

    const currentVideo = videoRef.current;
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (currentVideo && currentVideo.srcObject) {
        const stream = currentVideo.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen bg-[#111111] text-cream font-sans flex flex-col pt-6 pb-6 px-6 relative overflow-hidden">
      {/* Navbar overlay */}
      <header className="session-ui flex items-center justify-between mb-8 z-20">
        <Link to="/dashboard" className="flex items-center gap-2 text-cream/60 hover:text-clay transition-colors group">
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-outfit font-medium">End Session</span>
        </Link>
        <div className="font-mono text-xs tracking-widest uppercase text-moss bg-moss/10 px-4 py-2 rounded-full border border-moss/20 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-moss animate-pulse" />
          {targetPose ? `Tracking: ${targetPose.name}` : 'Live Telemetry'}
        </div>
      </header>

      {/* Main AI Viewfinder */}
      <main className="session-ui flex-1 relative rounded-[3rem] overflow-hidden bg-[#0A0A0A] border-[3px] border-cream/5 shadow-2xl flex items-center justify-center isolate">
        
        {/* Loading Overlay */}
        {!cameraActive && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#111111]/80 backdrop-blur-md">
            <Loader2 className="w-12 h-12 text-clay animate-spin mb-4" />
            <p className="font-mono text-cream/70 text-sm tracking-widest uppercase">{loadingMsg}</p>
          </div>
        )}

        {/* Video & Canvas Elements */}
        {/* We use scaleX(-1) to mirror the camera so it acts like a mirror to the user */}
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

        {/* Cinematic HUD Overlays */}
        <div className="absolute top-8 left-8 z-30 flex flex-col gap-2">
          <div className="font-mono text-[10px] tracking-widest text-cream/40">SYSTEM LOAD</div>
          <div className="font-outfit text-2xl font-light text-cream">TFJS-MoveNet Thunder</div>
          {targetPose && (
            <div className="mt-4 bg-charcoal/60 backdrop-blur-md border border-cream/10 p-4 rounded-2xl max-w-xs">
              <h3 className="font-serif italic text-xl text-clay mb-1">{targetPose.sanskritName}</h3>
              <p className="font-outfit text-sm text-cream/80">Goal Duration: {targetPose.targetDurationSeconds}s</p>
            </div>
          )}
        </div>

        <div className="absolute bottom-8 right-8 z-30 flex items-end gap-6">
          {targetPose?.imageUrl && (
            <div className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-clay/30 shadow-2xl relative">
               <img src={targetPose.imageUrl} alt={targetPose.name} className="w-full h-full object-cover" />
               <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-center text-[10px] font-mono tracking-widest text-clay uppercase">
                 Target Form
               </div>
            </div>
          )}
          <div className="flex flex-col items-end gap-2 bg-charcoal/40 p-4 rounded-xl backdrop-blur-md border border-cream/10">
            <div className="flex items-center gap-2 text-clay">
              <Activity fill="currentColor" size={16} />
              <span className="font-sans font-bold text-lg">96.4%</span>
            </div>
            <p className="font-mono text-[10px] tracking-widest text-cream/50 uppercase">Form Integrity</p>
          </div>
        </div>

      </main>

      {/* Footer Controls */}
      <footer className="session-ui mt-8 flex items-center justify-center gap-6 z-20">
        <button className="w-14 h-14 rounded-full bg-cream/10 flex items-center justify-center text-cream hover:bg-cream/20 hover:text-clay transition-all hover:scale-105 group">
           <Video size={24} />
        </button>
      </footer>
      
    </div>
  );
};

export default Session;
