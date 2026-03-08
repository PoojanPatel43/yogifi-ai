import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, LogOut, MessageSquare, HandMetal,
  Dumbbell, ChefHat, Play, User,
} from 'lucide-react';
import api, { clearAccessToken, hasAccessToken, initSession } from '../lib/api';
import BrutalistCursor from '../components/BrutalistCursor';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
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

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    clearAccessToken();
    navigate('/login');
  };

  if (!sessionReady) return null;

  return (
    <>
      <BrutalistCursor />
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', overflow: 'hidden' }}>

        {/* ── Sidebar ── */}
        <aside
          className="hidden sm:flex"
          style={{
            width: '220px',
            background: 'var(--brutal)',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '2rem 0',
            flexShrink: 0,
            borderRight: '2px solid rgba(210,232,35,0.15)',
          }}
        >
          <div>
            {/* Logo */}
            <div style={{ padding: '0 1.5rem', marginBottom: '2.5rem' }}>
              <Link
                to="/"
                style={{
                  fontFamily: '"Playfair Display", serif',
                  fontStyle: 'italic',
                  fontSize: '1.3rem',
                  color: 'var(--bg)',
                  textDecoration: 'none',
                  display: 'block',
                }}
              >
                Yogifi AI
              </Link>
              {/* Acid accent underline */}
              <div style={{ height: '2px', background: 'var(--acid)', width: '32px', marginTop: '0.5rem', opacity: 0.8 }} />
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column' }}>
              <NavItem icon={LayoutDashboard} label="Overview"  href="/dashboard" />
              <NavItem icon={HandMetal}       label="Poses"     href="/dashboard/poses" />
              <NavItem icon={Play}            label="Session"   href="/session" />
              <NavItem icon={MessageSquare}   label="AI Chat"   href="/dashboard/chat" />
              <NavItem icon={Dumbbell}        label="Exercise"  href="/dashboard/fitness" />
              <NavItem icon={ChefHat}         label="Nutrition" href="/dashboard/nutrition" />
            </nav>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <NavItem icon={User} label="Profile" href="/profile" />
            <button
              onClick={handleLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem 1.5rem',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(247,244,238,0.3)',
                fontSize: '0.82rem', fontWeight: 300, textAlign: 'left', width: '100%',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--acid)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(247,244,238,0.3)')}
            >
              <LogOut size={15} />
              <span>Log Out</span>
            </button>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main style={{ flex: 1, overflowY: 'auto', height: '100vh' }}>
          <div style={{ maxWidth: '1100px', padding: '3rem 2.5rem' }}>
            <Outlet />
          </div>
        </main>

        {/* ── Mobile bottom nav ── */}
        <div
          className="sm:hidden"
          style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            background: 'var(--brutal)',
            borderTop: '2px solid rgba(210,232,35,0.2)',
            padding: '0.75rem',
            display: 'flex', justifyContent: 'space-around', zIndex: 50,
          }}
        >
          {[
            { to: '/dashboard',         Icon: LayoutDashboard, label: 'Home'    },
            { to: '/dashboard/poses',   Icon: HandMetal,       label: 'Poses'   },
            { to: '/dashboard/chat',    Icon: MessageSquare,   label: 'Chat'    },
            { to: '/dashboard/fitness', Icon: Dumbbell,        label: 'Fitness' },
            { to: '/profile',           Icon: User,            label: 'Profile' },
          ].map(({ to, Icon, label }) => (
            <Link
              key={to}
              to={to}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', color: 'rgba(247,244,238,0.4)', textDecoration: 'none' }}
            >
              <Icon size={18} />
              <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '0.6rem', letterSpacing: '0.05em' }}>{label}</span>
            </Link>
          ))}
          <button
            onClick={handleLogout}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', color: 'rgba(247,244,238,0.4)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <LogOut size={18} />
            <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '0.6rem', letterSpacing: '0.05em' }}>Out</span>
          </button>
        </div>
      </div>
    </>
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
      style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '0.75rem 1.5rem',
        color:      isActive ? 'var(--brutal)'           : 'rgba(247,244,238,0.4)',
        background: isActive ? 'var(--acid)'             : 'none',
        borderLeft: isActive ? '3px solid var(--brutal)' : '3px solid transparent',
        textDecoration: 'none',
        fontSize: '0.82rem', fontWeight: isActive ? 700 : 300,
        transition: 'all 0.15s',
        fontFamily: isActive ? '"Space Grotesk", sans-serif' : 'inherit',
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = 'rgba(247,244,238,0.8)'; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'rgba(247,244,238,0.4)'; }}
    >
      <Icon size={15} />
      <span>{label}</span>
    </Link>
  );
};

export default Dashboard;
