import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const ProtoSVG1 = () => (
  <div className="w-full h-full flex items-center justify-center relative min-h-[250px] lg:min-h-[400px]">
    <svg className="w-[80%] max-w-[300px] h-auto animate-[spin_20s_linear_infinite]" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="90" stroke="#CC5833" strokeWidth="1" strokeDasharray="4 8" strokeOpacity="0.4" />
      <circle cx="100" cy="100" r="60" stroke="#CC5833" strokeWidth="2" strokeOpacity="0.4" />
      <circle cx="100" cy="100" r="4" fill="#CC5833" />
      <path d="M100 80 V120 M80 100 H120" stroke="#CC5833" strokeOpacity="0.5" strokeWidth="1" />
      {/* Orbiting dot */}
      <circle cx="10" cy="100" r="6" fill="#CC5833" className="shadow-[0_0_10px_#CC5833]" />
    </svg>
    <svg className="absolute w-[80%] max-w-[300px] h-auto animate-[spin_15s_linear_infinite_reverse]" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="75" stroke="#CC5833" strokeWidth="1" strokeDasharray="10 10" strokeOpacity="0.3" />
    </svg>
  </div>
);

const ProtoSVG2 = () => {
  const laserRef = useRef<HTMLDivElement>(null);


  useGSAP(() => {
    // Laser scanning animation
    gsap.to(laserRef.current, {
      y: 350,
      duration: 3,
      repeat: -1,
      ease: "linear",
    });

    // We can animate dots based on laser position, but standard CSS works better for grid if we don't want heavy JS loop.
    // Instead we'll simulate the laser passing by animating rows staggered in a loop matching laser duration
    const rows = 6;
    for(let i=0; i<rows; i++) {
      gsap.to(`.grid-row-${i} .dot`, {
        backgroundColor: '#CC5833',
        boxShadow: '0 0 8px #CC5833',
        scale: 1.5,
        duration: 0.2,
        repeat: -1,
        repeatDelay: 2.8,
        delay: (3 / rows) * i,
        yoyo: true
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
                <div className="dot w-1.5 h-1.5 rounded-full bg-cream/20 transition-all duration-300"></div>
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
      
      {/* Laser line overlay */}
      <div 
        ref={laserRef} 
        className="absolute top-[-100px] left-0 w-full h-[60px] z-20 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, rgba(204, 88, 51, 0.4) 90%, transparent)' }}
      >
        <div className="absolute bottom-[10%] w-full h-[2px] bg-clay shadow-[0_0_15px_#CC5833]"></div>
      </div>
    </div>
  );
};

const ProtoSVG3 = () => {
  const lineRef = useRef<SVGPathElement>(null);

  useGSAP(() => {
    // We animate strokeDashoffset
    gsap.to(lineRef.current, {
      strokeDashoffset: 0,
      duration: 2.5,
      ease: "power1.inOut",
      repeat: -1
    });
  }, []);

  return (
    <div className="w-full h-full flex items-center justify-center relative min-h-[250px] lg:min-h-[400px]">
      <svg className="w-[80%] max-w-[300px] h-auto" viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M 0 50 L 50 50 L 60 20 L 75 85 L 90 50 L 200 50" stroke="#CC5833" strokeWidth="2" strokeOpacity="0.2" strokeLinecap="round" strokeLinejoin="round" />
        <path 
          ref={lineRef}
          d="M 0 50 L 50 50 L 60 20 L 75 85 L 90 50 L 200 50" 
          stroke="#CC5833" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeDasharray="300" 
          strokeDashoffset="300"
          className="drop-shadow-[0_0_8px_#CC5833]"
        />
        <circle cx="75" cy="85" r="3" fill="#CC5833" className="animate-pulse shadow-[0_0_10px_#CC5833]" />
      </svg>
    </div>
  );
};

const Protocol = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(() => {
    // We use sticky CSS for pinning, and ScrollTrigger to animate scale and blur of PREVIOUS cards
    cardsRef.current.forEach((card, index) => {
      if (index === cardsRef.current.length - 1) return; // Last card doesn't shrink
      
      const nextCard = cardsRef.current[index + 1];
      
      gsap.to(card, {
        scale: 0.9,
        opacity: 0.5,
        filter: "blur(10px)",
        scrollTrigger: {
          trigger: nextCard,
          start: "top 85%", // When the next card enters the view
          end: "top 20%",   // When it's fully stacked
          scrub: true,
        }
      });
    });
  }, { scope: containerRef });

  return (
    <section id="protocol" className="relative w-full bg-cream py-32 px-6 md:px-12 lg:px-20 z-40 rounded-t-[3rem] -mt-10 border-t border-charcoal/5" ref={containerRef}>
      
      <div className="max-w-7xl mx-auto mb-16 px-4">
        <div className="font-mono tracking-widest text-[#80503f] text-sm uppercase mb-4 text-center md:text-left">The Protocol</div>
        <h2 className="font-serif italic text-[clamp(2.5rem,5vw,4.5rem)] text-moss leading-tight text-center md:text-left">
          How Yogifi AI works for you.
        </h2>
      </div>

      <div className="max-w-6xl mx-auto flex flex-col gap-0 pb-32">
        
        {/* Card 1 */}
        <div 
          ref={el => { cardsRef.current[0] = el; }}
          className="proto-card sticky top-20 md:top-32 w-full min-h-[420px] rounded-[3rem] bg-moss overflow-hidden shadow-2xl z-10 grid grid-cols-1 lg:grid-cols-2 origin-top mb-[10vh]"
        >
          <div className="p-10 md:p-16 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-cream/10">
            <div className="font-mono text-clay text-sm mb-6">STEP 01 / 03</div>
            <h3 className="font-sans font-bold text-cream text-[clamp(2rem,3vw,3rem)] leading-tight tracking-tight mb-6">Body Mapping. <br/><span className="text-cream/50">Your Baseline.</span></h3>
            <p className="font-outfit text-cream/70 text-base md:text-lg leading-relaxed max-w-md">
              On first launch, Yogifi AI builds a 3D skeletal map using your device camera. 33 keypoints. Sub-pixel precision. Your unique biomechanical signature established in under 60 seconds.
            </p>
          </div>
          <div className="bg-[#1c2822]">
            <ProtoSVG1 />
          </div>
        </div>

        {/* Card 2 */}
        <div 
          ref={el => { cardsRef.current[1] = el; }}
          className="proto-card sticky top-24 md:top-40 w-full min-h-[420px] rounded-[3rem] bg-charcoal overflow-hidden shadow-2xl z-20 grid grid-cols-1 lg:grid-cols-2 origin-top mb-[10vh]"
        >
          <div className="p-10 md:p-16 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-cream/5 text-left">
            <div className="font-mono text-clay text-sm mb-6">STEP 02 / 03</div>
            <h3 className="font-sans font-bold text-cream text-[clamp(2rem,3vw,3rem)] leading-tight tracking-tight mb-6">Real-Time <br/><span className="text-cream/50">Intelligence Layer.</span></h3>
            <p className="font-outfit text-cream/70 text-base md:text-lg leading-relaxed max-w-md">
              During every session, our TensorFlow MoveNet engine processes your movement at 30 frames per second. Instant corrections delivered as haptic and visual cues. Zero lag between movement and feedback.
            </p>
          </div>
          <div className="bg-[#111]">
            <ProtoSVG2 />
          </div>
        </div>

        {/* Card 3 */}
        <div 
          ref={el => { cardsRef.current[2] = el; }}
          className="proto-card sticky top-28 md:top-48 w-full min-h-[420px] rounded-[3rem] bg-[#1c2d26] overflow-hidden shadow-2xl z-30 grid grid-cols-1 lg:grid-cols-2 origin-top"
        >
          <div className="p-10 md:p-16 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-cream/5">
            <div className="font-mono text-clay text-sm mb-6">STEP 03 / 03</div>
            <h3 className="font-sans font-bold text-cream text-[clamp(2rem,3vw,3rem)] leading-tight tracking-tight mb-6">Adaptive <br/><span className="text-clay italic">Growth</span> Protocol.</h3>
            <p className="font-outfit text-cream/70 text-base md:text-lg leading-relaxed max-w-md">
              After each session, your performance data shapes tomorrow's program. Progressive overload calibrated to your actual capability. The model that knows you better than any human trainer could.
            </p>
          </div>
          <div className="bg-[#131f1a]">
             <ProtoSVG3 />
          </div>
        </div>

      </div>
    </section>
  );
};

export default Protocol;
