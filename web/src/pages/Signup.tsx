import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ArrowRight, Loader2, Check, Leaf } from 'lucide-react';
import api, { setAccessToken } from '../lib/api';

const Signup: React.FC = () => {
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const [hasLength,  setHasLength]  = useState(false);
  const [hasNumber,  setHasNumber]  = useState(false);
  const [hasSpecial, setHasSpecial] = useState(false);

  const navigate     = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHasLength(password.length >= 8);
    setHasNumber(/\d/.test(password));
    setHasSpecial(/[!@#$%^&*(),.?":{}|<>]/.test(password));
  }, [password]);

  useGSAP(() => {
    const ctx = gsap.context(() => {
      gsap.from('.auth-elem', { y: 28, opacity: 0, stagger: 0.1, ease: 'power3.out', duration: 1, delay: 0.2 });
      gsap.from('.auth-image', { scale: 1.05, opacity: 0, duration: 1.6, ease: 'power2.out' });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
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
  };

  const isPasswordValid = hasLength && hasNumber && hasSpecial;

  const PassReq = ({ ok, label }: { ok: boolean; label: string }) => (
    <div className={`flex items-center gap-2 text-xs transition-colors ${ok ? 'text-forest dark:text-sage' : 'text-charcoal/35 dark:text-warmwhite/25'}`}>
      {ok
        ? <Check size={12} />
        : <div className="w-1 h-1 rounded-full bg-charcoal/25 dark:bg-warmwhite/20 mx-1" />
      }
      {label}
    </div>
  );

  return (
    <div ref={containerRef} className="min-h-screen bg-warmwhite dark:bg-forest-dark flex font-sans">

      {/* Left — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 md:p-16 relative order-2 lg:order-1">
        <Link to="/" className="absolute top-8 left-8 lg:hidden flex items-center gap-2">
          <Leaf size={16} className="text-forest dark:text-gold" />
          <span className="font-outfit font-bold text-lg text-forest dark:text-warmwhite">Yogifi AI</span>
        </Link>

        <div className="w-full max-w-md">
          <div className="auth-elem mb-10">
            <div className="section-label mb-5 !bg-gold/8 !text-gold">Get started free</div>
            <h1 className="font-serif italic text-4xl sm:text-5xl text-forest dark:text-warmwhite mb-3 leading-tight">
              Join the practice.
            </h1>
            <p className="font-outfit text-charcoal/50 dark:text-warmwhite/45">
              Create your account and start your AI-guided journey.
            </p>
          </div>

          <form onSubmit={handleSignup} className="flex flex-col gap-5">
            <div className="auth-elem flex flex-col gap-2">
              <label className="font-mono text-[10px] tracking-widest text-charcoal/45 dark:text-warmwhite/35 uppercase">Full Name</label>
              <input
                type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe"
                className="bg-transparent border-b-2 border-charcoal/15 dark:border-warmwhite/12 pb-3 text-lg font-outfit outline-none
                  focus:border-forest dark:focus:border-gold transition-colors
                  text-charcoal dark:text-warmwhite placeholder:text-charcoal/20 dark:placeholder:text-warmwhite/18"
              />
            </div>

            <div className="auth-elem flex flex-col gap-2">
              <label className="font-mono text-[10px] tracking-widest text-charcoal/45 dark:text-warmwhite/35 uppercase">Email address</label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="hello@example.com"
                className="bg-transparent border-b-2 border-charcoal/15 dark:border-warmwhite/12 pb-3 text-lg font-outfit outline-none
                  focus:border-forest dark:focus:border-gold transition-colors
                  text-charcoal dark:text-warmwhite placeholder:text-charcoal/20 dark:placeholder:text-warmwhite/18"
              />
            </div>

            <div className="auth-elem flex flex-col gap-2">
              <label className="font-mono text-[10px] tracking-widest text-charcoal/45 dark:text-warmwhite/35 uppercase">Password</label>
              <input
                type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                className="bg-transparent border-b-2 border-charcoal/15 dark:border-warmwhite/12 pb-3 text-lg font-outfit outline-none
                  focus:border-forest dark:focus:border-gold transition-colors
                  text-charcoal dark:text-warmwhite placeholder:text-charcoal/20 dark:placeholder:text-warmwhite/18"
              />
              <div className="mt-2 flex flex-col gap-1.5 font-sans">
                <PassReq ok={hasLength}  label="8+ characters"              />
                <PassReq ok={hasNumber}  label="At least one number"        />
                <PassReq ok={hasSpecial} label="At least one special character" />
              </div>
            </div>

            {error && (
              <div className="auth-elem text-red-600 dark:text-red-400 text-sm font-sans bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl border border-red-200 dark:border-red-900/40">
                {error}
              </div>
            )}

            <div className="auth-elem mt-4">
              <button
                type="submit" disabled={loading || !isPasswordValid}
                className="btn-primary w-full !py-4 text-base disabled:opacity-45 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
              >
                {loading
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : <><span>Create Account</span><ArrowRight size={18} /></>
                }
              </button>
            </div>
          </form>

          <div className="auth-elem mt-10 text-center text-sm text-charcoal/45 dark:text-warmwhite/30 font-outfit">
            Already have an account?{' '}
            <Link to="/login" className="text-forest dark:text-gold font-semibold hover:underline ml-1">Log in</Link>
          </div>
        </div>
      </div>

      {/* Right — image */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden order-1 lg:order-2">
        <div className="absolute inset-0 z-10" style={{ background: 'linear-gradient(to bottom, rgba(15,36,25,0.85) 0%, rgba(27,67,50,0.35) 50%, transparent 100%)' }} />
        <img
          src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&q=85&auto=format&fit=crop"
          alt="Yoga practice"
          className="auth-image absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute top-12 right-12 z-20 text-right">
          <Link to="/" className="flex items-center gap-2 justify-end mb-2">
            <Leaf size={16} className="text-gold" />
            <span className="font-outfit font-bold text-xl text-warmwhite tracking-tight">Yogifi AI</span>
          </Link>
          <p className="font-mono text-warmwhite/30 text-[10px] tracking-widest">BETA · LIMITED ACCESS</p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
