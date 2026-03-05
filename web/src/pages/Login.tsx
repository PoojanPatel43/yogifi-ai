import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ArrowRight, Loader2, Leaf } from 'lucide-react';
import api, { setAccessToken } from '../lib/api';

const Login: React.FC = () => {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const navigate     = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const ctx = gsap.context(() => {
      gsap.from('.auth-elem', { y: 28, opacity: 0, stagger: 0.1, ease: 'power3.out', duration: 1, delay: 0.2 });
      gsap.from('.auth-image', { scale: 1.06, opacity: 0, duration: 1.6, ease: 'power2.out' });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
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
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-warmwhite dark:bg-forest-dark flex font-sans">

      {/* Left — image */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-forest-dark">
        <div className="absolute inset-0 z-10" style={{ background: 'linear-gradient(to top, rgba(15,36,25,0.9) 0%, rgba(27,67,50,0.35) 55%, transparent 100%)' }} />
        <img
          src="https://images.unsplash.com/photo-1599901860904-17e08c2d4212?w=1200&q=85&auto=format&fit=crop"
          alt="Yoga session"
          className="auth-image absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute bottom-12 left-12 z-20">
          <Link to="/" className="flex items-center gap-2.5 mb-4">
            <Leaf size={18} className="text-gold" />
            <span className="font-outfit font-bold text-xl text-warmwhite tracking-tight">Yogifi AI</span>
          </Link>
          <p className="font-serif italic text-warmwhite/60 text-xl max-w-xs leading-snug">
            "Every session moves you closer to mastery."
          </p>
          <p className="font-mono text-warmwhite/30 text-[10px] mt-3 tracking-widest">SYSTEM ACTIVE · v0.9.2</p>
        </div>
      </div>

      {/* Right — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 md:p-16 relative">
        <Link to="/" className="absolute top-8 left-8 lg:hidden flex items-center gap-2">
          <Leaf size={16} className="text-forest dark:text-gold" />
          <span className="font-outfit font-bold text-lg text-forest dark:text-warmwhite">Yogifi AI</span>
        </Link>

        <div className="w-full max-w-md">
          <div className="auth-elem mb-10">
            <div className="section-label mb-5 !bg-gold/8 !text-gold">Welcome back</div>
            <h1 className="font-serif italic text-4xl sm:text-5xl text-forest dark:text-warmwhite mb-3 leading-tight">
              Sign in to practice.
            </h1>
            <p className="font-outfit text-charcoal/50 dark:text-warmwhite/45">
              Your AI coach is ready when you are.
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <div className="auth-elem flex flex-col gap-2">
              <label className="font-mono text-[10px] tracking-widest text-charcoal/45 dark:text-warmwhite/35 uppercase">Email address</label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="hello@example.com"
                className="bg-transparent border-b-2 border-charcoal/15 dark:border-warmwhite/12 pb-3 text-lg font-outfit outline-none
                  focus:border-forest dark:focus:border-gold transition-colors
                  text-charcoal dark:text-warmwhite placeholder:text-charcoal/20 dark:placeholder:text-warmwhite/18"
              />
            </div>

            <div className="auth-elem flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="font-mono text-[10px] tracking-widest text-charcoal/45 dark:text-warmwhite/35 uppercase">Password</label>
                <a href="#" className="font-outfit text-xs text-charcoal/35 dark:text-warmwhite/28 hover:text-forest dark:hover:text-gold transition-colors">Forgot password?</a>
              </div>
              <input
                type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-transparent border-b-2 border-charcoal/15 dark:border-warmwhite/12 pb-3 text-lg font-outfit outline-none
                  focus:border-forest dark:focus:border-gold transition-colors
                  text-charcoal dark:text-warmwhite placeholder:text-charcoal/20 dark:placeholder:text-warmwhite/18"
              />
            </div>

            {error && (
              <div className="auth-elem text-red-600 dark:text-red-400 text-sm font-sans bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl border border-red-200 dark:border-red-900/40">
                {error}
              </div>
            )}

            <div className="auth-elem mt-4">
              <button
                type="submit" disabled={loading}
                className="btn-primary w-full !py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
              >
                {loading
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : <><span>Sign in securely</span><ArrowRight size={18} /></>
                }
              </button>
            </div>
          </form>

          <div className="auth-elem mt-10 text-center text-sm text-charcoal/45 dark:text-warmwhite/30 font-outfit">
            New to Yogifi?{' '}
            <Link to="/signup" className="text-forest dark:text-gold font-semibold hover:underline ml-1">Create an account</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
