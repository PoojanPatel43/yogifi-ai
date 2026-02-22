import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const Philosophy = () => {
  const sectionRef = useRef<HTMLElement>(null);
  
  // To avoid installing SplitType just for this, we split the text manually into words or wrapped spans.
  const bigText = "We focus on: understanding your body like a living instrument.";
  const words = bigText.split(' ');

  useGSAP(() => {
    // Parallax background using background-attachment: fixed doesn't need GSAP if it's CSS, 
    // but GSAP can also animate the background position for smoother parallax. CSS `fixed` is usually fine for this design requirement.
    
    gsap.from('.phil-word', {
      scrollTrigger: {
        trigger: '.philosophy-big',
        start: 'top 85%',
      },
      y: 30,
      opacity: 0,
      stagger: 0.08,
      ease: 'power2.out',
      duration: 1
    });

    gsap.from('.phil-small', {
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 80%',
      },
      y: 20,
      opacity: 0,
      duration: 1
    });

  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} id="philosophy" className="relative w-full bg-[#1A1A1A] py-32 md:py-48 px-6 md:px-12 lg:px-20 overflow-hidden text-center md:text-left flex flex-col items-center justify-center min-h-[80vh]">
      
      {/* Background Parallax Texture */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center pointer-events-none"
        style={{ 
          backgroundImage: "url('https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=1800&q=85&auto=format&fit=crop')",
          backgroundAttachment: 'fixed',
          opacity: 0.06 
        }}
      />

      <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center text-center">
        
        <p className="phil-small font-outfit font-light text-cream/45 text-[clamp(1rem,2vw,1.25rem)] leading-relaxed max-w-3xl mb-12">
          "Most wellness apps focus on: generic video libraries, <br className="hidden md:block"/> one-size-fits-all routines, and passive consumption."
        </p>

        <div className="phil-small w-[60px] h-[2px] bg-clay mb-12 mx-auto" />

        <div className="philosophy-big font-serif italic font-light text-[clamp(2.5rem,6vw,6rem)] leading-[1.1] text-cream w-full">
          {words.map((word, i) => {
            let className = "phil-word inline-block mr-[0.3em] overflow-hidden ";
            if (word.includes('understanding') || word.includes('instrument')) {
              className += "text-clay font-medium";
            }
            if (word === 'like') {
               // force break on mobile if needed, but flex wrap usually handles it
            }
            return (
              <span key={i} className={className}>
                {word}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Philosophy;
