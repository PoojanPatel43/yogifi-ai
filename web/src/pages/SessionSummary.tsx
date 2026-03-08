import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Share2, TrendingUp } from 'lucide-react';
import BrutalistCursor from '../components/BrutalistCursor';

interface PoseResult {
  name:     string;
  accuracy: number;
  duration: number;
  feedback: string;
}

/* ── Animated score ring ─────────────────────────────────────────────── */
const ScoreRing = ({ score }: { score: number }) => {
  const radius       = 65;
  const circumference = 2 * Math.PI * radius;
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    let frame: number;
    const start    = performance.now();
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
  const color  = score >= 80 ? '#C9472F' : score >= 60 ? '#6B6760' : '#D4813A';

  return (
    <div style={{ position: 'relative', width: '160px', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={radius} stroke="var(--line)" strokeWidth="6" fill="none" />
        <circle
          cx="80" cy="80" r={radius}
          stroke={color} strokeWidth="6" fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.05s linear' }}
        />
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={{
          fontFamily: '"Playfair Display", serif',
          fontStyle: 'italic',
          fontSize: '2.5rem',
          color: 'var(--ink)',
          lineHeight: 1,
        }}>
          {displayed}
        </span>
        <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '0.6rem', color: 'var(--muted)', letterSpacing: '0.08em' }}>/ 100</span>
      </div>
    </div>
  );
};

/* ── Pose accuracy bar ───────────────────────────────────────────────── */
const PoseBar = ({ pose }: { pose: PoseResult }) => {
  const [width, setWidth] = useState(0);
  const barColor = pose.accuracy >= 80 ? 'var(--accent)' : pose.accuracy >= 60 ? 'var(--muted)' : 'var(--ink)';

  useEffect(() => {
    const t = setTimeout(() => setWidth(pose.accuracy), 200);
    return () => clearTimeout(t);
  }, [pose.accuracy]);

  return (
    <div style={{ paddingBottom: '1.25rem', borderBottom: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontWeight: 400, fontSize: '0.9rem', color: 'var(--ink)' }}>{pose.name}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '0.7rem', color: 'var(--muted)' }}>{pose.duration}s</span>
          <span style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--ink)' }}>{pose.accuracy}%</span>
        </div>
      </div>
      <div style={{ height: '2px', background: 'var(--line)', overflow: 'hidden' }}>
        <div style={{ height: '100%', background: barColor, width: `${width}%`, transition: 'width 1s ease-out' }} />
      </div>
      <p style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 300 }}>{pose.feedback}</p>
    </div>
  );
};

