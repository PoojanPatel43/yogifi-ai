import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* ── Step SVG illustrations ─────────────────────────────────────────── */
const ScanSVG = () => (
  <div className="w-full h-full flex items-center justify-center relative min-h-[250px] lg:min-h-[400px]">
    <svg className="w-[70%] max-w-[280px] h-auto animate-spin-slow" viewBox="0 0 200 200" fill="none">
      <circle cx="100" cy="100" r="90" stroke="#D4AF37" strokeWidth="1" strokeDasharray="4 8" strokeOpacity="0.35" />
      <circle cx="100" cy="100" r="60" stroke="#D4AF37" strokeWidth="2" strokeOpacity="0.35" />
      <circle cx="100" cy="100" r="4" fill="#D4AF37" />
      <path d="M100 80 V120 M80 100 H120" stroke="#D4AF37" strokeOpacity="0.4" strokeWidth="1" />
      <circle cx="10" cy="100" r="6" fill="#D4AF37" />
    </svg>
    <svg className="absolute w-[70%] max-w-[280px] h-auto animate-spin-slow-reverse" viewBox="0 0 200 200" fill="none">
      <circle cx="100" cy="100" r="75" stroke="#87A878" strokeWidth="1" strokeDasharray="10 10" strokeOpacity="0.25" />
    </svg>
  </div>
);

