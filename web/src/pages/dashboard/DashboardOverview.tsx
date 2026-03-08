/**
 * DashboardOverview — Wellness Brutalism dashboard home.
 *
 * Layout:
 *   - Header greeting: Outfit 48px + Reenie Beanie on username
 *   - Stats bento: 3-col grid — large streak card (#09090B bg, acid text),
 *     accuracy + sessions cards with editorial --line borders
 *   - Weekly bar chart: #09090B bars, acid active bar, no border-radius
 *   - AI insight strip: coral left-border + hard shadow
 *   - Recent sessions: card-brutalist rows with hover translate
 *
 * Clauaskee rules: no border-radius on any element.
 */
import React from 'react';
import { Play, TrendingUp, Flame, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

/* ── Weekly bar data ────────────────────────────────────────────────── */
const WEEK_BARS = [
  { day: 'Mo', val: 88, active: false },
  { day: 'Tu', val: 92, active: false },
  { day: 'We', val: 90, active: false },
  { day: 'Th', val: 96, active: true  },
  { day: 'Fr', val: 0,  active: false },
  { day: 'Sa', val: 0,  active: false },
  { day: 'Su', val: 0,  active: false },
];

/* ── Session row — card-brutalist with hover translate ──────────────── */
const SessionRow = ({
  date, title, duration, score,
}: { date: string; title: string; duration: string; score: string }) => {
  const scoreNum = parseInt(score);
  const scoreColor = scoreNum >= 90 ? 'var(--ink)' : scoreNum >= 75 ? 'var(--muted)' : 'var(--accent)';

  return (
    <Link
      to="/session/summary"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 1.25rem',
        textDecoration: 'none',
        color: 'var(--ink)',
        gap: '1rem',
        background: 'var(--bg)',
        border: '2px solid var(--brutal)',
        boxShadow: '4px 4px 0 0 var(--brutal)',
        transition: 'transform 0.1s ease, box-shadow 0.1s ease',
        willChange: 'transform',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translate(4px, 4px)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 0 var(--brutal)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = '';
        (e.currentTarget as HTMLElement).style.boxShadow = '4px 4px 0 0 var(--brutal)';
      }}
    >
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 400, fontSize: '0.9rem', marginBottom: '0.2rem' }}>{title}</p>
        <p className="ck-label" style={{ marginBottom: 0 }}>{date}</p>
      </div>
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ textAlign: 'right' }}>
          <p className="ck-label" style={{ marginBottom: '0.1rem' }}>Duration</p>
          <p style={{ fontSize: '0.85rem', fontWeight: 300 }}>{duration}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p className="ck-label" style={{ marginBottom: '0.1rem' }}>Score</p>
          <p style={{ fontSize: '0.85rem', fontWeight: 500, color: scoreColor }}>{score}</p>
        </div>
        <ArrowRight size={14} style={{ color: 'var(--line)' }} />
      </div>
    </Link>
  );
};

