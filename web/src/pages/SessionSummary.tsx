import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Star, TrendingUp, Share2, ArrowRight, Trophy, Flame, CheckCircle } from 'lucide-react';

interface PoseResult {
  name:      string;
  accuracy:  number;
  duration:  number;
  feedback:  string;
}

/* ── Animated score ring ─────────────────────────────────────────────── */
const ScoreRing = ({ score }: { score: number }) => {
  const radius      = 70;
  const circumference = 2 * Math.PI * radius;
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    let frame: number;
    const start   = performance.now();
    const duration = 1800;
    const animate  = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const ease     = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(ease * score));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const offset = circumference - (displayed / 100) * circumference;
  const color  = score >= 80 ? '#D4AF37' : score >= 60 ? '#87A878' : '#CC5833';

  return (
    <div className="relative w-44 h-44 flex items-center justify-center">
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={radius} stroke="rgba(27,67,50,0.1)" strokeWidth="10" fill="none" />
        <circle
          cx="80" cy="80" r={radius}
          stroke={color} strokeWidth="10" fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.05s linear' }}
        />
      </svg>
      <div className="flex flex-col items-center">
        <span className="font-sans font-bold text-4xl text-charcoal dark:text-warmwhite leading-none">{displayed}</span>
        <span className="font-mono text-xs text-charcoal/40 dark:text-warmwhite/35 mt-1">/ 100</span>
      </div>
    </div>
  );
};

/* ── Pose accuracy bar ───────────────────────────────────────────────── */
const PoseBar = ({ pose }: { pose: PoseResult }) => {
  const [width, setWidth] = useState(0);
  const color = pose.accuracy >= 80 ? 'from-sage to-gold' : pose.accuracy >= 60 ? 'from-gold/70 to-gold' : 'from-clay/70 to-clay';

  useEffect(() => {
    const t = setTimeout(() => setWidth(pose.accuracy), 200);
    return () => clearTimeout(t);
  }, [pose.accuracy]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <span className="font-sans font-semibold text-sm text-charcoal dark:text-warmwhite">{pose.name}</span>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-charcoal/45 dark:text-warmwhite/35">{pose.duration}s hold</span>
          <span className="font-bold text-sm text-charcoal dark:text-warmwhite">{pose.accuracy}%</span>
        </div>
      </div>
      <div className="h-2 bg-charcoal/8 dark:bg-warmwhite/8 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${width}%` }}
        />
      </div>
      <p className="font-outfit text-xs text-charcoal/40 dark:text-warmwhite/30">{pose.feedback}</p>
    </div>
  );
};

