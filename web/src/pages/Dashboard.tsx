import React, { useRef, useEffect, useState } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { LayoutDashboard, LogOut, MessageSquare, HandMetal, Dumbbell, ChefHat, Play } from 'lucide-react';
import api, { clearAccessToken, hasAccessToken, initSession } from '../lib/api';

const Dashboard: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [sessionReady, setSessionReady] = useState(false);

  // If no in-memory token (e.g. after page refresh), try recovering via httpOnly cookie.
  // If cookie is also missing/expired, redirect to login.
  useEffect(() => {
    if (hasAccessToken()) {
      setSessionReady(true);
      return;
    }
    initSession().then((ok) => {
      if (ok) {
        setSessionReady(true);
      } else {
        navigate('/login');
      }
    });
  }, [navigate]);

  useGSAP(() => {
    const ctx = gsap.context(() => {
      gsap.from('.dash-sidebar', {
        x: -50,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out'
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');  // clears httpOnly cookie server-side
    } catch {
      // proceed regardless
    }
    clearAccessToken();
    navigate('/login');
  };

  if (!sessionReady) return null; // wait for session check before rendering

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
          
          <nav className="flex flex-col gap-1 px-4">
            <NavItem icon={LayoutDashboard} label="Overview"   href="/dashboard" />
            <NavItem icon={HandMetal}       label="Poses"      href="/dashboard/poses" />
            <NavItem icon={Play}            label="Session"    href="/session" />
            <NavItem icon={MessageSquare}   label="AI Chat"    href="/dashboard/chat" />
            <NavItem icon={Dumbbell}        label="Exercise"   href="/dashboard/fitness" />
            <NavItem icon={ChefHat}         label="Nutrition"  href="/dashboard/nutrition" />
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
          <Outlet />
        </div>
      </main>

      {/* Mobile Nav Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-[#161616]/90 backdrop-blur-xl border-t border-cream/10 p-3 flex justify-around z-50">
        <Link to="/dashboard"            className="p-2 flex flex-col items-center gap-1 text-cream/40 hover:text-clay transition-colors"><LayoutDashboard size={20} /><span className="text-[9px] font-mono">Home</span></Link>
        <Link to="/dashboard/poses"      className="p-2 flex flex-col items-center gap-1 text-cream/40 hover:text-clay transition-colors"><HandMetal size={20} /><span className="text-[9px] font-mono">Poses</span></Link>
        <Link to="/dashboard/chat"       className="p-2 flex flex-col items-center gap-1 text-cream/40 hover:text-clay transition-colors"><MessageSquare size={20} /><span className="text-[9px] font-mono">Chat</span></Link>
        <Link to="/dashboard/fitness"    className="p-2 flex flex-col items-center gap-1 text-cream/40 hover:text-clay transition-colors"><Dumbbell size={20} /><span className="text-[9px] font-mono">Exercise</span></Link>
        <Link to="/dashboard/nutrition"  className="p-2 flex flex-col items-center gap-1 text-cream/40 hover:text-clay transition-colors"><ChefHat size={20} /><span className="text-[9px] font-mono">Nutrition</span></Link>
        <button onClick={handleLogout}   className="p-2 flex flex-col items-center gap-1 text-cream/40 hover:text-clay transition-colors"><LogOut size={20} /><span className="text-[9px] font-mono">Out</span></button>
      </div>
      
    </div>
  );
};

// Sub-components for cleaner code
const NavItem = ({ icon: Icon, label, href }: { icon: React.ElementType, label: string, href: string }) => {
  const location = useLocation();
  const isActive =
    href === '/dashboard'
      ? location.pathname === '/dashboard' || location.pathname === '/dashboard/'
      : location.pathname.startsWith(href);
  return (
    <Link
      to={href}
      className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${
        isActive
          ? 'bg-clay/15 text-clay'
          : 'text-cream/50 hover:bg-cream/5 hover:text-cream'
      }`}
    >
      <Icon size={18} className={isActive ? 'text-clay' : 'group-hover:text-cream transition-colors'} />
      <span className="hidden lg:block font-outfit font-medium text-sm">{label}</span>
    </Link>
  );
};

export default Dashboard;
