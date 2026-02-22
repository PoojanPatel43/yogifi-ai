import { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const Hero = () => {
  const container = useRef<HTMLDivElement>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('token'));
  }, []);

  useGSAP(() => {
    // Entrance animation
    gsap.from('.hero-elem', {
      y: 40,
      opacity: 0,
      stagger: 0.12,
      ease: 'power3.out',
      duration: 1.2,
      delay: 0.3
    });
    
    // Scroll hint line animation
    gsap.to('.scroll-line', {
      scaleY: 0,
      transformOrigin: 'bottom',
      ease: 'power2.inOut',
      duration: 1.5,
      repeat: -1,
      yoyo: true
    });
  }, { scope: container });

  return (
    <section 
      ref={container}
      className="relative w-full h-[100dvh] flex items-end p-8 md:p-12 lg:p-20 overflow-hidden bg-charcoal"
      id="hero"
    >
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1800&q=85&auto=format&fit=crop')" }}
      />
      
      {/* Gradient Overlay */}
      <div 
        className="absolute inset-0 z-10"
        style={{ background: "linear-gradient(to top, rgba(26,26,26,0.96) 0%, rgba(46,64,54,0.4) 65%, transparent 100%)" }}
      />

      {/* Content */}
      <div className="relative z-20 w-full max-w-7xl mx-auto flex justify-between items-end">
        
        <div className="flex flex-col items-start max-w-3xl">
          <p className="hero-elem font-mono text-xs md:text-sm text-clay tracking-widest uppercase mb-6 sm:mb-8">
            Yogifi AI — Wellness Intelligence
          </p>
          
          <h1 className="hero-elem font-sans font-bold text-cream leading-none lg:leading-[0.9] tracking-tight text-[clamp(2.5rem,6vw,5rem)] mb-1 sm:mb-2">
            Wellness is the
          </h1>
          
          <h2 className="hero-elem font-serif italic font-light text-clay leading-[0.85] text-[clamp(4.5rem,12vw,9.5rem)] mb-8 sm:mb-10 -ml-1 md:-ml-2">
            new science.
          </h2>
          
          <p className="hero-elem font-outfit font-light text-cream/70 text-lg md:text-xl max-w-[520px] mb-12 sm:mb-14">
            Personalized wellness coaching powered by computer vision. Your body, understood in real time.
          </p>
          
          <div className="hero-elem flex flex-col sm:flex-row items-center gap-6 lg:gap-8 w-full sm:w-auto">
            {isLoggedIn ? (
              <Link to="/dashboard" className="magnetic-btn btn-clay bg-clay text-cream px-8 py-4 rounded-full font-sans font-bold text-base md:text-lg w-full sm:w-auto inline-flex items-center justify-center transition-colors">
                <span>Open Dashboard &rarr;</span>
              </Link>
            ) : (
              <a href="#pricing" className="magnetic-btn btn-clay bg-clay text-cream px-8 py-4 rounded-full font-sans font-bold text-base md:text-lg w-full sm:w-auto inline-flex items-center justify-center transition-colors">
                <span>Join the Waitlist &rarr;</span>
              </a>
            )}
            <a href="#features" className="link-lift link-lift-color text-cream font-sans font-semibold border-b border-cream/30 pb-1 text-sm md:text-base whitespace-nowrap">
              Explore features &darr;
            </a>
          </div>
        </div>

        {/* Scroll Hint */}
        <div className="hidden lg:flex flex-col items-center gap-5 absolute bottom-0 right-4 z-20">
          <div className="w-[1px] h-24 bg-cream/10 overflow-hidden relative">
             <div className="scroll-line absolute top-0 left-0 w-full h-full bg-cream origin-bottom" />
          </div>
          <p className="font-mono text-cream/50 tracking-widest text-[10px]" style={{ writingMode: 'vertical-rl' }}>SCROLL</p>
        </div>
      </div>
    </section>
  );
};

export default Hero;
