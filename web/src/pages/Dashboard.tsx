import React, { useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { LayoutDashboard, History, Settings, LogOut, Play, TrendingUp, Activity, Award } from 'lucide-react';

const Dashboard: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const userName = 'Initiate';

  // Simple check for auth (in real app, use Context or verify token validity)
  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
    }
  }, [navigate]);

  useGSAP(() => {
    const ctx = gsap.context(() => {
      gsap.from('.dash-sidebar', {
        x: -50,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out'
      });
      
      gsap.from('.dash-header', {
        y: -30,
        opacity: 0,
        duration: 0.8,
        delay: 0.2,
        ease: 'power3.out'
      });

      gsap.from('.dash-card', {
        y: 40,
        opacity: 0,
        stagger: 0.1,
        duration: 0.8,
        delay: 0.3,
        ease: 'power3.out'
      });

      gsap.from('.dash-list-item', {
        x: -20,
        opacity: 0,
        stagger: 0.05,
        duration: 0.6,
        delay: 0.6,
        ease: 'power2.out'
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const handleLogout = () => {
    // Optionally call api.post('/auth/logout') here
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-[#111111] text-cream font-sans flex overflow-hidden">
      
      {/* Sidebar */}
      <aside className="dash-sidebar w-20 lg:w-64 border-r border-cream/10 bg-[#161616] flex flex-col justify-between py-8 z-20 hidden sm:flex shrink-0">
        <div>
          <div className="px-6 mb-12">
            <Link to="/" className="font-outfit font-bold text-xl tracking-tight text-moss hidden lg:block">
              Yogifi AI
            </Link>
            <div className="w-8 h-8 bg-moss rounded-full lg:hidden flex items-center justify-center font-bold text-sm">Y</div>
          </div>
          
          <nav className="flex flex-col gap-2 px-4">
            <NavItem icon={<LayoutDashboard size={20} />} label="Overview" active />
            <NavItem icon={<History size={20} />} label="Sessions" />
            <NavItem icon={<Settings size={20} />} label="Settings" />
          </nav>
        </div>
        
        <div className="px-4">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-cream/40 hover:text-clay hover:bg-clay/10 transition-colors font-outfit text-sm font-medium"
          >
            <LogOut size={20} />
            <span className="hidden lg:block">Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative h-screen">
        {/* Decorative noise/gradient in background */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-moss/5 rounded-full blur-[120px] pointer-events-none -z-10 translate-x-1/2 -translate-y-1/2" />
        
        <div className="max-w-6xl mx-auto p-6 lg:p-12 relative z-10">
          
          {/* Header */}
          <header className="dash-header flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12 gap-6">
            <div>
              <div className="font-mono text-clay text-xs tracking-widest uppercase mb-2">Intelligence Hub</div>
              <h1 className="font-serif italic text-4xl lg:text-5xl text-cream">Welcome back, {userName}.</h1>
            </div>
            
            <button className="magnetic-btn btn-clay bg-clay text-cream px-6 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 group shrink-0">
              <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
              <span>Start Session</span>
            </button>
          </header>

          {/* KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <StatCard 
              icon={<TrendingUp className="text-moss" />}
              label="Avg. Accuracy"
              value="94.2%"
              trend="+2.1% this week"
              trendUp
            />
            <StatCard 
              icon={<Activity className="text-clay" />}
              label="Sessions Completed"
              value="12"
              trend="3 this week"
            />
            <StatCard 
              icon={<Award className="text-[#D4AF37]" />}
              label="Current Streak"
              value="4 Days"
              trend="Personal best: 14"
            />
          </div>

          {/* Recent Sessions */}
          <div className="dash-card bg-[#161616] border border-cream/5 rounded-[2rem] p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-outfit font-semibold text-xl">Recent Telemetry</h3>
              <button className="text-sm font-sans text-cream/40 hover:text-clay transition-colors">View All &rarr;</button>
            </div>
            
            <div className="flex flex-col gap-2">
              <SessionRow date="Today, 08:30 AM" name="Morning Mobility Flow" duration="24 min" accuracy="96%" />
              <SessionRow date="Yesterday, 06:15 PM" name="Core Integration II" duration="32 min" accuracy="91%" />
              <SessionRow date="Oct 12, 07:00 AM" name="Vinyasa Baseline" duration="45 min" accuracy="88%" />
              <SessionRow date="Oct 10, 06:30 PM" name="Hip Openers Deep" duration="18 min" accuracy="95%" />
            </div>
          </div>
          
        </div>
      </main>

      {/* Mobile Nav Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-[#161616]/90 backdrop-blur-xl border-t border-cream/10 p-4 flex justify-around z-50">
        <button className="p-2 text-moss"><LayoutDashboard size={24} /></button>
        <button className="p-2 text-cream/40"><History size={24} /></button>
        <button className="p-2 text-cream/40"><Settings size={24} /></button>
        <button onClick={handleLogout} className="p-2 text-cream/40"><LogOut size={24} /></button>
      </div>
      
    </div>
  );
};

// Sub-components for cleaner code
const NavItem = ({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) => (
  <button className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-outfit text-sm font-medium ${
    active ? 'bg-moss/20 text-moss' : 'text-cream/40 hover:text-cream hover:bg-cream/5'
  }`}>
    {icon}
    <span className="hidden lg:block">{label}</span>
  </button>
);

const StatCard = ({ icon, label, value, trend, trendUp = false }: { icon: React.ReactNode, label: string, value: string, trend: string, trendUp?: boolean }) => (
  <div className="dash-card bg-[#161616] border border-cream/5 rounded-[2rem] p-6 lg:p-8 flex flex-col hover:-translate-y-1 transition-transform duration-300">
    <div className="w-10 h-10 rounded-full bg-cream/5 flex items-center justify-center mb-6">
      {icon}
    </div>
    <div className="font-mono text-[10px] tracking-widest text-cream/40 uppercase mb-2">{label}</div>
    <div className="text-4xl font-semibold font-outfit mb-4">{value}</div>
    <div className={`text-xs font-sans ${trendUp ? 'text-moss' : 'text-cream/30'}`}>{trend}</div>
  </div>
);

const SessionRow = ({ date, name, duration, accuracy }: { date: string, name: string, duration: string, accuracy: string }) => (
  <div className="dash-list-item flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 px-4 hover:bg-cream/5 rounded-xl transition-colors cursor-pointer group">
    <div className="flex items-center gap-4 mb-2 sm:mb-0">
      <div className="w-10 h-10 rounded-full bg-moss/20 text-moss flex items-center justify-center -ml-2 group-hover:scale-110 transition-transform">
        <Activity size={16} />
      </div>
      <div>
        <div className="font-medium font-outfit text-cream/90">{name}</div>
        <div className="text-xs font-mono text-cream/40 mt-1">{date}</div>
      </div>
    </div>
    
    <div className="flex items-center gap-6 sm:gap-12 w-full sm:w-auto justify-between sm:justify-end px-2 sm:px-0">
      <div className="text-sm font-sans text-cream/60">{duration}</div>
      <div className="text-sm font-mono text-clay px-3 py-1 rounded-full bg-clay/10 border border-clay/20">{accuracy}</div>
    </div>
  </div>
);

export default Dashboard;
