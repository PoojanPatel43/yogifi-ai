import React, { useState, useEffect } from 'react';
import { Dumbbell, Loader2, RefreshCw } from 'lucide-react';
import api from '../../lib/api';

interface WorkoutDay {
  dayNumber: number;
  focus: string;
  warmup?: string;
  cooldown?: string;
  exercises: { name: string; sets: number; reps: string; restSeconds?: number; notes?: string }[];
}

interface FitnessPlanData {
  id: string;
  goal: string;
  fitnessLevel: string;
  daysPerWeek: number;
  equipment: string;
  workoutDays: WorkoutDay[];
}

function planToText(p: FitnessPlanData): string {
  const lines: string[] = [
    `Goal: ${p.goal}  |  Level: ${p.fitnessLevel}  |  ${p.daysPerWeek} days/week  |  Equipment: ${p.equipment}`,
    '',
  ];
  (p.workoutDays || []).forEach(day => {
    lines.push(`── Day ${day.dayNumber}: ${day.focus} ──`);
    if (day.warmup) lines.push(`Warm-up: ${day.warmup}`);
    (day.exercises || []).forEach(ex => {
      lines.push(`• ${ex.name}  ${ex.sets} × ${ex.reps}${ex.restSeconds ? `  (rest ${ex.restSeconds}s)` : ''}${ex.notes ? `  — ${ex.notes}` : ''}`);
    });
    if (day.cooldown) lines.push(`Cool-down: ${day.cooldown}`);
    lines.push('');
  });
  return lines.join('\n');
}

const FitnessPlanView: React.FC = () => {
  const [loading,        setLoading]        = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [plan,           setPlan]           = useState<string | null>(null);

  const [fitnessLevel, setFitnessLevel] = useState('Intermediate');
  const [goal,         setGoal]         = useState('Hypertrophy');
  const [days,         setDays]         = useState('4');
  const [equipment,    setEquipment]    = useState('Full Gym');

  useEffect(() => {
    api.get('/fitness/plans')
      .then(res => {
        if (res.data?.data?.length > 0) setPlan(planToText(res.data.data[0]));
      })
      .catch(console.error)
      .finally(() => setHistoryLoading(false));
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/fitness/generate-plan', {
        fitnessLevel,
        goal,
        daysPerWeek: parseInt(days) || 4,
        equipment,
      });
      if (response.data?.data) setPlan(planToText(response.data.data));
    } catch (err) {
      console.error('Failed to generate fitness plan:', err);
      setPlan('Error: Could not generate a plan at this time.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <p className="ck-label" style={{ marginBottom: '0.5rem' }}>AI-Powered</p>
        <h2 style={{
          fontFamily: '"Playfair Display", serif',
          fontStyle: 'italic',
          fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
          color: 'var(--ink)',
          lineHeight: 1.1,
          marginBottom: '0.5rem',
        }}>
          Exercise & Fitness
        </h2>
        <p style={{ color: 'var(--muted)', fontWeight: 300, fontSize: '0.875rem' }}>
          Progressive overload plans generated from your capability metrics.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2px', background: 'var(--line)', alignItems: 'start' }}>

        {/* Form panel */}
        <div style={{ background: 'var(--surface)', padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.75rem' }}>
            <Dumbbell size={16} style={{ color: 'var(--accent)' }} />
            <p className="ck-label" style={{ marginBottom: 0 }}>Parameters</p>
          </div>

          <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label className="ck-label">Fitness Level</label>
              <select value={fitnessLevel} onChange={e => setFitnessLevel(e.target.value)} className="ck-select">
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
                <option>Elite</option>
              </select>
            </div>
            <div>
              <label className="ck-label">Primary Goal</label>
              <select value={goal} onChange={e => setGoal(e.target.value)} className="ck-select">
                <option>Hypertrophy (Muscle Size)</option>
                <option>Strength</option>
                <option>Endurance</option>
                <option>Mobility & Rehab</option>
              </select>
            </div>
            <div>
              <label className="ck-label">Days Per Week</label>
              <select value={days} onChange={e => setDays(e.target.value)} className="ck-select">
                <option value="2">2 Days</option>
                <option value="3">3 Days</option>
                <option value="4">4 Days</option>
                <option value="5">5 Days</option>
                <option value="6">6 Days</option>
              </select>
            </div>
            <div>
              <label className="ck-label">Equipment Available</label>
              <select value={equipment} onChange={e => setEquipment(e.target.value)} className="ck-select">
                <option>Full Gym</option>
                <option>Dumbbells Only</option>
                <option>Bodyweight Only</option>
                <option>Resistance Bands</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-brutalist"
              style={{ width: '100%', justifyContent: 'center', padding: '0.875rem', marginTop: '0.5rem', opacity: loading ? 0.6 : 1 }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <span>Synthesize Protocol</span>}
            </button>
          </form>
        </div>

        {/* Output panel */}
        <div style={{ background: 'var(--bg)', padding: '2rem', minHeight: '500px', position: 'relative' }}>
          {historyLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
              <Loader2 size={24} className="animate-spin" style={{ color: 'var(--muted)' }} />
            </div>
          ) : !plan ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', color: 'var(--muted)' }}>
              <Dumbbell size={36} style={{ marginBottom: '1rem', opacity: 0.4 }} />
              <p style={{ fontWeight: 300, fontStyle: 'italic' }}>No active protocol generated.</p>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--line)' }}>
                <p className="ck-label" style={{ marginBottom: 0, color: 'var(--accent)' }}>Active Protocol</p>
                <button
                  onClick={handleGenerate}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center' }}
                >
                  <RefreshCw size={15} />
                </button>
              </div>
              <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '0.8rem', lineHeight: 1.8, color: 'var(--ink)', fontWeight: 400, whiteSpace: 'pre-wrap' }}>
                {plan.split('\n').map((line, i) => (
                  line ? <p key={i} style={{ margin: 0 }}>{line}</p> : <br key={i} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FitnessPlanView;
