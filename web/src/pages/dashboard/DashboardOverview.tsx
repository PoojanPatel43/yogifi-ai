import React from 'react';
import { Play, Activity, TrendingUp, Flame, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const StatCard = ({ label, value, trend, highlight }: { label: string; value: string; trend: string; highlight?: boolean }) => (
  <div className={`p-6 rounded-[1.75rem] border flex flex-col gap-4 relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5
    ${highlight
      ? 'bg-forest border-gold/20 shadow-md'
      : 'bg-warmwhite dark:bg-forest/15 border-charcoal/8 dark:border-warmwhite/8 hover:border-forest/20 dark:hover:border-warmwhite/15'
    }`}
  >
    {highlight && <div className="absolute top-0 right-0 w-36 h-36 bg-gold/8 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />}
    <span className={`font-mono text-xs tracking-widest uppercase ${highlight ? 'text-warmwhite/50' : 'text-charcoal/40 dark:text-warmwhite/35'}`}>{label}</span>
    <div className="flex items-end justify-between">
      <span className={`font-sans font-bold text-4xl leading-none ${highlight ? 'text-warmwhite' : 'text-charcoal dark:text-warmwhite'}`}>{value}</span>
      <span className={`font-outfit text-sm font-medium ${highlight ? 'text-gold' : 'text-sage dark:text-sage'}`}>{trend}</span>
    </div>
  </div>
);

const SessionRow = ({ date, title, duration, score }: { date: string; title: string; duration: string; score: string }) => {
  const scoreNum = parseInt(score);
  const scoreColor = scoreNum >= 90 ? 'text-sage' : scoreNum >= 75 ? 'text-gold' : 'text-clay';
  return (
    <Link
      to="/session/summary"
      className="flex flex-col md:flex-row md:items-center justify-between p-5 rounded-2xl
        bg-warmwhite dark:bg-forest/10 border border-charcoal/6 dark:border-warmwhite/6
        hover:border-forest/25 dark:hover:border-warmwhite/15 hover:-translate-y-0.5
        transition-all duration-200 gap-4 group"
    >
      <div className="flex items-center gap-5">
        <div className="w-11 h-11 rounded-full bg-forest/8 dark:bg-warmwhite/8 text-forest dark:text-sage flex items-center justify-center shrink-0 group-hover:bg-forest group-hover:text-warmwhite dark:group-hover:bg-warmwhite/15 transition-colors">
          <Activity size={18} />
        </div>
        <div>
          <h4 className="font-sans font-semibold text-charcoal dark:text-warmwhite text-base">{title}</h4>
          <p className="font-mono text-[10px] uppercase tracking-widest text-charcoal/35 dark:text-warmwhite/30 mt-0.5">{date}</p>
        </div>
      </div>
      <div className="flex items-center gap-8 pl-16 md:pl-0">
        <div className="flex flex-col md:items-end">
          <span className="font-mono text-[10px] text-charcoal/30 dark:text-warmwhite/25 uppercase tracking-widest mb-0.5">Duration</span>
          <span className="font-outfit text-sm text-charcoal dark:text-warmwhite">{duration}</span>
        </div>
        <div className="flex flex-col md:items-end">
          <span className="font-mono text-[10px] text-charcoal/30 dark:text-warmwhite/25 uppercase tracking-widest mb-0.5">Score</span>
          <span className={`font-outfit font-semibold text-sm ${scoreColor}`}>{score}</span>
        </div>
        <ArrowRight size={16} className="hidden md:block text-charcoal/20 dark:text-warmwhite/15 group-hover:text-forest dark:group-hover:text-gold group-hover:translate-x-1 transition-all" />
      </div>
    </Link>
  );
};

const DashboardOverview: React.FC = () => {
  const userName = 'Alex';

  return (
    <div className="animate-fade-in max-w-5xl">

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <div className="section-label mb-3 !bg-gold/8 !text-gold">
            <Flame size={12} /> Today
          </div>
          <h1 className="font-serif italic text-4xl lg:text-5xl text-forest dark:text-warmwhite leading-tight">
            Welcome back, {userName}.
          </h1>
          <p className="font-outfit text-charcoal/45 dark:text-warmwhite/40 mt-2 text-sm">
            You're on a 6-day streak — keep it going!
          </p>
        </div>
        <Link
          to="/session"
          className="btn-primary !px-7 !py-3.5 text-sm shrink-0 self-start md:self-auto"
        >
          <Play size={15} className="fill-current" />
          <span>Quick Start</span>
        </Link>
      </header>

      {/* KPI grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <StatCard label="Avg. Accuracy"       value="94.2%" trend="+2.4% vs last wk" />
        <StatCard label="Sessions Completed"  value="24"    trend="On track" />
        <StatCard label="Current Streak"      value="6 Days" trend="Personal Best 🏆" highlight />
      </div>

      {/* Weekly mini-chart placeholder */}
      <div className="bg-warmwhite dark:bg-forest/10 border border-charcoal/6 dark:border-warmwhite/6 rounded-[1.75rem] p-6 mb-6 flex items-center gap-4">
        <TrendingUp size={18} className="text-sage shrink-0" />
        <div className="flex-1">
          <p className="font-sans font-semibold text-sm text-charcoal dark:text-warmwhite">This week you've improved accuracy by</p>
          <p className="font-mono text-xs text-charcoal/40 dark:text-warmwhite/30 mt-0.5">Across 4 sessions — Monday through Thursday</p>
        </div>
        <span className="font-sans font-bold text-2xl text-gold">+8°</span>
      </div>

      {/* Recent sessions */}
      <div className="bg-warmwhite dark:bg-forest/10 border border-charcoal/6 dark:border-warmwhite/6 rounded-[1.75rem] p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif italic text-xl text-charcoal dark:text-warmwhite">Recent Sessions</h2>
          <button className="font-mono text-xs tracking-widest text-forest/60 dark:text-warmwhite/40 hover:text-forest dark:hover:text-gold transition-colors uppercase flex items-center gap-1">
            View all <ArrowRight size={12} />
          </button>
        </div>
        <div className="flex flex-col gap-3">
          <SessionRow date="Today, 07:00 AM"       title="Morning Mobility Flow"   duration="25m" score="96%" />
          <SessionRow date="Yesterday, 06:30 PM"   title="Hip Openers & Core"      duration="45m" score="92%" />
          <SessionRow date="Oct 12, 07:15 AM"      title="Foundational Alignment"  duration="30m" score="88%" />
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
