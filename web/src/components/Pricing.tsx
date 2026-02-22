import React, { useState, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { X, Check } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const WaitlistModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Focus trap / simple close on escape can be added, but keeping it simple for now
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(email) setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-charcoal/85 backdrop-blur-[12px] cursor-pointer" 
        onClick={onClose}
      />
      <div className="relative bg-cream rounded-[3rem] p-8 md:p-12 w-full max-w-lg shadow-2xl z-10 animate-[fadeIn_0.3s_ease-out]">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-black/5 transition-colors"
        >
          <X className="w-6 h-6 text-charcoal/50" />
        </button>

        {!submitted ? (
          <>
            <h3 className="font-serif italic text-3xl md:text-4xl text-charcoal mb-4">"Be first to practice."</h3>
            <p className="font-outfit text-charcoal/70 mb-8 leading-relaxed">
              We're launching soon. Drop your email and we'll reach out the moment doors open.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input 
                type="email" 
                required
                placeholder="Email address" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="bg-transparent border-b-2 border-charcoal/20 px-2 py-3 text-lg font-sans outline-none focus:border-clay transition-colors text-charcoal placeholder:text-charcoal/30 font-medium"
              />
              <button 
                type="submit" 
                className="magnetic-btn btn-clay bg-clay text-cream py-4 rounded-full font-sans font-bold text-lg mt-4 shadow-lg"
              >
                <span>Reserve My Spot</span>
              </button>
            </form>
            <p className="font-mono text-[10px] tracking-widest text-charcoal/30 mt-6 text-center">NO SPAM · EARLY ACCESS ONLY</p>
          </>
        ) : (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-moss/10 flex items-center justify-center mb-6 text-moss">
              <Check className="w-8 h-8" />
            </div>
            <h3 className="font-serif italic text-3xl md:text-4xl text-charcoal mb-3">You're on the list.</h3>
            <p className="font-outfit text-charcoal/60">We'll be in touch soon.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const Pricing = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    gsap.from('.pricing-card', {
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 75%',
      },
      y: 40,
      opacity: 0,
      stagger: 0.12,
      ease: 'power3.out',
      duration: 1
    });
  }, { scope: sectionRef });

  return (
    <>
      <section ref={sectionRef} id="pricing" className="relative w-full bg-[#E8E5DC] py-32 px-6 md:px-12 lg:px-20 z-30 font-sans">
        
        <div className="max-w-7xl mx-auto mb-20 text-center">
          <div className="font-mono tracking-widest text-clay text-sm uppercase mb-4 flex justify-center">Pricing</div>
          <h2 className="font-serif italic text-[clamp(2.5rem,5vw,4rem)] text-charcoal leading-tight">
            One plan for every body. <br className="hidden md:block"/> Three tiers.
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
          
          {/* Starter Tier */}
          <div className="pricing-card bg-cream border border-charcoal/5 rounded-[2.5rem] p-10 flex flex-col h-[500px]">
            <div className="font-mono text-charcoal/50 text-xs tracking-widest mb-4">STARTER</div>
            <h3 className="text-3xl font-bold text-charcoal mb-2">Essential</h3>
            <div className="text-xl font-medium text-charcoal/60 mb-8">Free <span className="text-sm font-normal">(beta)</span></div>
            
            <ul className="flex flex-col gap-4 flex-1">
              <li className="flex gap-3 text-sm text-charcoal/80"><Check className="w-5 h-5 text-clay shrink-0" /> Real-time pose detection (5 sessions/week)</li>
              <li className="flex gap-3 text-sm text-charcoal/80"><Check className="w-5 h-5 text-clay shrink-0" /> Basic progress dashboard</li>
              <li className="flex gap-3 text-sm text-charcoal/80"><Check className="w-5 h-5 text-clay shrink-0" /> 10 guided yoga sequences</li>
              <li className="flex gap-3 text-sm text-charcoal/80"><Check className="w-5 h-5 text-clay shrink-0" /> Email coaching summaries</li>
            </ul>

            <button 
              onClick={() => setModalOpen(true)}
              className="magnetic-btn w-full bg-transparent border border-clay text-clay hover:text-cream py-3.5 rounded-full font-bold transition-colors"
            >
              <span>Join Waitlist</span>
            </button>
          </div>

          {/* Performance Tier (Featured) */}
          <div className="pricing-card bg-moss border-[3px] border-clay/30 rounded-[3rem] p-10 flex flex-col h-[560px] shadow-2xl relative z-10 scale-[1.02] transform transition-transform hover:scale-[1.04]">
            <div className="absolute top-0 right-10 transform -translate-y-1/2 bg-clay text-cream text-[10px] font-mono tracking-widest py-1 px-3 rounded-full">
              MOST POPULAR ⭐
            </div>
            <div className="font-mono text-cream/60 text-xs tracking-widest mb-4">PERFORMANCE</div>
            <h3 className="text-4xl font-bold text-cream mb-2">Performance</h3>
            <div className="text-2xl font-medium text-clay mb-8">$19<span className="text-sm font-normal text-cream/50">/mo</span></div>
            
            <ul className="flex flex-col gap-4 flex-1">
              <li className="flex gap-3 text-base text-cream/90"><Check className="w-5 h-5 text-clay shrink-0" /> Unlimited real-time AI sessions</li>
              <li className="flex gap-3 text-base text-cream/90"><Check className="w-5 h-5 text-clay shrink-0" /> Full performance analytics suite</li>
              <li className="flex gap-3 text-base text-cream/90"><Check className="w-5 h-5 text-clay shrink-0" /> Adaptive weekly programming</li>
              <li className="flex gap-3 text-base text-cream/90"><Check className="w-5 h-5 text-clay shrink-0" /> Injury prevention insights</li>
              <li className="flex gap-3 text-base text-cream/90"><Check className="w-5 h-5 text-clay shrink-0" /> Priority model updates</li>
            </ul>

            <button 
              onClick={() => setModalOpen(true)}
              className="magnetic-btn btn-clay w-full bg-clay text-cream py-4 rounded-full font-bold shadow-lg"
            >
              <span>Join Waitlist &rarr;</span>
            </button>
          </div>

          {/* Studio Tier */}
          <div className="pricing-card bg-cream border border-charcoal/5 rounded-[2.5rem] p-10 flex flex-col h-[500px]">
            <div className="font-mono text-charcoal/50 text-xs tracking-widest mb-4">STUDIO</div>
            <h3 className="text-3xl font-bold text-charcoal mb-2">Enterprise</h3>
            <div className="text-xl font-medium text-charcoal/60 mb-8">Custom</div>
            
            <ul className="flex flex-col gap-4 flex-1">
              <li className="flex gap-3 text-sm text-charcoal/80"><Check className="w-5 h-5 text-clay shrink-0" /> Multi-user studio dashboard</li>
              <li className="flex gap-3 text-sm text-charcoal/80"><Check className="w-5 h-5 text-clay shrink-0" /> White-label options</li>
              <li className="flex gap-3 text-sm text-charcoal/80"><Check className="w-5 h-5 text-clay shrink-0" /> API access for integrations</li>
              <li className="flex gap-3 text-sm text-charcoal/80"><Check className="w-5 h-5 text-clay shrink-0" /> Dedicated success manager</li>
            </ul>

            <button 
              onClick={() => setModalOpen(true)}
              className="magnetic-btn w-full bg-transparent border border-charcoal/20 text-charcoal hover:text-cream py-3.5 rounded-full font-bold transition-colors hover:border-charcoal hover:bg-charcoal"
            >
              <span>Contact Us</span>
            </button>
          </div>

        </div>
      </section>

      <WaitlistModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};

export default Pricing;
