import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Bell, Camera, CreditCard, LogOut, Check } from 'lucide-react';
import api, { clearAccessToken } from '../lib/api';
import BrutalistCursor from '../components/BrutalistCursor';

/* ── Stat card ───────────────────────────────────────────────────────── */
const StatCard = ({ label, value }: { label: string; value: string }) => (
  <div style={{ background: 'var(--bg)', padding: '1.5rem', border: '2px solid var(--brutal)', boxShadow: '4px 4px 0 0 var(--brutal)' }}>
    <p style={{
      fontFamily: '"Outfit", sans-serif', fontWeight: 800,
      fontSize: '1.75rem', color: 'var(--ink)', lineHeight: 1, marginBottom: '0.4rem',
    }}>
      {value}
    </p>
    <p className="ck-label" style={{ marginBottom: 0 }}>{label}</p>
  </div>
);

/* ── Settings row ────────────────────────────────────────────────────── */
const SettingRow = ({
  icon: Icon, label, desc, action, toggle, value,
}: {
  icon: React.ElementType;
  label: string;
  desc?: string;
  action?: () => void;
  toggle?: { value: boolean; onChange: (v: boolean) => void };
  value?: string;
}) => (
  <button
    onClick={action}
    style={{
      display: 'flex', alignItems: 'center', gap: '1rem',
      width: '100%', padding: '1rem 0',
      background: 'none', border: 'none',
      borderBottom: '1px solid var(--line)',
      cursor: 'pointer', textAlign: 'left', color: 'var(--ink)',
    }}
  >
    <div style={{ width: '36px', height: '36px', background: 'var(--surface)', border: '2px solid var(--brutal)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={15} style={{ color: 'var(--muted)' }} />
    </div>
    <div style={{ flex: 1 }}>
      <p style={{ fontWeight: 400, fontSize: '0.875rem', marginBottom: '0.1rem', fontFamily: '"Space Grotesk", sans-serif' }}>{label}</p>
      {desc && <p style={{ fontSize: '0.775rem', color: 'var(--muted)', fontWeight: 300 }}>{desc}</p>}
    </div>
    {toggle ? (
      <div
        onClick={e => { e.stopPropagation(); toggle.onChange(!toggle.value); }}
        style={{
          width: '40px', height: '22px',
          background: toggle.value ? 'var(--accent)' : 'var(--line)',
          border: '2px solid var(--brutal)',
          position: 'relative', flexShrink: 0, cursor: 'pointer', transition: 'background 0.2s',
        }}
      >
        <div style={{
          position: 'absolute', top: '1px',
          left: toggle.value ? '18px' : '1px',
          width: '16px', height: '16px',
          background: 'var(--bg)',
          border: '1px solid var(--brutal)',
          transition: 'left 0.2s',
        }} />
      </div>
    ) : value ? (
      <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 400, letterSpacing: '0.06em', flexShrink: 0 }}>{value}</span>
    ) : (
      <span style={{ color: 'var(--brutal)', fontSize: '1rem', flexShrink: 0, fontWeight: 700 }}>→</span>
    )}
  </button>
);

