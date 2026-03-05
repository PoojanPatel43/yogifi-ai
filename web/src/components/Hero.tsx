import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { hasAccessToken } from '../lib/api';
import { Star, Users, ArrowRight } from 'lucide-react';

const Hero = () => {
  const container = useRef<HTMLDivElement>(null);
  const [isLoggedIn] = useState(() => hasAccessToken());

  useGSAP(() => {
    gsap.from('.hero-elem', {
      y: 48,
      opacity: 0,
      stagger: 0.13,
      ease: 'power3.out',
      duration: 1.3,
      delay: 0.2,
    });
    gsap.to('.hero-badge', {
      y: -8,
      duration: 3.5,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    });
    gsap.to('.scroll-line', {
      scaleY: 0,
      transformOrigin: 'bottom',
      ease: 'power2.inOut',
      duration: 1.6,
      repeat: -1,
      yoyo: true,
    });
  }, { scope: container });

  return (
    <section
      ref={container}
      className="relative w-full h-[100dvh] flex items-end p-8 md:p-12 lg:p-20 overflow-hidden bg-forest-dark"
      id="hero"
    >
      {/* Background yoga image */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?w=1800&q=85&auto=format&fit=crop')" }}
      />

      {/* Forest green gradient overlay */}
      <div
        className="absolute inset-0 z-10"
        style={{ background: 'linear-gradient(to top, rgba(15,36,25,0.97) 0%, rgba(27,67,50,0.55) 50%, rgba(13,26,18,0.3) 100%)' }}
      />

      {/* Gold glow accent */}
      <div className="absolute bottom-0 left-0 w-[600px] h-[400px] bg-gold/8 blur-[120px] rounded-full pointer-events-none z-10" />

      {/* Main content */}
      <div className="relative z-20 w-full max-w-7xl mx-auto flex justify-between items-end">
        <div className="flex flex-col items-start max-w-3xl">

          {/* Eyebrow */}
          <div className="hero-elem section-label mb-7 !text-gold !bg-gold/15">
            Yogifi AI — Intelligent Wellness
          </div>

          {/* Headline */}
          <h1 className="hero-elem font-sans font-bold text-warmwhite leading-none tracking-tight text-[clamp(2.8rem,6.5vw,5.5rem)] mb-2">
            Your practice,
          </h1>
          <h2 className="hero-elem font-serif italic font-light text-gold leading-[0.88] text-[clamp(4rem,11vw,9rem)] mb-8 md:mb-10 -ml-1">
            perfected.
          </h2>

          {/* Sub */}
          <p className="hero-elem font-outfit font-light text-warmwhite/70 text-lg md:text-xl max-w-[520px] leading-relaxed mb-10 md:mb-12">
            Real-time AI coaching powered by computer vision. Every session,
            your form is understood and guided at 30&nbsp;fps — no instructor needed.
          </p>

          {/* CTAs */}
          <div className="hero-elem flex flex-col sm:flex-row items-center gap-5 w-full sm:w-auto mb-10">
            {isLoggedIn ? (
              <Link to="/dashboard" className="btn-primary text-base md:text-lg w-full sm:w-auto">
                <span>Open Dashboard</span>
                <ArrowRight size={18} />
              </Link>
            ) : (
              <a href="#pricing" className="btn-primary text-base md:text-lg w-full sm:w-auto">
                <span>Start Free — Join Waitlist</span>
                <ArrowRight size={18} />
              </a>
            )}
            <a href="#features" className="btn-ghost text-sm md:text-base !px-6 !py-3 w-full sm:w-auto justify-center">
              See how it works
            </a>
          </div>

          {/* Social proof row */}
          <div className="hero-elem flex flex-wrap items-center gap-5">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {['🧘', '🏃', '💪', '🌿'].map((emoji, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-forest-light border-2 border-forest-dark flex items-center justify-center text-xs">
                    {emoji}
                  </div>
                ))}
              </div>
              <div className="flex flex-col">
                <span className="text-warmwhite font-bold text-sm leading-none">2,400+</span>
                <span className="text-warmwhite/50 text-xs font-mono mt-0.5">practitioners</span>
              </div>
            </div>
            <div className="w-px h-8 bg-warmwhite/10" />
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(i => <Star key={i} size={13} className="fill-gold text-gold" />)}
              </div>
              <span className="text-warmwhite/60 text-xs font-mono">4.9 / 5.0</span>
            </div>
            <div className="w-px h-8 bg-warmwhite/10" />
            <div className="flex items-center gap-2">
              <Users size={14} className="text-sage" />
              <span className="text-warmwhite/60 text-xs font-mono">BETA · Limited access</span>
            </div>
          </div>
        </div>

        {/* Floating stat cards — desktop */}
        <div className="hero-badge hidden lg:flex flex-col gap-4 mb-6">
          <div className="bg-warmwhite/8 backdrop-blur-md border border-warmwhite/10 rounded-2xl p-5 flex flex-col gap-3 min-w-[190px]">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-sage animate-pulse" />
              <span className="font-mono text-[10px] text-warmwhite/50 tracking-widest">LIVE SESSION</span>
            </div>
            <div>
              <p className="text-warmwhite font-bold text-2xl leading-none">94.2%</p>
              <p className="text-warmwhite/50 text-xs font-outfit mt-1">Warrior II accuracy</p>
            </div>
            <div className="w-full h-1 bg-warmwhite/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-sage to-gold rounded-full" style={{ width: '94.2%' }} />
            </div>
          </div>
          <div className="bg-warmwhite/8 backdrop-blur-md border border-warmwhite/10 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gold/15 flex items-center justify-center text-base">🔥</div>
            <div>
              <p className="text-warmwhite font-bold text-sm leading-none">21-day streak</p>
              <p className="text-warmwhite/40 text-xs font-outfit mt-0.5">Keep it going!</p>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="hidden lg:flex flex-col items-center gap-4 absolute bottom-0 right-4 z-20">
          <div className="w-px h-20 bg-warmwhite/8 overflow-hidden relative">
            <div className="scroll-line absolute top-0 left-0 w-full h-full bg-gold origin-bottom" />
          </div>
          <p className="font-mono text-warmwhite/30 tracking-widest text-[9px]" style={{ writingMode: 'vertical-rl' }}>SCROLL</p>
        </div>
      </div>
    </section>
  );
};

export default Hero;
