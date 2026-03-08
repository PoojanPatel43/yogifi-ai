import React, { useEffect, useState } from 'react';
import { Play, Cpu, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';

interface Pose {
  id: string;
  name: string;
  sanskritName: string;
  difficulty: string;
  description: string;
  imageUrl?: string;
  targetDurationSeconds: number;
  mlModelKey?: string;
}

const PosesView: React.FC = () => {
  const [poses,   setPoses]   = useState<Pose[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/poses/list')
      .then(res => { if (res.data?.data) setPoses(res.data.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '0.75rem', color: 'var(--muted)' }}>
        <Loader2 size={20} className="animate-spin" />
        <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '0.75rem', letterSpacing: '0.1em' }}>LOADING POSES...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <p className="ck-label" style={{ marginBottom: '0.5rem' }}>Library</p>
        <h2 style={{
          fontFamily: '"Playfair Display", serif',
          fontStyle: 'italic',
          fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
          color: 'var(--ink)',
          lineHeight: 1.1,
          marginBottom: '0.5rem',
        }}>
          Yoga Postures
        </h2>
        <p style={{ color: 'var(--muted)', fontWeight: 300, fontSize: '0.875rem' }}>
          Select a pose to begin AI tracking.
        </p>
      </div>

      {/* Pose grid — brutalist cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {poses.map(pose => (
          <div
            key={pose.id}
            style={{ background: 'var(--bg)', display: 'flex', flexDirection: 'column', border: '2px solid var(--brutal)', boxShadow: '4px 4px 0 0 var(--brutal)', transition: 'transform 0.15s, box-shadow 0.15s' }}
            onMouseEnter={e => { const el = e.currentTarget; el.style.transform = 'translate(4px,4px)'; el.style.boxShadow = 'none'; }}
            onMouseLeave={e => { const el = e.currentTarget; el.style.transform = ''; el.style.boxShadow = '4px 4px 0 0 var(--brutal)'; }}
          >
            {/* Image */}
            <div style={{ width: '100%', height: '200px', background: 'var(--surface)', overflow: 'hidden', position: 'relative' }}>
              {pose.imageUrl ? (
                <img
                  src={pose.imageUrl}
                  alt={pose.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '1.25rem', color: 'var(--line)' }}>
                    {pose.sanskritName}
                  </span>
                </div>
              )}
              <div style={{
                position: 'absolute',
                top: '0.75rem',
                right: '0.75rem',
                background: 'var(--ink)',
                color: 'var(--bg)',
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: '0.6rem',
                letterSpacing: '0.08em',
                padding: '0.25rem 0.5rem',
              }}>
                {pose.difficulty.toUpperCase()}
              </div>
              {pose.mlModelKey && (
                <div style={{
                  position: 'absolute', bottom: '0.75rem', left: '0.75rem',
                  background: 'var(--acid)', color: 'var(--brutal)',
                  fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700,
                  fontSize: '0.6rem', letterSpacing: '0.1em',
                  padding: '0.25rem 0.5rem',
                  display: 'flex', alignItems: 'center', gap: '0.3rem',
                  border: '1px solid var(--brutal)',
                }}>
                  <Cpu size={9} />
                  AI TRACKING
                </div>
              )}
            </div>

            {/* Info */}
            <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <p className="ck-label" style={{ marginBottom: '0.2rem' }}>{pose.sanskritName}</p>
              <p style={{ fontWeight: 500, fontSize: '1rem', color: 'var(--ink)', marginBottom: '0.75rem' }}>{pose.name}</p>
              <p style={{
                fontSize: '0.8rem',
                color: 'var(--muted)',
                fontWeight: 300,
                lineHeight: 1.6,
                marginBottom: '1.25rem',
                flex: 1,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical' as const,
              }}>
                {pose.description}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--line)', paddingTop: '1rem' }}>
                <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '0.7rem', color: 'var(--muted)', letterSpacing: '0.06em' }}>
                  {pose.targetDurationSeconds}S HOLD
                </span>
                <Link
                  to={`/session?poseId=${pose.id}&mk=${pose.mlModelKey ?? ''}`}
                  className="btn-brutalist"
                  style={{ padding: '0.4rem 0.875rem', fontSize: '0.75rem', textDecoration: 'none' }}
                >
                  <Play size={11} style={{ fill: 'currentColor' }} />
                  <span>Start</span>
                </Link>
              </div>
            </div>
          </div>
        ))}

        {poses.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: '4rem', textAlign: 'center', background: 'var(--bg)', color: 'var(--muted)', fontWeight: 300 }}>
            No poses available from server.
          </div>
        )}
      </div>
    </div>
  );
};

export default PosesView;