const DashboardOverview: React.FC = () => {
  const userName = 'Alex';

  return (
    <div>

      {/* ── Header greeting ────────────────────────────────────────────── */}
      <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1.5rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
        <div>
          <p className="ck-label" style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Flame size={11} /> Today
          </p>
          {/* Outfit display heading + Reenie Beanie on name */}
          <div style={{ lineHeight: 1.0, marginBottom: '0.5rem' }}>
            <span style={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', color: 'var(--ink)', display: 'block' }}>
              Welcome back,
            </span>
            <span style={{ fontFamily: '"Reenie Beanie", cursive', fontWeight: 400, fontSize: 'clamp(2.5rem, 5vw, 3.75rem)', color: 'var(--accent)', display: 'block', lineHeight: 0.85 }}>
              {userName}.
            </span>
          </div>
          <p style={{ color: 'var(--muted)', fontWeight: 300, fontSize: '0.875rem' }}>
            You're on a 6-day streak — keep it going!
          </p>
        </div>

        {/* Quick start — btn-brutalist */}
        <Link to="/session" className="btn-brutalist" style={{ textDecoration: 'none' }}>
          <Play size={13} style={{ fill: 'currentColor' }} />
          <span>Quick Start</span>
        </Link>
      </header>

      {/* ── Stats bento grid ────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px', background: 'var(--line)', marginBottom: '2.5rem' }}>

        {/* Accuracy */}
        <div style={{ padding: '1.75rem', background: 'var(--bg)', borderTop: '2px solid var(--line)' }}>
          <p className="ck-label" style={{ marginBottom: '1rem' }}>Avg. Accuracy</p>
          <p style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1, marginBottom: '0.5rem', color: 'var(--ink)' }}>
            94.2%
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 300 }}>+2.4% vs last week</p>
        </div>

        {/* Sessions */}
        <div style={{ padding: '1.75rem', background: 'var(--bg)', borderTop: '2px solid var(--line)' }}>
          <p className="ck-label" style={{ marginBottom: '1rem' }}>Sessions Completed</p>
          <p style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1, marginBottom: '0.5rem', color: 'var(--ink)' }}>
            24
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 300 }}>On track</p>
        </div>

        {/* Streak — dark card with acid text (brutalist injection) */}
        <div style={{ padding: '1.75rem', background: 'var(--brutal)', borderTop: '2px solid var(--brutal)', position: 'relative' }}>
          {/* Acid sticker badge */}
          <div aria-hidden="true" style={{ position: 'absolute', top: '-0.85rem', right: '1rem', background: 'var(--acid)', border: '1px solid var(--brutal)', padding: '0.15rem 0.6rem', transform: 'rotate(-1.5deg)' }}>
            <span style={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--brutal)' }}>
              Personal Best
            </span>
          </div>
          <p className="ck-label" style={{ marginBottom: '1rem', color: 'rgba(210,232,35,0.5)' }}>Current Streak</p>
          <p style={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1, marginBottom: '0.5rem', color: 'var(--acid)' }}>
            6 days
          </p>
          <p style={{ fontSize: '0.8rem', color: 'rgba(210,232,35,0.45)', fontWeight: 300 }}>Keep the streak alive</p>
        </div>
      </div>

      {/* ── Weekly accuracy chart — brutalist bars ───────────────────────── */}
      <div style={{ padding: '1.5rem', border: '2px solid var(--brutal)', boxShadow: '4px 4px 0 0 var(--brutal)', marginBottom: '2.5rem', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={15} style={{ color: 'var(--muted)' }} />
            <p style={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink)' }}>
              Weekly Accuracy
            </p>
          </div>
          <span style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '1.5rem', color: 'var(--accent)' }}>+8°</span>
        </div>

        {/* Bars — no border-radius, acid for active day */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '72px' }}>
          {WEEK_BARS.map(({ day, val, active }) => (
            <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', height: '100%', justifyContent: 'flex-end' }}>
              <div style={{
                width: '100%',
                height: val ? `${(val / 100) * 56}px` : '3px',
                background: active ? 'var(--acid)' : val ? 'var(--brutal)' : 'var(--line)',
                border: val ? `1px solid ${active ? 'var(--brutal)' : 'var(--brutal)'}` : 'none',
                transition: 'height 0.5s ease',
              }} />
              <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '0.55rem', color: active ? 'var(--ink)' : 'var(--muted)', letterSpacing: '0.05em', fontWeight: active ? 700 : 400 }}>{day}</span>
            </div>
          ))}
        </div>
        <p style={{ marginTop: '0.75rem', color: 'var(--muted)', fontWeight: 300, fontSize: '0.8rem' }}>
          Across 4 sessions — Monday through Thursday
        </p>
      </div>

      {/* ── Recent sessions ──────────────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--line)', marginBottom: '1rem' }}>
          <h2 style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '1.4rem', color: 'var(--ink)' }}>
            Recent Sessions
          </h2>
          <button style={{ color: 'var(--muted)', fontSize: '0.75rem', fontWeight: 300, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            View all <ArrowRight size={11} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <SessionRow date="Today, 07:00 AM"     title="Morning Mobility Flow"  duration="25m" score="96%" />
          <SessionRow date="Yesterday, 06:30 PM" title="Hip Openers & Core"     duration="45m" score="92%" />
          <SessionRow date="Oct 12, 07:15 AM"    title="Foundational Alignment" duration="30m" score="88%" />
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
