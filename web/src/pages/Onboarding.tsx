import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Camera, Check, ChevronRight, Leaf } from 'lucide-react';

type Level = 'beginner' | 'intermediate' | 'advanced';
type Goal  = 'flexibility' | 'strength' | 'mindfulness' | 'weight';

const TOTAL_STEPS = 4;

const ProgressBar = ({ step }: { step: number }) => (
  <div className="flex items-center gap-2">
    {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
      <div
        key={i}
        className={`h-1 rounded-full transition-all duration-500 ${
          i < step ? 'bg-gold' : i === step - 1 ? 'bg-gold' : 'bg-forest/15 dark:bg-warmwhite/10'
        } ${i === step - 1 ? 'flex-[2]' : 'flex-1'}`}
      />
    ))}
  </div>
);

/* ── Step 1 — Level ─────────────────────────────────────────────────── */
const StepLevel = ({ value, onChange }: { value: Level | null; onChange: (v: Level) => void }) => {
  const levels: { id: Level; label: string; emoji: string; desc: string }[] = [
    { id: 'beginner',     label: 'Beginner',     emoji: '🌱', desc: 'New to yoga, starting fresh'      },
    { id: 'intermediate', label: 'Intermediate', emoji: '🌿', desc: '1–3 years of regular practice'    },
    { id: 'advanced',     label: 'Advanced',     emoji: '🌳', desc: '3+ years, complex poses mastered' },
  ];

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-serif italic text-[clamp(2rem,4vw,3rem)] text-forest dark:text-warmwhite leading-tight mb-2">
        What's your yoga level?
      </h2>
      <p className="font-outfit text-charcoal/55 dark:text-warmwhite/45 mb-6">
        We'll personalise your sessions and difficulty accordingly.
      </p>
      {levels.map(l => (
        <button
          key={l.id}
          onClick={() => onChange(l.id)}
          className={`flex items-center gap-5 p-5 rounded-2xl border-2 text-left transition-all duration-200
            ${value === l.id
              ? 'border-gold bg-gold/8 dark:bg-gold/6'
              : 'border-charcoal/10 dark:border-warmwhite/10 hover:border-forest/30 dark:hover:border-warmwhite/25'
            }`}
        >
          <span className="text-2xl">{l.emoji}</span>
          <div className="flex-1">
            <p className="font-sans font-bold text-charcoal dark:text-warmwhite">{l.label}</p>
            <p className="font-outfit text-sm text-charcoal/50 dark:text-warmwhite/40">{l.desc}</p>
          </div>
          {value === l.id && <Check size={18} className="text-gold shrink-0" />}
        </button>
      ))}
    </div>
  );
};

