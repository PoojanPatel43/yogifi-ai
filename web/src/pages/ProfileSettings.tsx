import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Bell, Camera, CreditCard, LogOut,
  ChevronRight, Check, Moon, Sun,
} from 'lucide-react';
import api, { clearAccessToken } from '../lib/api';

/* ── Helpers ─────────────────────────────────────────────────────────── */
const StatCard = ({ label, value, emoji }: { label: string; value: string; emoji: string }) => (
  <div className="bg-warmwhite dark:bg-forest/20 border border-charcoal/8 dark:border-warmwhite/8 rounded-2xl p-5 flex flex-col gap-2">
    <span className="text-2xl">{emoji}</span>
    <p className="font-sans font-bold text-xl text-charcoal dark:text-warmwhite leading-none">{value}</p>
    <p className="font-outfit text-xs text-charcoal/45 dark:text-warmwhite/35">{label}</p>
  </div>
);

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
    className="flex items-center gap-4 w-full py-4 px-1 border-b border-charcoal/6 dark:border-warmwhite/6 last:border-none hover:bg-charcoal/2 dark:hover:bg-warmwhite/2 rounded-xl transition-colors text-left group"
  >
    <div className="w-9 h-9 rounded-xl bg-forest/8 dark:bg-warmwhite/8 flex items-center justify-center shrink-0">
      <Icon size={16} className="text-forest dark:text-sage" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-sans font-semibold text-sm text-charcoal dark:text-warmwhite">{label}</p>
      {desc && <p className="font-outfit text-xs text-charcoal/40 dark:text-warmwhite/30 mt-0.5 truncate">{desc}</p>}
    </div>
    {toggle ? (
      <div
        onClick={e => { e.stopPropagation(); toggle.onChange(!toggle.value); }}
        className={`w-11 h-6 rounded-full transition-colors duration-300 relative shrink-0 ${toggle.value ? 'bg-forest dark:bg-sage' : 'bg-charcoal/15 dark:bg-warmwhite/15'}`}
      >
        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-warmwhite shadow transition-transform duration-300 ${toggle.value ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </div>
    ) : value ? (
      <span className="font-outfit text-xs text-charcoal/40 dark:text-warmwhite/30 shrink-0">{value}</span>
    ) : (
      <ChevronRight size={16} className="text-charcoal/25 dark:text-warmwhite/20 group-hover:text-charcoal/50 dark:group-hover:text-warmwhite/50 transition-colors shrink-0" />
    )}
  </button>
);

/* ── Main ────────────────────────────────────────────────────────────── */
const ProfileSettings = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(true);
  const [cameraHD,      setCameraHD]      = useState(false);
  const [darkMode,      setDarkMode]      = useState(() =>
    document.documentElement.classList.contains('dark')
  );
  const [saved, setSaved] = useState(false);

  const handleDarkToggle = (v: boolean) => {
    setDarkMode(v);
    document.documentElement.classList.toggle('dark', v);
  };

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    clearAccessToken();
    navigate('/login');
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Mock user data
  const user = { name: 'Alex Rivera', email: 'alex@example.com', plan: 'Pro', since: 'Jan 2025', avatar: '🧘' };
  const stats = [
    { label: 'Total sessions',  value: '47',    emoji: '🏋️' },
    { label: 'Best streak',     value: '21 days', emoji: '🔥' },
    { label: 'Favourite pose',  value: 'Warrior II', emoji: '🌿' },
  ];

  return (
    <div className="min-h-screen bg-warmwhite dark:bg-forest-dark font-sans">
      {/* Header */}
      <div className="bg-forest px-6 md:px-12 pt-10 pb-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold/8 blur-[80px] rounded-full pointer-events-none" />
        <div className="max-w-2xl mx-auto relative z-10">
          <div className="section-label mb-6 !bg-gold/15 !text-gold">Profile</div>

          {/* Avatar + info */}
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gold/15 border-2 border-gold/25 flex items-center justify-center text-4xl">
                {user.avatar}
              </div>
              <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-gold rounded-full flex items-center justify-center border-2 border-forest">
                <Camera size={12} className="text-forest" />
              </button>
            </div>
            <div>
              <h1 className="font-sans font-bold text-2xl text-warmwhite leading-tight">{user.name}</h1>
              <p className="font-outfit text-warmwhite/55 text-sm mt-0.5">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="bg-gold/15 border border-gold/25 text-gold font-mono text-[10px] tracking-widest px-2.5 py-0.5 rounded-full">
                  {user.plan.toUpperCase()}
                </span>
                <span className="font-mono text-[10px] text-warmwhite/30">since {user.since}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats — overlap the hero */}
      <div className="px-6 md:px-12 -mt-10 mb-8 relative z-10">
        <div className="max-w-2xl mx-auto grid grid-cols-3 gap-3 shadow-lg">
          {stats.map(s => <StatCard key={s.label} {...s} />)}
        </div>
      </div>

      <div className="px-6 md:px-12 pb-16">
        <div className="max-w-2xl mx-auto flex flex-col gap-6">

          {/* App preferences */}
          <div className="bg-warmwhite dark:bg-forest/20 border border-charcoal/8 dark:border-warmwhite/8 rounded-[1.5rem] p-5">
            <h2 className="font-sans font-bold text-sm text-charcoal/50 dark:text-warmwhite/35 uppercase tracking-wider mb-3">Preferences</h2>
            <SettingRow
              icon={darkMode ? Moon : Sun}
              label="Dark Mode"
              desc="Switch between light and dark theme"
              toggle={{ value: darkMode, onChange: handleDarkToggle }}
            />
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
          <div className="bg-warmwhite dark:bg-forest/20 border border-charcoal/8 dark:border-warmwhite/8 rounded-[1.5rem] p-5">
            <h2 className="font-sans font-bold text-sm text-charcoal/50 dark:text-warmwhite/35 uppercase tracking-wider mb-3">Account</h2>
            <SettingRow icon={User}       label="Edit Profile"       action={() => {}} />
            <SettingRow icon={CreditCard} label="Subscription"       value={user.plan} action={() => navigate('/pricing')} />
          </div>

          {/* Save button */}
          <button onClick={handleSave} className="btn-primary w-full !py-4 text-base">
            {saved ? (
              <><Check size={18} /><span>Saved!</span></>
            ) : (
              <span>Save Changes</span>
            )}
          </button>

          {/* Danger zone */}
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl border border-red-200 dark:border-red-900/40 text-red-500 dark:text-red-400 font-semibold text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut size={16} />
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
