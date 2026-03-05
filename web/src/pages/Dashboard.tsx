import React, { useRef, useEffect, useState } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  LayoutDashboard, LogOut, MessageSquare, HandMetal,
  Dumbbell, ChefHat, Play, User, ChevronRight,
} from 'lucide-react';
import api, { clearAccessToken, hasAccessToken, initSession } from '../lib/api';

const Dashboard: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  // Initialise synchronously from in-memory token; fall back to cookie refresh via effect
  const [sessionReady, setSessionReady] = useState(() => hasAccessToken());

  useEffect(() => {
    if (sessionReady) return;
    let cancelled = false;
    initSession().then(ok => {
      if (!cancelled) {
        if (ok) setSessionReady(true);
        else navigate('/login');
      }
    });
    return () => { cancelled = true; };
  }, [navigate, sessionReady]);

  useGSAP(() => {
    const ctx = gsap.context(() => {
      gsap.from('.dash-sidebar', { x: -40, opacity: 0, duration: 0.7, ease: 'power3.out' });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    clearAccessToken();
    navigate('/login');
  };

  if (!sessionReady) return null;

  return (
    <div ref={containerRef} className="min-h-screen bg-warmwhite dark:bg-forest-dark text-charcoal dark:text-warmwhite font-sans flex overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className="dash-sidebar w-20 lg:w-64 border-r border-charcoal/6 dark:border-warmwhite/6 bg-warmwhite dark:bg-forest-dark flex flex-col justify-between py-8 z-20 hidden sm:flex shrink-0">
        <div>
          <div className="px-5 mb-10">
            <Link to="/" className="hidden lg:flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-forest flex items-center justify-center text-xs font-bold text-warmwhite">Y</div>
              <span className="font-outfit font-bold text-lg text-forest dark:text-warmwhite tracking-tight">Yogifi AI</span>
            </Link>
            <div className="w-9 h-9 bg-forest rounded-full lg:hidden flex items-center justify-center font-bold text-sm text-warmwhite">Y</div>
          </div>

          <nav className="flex flex-col gap-1 px-3">
            <NavItem icon={LayoutDashboard} label="Overview"  href="/dashboard" />
            <NavItem icon={HandMetal}       label="Poses"     href="/dashboard/poses" />
            <NavItem icon={Play}            label="Session"   href="/session" />
            <NavItem icon={MessageSquare}   label="AI Chat"   href="/dashboard/chat" />
            <NavItem icon={Dumbbell}        label="Exercise"  href="/dashboard/fitness" />
            <NavItem icon={ChefHat}         label="Nutrition" href="/dashboard/nutrition" />
          </nav>
        </div>

        <div className="px-3 flex flex-col gap-1">
          <NavItem icon={User} label="Profile" href="/profile" />
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-charcoal/40 dark:text-warmwhite/35 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/15 transition-colors font-outfit text-sm font-medium"
          >
            <LogOut size={18} />
            <span className="hidden lg:block">Log Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-y-auto relative h-screen">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gold/4 rounded-full blur-[140px] pointer-events-none translate-x-1/3 -translate-y-1/3" />
        <div className="max-w-6xl mx-auto p-6 lg:p-10 relative z-10">
          <Outlet />
        </div>
      </main>

      {/* ── Mobile nav ── */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-warmwhite/95 dark:bg-forest-dark/95 backdrop-blur-xl border-t border-charcoal/8 dark:border-warmwhite/8 p-3 flex justify-around z-50">
        {[
          { to: '/dashboard',         Icon: LayoutDashboard, label: 'Home'     },
          { to: '/dashboard/poses',   Icon: HandMetal,       label: 'Poses'    },
          { to: '/dashboard/chat',    Icon: MessageSquare,   label: 'Chat'     },
          { to: '/dashboard/fitness', Icon: Dumbbell,        label: 'Fitness'  },
          { to: '/profile',           Icon: User,            label: 'Profile'  },
        ].map(({ to, Icon, label }) => (
          <Link key={to} to={to} className="p-2 flex flex-col items-center gap-1 text-charcoal/35 dark:text-warmwhite/35 hover:text-forest dark:hover:text-gold transition-colors">
            <Icon size={20} />
            <span className="text-[9px] font-mono">{label}</span>
          </Link>
        ))}
        <button onClick={handleLogout} className="p-2 flex flex-col items-center gap-1 text-charcoal/35 dark:text-warmwhite/35 hover:text-red-500 transition-colors">
          <LogOut size={20} /><span className="text-[9px] font-mono">Out</span>
        </button>
      </div>
    </div>
  );
};

const NavItem = ({ icon: Icon, label, href }: { icon: React.ElementType; label: string; href: string }) => {
  const location = useLocation();
  const isActive = href === '/dashboard'
    ? location.pathname === '/dashboard' || location.pathname === '/dashboard/'
    : location.pathname.startsWith(href);

  return (
    <Link
      to={href}
      className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 group
        ${isActive
          ? 'bg-forest text-warmwhite shadow-sm'
          : 'text-charcoal/50 dark:text-warmwhite/40 hover:bg-charcoal/5 dark:hover:bg-warmwhite/5 hover:text-charcoal dark:hover:text-warmwhite'
        }`}
    >
      <Icon size={18} />
      <span className="hidden lg:block font-outfit font-medium text-sm">{label}</span>
      {isActive && <ChevronRight size={14} className="hidden lg:block ml-auto opacity-50" />}
    </Link>
  );
};

export default Dashboard;