/* ── Main summary page ───────────────────────────────────────────────── */
const SessionSummary = () => {
  const navigate  = useNavigate();
  const container = useRef<HTMLDivElement>(null);

  // Mock session data — in production this comes from router state or API
  const sessionData = {
    score:       87,
    duration:    '24 min',
    posesCount:  6,
    streak:      12,
    newBadge:    true,
    aiInsight:   'Your Warrior II alignment improved 8° in hip rotation since last session. Focus on opening the chest more in Triangle Pose next time.',
    poses: [
      { name: 'Mountain Pose',  accuracy: 96, duration: 45, feedback: 'Excellent alignment — body fully vertical' },
      { name: 'Warrior II',     accuracy: 89, duration: 60, feedback: 'Good hip depth, slight front knee drift'   },
      { name: 'Tree Pose',      accuracy: 82, duration: 30, feedback: 'Balance improved from last session'         },
      { name: 'Triangle Pose',  accuracy: 74, duration: 40, feedback: 'Chest rotation needs more opening'          },
      { name: 'Downward Dog',   accuracy: 91, duration: 50, feedback: 'Strong form, heels almost to floor'         },
      { name: 'Child\'s Pose',  accuracy: 98, duration: 35, feedback: 'Perfect resting position'                  },
    ] as PoseResult[],
  };

  useGSAP(() => {
    gsap.from('.summary-elem', {
      y: 30,
      opacity: 0,
      stagger: 0.1,
      ease: 'power2.out',
      duration: 0.8,
      delay: 0.2,
    });
  }, { scope: container });

  return (
    <div ref={container} className="min-h-screen bg-warmwhite dark:bg-forest-dark px-6 md:px-12 py-10 font-sans">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="summary-elem flex items-center justify-between mb-10">
          <div>
            <div className="section-label mb-2 !bg-gold/10 !text-gold">Session Complete</div>
            <h1 className="font-serif italic text-3xl md:text-4xl text-forest dark:text-warmwhite">
              Great work today! 🌿
            </h1>
          </div>
          <button
            className="p-3 rounded-xl border border-charcoal/10 dark:border-warmwhite/10 hover:bg-charcoal/5 dark:hover:bg-warmwhite/5 transition-colors"
            aria-label="Share session"
          >
            <Share2 size={18} className="text-charcoal/50 dark:text-warmwhite/50" />
          </button>
        </div>

        {/* Score hero card */}
        <div className="summary-elem bg-forest rounded-[2rem] p-8 flex flex-col md:flex-row items-center gap-8 mb-6">
          <ScoreRing score={sessionData.score} />
          <div className="flex-1 text-center md:text-left">
            <p className="font-mono text-xs text-warmwhite/40 tracking-widest mb-2">OVERALL SCORE</p>
            <h2 className="font-sans font-bold text-warmwhite text-2xl mb-1">
              {sessionData.score >= 80 ? 'Outstanding session' : sessionData.score >= 60 ? 'Good progress' : 'Keep practicing'}
            </h2>
            <p className="font-outfit text-warmwhite/55 mb-5">
              {sessionData.duration} · {sessionData.posesCount} poses completed
            </p>
            {/* Quick stats row */}
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              {[
                { icon: <Flame size={14} />, label: `${sessionData.streak}-day streak`, color: 'text-gold' },
                { icon: <CheckCircle size={14} />, label: `${sessionData.posesCount} poses`, color: 'text-sage' },
                { icon: <Star size={14} />, label: 'Top score', color: 'text-gold' },
              ].map(({ icon, label, color }) => (
                <div key={label} className={`flex items-center gap-1.5 font-mono text-xs ${color}`}>
                  {icon} {label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Achievement badge */}
        {sessionData.newBadge && (
          <div className="summary-elem bg-gold/10 border border-gold/20 rounded-2xl p-5 flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-gold/15 flex items-center justify-center shrink-0">
              <Trophy size={22} className="text-gold" />
            </div>
            <div>
              <p className="font-sans font-bold text-charcoal dark:text-warmwhite text-sm">New achievement unlocked!</p>
              <p className="font-outfit text-xs text-charcoal/50 dark:text-warmwhite/45 mt-0.5">
                "Two-Week Warrior" — 14 days of consecutive practice
              </p>
            </div>
          </div>
        )}

        {/* Per-pose breakdown */}
        <div className="summary-elem bg-warmwhite dark:bg-forest/20 border border-charcoal/8 dark:border-warmwhite/8 rounded-[2rem] p-6 md:p-8 mb-6">
          <h3 className="font-sans font-bold text-lg text-charcoal dark:text-warmwhite mb-6 flex items-center gap-2">
            <TrendingUp size={18} className="text-forest dark:text-sage" />
            Pose Breakdown
          </h3>
          <div className="flex flex-col gap-6">
            {sessionData.poses.map(pose => (
              <PoseBar key={pose.name} pose={pose} />
            ))}
          </div>
        </div>

        {/* AI Insights */}
        <div className="summary-elem bg-forest/6 dark:bg-forest/30 border border-forest/12 dark:border-forest/40 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-sage animate-pulse" />
            <span className="font-mono text-xs text-forest dark:text-sage tracking-widest">AI COACHING INSIGHT</span>
          </div>
          <p className="font-outfit text-charcoal dark:text-warmwhite/80 leading-relaxed">
            {sessionData.aiInsight}
          </p>
        </div>

        {/* CTAs */}
        <div className="summary-elem flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate('/session')}
            className="btn-primary flex-1 !py-4 text-base"
          >
            <span>Start Next Session</span>
            <ArrowRight size={18} />
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-secondary flex-1 !py-4 text-base"
          >
            View Progress
          </button>
        </div>

      </div>
    </div>
  );
};

export default SessionSummary;