/* ── Main ────────────────────────────────────────────────────────────── */
const ProfileSettings = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(true);
  const [cameraHD,      setCameraHD]      = useState(false);
  const [saved,         setSaved]         = useState(false);

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    clearAccessToken();
    navigate('/login');
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const user  = { name: 'Alex Rivera', email: 'alex@example.com', plan: 'Pro', since: 'Jan 2025' };
  const stats = [
    { label: 'Total sessions', value: '47'        },
    { label: 'Best streak',    value: '21 days'   },
    { label: 'Fav. pose',      value: 'Warrior II' },
  ];

  return (
    <>
      <BrutalistCursor />
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

        {/* Hero header */}
        <div style={{ background: 'var(--brutal)', padding: '3rem 2rem 5rem' }}>
          <div style={{ maxWidth: '680px', margin: '0 auto' }}>
            <p className="ck-label" style={{ color: 'rgba(247,244,238,0.4)', marginBottom: '1.5rem' }}>Profile</p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              {/* Avatar — brutal border + shadow */}
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: '72px', height: '72px',
                  background: 'rgba(201,71,47,0.15)',
                  border: '4px solid var(--acid)',
                  boxShadow: '6px 6px 0 0 var(--acid)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem',
                }}>
                  🧘
                </div>
                <button style={{
                  position: 'absolute', bottom: '-8px', right: '-8px',
                  width: '24px', height: '24px',
                  background: 'var(--acid)', border: '2px solid var(--brutal)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--brutal)',
                }}>
                  <Camera size={11} />
                </button>
              </div>

              <div>
                <h1 style={{
                  fontFamily: '"Outfit", sans-serif', fontWeight: 800,
                  fontSize: '1.75rem', color: 'var(--bg)', lineHeight: 1.05, marginBottom: '0.25rem',
                }}>
                  {user.name}
                </h1>
                <p style={{ color: 'rgba(247,244,238,0.45)', fontWeight: 300, fontSize: '0.875rem', marginBottom: '0.5rem' }}>{user.email}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{
                    fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700,
                    fontSize: '0.65rem', letterSpacing: '0.1em',
                    color: 'var(--brutal)', background: 'var(--acid)',
                    border: '2px solid var(--bg)', padding: '0.2rem 0.5rem', textTransform: 'uppercase',
                  }}>
                    {user.plan}
                  </span>
                  <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '0.65rem', color: 'rgba(247,244,238,0.2)', letterSpacing: '0.06em' }}>
                    since {user.since}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats — overlap hero */}
        <div style={{ padding: '0 2rem', marginTop: '-2.5rem', marginBottom: '2.5rem', position: 'relative', zIndex: 10 }}>
          <div style={{ maxWidth: '680px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            {stats.map(s => <StatCard key={s.label} {...s} />)}
          </div>
        </div>

        {/* Settings */}
        <div style={{ padding: '0 2rem 4rem', maxWidth: '680px', margin: '0 auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

            {/* Preferences */}
            <div>
              <p style={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                Preferences
              </p>
              <SettingRow
                icon={Bell}
                label="Notifications"
                desc="Daily practice reminders"
                toggle={{ value: notifications, onChange: setNotifications }}
              />
              <SettingRow
                icon={Camera}
                label="HD Camera"
                desc="Higher quality pose tracking (uses more CPU)"
                toggle={{ value: cameraHD, onChange: setCameraHD }}
              />
            </div>

            {/* Account */}
            <div>
              <p style={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                Account
              </p>
              <SettingRow icon={User}       label="Edit Profile"  action={() => {}} />
              <SettingRow icon={CreditCard} label="Subscription"  value={user.plan} action={() => navigate('/pricing')} />
            </div>

            {/* Save */}
            <button
              onClick={handleSave}
              className="btn-brutalist"
              style={{ width: '100%', justifyContent: 'center', padding: '0.875rem' }}
            >
              {saved ? <><Check size={16} /><span>Saved!</span></> : <span>Save Changes</span>}
            </button>

            {/* Danger zone */}
            <div style={{ border: '2px solid var(--acid)', boxShadow: '4px 4px 0 0 var(--acid)', padding: '1.5rem' }}>
              <p style={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--brutal)', background: 'var(--acid)', display: 'inline-block', padding: '0.2rem 0.5rem', marginBottom: '1rem' }}>
                Danger Zone
              </p>
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  width: '100%', padding: '0.875rem',
                  background: 'none', border: '2px solid var(--accent)',
                  color: 'var(--accent)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 400,
                  fontFamily: '"Space Grotesk", sans-serif',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = 'var(--bg)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--accent)'; }}
              >
                <LogOut size={15} />
                Log Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileSettings;
