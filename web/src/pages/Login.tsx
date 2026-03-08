import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import api, { setAccessToken } from '../lib/api';
import BrutalistCursor from '../components/BrutalistCursor';

const Login: React.FC = () => {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const navigate = useNavigate();

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data?.data?.token) {
        setAccessToken(response.data.data.token);
        navigate('/dashboard');
      } else {
        setError('Unexpected response from server.');
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }, [email, password, navigate]);

  return (
    <>
      <BrutalistCursor />
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex' }}>

        {/* Left — dark editorial panel */}
        <div
          className="hidden lg:flex lg:w-1/2 flex-col justify-between"
          style={{ background: 'var(--ink)', color: 'var(--bg)', padding: '4rem', position: 'relative', overflow: 'hidden' }}
        >
          {/* Acid sticker badge */}
          <div aria-hidden="true" style={{
            position: 'absolute', top: '3.5rem', right: '3rem',
            background: 'var(--acid)', border: '2px solid var(--bg)',
            boxShadow: '4px 4px 0 0 var(--bg)',
            transform: 'rotate(-2deg)', padding: '0.4rem 0.9rem',
          }}>
            <span style={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--brutal)' }}>
              v0.9.2 ✦
            </span>
          </div>

          <Link
            to="/"
            style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '1.4rem', color: 'var(--bg)', textDecoration: 'none' }}
          >
            Yogifi AI
          </Link>

          <div>
            <p style={{
              fontFamily: '"Playfair Display", serif', fontStyle: 'italic',
              fontSize: 'clamp(2.2rem, 4vw, 3.5rem)', lineHeight: 1.1,
              color: 'var(--bg)', marginBottom: '1.5rem',
            }}>
              Every session<br />
              <em style={{ color: 'var(--accent)' }}>moves you closer</em><br />
              to mastery.
            </p>
            <p style={{ color: 'rgba(247,244,238,0.45)', fontWeight: 300, fontSize: '0.9rem', lineHeight: 1.6 }}>
              Your AI-guided yoga coach — real-time pose feedback, every practice.
            </p>
          </div>

          <p style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '0.65rem', letterSpacing: '0.1em', color: 'rgba(247,244,238,0.2)', textTransform: 'uppercase' }}>
            System Active · v0.9.2
          </p>
        </div>

        {/* Right — form */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 2rem' }}>
          <div style={{ width: '100%', maxWidth: '400px' }}>

            {/* Mobile logo */}
            <Link
              to="/"
              className="lg:hidden"
              style={{ display: 'block', fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '1.3rem', color: 'var(--ink)', textDecoration: 'none', marginBottom: '2.5rem' }}
            >
              Yogifi AI
            </Link>

            <p className="ck-label" style={{ marginBottom: '0.75rem' }}>Welcome back</p>

            {/* Brutalist heading: Outfit + Reenie Beanie */}
            <div style={{ marginBottom: '2.5rem', lineHeight: 1.05 }}>
              <span style={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', color: 'var(--ink)', display: 'block' }}>
                Sign in to your
              </span>
              <span style={{ fontFamily: '"Reenie Beanie", cursive', fontWeight: 400, fontSize: 'clamp(2.4rem, 5vw, 3.2rem)', color: 'var(--accent)', display: 'block', lineHeight: 0.9 }}>
                practice.
              </span>
            </div>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              <div>
                <label className="ck-label">Email address</label>
                <input
                  type="email" required value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="hello@example.com" className="ck-input"
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="ck-label" style={{ marginBottom: 0 }}>Password</label>
                  <a href="#" style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 300, textDecoration: 'none' }}>
                    Forgot?
                  </a>
                </div>
                <input
                  type="password" required value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" className="ck-input"
                  style={{ marginTop: '0.5rem' }}
                />
              </div>

              {error && (
                <div style={{
                  background: 'var(--acid)', border: '2px solid var(--brutal)',
                  boxShadow: '4px 4px 0 0 var(--brutal)', padding: '0.75rem 1rem',
                  color: 'var(--brutal)', fontSize: '0.8rem', fontWeight: 600,
                  lineHeight: 1.5, fontFamily: '"Space Grotesk", sans-serif',
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit" disabled={loading}
                className="btn-brutalist"
                style={{ width: '100%', justifyContent: 'center', padding: '0.875rem 1.5rem', opacity: loading ? 0.6 : 1 }}
              >
                {loading
                  ? <Loader2 size={18} className="animate-spin" />
                  : <><span>Sign in securely</span><ArrowRight size={16} /></>
                }
              </button>
            </form>

            {/* OR divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.75rem 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--line)' }} />
              <span style={{ fontFamily: '"Space Grotesk", sans-serif', fontSize: '0.7rem', letterSpacing: '0.1em', color: 'var(--muted)', textTransform: 'uppercase' }}>or</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--line)' }} />
            </div>

            {/* SSO buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { label: 'Continue with Google',  icon: 'G' },
                { label: 'Continue with Apple',   icon: '⌘' },
              ].map(({ label, icon }) => (
                <button
                  key={label}
                  type="button"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                    width: '100%', padding: '0.75rem 1.5rem',
                    background: 'var(--bg)', border: '2px solid var(--brutal)',
                    boxShadow: '4px 4px 0 0 var(--brutal)',
                    cursor: 'pointer', fontSize: '0.875rem', fontWeight: 400, color: 'var(--ink)',
                    transition: 'transform 0.1s, box-shadow 0.1s',
                    fontFamily: '"Space Grotesk", sans-serif',
                  }}
                  onMouseEnter={e => { const el = e.currentTarget; el.style.transform = 'translate(4px,4px)'; el.style.boxShadow = 'none'; }}
                  onMouseLeave={e => { const el = e.currentTarget; el.style.transform = ''; el.style.boxShadow = '4px 4px 0 0 var(--brutal)'; }}
                >
                  <span style={{ fontWeight: 700, fontSize: '1rem' }}>{icon}</span>
                  {label}
                </button>
              ))}
            </div>

            <p style={{ marginTop: '2rem', fontSize: '0.875rem', color: 'var(--muted)', fontWeight: 300 }}>
              New to Yogifi?{' '}
              <Link to="/signup" style={{ color: 'var(--ink)', textDecoration: 'underline', fontWeight: 400 }}>
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