const LaserSVG = () => {
  const laserRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.to(laserRef.current, { y: 350, duration: 3, repeat: -1, ease: 'linear' });
    const rows = 6;
    for (let i = 0; i < rows; i++) {
      gsap.to(`.grid-row-${i} .dot`, {
        backgroundColor: '#D4AF37',
        boxShadow: '0 0 8px #D4AF37',
        scale: 1.5,
        duration: 0.2,
        repeat: -1,
        repeatDelay: 2.8,
        delay: (3 / rows) * i,
        yoyo: true,
      });
    }
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative min-h-[250px] lg:min-h-[400px] overflow-hidden">
      <div className="grid grid-cols-8 gap-6 relative z-10 w-[80%] max-w-[300px] h-auto py-8">
        {Array.from({ length: 6 }).map((_, r) => (
          <React.Fragment key={`row-${r}`}>
            {Array.from({ length: 8 }).map((_, c) => (
              <div key={`dot-${r}-${c}`} className={`grid-row-${r} flex items-center justify-center`}>
                <div className="dot w-1.5 h-1.5 rounded-full bg-warmwhite/15 transition-all duration-300" />
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
      <div
        ref={laserRef}
        className="absolute top-[-100px] left-0 w-full h-[60px] z-20 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, rgba(212,175,55,0.35) 90%, transparent)' }}
      >
        <div className="absolute bottom-[10%] w-full h-[2px] bg-gold shadow-[0_0_15px_#D4AF37]" />
      </div>
    </div>
  );
};

const GrowthSVG = () => {
  const lineRef = useRef<SVGPathElement>(null);

  useGSAP(() => {
    gsap.to(lineRef.current, {
      strokeDashoffset: 0,
      duration: 2.5,
      ease: 'power1.inOut',
      repeat: -1,
    });
  }, []);

  return (
    <div className="w-full h-full flex items-center justify-center relative min-h-[250px] lg:min-h-[400px]">
      <svg className="w-[80%] max-w-[300px] h-auto" viewBox="0 0 200 100" fill="none">
        <path d="M 0 50 L 50 50 L 60 20 L 75 85 L 90 50 L 200 50" stroke="#D4AF37" strokeWidth="2" strokeOpacity="0.15" strokeLinecap="round" strokeLinejoin="round" />
        <path
          ref={lineRef}
          d="M 0 50 L 50 50 L 60 20 L 75 85 L 90 50 L 200 50"
          stroke="#D4AF37"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="300"
          strokeDashoffset="300"
          className="drop-shadow-[0_0_8px_#D4AF37]"
        />
        <circle cx="75" cy="85" r="3" fill="#D4AF37" className="animate-pulse" />
      </svg>
    </div>
  );
};

/* ── Section ─────────────────────────────────────────────────────────── */
const Protocol = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef     = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(() => {
    cardsRef.current.forEach((card, index) => {
      if (index === cardsRef.current.length - 1) return;
      gsap.to(card, {
        scale: 0.9,
        opacity: 0.45,
        filter: 'blur(10px)',
        scrollTrigger: {
          trigger: cardsRef.current[index + 1],
          start: 'top 85%',
          end:   'top 20%',
          scrub: true,
        },
      });
    });
  }, { scope: containerRef });

  const steps = [
    {
      step:  'STEP 01 / 03',
      title: 'Body Mapping.',
      sub:   'Your Baseline.',
      body:  'On first launch, Yogifi AI builds a skeletal map using your device camera. 33 keypoints. Sub-pixel precision. Your unique biomechanical signature established in under 60 seconds.',
      bg:    'bg-forest',
      textBg:'bg-forest-dark/40',
      svg:   <ScanSVG />,
    },
    {
      step:  'STEP 02 / 03',
      title: 'Real-Time',
      sub:   'Intelligence Layer.',
      body:  'During every session, our TensorFlow MoveNet engine processes your movement at 30 frames per second. Instant corrections as visual cues. Zero lag between movement and feedback.',
      bg:    'bg-charcoal',
      textBg:'bg-charcoal',
      svg:   <LaserSVG />,
    },
    {
      step:  'STEP 03 / 03',
      title: 'Adaptive',
      sub:   'Growth Protocol.',
      body:  'After each session, your performance data shapes tomorrow\'s program. Progressive overload calibrated to your actual capability. The model that knows you better every day.',
      bg:    'bg-forest-dark',
      textBg:'bg-forest-dark',
      svg:   <GrowthSVG />,
    },
  ];

  return (
    <section
      id="protocol"
      className="relative w-full bg-warmwhite dark:bg-charcoal py-32 px-6 md:px-12 lg:px-20 z-40 rounded-t-[3rem] -mt-10 border-t border-charcoal/5 dark:border-warmwhite/5"
      ref={containerRef}
    >
      <div className="max-w-7xl mx-auto mb-16 px-4">
        <div className="section-label mb-5 !bg-gold/8 !text-gold">The Method</div>
        <h2 className="font-serif italic text-[clamp(2.5rem,5vw,4.5rem)] text-forest dark:text-warmwhite leading-tight">
          How Yogifi AI works for you.
        </h2>
      </div>

      <div className="max-w-6xl mx-auto flex flex-col gap-0 pb-32">
        {steps.map((s, index) => (
          <div
            key={s.step}
            ref={el => { cardsRef.current[index] = el; }}
            className={`proto-card sticky top-${index === 0 ? 20 : index === 1 ? 28 : 36} md:top-${index === 0 ? 32 : index === 1 ? 40 : 48} w-full min-h-[420px] rounded-[3rem] ${s.bg} overflow-hidden shadow-2xl z-${10 + index * 10} grid grid-cols-1 lg:grid-cols-2 origin-top ${index < steps.length - 1 ? 'mb-[10vh]' : ''}`}
          >
            <div className="p-10 md:p-16 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-warmwhite/8">
              <div className="font-mono text-gold text-sm mb-6">{s.step}</div>
              <h3 className="font-sans font-bold text-warmwhite text-[clamp(2rem,3vw,3rem)] leading-tight tracking-tight mb-6">
                {s.title}<br />
                <span className="text-warmwhite/45 italic font-serif font-light">{s.sub}</span>
              </h3>
              <p className="font-outfit text-warmwhite/65 text-base md:text-lg leading-relaxed max-w-md">
                {s.body}
              </p>
            </div>
            <div className={`${s.textBg}`}>
              {s.svg}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Protocol;
