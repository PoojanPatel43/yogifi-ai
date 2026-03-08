import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Camera, Check } from 'lucide-react';
import BrutalistCursor from '../components/BrutalistCursor';

type Level = 'beginner' | 'intermediate' | 'advanced';
type Goal  = 'flexibility' | 'strength' | 'mindfulness' | 'weight';

const TOTAL_STEPS = 4;

/* ── Acid pill step indicator ─────────────────────────────────────────── */
const StepPills = ({ step }: { step: number }) => (
  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
    {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
      const done    = i < step - 1;
      const current = i === step - 1;
      return (
        <div
          key={i}
          style={{
            height: '28px',
            width:  current ? '56px' : '28px',
            background:  done || current ? 'var(--acid)' : 'var(--bg)',
            border:      '2px solid var(--brutal)',
            boxShadow:   done || current ? '3px 3px 0 0 var(--brutal)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.3s ease',
            flexShrink: 0,
          }}
        >
          {done && <Check size={12} style={{ color: 'var(--brutal)', strokeWidth: 3 }} />}
          {current && (
            <span style={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.06em', color: 'var(--brutal)' }}>
              {step}/{TOTAL_STEPS}
            </span>
          )}
        </div>
      );
    })}
  </div>
);

/* ── Step 1 — Level ─────────────────────────────────────────────────── */
const StepLevel = ({ value, onChange }: { value: Level | null; onChange: (v: Level) => void }) => {
  const levels: { id: Level; label: string; desc: string }[] = [
    { id: 'beginner',     label: 'Beginner',     desc: 'New to yoga, starting fresh'      },
    { id: 'intermediate', label: 'Intermediate', desc: '1–3 years of regular practice'    },
    { id: 'advanced',     label: 'Advanced',     desc: '3+ years, complex poses mastered' },
  ];

  return (
    <div>
      <h2 style={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', color: 'var(--ink)', lineHeight: 1.05, marginBottom: '0.75rem' }}>
        What's your yoga level?
      </h2>
      <p style={{ color: 'var(--muted)', fontWeight: 300, marginBottom: '2rem' }}>
        We'll personalise your sessions and difficulty accordingly.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {levels.map(l => {
          const active = value === l.id;
          return (
            <button
              key={l.id}
              onClick={() => onChange(l.id)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '1.25rem 1.5rem',
                background: active ? 'var(--brutal)' : 'var(--bg)',
                color:      active ? 'var(--bg)'     : 'var(--ink)',
                border: '2px solid var(--brutal)',
                boxShadow: active ? 'none' : '4px 4px 0 0 var(--brutal)',
                cursor: 'pointer', textAlign: 'left',
                transform: active ? 'translate(4px,4px)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              <div>
                <p style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.2rem', fontFamily: '"Space Grotesk", sans-serif' }}>{l.label}</p>
                <p style={{ fontSize: '0.8rem', color: active ? 'rgba(247,244,238,0.6)' : 'var(--muted)', fontWeight: 300 }}>{l.desc}</p>
              </div>
              {active && (
                <div style={{ background: 'var(--acid)', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Check size={14} style={{ color: 'var(--brutal)', strokeWidth: 3 }} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ── Step 2 — Goals ─────────────────────────────────────────────────── */
const StepGoals = ({ value, onChange }: { value: Goal[]; onChange: (v: Goal[]) => void }) => {
  const goals: { id: Goal; label: string; desc: string; emoji: string }[] = [
    { id: 'flexibility', label: 'Flexibility',  desc: 'Range of motion & mobility', emoji: '🧘' },
    { id: 'strength',    label: 'Strength',     desc: 'Build muscle and stability',  emoji: '💪' },
    { id: 'mindfulness', label: 'Mindfulness',  desc: 'Reduce stress, focus',        emoji: '🧠' },
    { id: 'weight',      label: 'Weight Loss',  desc: 'Burn calories, tone body',    emoji: '⚡' },
  ];

  const toggle = (id: Goal) =>
    onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id]);

  return (
    <div>
      <h2 style={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', color: 'var(--ink)', lineHeight: 1.05, marginBottom: '0.75rem' }}>
        What are your goals?
      </h2>
      <p style={{ color: 'var(--muted)', fontWeight: 300, marginBottom: '2rem' }}>
        Select all that apply — we'll build a plan around them.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        {goals.map(g => {
          const active = value.includes(g.id);
          return (
            <button
              key={g.id}
              onClick={() => toggle(g.id)}
              style={{
                display: 'flex', flexDirection: 'column', gap: '0.5rem',
                padding: '1.25rem', position: 'relative',
                background: active ? 'var(--brutal)' : 'var(--bg)',
                color:      active ? 'var(--bg)'     : 'var(--ink)',
                border: '2px solid var(--brutal)',
                boxShadow: active ? 'none' : '4px 4px 0 0 var(--brutal)',
                cursor: 'pointer', textAlign: 'left',
                transform: active ? 'translate(4px,4px)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>{g.emoji}</span>
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.15rem', fontFamily: '"Space Grotesk", sans-serif' }}>{g.label}</p>
                <p style={{ fontSize: '0.75rem', color: active ? 'rgba(247,244,238,0.55)' : 'var(--muted)', fontWeight: 300 }}>{g.desc}</p>
              </div>
              {active && (
                <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'var(--acid)', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={11} style={{ color: 'var(--brutal)', strokeWidth: 3 }} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ── Step 3 — Camera ─────────────────────────────────────────────────── */
const StepCamera = ({ granted, onRequest }: { granted: boolean; onRequest: () => void }) => (
  <div>
    <h2 style={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', color: 'var(--ink)', lineHeight: 1.05, marginBottom: '0.75rem' }}>
      Enable your camera
    </h2>
    <p style={{ color: 'var(--muted)', fontWeight: 300, marginBottom: '2rem', lineHeight: 1.7 }}>
      Yogifi AI needs camera access to track your poses in real time. Your video{' '}
      <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>never leaves your device</strong> — all processing happens locally.
    </p>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '2rem' }}>
      {[
        { label: 'Private',    desc: 'Video stays on device',     icon: '🔒' },
        { label: 'Real-Time',  desc: 'Instant pose feedback',     icon: '⚡' },
        { label: 'No Storage', desc: 'Nothing saved or uploaded', icon: '🚫' },
      ].map(({ label, desc, icon }) => (
        <div
          key={label}
          style={{ background: 'var(--bg)', padding: '1.25rem', textAlign: 'center', border: '2px solid var(--brutal)', boxShadow: '4px 4px 0 0 var(--brutal)' }}
        >
          <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{icon}</p>
          <p style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.3rem', fontFamily: '"Space Grotesk", sans-serif' }}>{label}</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 300 }}>{desc}</p>
        </div>
      ))}
    </div>

    {granted ? (
      <div style={{ background: 'var(--acid)', border: '2px solid var(--brutal)', boxShadow: '4px 4px 0 0 var(--brutal)', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Check size={18} style={{ color: 'var(--brutal)', strokeWidth: 3, flexShrink: 0 }} />
        <p style={{ color: 'var(--brutal)', fontWeight: 600, fontFamily: '"Space Grotesk", sans-serif', fontSize: '0.9rem' }}>
          Camera access granted — you're all set!
        </p>
      </div>
    ) : (
      <button onClick={onRequest} className="btn-brutalist" style={{ padding: '0.875rem 2rem' }}>
        <Camera size={16} />
        <span>Allow Camera Access</span>
      </button>
    )}
  </div>
);

/* ── Step 4 — Tutorial ───────────────────────────────────────────────── */
const StepTutorial = () => {
  const poses = [
    { name: 'Mountain Pose', sanskrit: 'Tadasana', cues: ['Stand tall, feet hip-width', 'Arms relaxed at sides', 'Core gently engaged'] },
    { name: 'Warrior II',    sanskrit: 'Virabhadrasana II', cues: ['Front knee over ankle', 'Arms parallel to ground', 'Gaze over front fingers'] },
  ];

  return (
    <div>
      <h2 style={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', color: 'var(--ink)', lineHeight: 1.05, marginBottom: '0.75rem' }}>
        What good form looks like
      </h2>
      <p style={{ color: 'var(--muted)', fontWeight: 300, marginBottom: '2rem' }}>
        Yogifi AI tracks these alignment points in real time during your session.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        {poses.map(pose => (
          <div key={pose.name} style={{ background: 'var(--bg)', padding: '1.5rem', border: '2px solid var(--brutal)', boxShadow: '4px 4px 0 0 var(--brutal)' }}>
            <p className="ck-label" style={{ marginBottom: '0.25rem', color: 'var(--accent)' }}>{pose.sanskrit}</p>
            <p style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--ink)', marginBottom: '1rem', fontFamily: '"Space Grotesk", sans-serif' }}>{pose.name}</p>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', listStyle: 'none', padding: 0, margin: 0 }}>
              {pose.cues.map(cue => (
                <li key={cue} style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 300, paddingLeft: '1rem', borderLeft: '2px solid var(--accent)' }}>
                  {cue}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Main component ─────────────────────────────────────────────────── */
const Onboarding = () => {
  const navigate = useNavigate();
  const [step,     setStep]     = useState(1);
  const [level,    setLevel]    = useState<Level | null>(null);
  const [goals,    setGoals]    = useState<Goal[]>([]);
  const [cameraOk, setCameraOk] = useState(false);

  const requestCamera = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraOk(true);
    } catch {
      setCameraOk(false);
    }
  };

  const canAdvance = () => {
    if (step === 1) return level !== null;
    if (step === 2) return goals.length > 0;
    return true;
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) setStep(s => s + 1);
    else navigate('/dashboard');
  };

  return (
    <>
      <BrutalistCursor />
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2rem 3rem', borderBottom: '1px solid var(--line)' }}>
          <span style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '1.3rem', color: 'var(--ink)' }}>
            Yogifi AI
          </span>
          {step < TOTAL_STEPS && (
            <button
              onClick={() => navigate('/dashboard')}
              style={{ color: 'var(--muted)', fontSize: '0.8rem', fontWeight: 300, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Skip for now
            </button>
          )}
        </header>

        {/* Progress pills */}
        <div style={{ padding: '2rem 3rem 0' }}>
          <div style={{ maxWidth: '600px' }}>
            <StepPills step={step} />
          </div>
        </div>

        {/* Step content */}
        <main style={{ flex: 1, padding: '2.5rem 3rem' }}>
          <div style={{ maxWidth: '600px' }}>
            {step === 1 && <StepLevel value={level} onChange={setLevel} />}
            {step === 2 && <StepGoals value={goals} onChange={setGoals} />}
            {step === 3 && <StepCamera granted={cameraOk} onRequest={requestCamera} />}
            {step === 4 && <StepTutorial />}
          </div>
        </main>

        {/* Footer CTA */}
        <div style={{ padding: '2rem 3rem', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'center' }}>
          <div style={{ maxWidth: '600px', width: '100%', display: 'flex', gap: '0.75rem' }}>
            {step > 1 && (
              <button
                onClick={() => setStep(s => s - 1)}
                style={{ color: 'var(--ink)', background: 'none', border: '2px solid var(--ink)', padding: '0.75rem 1.5rem', cursor: 'pointer', fontWeight: 400, fontSize: '0.875rem', fontFamily: '"Space Grotesk", sans-serif' }}
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!canAdvance()}
              className="btn-brutalist"
              style={{ flex: 1, justifyContent: 'center', padding: '0.875rem 2rem', opacity: !canAdvance() ? 0.4 : 1 }}
            >
              <span>{step === TOTAL_STEPS ? 'Start Practicing' : 'Continue'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Onboarding;