/* ── Main ────────────────────────────────────────────────────────────── */
const SessionSummary = () => {
  const navigate  = useNavigate();
  const container = useRef<HTMLDivElement>(null);

  const sessionData = {
    score:      87,
    duration:   '24 min',
    posesCount: 6,
    streak:     12,
    aiInsight:  'Your Warrior II alignment improved 8° in hip rotation since last session. Focus on opening the chest more in Triangle Pose next time.',
    poses: [
      { name: 'Mountain Pose', accuracy: 96, duration: 45, feedback: 'Excellent alignment — body fully vertical'  },
      { name: 'Warrior II',    accuracy: 89, duration: 60, feedback: 'Good hip depth, slight front knee drift'     },
      { name: 'Tree Pose',     accuracy: 82, duration: 30, feedback: 'Balance improved from last session'          },
      { name: 'Triangle Pose', accuracy: 74, duration: 40, feedback: 'Chest rotation needs more opening'           },
      { name: 'Downward Dog',  accuracy: 91, duration: 50, feedback: 'Strong form, heels almost to floor'          },
      { name: "Child's Pose",  accuracy: 98, duration: 35, feedback: 'Perfect resting position'                    },
    ] as PoseResult[],
  };

  return (
    <>
    <BrutalistCursor />
    <div ref={container} style={{ minHeight: '100vh', background: 'var(--bg)', padding: '3rem 2rem' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '3rem' }}>
          <div>
            <p className="ck-label" style={{ marginBottom: '0.5rem', color: 'var(--accent)' }}>Session Complete</p>
            <h1 style={{
              fontFamily: '"Playfair Display", serif',
              fontStyle: 'italic',
              fontSize: 'clamp(2rem, 4vw, 2.75rem)',
              color: 'var(--ink)',
              lineHeight: 1.1,
            }}>
              Great work today.
            </h1>
          </div>
          <button
            style={{ background: 'none', border: '1px solid var(--line)', padding: '0.625rem', cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center' }}
            aria-label="Share session"
          >
            <Share2 size={16} />
          </button>
        </div>

        {/* Score hero — dark brutal block */}
        <div style={{ background: 'var(--brutal)', color: 'var(--bg)', padding: '2.5rem', display: 'flex', alignItems: 'center', gap: '2.5rem', marginBottom: '2px', flexWrap: 'wrap', border: '2px solid var(--brutal)', boxShadow: '8px 8px 0 0 var(--acid)' }}>
          <ScoreRing score={sessionData.score} />
          <div style={{ flex: 1, minWidth: '200px' }}>
            <p style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '0.65rem', letterSpacing: '0.1em', color: 'rgba(247,244,238,0.4)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              Overall Score
            </p>
            <h2 style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '1.5rem', color: 'var(--bg)', marginBottom: '0.5rem', lineHeight: 1.2 }}>
              {sessionData.score >= 80 ? 'Outstanding session' : sessionData.score >= 60 ? 'Good progress' : 'Keep practicing'}
            </h2>
            <p style={{ color: 'rgba(247,244,238,0.45)', fontWeight: 300, fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              {sessionData.duration} · {sessionData.posesCount} poses completed
            </p>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              {[
                { label: `${sessionData.streak}-day streak` },
                { label: `${sessionData.posesCount} poses`  },
                { label: 'Top score'                         },
              ].map(({ label }) => (
                <span key={label} style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '0.7rem', color: 'var(--accent)', letterSpacing: '0.06em' }}>
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* AI insight */}
        <div style={{ background: 'var(--surface)', padding: '1.75rem', marginBottom: '2px', borderLeft: '3px solid var(--accent)', border: '2px solid var(--brutal)', boxShadow: '4px 4px 0 0 var(--brutal)' }}>
          <p className="ck-label" style={{ marginBottom: '0.75rem', color: 'var(--accent)' }}>AI Coaching Insight</p>
          <p style={{ color: 'var(--ink)', fontWeight: 300, lineHeight: 1.7, fontSize: '0.9rem' }}>
            {sessionData.aiInsight}
          </p>
        </div>

        {/* Pose breakdown */}
        <div style={{ background: 'var(--bg)', padding: '2rem', border: '2px solid var(--brutal)', boxShadow: '4px 4px 0 0 var(--brutal)', marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.75rem' }}>
            <TrendingUp size={15} style={{ color: 'var(--muted)' }} />
            <h3 style={{
              fontFamily: '"Playfair Display", serif',
              fontStyle: 'italic',
              fontSize: '1.2rem',
              color: 'var(--ink)',
            }}>
              Pose Breakdown
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {sessionData.poses.map(pose => (
              <PoseBar key={pose.name} pose={pose} />
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/session')}
            className="btn-brutalist"
            style={{ flex: 1, justifyContent: 'center', padding: '0.875rem' }}
          >
            <span>Start Next Session</span>
            <ArrowRight size={16} />
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            style={{ flex: 1, padding: '0.875rem', background: 'none', border: '1px solid var(--ink)', color: 'var(--ink)', cursor: 'pointer', fontWeight: 300, fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            View Progress
          </button>
        </div>
      </div>
    </div>
    </>
  );
};

export default SessionSummary;
