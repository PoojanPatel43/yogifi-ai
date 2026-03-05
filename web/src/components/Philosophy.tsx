import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const Philosophy = () => {
  const sectionRef = useRef<HTMLElement>(null);

  const bigText = 'We focus on: understanding your body like a living instrument.';
  const words    = bigText.split(' ');

  useGSAP(() => {
    gsap.from('.phil-word', {
      scrollTrigger: { trigger: '.philosophy-big', start: 'top 85%' },
      y: 30,
      opacity: 0,
      stagger: 0.07,
      ease: 'power2.out',
      duration: 0.9,
    });
    gsap.from('.phil-small', {
      scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' },
      y: 20,
      opacity: 0,
      duration: 1,
    });
  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      id="philosophy"
      className="relative w-full bg-charcoal py-32 md:py-48 px-6 md:px-12 lg:px-20
        overflow-hidden text-center flex flex-col items-center justify-center min-h-[80vh]"
    >
      {/* Background parallax yoga image */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center pointer-events-none"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=1800&q=85&auto=format&fit=crop')",
          backgroundAttachment: 'fixed',
          opacity: 0.06,
        }}
      />

      {/* Subtle gold radial glow */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] bg-gold/5 blur-[160px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center text-center">

        {/* Contrast quote */}
        <p className="phil-small font-outfit font-light text-warmwhite/40 text-[clamp(0.95rem,2vw,1.2rem)] leading-relaxed max-w-2xl mb-10">
          "Most wellness apps focus on: generic video libraries,&nbsp;
          <br className="hidden md:block" />
          one-size-fits-all routines, and passive consumption."
        </p>

        {/* Divider line */}
        <div className="phil-small w-14 h-px bg-gold/40 mb-10 mx-auto" />

        {/* Big serif statement */}
        <div className="philosophy-big font-serif italic font-light text-[clamp(2.5rem,6vw,6rem)] leading-[1.1] text-warmwhite w-full">
          {words.map((word, i) => {
            const isAccent = word.includes('understanding') || word.includes('instrument');
            return (
              <span
                key={i}
                className={`phil-word inline-block mr-[0.28em] ${isAccent ? 'text-gold' : ''}`}
              >
                {word}
              </span>
            );
          })}
        </div>

        {/* Attribution */}
        <p className="phil-small font-mono text-xs tracking-widest text-warmwhite/20 mt-10 uppercase">
          The Yogifi Philosophy
        </p>
      </div>
    </section>
  );
};

export default Philosophy;
