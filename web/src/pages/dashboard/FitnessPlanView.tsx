import React, { useState, useEffect } from 'react';
import { Dumbbell, Loader2, RefreshCw } from 'lucide-react';
import api from '../../lib/api';

// Backend FitnessPlanResponse shape
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

// Convert structured plan to readable text for display
function planToText(p: FitnessPlanData): string {
  const lines: string[] = [
    `Goal: ${p.goal}  |  Level: ${p.fitnessLevel}  |  ${p.daysPerWeek} days/week  |  Equipment: ${p.equipment}`,
    ''
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
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [plan, setPlan] = useState<string | null>(null);
  
  // Form State
  const [fitnessLevel, setFitnessLevel] = useState('Intermediate');
  const [goal, setGoal] = useState('Hypertrophy');
  const [days, setDays] = useState('4');
  const [equipment, setEquipment] = useState('Full Gym');

  useEffect(() => {
    const fetchLatestPlan = async () => {
      try {
        const res = await api.get('/fitness/plans');
        if (res.data?.data && res.data.data.length > 0) {
          setPlan(planToText(res.data.data[0]));
        }
      } catch (err) {
        console.error('Failed to fetch fitness plans:', err);
      } finally {
        setHistoryLoading(false);
      }
    };
    fetchLatestPlan();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/fitness/generate-plan', {
        fitnessLevel,
        goal,
        daysPerWeek: parseInt(days) || 4,
        equipment
      });
      
      if (response.data?.data) {
        setPlan(planToText(response.data.data));
      }
    } catch (err) {
      console.error('Failed to generate fitness plan:', err);
      setPlan('Error: Could not generate a plan at this time.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-[fadeIn_0.5s_ease-out] max-w-5xl">
      <div className="mb-8">
        <h2 className="font-serif italic text-3xl text-cream mb-2">Exercise AI</h2>
        <p className="font-outfit text-cream/50">Progressive overload kinematics generated from your capability metrics.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Generator Form */}
        <div className="lg:col-span-1 bg-charcoal/40 border border-cream/5 rounded-[2rem] p-6 h-fit">
          <div className="flex items-center gap-3 mb-6 text-clay">
            <Dumbbell size={20} />
            <span className="font-sans font-bold uppercase tracking-widest text-sm">Parameters</span>
          </div>

          <form onSubmit={handleGenerate} className="space-y-5">
             <div className="space-y-2">
               <label className="text-xs font-mono uppercase tracking-widest text-cream/40">Fitness Level</label>
               <select 
                 value={fitnessLevel} onChange={e => setFitnessLevel(e.target.value)}
                 className="w-full bg-[#1A1A1A] border border-cream/10 rounded-xl px-4 py-3 text-cream font-outfit outline-none focus:border-clay/50"
               >
                 <option>Beginner</option>
                 <option>Intermediate</option>
                 <option>Advanced</option>
                 <option>Elite</option>
               </select>
             </div>

             <div className="space-y-2">
               <label className="text-xs font-mono uppercase tracking-widest text-cream/40">Primary Goal</label>
               <select 
                 value={goal} onChange={e => setGoal(e.target.value)}
                 className="w-full bg-[#1A1A1A] border border-cream/10 rounded-xl px-4 py-3 text-cream font-outfit outline-none focus:border-clay/50"
               >
                 <option>Hypertrophy (Muscle Size)</option>
                 <option>Strength</option>
                 <option>Endurance</option>
                 <option>Mobility & Rehab</option>
               </select>
             </div>

             <div className="space-y-2">
               <label className="text-xs font-mono uppercase tracking-widest text-cream/40">Days Per Week</label>
               <select 
                 value={days} onChange={e => setDays(e.target.value)}
                 className="w-full bg-[#1A1A1A] border border-cream/10 rounded-xl px-4 py-3 text-cream font-outfit outline-none focus:border-clay/50"
               >
                 <option value="2">2 Days</option>
                 <option value="3">3 Days</option>
                 <option value="4">4 Days</option>
                 <option value="5">5 Days</option>
                 <option value="6">6 Days</option>
               </select>
             </div>

             <div className="space-y-2">
               <label className="text-xs font-mono uppercase tracking-widest text-cream/40">Equipment Available</label>
               <select 
                 value={equipment} onChange={e => setEquipment(e.target.value)}
                 className="w-full bg-[#1A1A1A] border border-cream/10 rounded-xl px-4 py-3 text-cream font-outfit outline-none focus:border-clay/50"
               >
                 <option>Full Gym</option>
                 <option>Dumbbells Only</option>
                 <option>Bodyweight Only</option>
                 <option>Resistance Bands</option>
               </select>
             </div>

             <button 
                type="submit" 
                disabled={loading}
                className="w-full magnetic-btn btn-clay bg-clay text-cream py-4 rounded-xl font-bold mt-4 flex justify-center disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" /> : <span>Synthesize Protocol</span>}
             </button>
          </form>
        </div>

        {/* Output Area */}
        <div className="lg:col-span-2 bg-[#111] border border-cream/5 rounded-[2rem] p-6 lg:p-8 relative min-h-[500px]">
          {historyLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="animate-spin text-clay/50 w-8 h-8" />
            </div>
          ) : !plan ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-cream/20">
               <Dumbbell size={48} className="mb-4 opacity-50" />
               <p className="font-outfit font-light text-lg">No active protocol generated.</p>
             </div>
          ) : (
            <div className="animate-[fadeIn_0.3s_ease-out]">
              <div className="flex items-center justify-between mb-6 pb-6 border-b border-cream/10">
                <span className="font-mono text-xs text-moss bg-moss/20 px-3 py-1 rounded-full uppercase tracking-widest border border-moss/30 drop-shadow-[0_0_8px_rgba(46,64,54,0.5)]">
                  Active Protocol
                </span>
                <button onClick={handleGenerate} className="text-cream/40 hover:text-clay transition-colors">
                  <RefreshCw size={18} />
                </button>
              </div>
              <div className="prose prose-invert prose-p:text-cream/80 prose-headings:text-cream prose-headings:font-serif prose-headings:italic prose-p:font-outfit max-w-none">
                {plan.split('\n').map((paragraph, i) => (
                   paragraph ? <p key={i}>{paragraph}</p> : <br key={i} />
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