/* ── Step 2 — Goals ─────────────────────────────────────────────────── */
const StepGoals = ({ value, onChange }: { value: Goal[]; onChange: (v: Goal[]) => void }) => {
  const goals: { id: Goal; label: string; emoji: string; desc: string }[] = [
    { id: 'flexibility', label: 'Flexibility',  emoji: '🤸', desc: 'Improve range of motion & mobility' },
    { id: 'strength',    label: 'Strength',     emoji: '💪', desc: 'Build muscle and body stability'    },
    { id: 'mindfulness', label: 'Mindfulness',  emoji: '🧘', desc: 'Reduce stress, improve focus'       },
    { id: 'weight',      label: 'Weight Loss',  emoji: '🔥', desc: 'Burn calories, tone body'           },
  ];

  const toggle = (id: Goal) => {
    onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id]);
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-serif italic text-[clamp(2rem,4vw,3rem)] text-forest dark:text-warmwhite leading-tight mb-2">
        What are your goals?
      </h2>
      <p className="font-outfit text-charcoal/55 dark:text-warmwhite/45 mb-6">
        Select all that apply — we'll build a plan around them.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {goals.map(g => {
          const active = value.includes(g.id);
          return (
            <button
              key={g.id}
              onClick={() => toggle(g.id)}
              className={`flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-200
                ${active
                  ? 'border-gold bg-gold/8 dark:bg-gold/6'
                  : 'border-charcoal/10 dark:border-warmwhite/10 hover:border-forest/30 dark:hover:border-warmwhite/25'
                }`}
            >
              <span className="text-xl">{g.emoji}</span>
              <div className="flex-1">
                <p className="font-sans font-bold text-sm text-charcoal dark:text-warmwhite">{g.label}</p>
                <p className="font-outfit text-xs text-charcoal/45 dark:text-warmwhite/35">{g.desc}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
                ${active ? 'border-gold bg-gold' : 'border-charcoal/20 dark:border-warmwhite/20'}`}>
                {active && <Check size={11} className="text-forest" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ── Step 3 — Camera permission ─────────────────────────────────────── */
const StepCamera = ({ granted, onRequest }: { granted: boolean; onRequest: () => void }) => (
  <div className="flex flex-col gap-6">
    <h2 className="font-serif italic text-[clamp(2rem,4vw,3rem)] text-forest dark:text-warmwhite leading-tight mb-2">
      Enable your camera
    </h2>
    <p className="font-outfit text-charcoal/55 dark:text-warmwhite/45 leading-relaxed">
      Yogifi AI needs camera access to track your poses in real time. Your video
      <strong className="text-forest dark:text-sage"> never leaves your device</strong> — all processing happens locally.
    </p>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-4">
      {[
        { icon: '🔒', title: 'Private',  desc: 'Video stays on device'    },
        { icon: '⚡',  title: 'Real-Time', desc: 'Instant pose feedback'   },
        { icon: '🚫', title: 'No Storage', desc: 'Nothing saved or uploaded' },
      ].map(({ icon, title, desc }) => (
        <div key={title} className="bg-warmwhite dark:bg-forest/20 border border-charcoal/8 dark:border-warmwhite/8 rounded-2xl p-4 text-center">
          <div className="text-2xl mb-2">{icon}</div>
          <p className="font-sans font-bold text-sm text-charcoal dark:text-warmwhite">{title}</p>
          <p className="font-outfit text-xs text-charcoal/45 dark:text-warmwhite/35 mt-1">{desc}</p>
        </div>
      ))}
    </div>

    {granted ? (
      <div className="flex items-center gap-3 bg-sage/10 border border-sage/25 rounded-2xl p-4">
        <Check size={20} className="text-sage shrink-0" />
        <p className="font-sans font-semibold text-sage">Camera access granted — you're all set!</p>
      </div>
    ) : (
      <button onClick={onRequest} className="btn-primary w-full !py-4 text-base">
        <Camera size={18} />
        <span>Allow Camera Access</span>
      </button>
    )}
  </div>
);

/* ── Step 4 — Pose tutorial ──────────────────────────────────────────── */
const StepTutorial = () => {
  const poses = [
    { name: 'Mountain Pose', sanskrit: 'Tadasana', img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&q=80&auto=format', cues: ['Stand tall, feet hip-width', 'Arms relaxed at sides', 'Core gently engaged'] },
    { name: 'Warrior II',    sanskrit: 'Virabhadrasana II', img: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&q=80&auto=format', cues: ['Front knee over ankle', 'Arms parallel to ground', 'Gaze over front fingers'] },
  ];

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-serif italic text-[clamp(2rem,4vw,3rem)] text-forest dark:text-warmwhite leading-tight mb-2">
        What good form looks like
      </h2>
      <p className="font-outfit text-charcoal/55 dark:text-warmwhite/45 mb-4">
        Yogifi AI tracks these alignment points in real time during your session.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {poses.map(pose => (
          <div key={pose.name} className="bg-warmwhite dark:bg-forest/20 border border-charcoal/8 dark:border-warmwhite/8 rounded-2xl overflow-hidden">
            <div className="h-44 overflow-hidden">
              <img src={pose.img} alt={pose.name} className="w-full h-full object-cover" />
            </div>
            <div className="p-4">
              <p className="font-sans font-bold text-charcoal dark:text-warmwhite text-sm">{pose.name}</p>
              <p className="font-mono text-xs text-gold mb-3">{pose.sanskrit}</p>
              <ul className="flex flex-col gap-1.5">
                {pose.cues.map(cue => (
                  <li key={cue} className="flex items-center gap-2 text-xs text-charcoal/55 dark:text-warmwhite/45 font-outfit">
                    <ChevronRight size={12} className="text-sage shrink-0" />
                    {cue}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Main Onboarding component ──────────────────────────────────────── */
const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep]         = useState(1);
  const [level, setLevel]       = useState<Level | null>(null);
  const [goals, setGoals]       = useState<Goal[]>([]);
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
    <div className="min-h-screen bg-warmwhite dark:bg-forest-dark flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 md:px-12 pt-8 pb-6">
        <div className="flex items-center gap-2">
          <Leaf size={20} className="text-forest dark:text-gold" />
          <span className="font-outfit font-bold text-lg text-forest dark:text-warmwhite">Yogifi AI</span>
        </div>
        {step < TOTAL_STEPS && (
          <button
            onClick={() => navigate('/dashboard')}
            className="font-outfit text-sm text-charcoal/40 dark:text-warmwhite/30 hover:text-charcoal dark:hover:text-warmwhite transition-colors"
          >
            Skip for now
          </button>
        )}
      </header>

      {/* Progress */}
      <div className="px-6 md:px-12 pb-8">
        <div className="max-w-lg mx-auto">
          <ProgressBar step={step} />
          <p className="font-mono text-xs text-charcoal/30 dark:text-warmwhite/25 mt-2 text-right tracking-wider">
            STEP {step} / {TOTAL_STEPS}
          </p>
        </div>
      </div>

      {/* Step content */}
      <main className="flex-1 px-6 md:px-12 pb-8">
        <div className="max-w-lg mx-auto">
          {step === 1 && <StepLevel value={level} onChange={setLevel} />}
          {step === 2 && <StepGoals value={goals} onChange={setGoals} />}
          {step === 3 && <StepCamera granted={cameraOk} onRequest={requestCamera} />}
          {step === 4 && <StepTutorial />}
        </div>
      </main>

      {/* Footer CTA */}
      <div className="px-6 md:px-12 py-8 border-t border-charcoal/6 dark:border-warmwhite/6">
        <div className="max-w-lg mx-auto flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="btn-secondary !px-6 !py-3.5 text-sm"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canAdvance()}
            className="btn-primary flex-1 !py-3.5 text-base disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
          >
            <span>{step === TOTAL_STEPS ? 'Start Practicing' : 'Continue'}</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
