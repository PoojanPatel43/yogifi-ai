import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ArrowRight, Loader2 } from 'lucide-react';
import api, { setAccessToken } from '../lib/api';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const ctx = gsap.context(() => {
      gsap.from('.auth-elem', {
        y: 30,
        opacity: 0,
        stagger: 0.1,
        ease: 'power3.out',
        duration: 1,
        delay: 0.2
      });
      
      gsap.from('.auth-image', {
        scale: 1.05,
        opacity: 0,
        duration: 1.5,
        ease: 'power2.out'
      });
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
        // refresh_token is set as httpOnly cookie by the server automatically
        navigate('/dashboard');
      } else {
        setError('Unexpected response format from server.');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-cream flex font-sans text-charcoal">
      
      {/* Left side: Image */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-moss">
        <div className="absolute inset-0 bg-gradient-to-t from-moss/80 to-transparent z-10" />
        <img 
          src="https://images.unsplash.com/photo-1599901860904-17e08c2d4212?w=1200&q=85&auto=format&fit=crop" 
          alt="Yoga in dark moody room"
          className="auth-image absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-luminosity"
        />
        <div className="absolute bottom-12 left-12 z-20 auth-elem">
          <Link to="/" className="font-outfit font-bold text-2xl text-cream tracking-tight hover:text-clay transition-colors hover-lift inline-block">
            Yogifi AI
          </Link>
          <p className="font-mono text-cream/60 text-xs tracking-widest mt-2 uppercase">System Operational</p>
        </div>
      </div>

      {/* Right side: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 md:p-24 relative">
        <Link to="/" className="absolute top-8 left-8 lg:hidden font-outfit font-bold text-xl tracking-tight text-moss">
          Yogifi AI
        </Link>
        
        <div className="w-full max-w-md">
          <div className="auth-elem mb-12">
            <h1 className="font-serif italic text-4xl sm:text-5xl text-charcoal mb-4">Welcome back.</h1>
            <p className="font-outfit text-charcoal/60">Enter your details to access your intelligence dashboard.</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <div className="auth-elem flex flex-col gap-2">
              <label className="font-mono text-[10px] tracking-widest text-charcoal/60 uppercase">Email address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="bg-transparent border-b border-charcoal/20 pb-2 text-lg font-outfit outline-none focus:border-clay transition-colors text-charcoal placeholder:text-charcoal/20"
                placeholder="hello@example.com"
              />
            </div>
            
            <div className="auth-elem flex flex-col gap-2 relative">
              <div className="flex justify-between items-center">
                <label className="font-mono text-[10px] tracking-widest text-charcoal/60 uppercase">Password</label>
                <a href="#" className="font-outfit text-xs text-charcoal/40 hover:text-clay transition-colors">Forgot password?</a>
              </div>
              <input 
                type="password" 
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="bg-transparent border-b border-charcoal/20 pb-2 text-lg font-outfit outline-none focus:border-clay transition-colors text-charcoal placeholder:text-charcoal/20"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="auth-elem text-clay text-sm font-sans bg-clay/10 p-3 rounded-xl border border-clay/20">
                {error}
              </div>
            )}

            <div className="auth-elem mt-6">
              <button 
                type="submit" 
                disabled={loading}
                className="magnetic-btn w-full bg-charcoal text-cream py-4 rounded-full font-bold flex items-center justify-center gap-2 hover:bg-clay transition-colors disabled:opacity-70 disabled:cursor-not-allowed group shadow-lg"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <span>Sign in securely</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="auth-elem mt-12 text-center text-sm text-charcoal/60 font-outfit">
            Don't have an account? <Link to="/signup" className="text-moss font-semibold hover:text-clay transition-colors ml-1">Create one</Link>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default Login;
