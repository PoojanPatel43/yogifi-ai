import React, { useState, useEffect } from 'react';
import { ChefHat, Loader2, RefreshCw } from 'lucide-react';
import api from '../../lib/api';

interface MealDto {
  mealType: string;
  name: string;
  description?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

interface MealDay {
  dayNumber: number;
  meals: MealDto[];
}

interface NutritionPlanData {
  id: string;
  dietaryPreference: string;
  goal: string;
  calorieTarget: number;
  allergies?: string;
  mealDays: MealDay[];
}

function planToText(p: NutritionPlanData): string {
  const lines: string[] = [
    `Goal: ${p.goal}  |  Diet: ${p.dietaryPreference}  |  Target: ${p.calorieTarget} kcal/day${p.allergies ? `  |  Avoid: ${p.allergies}` : ''}`,
    '',
  ];
  (p.mealDays || []).forEach(day => {
    lines.push(`── Day ${day.dayNumber} ──`);
    (day.meals || []).forEach(meal => {
      const macros = [
        meal.calories ? `${meal.calories} kcal` : '',
        meal.protein  ? `P:${meal.protein}g`   : '',
        meal.carbs    ? `C:${meal.carbs}g`     : '',
        meal.fat      ? `F:${meal.fat}g`       : '',
      ].filter(Boolean).join('  ');
      lines.push(`[${meal.mealType}] ${meal.name}${macros ? `  (${macros})` : ''}`);
      if (meal.description) lines.push(`  ${meal.description}`);
    });
    lines.push('');
  });
  return lines.join('\n');
}

const NutritionPlanView: React.FC = () => {
  const [loading,        setLoading]        = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [plan,           setPlan]           = useState<string | null>(null);

  const [preference, setPreference] = useState('Vegetarian');
  const [goal,       setGoal]       = useState('Weight Loss');
  const [calories,   setCalories]   = useState('2000');
  const [allergies,  setAllergies]  = useState('');

  useEffect(() => {
    api.get('/nutrition/plans')
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
      const response = await api.post('/nutrition/generate-plan', {
        dietaryPreference: preference,
        goal,
        calorieTarget: parseInt(calories) || 2000,
        allergies,
      });
      if (response.data?.data) setPlan(planToText(response.data.data));
    } catch (err) {
      console.error('Failed to generate nutrition plan:', err);
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
          Diet & Nutrition
        </h2>
        <p style={{ color: 'var(--muted)', fontWeight: 300, fontSize: '0.875rem' }}>
          Dynamically generated meal plans tailored to your goals.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2px', background: 'var(--line)', alignItems: 'start' }}>

        {/* Form panel */}
        <div style={{ background: 'var(--surface)', padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.75rem' }}>
            <ChefHat size={16} style={{ color: 'var(--accent)' }} />
            <p className="ck-label" style={{ marginBottom: 0 }}>Parameters</p>
          </div>

          <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label className="ck-label">Dietary Preference</label>
              <select value={preference} onChange={e => setPreference(e.target.value)} className="ck-select">
                <option>Vegan</option>
                <option>Vegetarian</option>
                <option>Keto</option>
                <option>Paleo</option>
                <option>Omnivore</option>
              </select>
            </div>
            <div>
              <label className="ck-label">Primary Goal</label>
              <select value={goal} onChange={e => setGoal(e.target.value)} className="ck-select">
                <option>Weight Loss</option>
                <option>Muscle Gain</option>
                <option>Maintenance</option>
                <option>Energy Optimization</option>
              </select>
            </div>
            <div>
              <label className="ck-label">Daily Calories</label>
              <input
                type="number"
                value={calories}
                onChange={e => setCalories(e.target.value)}
                className="ck-input"
              />
            </div>
            <div>
              <label className="ck-label">Allergies / Exclusions</label>
              <input
                type="text"
                placeholder="e.g. Nuts, Dairy"
                value={allergies}
                onChange={e => setAllergies(e.target.value)}
                className="ck-input"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-brutalist"
              style={{ width: '100%', justifyContent: 'center', padding: '0.875rem', marginTop: '0.5rem', opacity: loading ? 0.6 : 1 }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <span>Synthesize Plan</span>}
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
              <ChefHat size={36} style={{ marginBottom: '1rem', opacity: 0.4 }} />
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

export default NutritionPlanView;
