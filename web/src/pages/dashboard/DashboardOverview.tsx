import React from 'react';
import { Play, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

const StatCard = ({ label, value, trend, highlight }: { label: string, value: string, trend: string, highlight?: boolean }) => (
  <div className={`p-6 rounded-[2rem] border ${highlight ? 'bg-moss border-clay/30' : 'bg-charcoal/40 border-cream/5'} flex flex-col gap-4 relative overflow-hidden`}>
    {highlight && <div className="absolute top-0 right-0 w-32 h-32 bg-clay/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />}
    <span className={`font-mono text-xs tracking-widest uppercase ${highlight ? 'text-cream/70' : 'text-cream/50'}`}>{label}</span>
    <div className="flex items-end justify-between">
      <span className={`font-sans font-bold text-4xl ${highlight ? 'text-cream' : 'text-cream'}`}>{value}</span>
      <span className={`font-outfit text-sm ${highlight ? 'text-clay font-medium' : 'text-cream/40'}`}>{trend}</span>
    </div>
  </div>
);

const SessionRow = ({ date, title, duration, score, status }: { date: string, title: string, duration: string, score: string, status: string }) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between p-4 md:p-6 rounded-2xl bg-[#1A1A1A] border border-cream/5 hover:border-clay/20 transition-colors gap-4 cursor-pointer group">
    <div className="flex items-center gap-6">
      <div className="w-12 h-12 rounded-full bg-cream/5 text-clay flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
        <Activity size={20} />
      </div>
      <div>
        <h4 className="font-sans font-bold text-lg text-cream mb-1">{title}</h4>
        <p className="font-mono text-[10px] uppercase tracking-widest text-cream/40">{date}</p>
      </div>
    </div>
    <div className="flex items-center gap-8 md:gap-12 pl-18 md:pl-0">
      <div className="flex flex-col md:items-end">
        <span className="font-mono text-xs text-cream/30 uppercase tracking-widest mb-1">Duration</span>
        <span className="font-outfit text-cream">{duration}</span>
      </div>
      <div className="flex flex-col md:items-end">
        <span className="font-mono text-xs text-cream/30 uppercase tracking-widest mb-1">Score</span>
        <span className="font-outfit font-medium text-clay">{score}</span>
      </div>
      <div className="hidden lg:flex px-3 py-1 rounded-full border border-cream/10 text-cream/50 font-mono text-[10px] uppercase tracking-widest">
        {status}
      </div>
    </div>
  </div>
);

const DashboardOverview: React.FC = () => {
  const userName = "Initiate"; // Mocked

  return (
    <div className="animate-[fadeIn_0.5s_ease-out] max-w-5xl">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <p className="font-mono text-xs tracking-widest text-clay uppercase mb-2">System Active // V.0.9.1</p>
          <h1 className="font-serif italic text-4xl lg:text-5xl text-cream">Welcome back, {userName}.</h1>
        </div>
        
        <Link to="/session" className="magnetic-btn btn-clay bg-clay text-cream px-6 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 group shrink-0 hover:bg-[#a64627] transition-colors">
          <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
          <span>Quick Start</span>
        </Link>
      </header>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <StatCard label="Avg. Accuracy" value="94.2%" trend="+2.4% vs last wk" />
        <StatCard label="Sessions Completed" value="24" trend="On track" />
        <StatCard label="Current Streak" value="6 Days" trend="Personal Best" highlight />
      </div>

      {/* Recent Telemetry */}
      <div className="bg-[#111] border border-cream/5 rounded-[2rem] p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-serif italic text-2xl text-cream">Recent Telemetry</h2>
          <button className="font-mono text-xs tracking-widest text-clay hover:text-cream transition-colors uppercase">
            View Archive &rarr;
          </button>
        </div>
        
        <div className="flex flex-col gap-4">
          <SessionRow 
            date="Today, 07:00 AM" 
            title="Morning Mobility Flow" 
            duration="25m" 
            score="96%" 
            status="Analyzed"
          />
          <SessionRow 
            date="Yesterday, 06:30 PM" 
            title="Hip Openers & Core" 
            duration="45m" 
            score="92%" 
            status="Analyzed"
          />
          <SessionRow 
            date="Oct 12, 07:15 AM" 
            title="Foundational Alignment" 
            duration="30m" 
            score="88%" 
            status="Archived"
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
