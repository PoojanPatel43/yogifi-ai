import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ArrowRight, Loader2, Check } from 'lucide-react';
import api, { setAccessToken } from '../lib/api';

const Signup: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Password validation state
  const [hasLength, setHasLength] = useState(false);
  const [hasNumber, setHasNumber] = useState(false);
  const [hasSpecial, setHasSpecial] = useState(false);
  
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHasLength(password.length >= 8);
    setHasNumber(/\d/.test(password));
    setHasSpecial(/[!@#$%^&*(),.?":{}|<>]/.test(password));
  }, [password]);

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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasLength || !hasNumber || !hasSpecial) {
      setError('Please meet all password requirements.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/register', { name, email, password });
      if (response.data?.data?.token) {
        setAccessToken(response.data.data.token);
        // refresh_token is set as httpOnly cookie by the server automatically
        navigate('/dashboard');
      } else {
        setError('Unexpected response format from server.');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isPasswordValid = hasLength && hasNumber && hasSpecial;

  return (
    <div ref={containerRef} className="min-h-screen bg-cream flex font-sans text-charcoal">
      
      {/* Left side: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 md:p-24 relative order-2 lg:order-1">
        <Link to="/" className="absolute top-8 left-8 lg:hidden font-outfit font-bold text-xl tracking-tight text-moss">
          Yogifi AI
        </Link>
        
        <div className="w-full max-w-md">
          <div className="auth-elem mb-10">
            <h1 className="font-serif italic text-4xl sm:text-5xl text-moss mb-4">Join the discipline.</h1>
            <p className="font-outfit text-charcoal/60">Create your account to start mapping your movement.</p>
          </div>

          <form onSubmit={handleSignup} className="flex flex-col gap-6">
            <div className="auth-elem flex flex-col gap-2">
              <label className="font-mono text-[10px] tracking-widest text-charcoal/60 uppercase">Full Name</label>
              <input 
                type="text" 
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="bg-transparent border-b border-charcoal/20 pb-2 text-lg font-outfit outline-none focus:border-clay transition-colors text-charcoal placeholder:text-charcoal/20"
                placeholder="Jane Doe"
              />
            </div>

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
            
            <div className="auth-elem flex flex-col gap-2">
              <label className="font-mono text-[10px] tracking-widest text-charcoal/60 uppercase">Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="bg-transparent border-b border-charcoal/20 pb-2 text-lg font-outfit outline-none focus:border-clay transition-colors text-charcoal placeholder:text-charcoal/20"
                placeholder="••••••••"
              />
              
              {/* Password Requirements */}
              <div className="mt-2 text-xs font-sans text-charcoal/50 flex flex-col gap-1">
                <div className={`flex items-center gap-2 ${hasLength ? 'text-moss' : ''}`}>
                  {hasLength ? <Check className="w-3 h-3" /> : <div className="w-1 h-1 rounded-full bg-charcoal/30 ml-1 mr-1" />}
                  8+ characters
                </div>
                <div className={`flex items-center gap-2 ${hasNumber ? 'text-moss' : ''}`}>
                  {hasNumber ? <Check className="w-3 h-3" /> : <div className="w-1 h-1 rounded-full bg-charcoal/30 ml-1 mr-1" />}
                  At least one number
                </div>
                <div className={`flex items-center gap-2 ${hasSpecial ? 'text-moss' : ''}`}>
                  {hasSpecial ? <Check className="w-3 h-3" /> : <div className="w-1 h-1 rounded-full bg-charcoal/30 ml-1 mr-1" />}
                  At least one special character
                </div>
              </div>
            </div>

            {error && (
              <div className="auth-elem text-clay text-sm font-sans bg-clay/10 p-3 rounded-xl border border-clay/20">
                {error}
              </div>
            )}

            <div className="auth-elem mt-4">
              <button 
                type="submit" 
                disabled={loading || !isPasswordValid}
                className="magnetic-btn w-full bg-clay text-cream py-4 rounded-full font-bold flex items-center justify-center gap-2 hover:bg-[#a64627] transition-colors disabled:opacity-50 disabled:cursor-not-allowed group shadow-lg"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="auth-elem mt-10 text-center text-sm text-charcoal/60 font-outfit">
            Already have an account? <Link to="/login" className="text-moss font-semibold hover:text-clay transition-colors ml-1">Log in</Link>
          </div>
        </div>
      </div>

      {/* Right side: Image */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-moss order-1 lg:order-2 bg-[#1c2a23]">
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-transparent to-transparent z-10" />
        <img 
          src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&q=85&auto=format&fit=crop" 
          alt="Abstract organic architecture"
          className="auth-image absolute inset-0 w-full h-full object-cover opacity-70 mix-blend-luminosity"
        />
        <div className="absolute top-12 right-12 z-20 auth-elem text-right">
          <Link to="/" className="font-outfit font-bold text-2xl text-cream tracking-tight hover:text-clay transition-colors hover-lift inline-block">
            Yogifi AI
          </Link>
        </div>
      </div>
      
    </div>
  );
};

export default Signup;
