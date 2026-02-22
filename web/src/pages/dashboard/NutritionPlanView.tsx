import React, { useState, useEffect } from 'react';
import { ChefHat, Loader2, RefreshCw } from 'lucide-react';
import api from '../../lib/api';

// Backend NutritionPlanResponse shape
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
    ''
  ];
  (p.mealDays || []).forEach(day => {
    lines.push(`── Day ${day.dayNumber} ──`);
    (day.meals || []).forEach(meal => {
      const macros = [
        meal.calories ? `${meal.calories} kcal` : '',
        meal.protein ? `P:${meal.protein}g` : '',
        meal.carbs ? `C:${meal.carbs}g` : '',
        meal.fat ? `F:${meal.fat}g` : ''
      ].filter(Boolean).join('  ');
      lines.push(`[${meal.mealType}] ${meal.name}${macros ? `  (${macros})` : ''}`);
      if (meal.description) lines.push(`  ${meal.description}`);
    });
    lines.push('');
  });
  return lines.join('\n');
}

const NutritionPlanView: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [plan, setPlan] = useState<string | null>(null);
  
  // Form State
  const [preference, setPreference] = useState('Vegetarian');
  const [goal, setGoal] = useState('Weight Loss');
  const [calories, setCalories] = useState('2000');
  const [allergies, setAllergies] = useState('');

  useEffect(() => {
    const fetchLatestPlan = async () => {
      try {
        const res = await api.get('/nutrition/plans');
        if (res.data?.data && res.data.data.length > 0) {
          // Show the most recent plan — backend returns structured NutritionPlanResponse
          setPlan(planToText(res.data.data[0]));
        }
      } catch (err) {
        console.error('Failed to fetch nutrition plans:', err);
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
      const response = await api.post('/nutrition/generate-plan', {
        dietaryPreference: preference,
        goal,
        calorieTarget: parseInt(calories) || 2000,
        allergies
      });
      
      if (response.data?.data) {
        // Backend returns structured NutritionPlanResponse with mealDays
        setPlan(planToText(response.data.data));
      }
    } catch (err) {
      console.error('Failed to generate nutrition plan:', err);
      setPlan('Error: Could not generate a plan at this time.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-[fadeIn_0.5s_ease-out] max-w-5xl">
      <div className="mb-8">
        <h2 className="font-serif italic text-3xl text-cream mb-2">Diet & Nutrition AI</h2>
        <p className="font-outfit text-cream/50">Dynamically generated meal plans tailored to your biometric goals.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Generator Form */}
        <div className="lg:col-span-1 bg-charcoal/40 border border-cream/5 rounded-[2rem] p-6 h-fit">
          <div className="flex items-center gap-3 mb-6 text-clay">
            <ChefHat size={20} />
            <span className="font-sans font-bold uppercase tracking-widest text-sm">Parameters</span>
          </div>

          <form onSubmit={handleGenerate} className="space-y-5">
             <div className="space-y-2">
               <label className="text-xs font-mono uppercase tracking-widest text-cream/40">Dietary Preference</label>
               <select 
                 value={preference} onChange={e => setPreference(e.target.value)}
                 className="w-full bg-[#1A1A1A] border border-cream/10 rounded-xl px-4 py-3 text-cream font-outfit outline-none focus:border-clay/50"
               >
                 <option>Vegan</option>
                 <option>Vegetarian</option>
                 <option>Keto</option>
                 <option>Paleo</option>
                 <option>Omnivore</option>
               </select>
             </div>

             <div className="space-y-2">
               <label className="text-xs font-mono uppercase tracking-widest text-cream/40">Primary Goal</label>
               <select 
                 value={goal} onChange={e => setGoal(e.target.value)}
                 className="w-full bg-[#1A1A1A] border border-cream/10 rounded-xl px-4 py-3 text-cream font-outfit outline-none focus:border-clay/50"
               >
                 <option>Weight Loss</option>
                 <option>Muscle Gain</option>
                 <option>Maintenance</option>
                 <option>Energy Optimization</option>
               </select>
             </div>

             <div className="space-y-2">
               <label className="text-xs font-mono uppercase tracking-widest text-cream/40">Daily Calories</label>
               <input 
                 type="number" value={calories} onChange={e => setCalories(e.target.value)}
                 className="w-full bg-[#1A1A1A] border border-cream/10 rounded-xl px-4 py-3 text-cream font-outfit outline-none focus:border-clay/50"
               />
             </div>

             <div className="space-y-2">
               <label className="text-xs font-mono uppercase tracking-widest text-cream/40">Allergies / Exclusions</label>
               <input 
                 type="text" placeholder="e.g. Nuts, Dairy" value={allergies} onChange={e => setAllergies(e.target.value)}
                 className="w-full bg-[#1A1A1A] border border-cream/10 rounded-xl px-4 py-3 text-cream font-outfit outline-none focus:border-clay/50"
               />
             </div>

             <button 
                type="submit" 
                disabled={loading}
                className="w-full magnetic-btn btn-clay bg-clay text-cream py-4 rounded-xl font-bold mt-4 flex justify-center disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" /> : <span>Synthesize Plan</span>}
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
               <ChefHat size={48} className="mb-4 opacity-50" />
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
                {/* Formatting standard AI text returns, assuming markdown or plain text with newlines */}
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

export default NutritionPlanView;
