import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2, Check } from 'lucide-react';
import api, { setAccessToken } from '../lib/api';
import BrutalistCursor from '../components/BrutalistCursor';

const PassReq = ({ ok, label }: { ok: boolean; label: string }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    fontSize: '0.75rem', color: ok ? 'var(--ink)' : 'var(--muted)',
    transition: 'color 0.2s', fontWeight: 300,
  }}>
    {ok
      ? <Check size={11} style={{ color: 'var(--accent)', flexShrink: 0 }} />
      : <span style={{ width: 11, height: 11, border: '1px solid var(--line)', display: 'inline-block', flexShrink: 0 }} />
    }
    {label}
  </div>
);

const Signup: React.FC = () => {
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const hasLength  = password.length >= 8;
  const hasNumber  = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isPasswordValid = hasLength && hasNumber && hasSpecial;

  const navigate = useNavigate();

  const handleSignup = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasLength || !hasNumber || !hasSpecial) { setError('Please meet all password requirements.'); return; }
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/register', { name, email, password });
      if (response.data?.data?.token) {
        setAccessToken(response.data.data.token);
        navigate('/onboarding');
      } else {
        setError('Unexpected response from server.');
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [hasLength, hasNumber, hasSpecial, name, email, password, navigate]);

  return (
    <>
      <BrutalistCursor />
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex' }}>

        {/* Left — form */}
        <div
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 2rem' }}
          className="order-2 lg:order-1"
        >
          <div style={{ width: '100%', maxWidth: '400px' }}>

            {/* Mobile logo */}
            <Link
              to="/"
              className="lg:hidden"
              style={{ display: 'block', fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '1.3rem', color: 'var(--ink)', textDecoration: 'none', marginBottom: '2.5rem' }}
            >
              Yogifi AI
            </Link>

            <p className="ck-label" style={{ marginBottom: '0.75rem' }}>Get started free</p>

            {/* Brutalist heading */}
            <div style={{ marginBottom: '2.5rem', lineHeight: 1.05 }}>
              <span style={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', color: 'var(--ink)', display: 'block' }}>
                Create your
              </span>
              <span style={{ fontFamily: '"Reenie Beanie", cursive', fontWeight: 400, fontSize: 'clamp(2.4rem, 5vw, 3.2rem)', color: 'var(--accent)', display: 'block', lineHeight: 0.9 }}>
                account.
              </span>
            </div>

            <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label className="ck-label">Full name</label>
                <input
                  type="text" required value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Jane Doe" className="ck-input"
                />
              </div>

              <div>
                <label className="ck-label">Email address</label>
                <input
                  type="email" required value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="hello@example.com" className="ck-input"
                />
              </div>

              <div>
                <label className="ck-label">Password</label>
                <input
                  type="password" required value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" className="ck-input"
                />
                {password.length > 0 && (
                  <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <PassReq ok={hasLength}  label="8+ characters" />
                    <PassReq ok={hasNumber}  label="At least one number" />
                    <PassReq ok={hasSpecial} label="At least one special character" />
                  </div>
                )}
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
                type="submit"
                disabled={loading || !isPasswordValid}
                className="btn-brutalist"
                style={{ width: '100%', justifyContent: 'center', padding: '0.875rem 1.5rem', opacity: (loading || !isPasswordValid) ? 0.45 : 1 }}
              >
                {loading
                  ? <Loader2 size={18} className="animate-spin" />
                  : <><span>Create account</span><ArrowRight size={16} /></>
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
                { label: 'Continue with Google', icon: 'G' },
                { label: 'Continue with Apple',  icon: '⌘' },
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
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'var(--ink)', textDecoration: 'underline', fontWeight: 400 }}>
                Log in
              </Link>
            </p>
          </div>
        </div>

        {/* Right — dark editorial panel */}
        <div
          className="hidden lg:flex lg:w-1/2 flex-col justify-between order-1 lg:order-2"
          style={{ background: 'var(--brutal)', color: 'var(--bg)', padding: '4rem', position: 'relative', overflow: 'hidden' }}
        >
          {/* Acid sticker badge */}
          <div aria-hidden="true" style={{
            position: 'absolute', top: '3.5rem', left: '3rem',
            background: 'var(--acid)', border: '2px solid var(--bg)',
            boxShadow: '4px 4px 0 0 var(--bg)',
            transform: 'rotate(2deg)', padding: '0.4rem 0.9rem',
          }}>
            <span style={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--brutal)' }}>
              Beta ✦
            </span>
          </div>

          <Link
            to="/"
            style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '1.4rem', color: 'var(--bg)', textDecoration: 'none', alignSelf: 'flex-end' }}
          >
            Yogifi AI
          </Link>

          <div>
            <p style={{
              fontFamily: '"Playfair Display", serif', fontStyle: 'italic',
              fontSize: 'clamp(2.2rem, 4vw, 3.5rem)', lineHeight: 1.1,
              color: 'var(--bg)', marginBottom: '1.5rem',
            }}>
              Your practice,<br />
              <em style={{ color: 'var(--accent)' }}>guided by AI.</em>
            </p>
            <p style={{ color: 'rgba(247,244,238,0.45)', fontWeight: 300, fontSize: '0.9rem', lineHeight: 1.6 }}>
              Join thousands of practitioners improving their form with real-time AI coaching.
            </p>
          </div>

          <p style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '0.65rem', letterSpacing: '0.1em', color: 'rgba(247,244,238,0.2)', textTransform: 'uppercase' }}>
            Beta · Limited access
          </p>
        </div>
      </div>
    </>
  );
};

export default Signup;
