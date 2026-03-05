import React, { useState, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { X, Check, Shield, Zap } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

/* ── Waitlist modal ──────────────────────────────────────────────────── */
const WaitlistModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [email, setEmail]         = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-charcoal/80 backdrop-blur-[14px] cursor-pointer" onClick={onClose} />
      <div className="relative bg-warmwhite dark:bg-forest-dark rounded-[2.5rem] p-8 md:p-12 w-full max-w-lg shadow-2xl z-10 animate-fade-in">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full hover:bg-charcoal/6 dark:hover:bg-warmwhite/6 transition-colors">
          <X className="w-5 h-5 text-charcoal/40 dark:text-warmwhite/40" />
        </button>

        {!submitted ? (
          <>
            <div className="section-label mb-5 !bg-gold/10 !text-gold">Early Access</div>
            <h3 className="font-serif italic text-3xl md:text-4xl text-charcoal dark:text-warmwhite mb-3">
              "Be first to practice."
            </h3>
            <p className="font-outfit text-charcoal/60 dark:text-warmwhite/55 mb-8 leading-relaxed">
              We're launching soon. Drop your email and we'll reach out the moment doors open.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="bg-transparent border-b-2 border-charcoal/15 dark:border-warmwhite/15 px-2 py-3 text-lg font-sans outline-none
                  focus:border-gold transition-colors text-charcoal dark:text-warmwhite placeholder:text-charcoal/30 dark:placeholder:text-warmwhite/25"
              />
              <button type="submit" className="btn-primary w-full mt-2 !py-4 text-lg">
                <span>Reserve My Spot</span>
              </button>
            </form>
            <p className="font-mono text-[10px] tracking-widest text-charcoal/25 dark:text-warmwhite/20 mt-6 text-center">
              NO SPAM · EARLY ACCESS ONLY
            </p>
          </>
        ) : (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-forest/10 flex items-center justify-center mb-6">
              <Check className="w-8 h-8 text-forest dark:text-sage" />
            </div>
            <h3 className="font-serif italic text-3xl md:text-4xl text-charcoal dark:text-warmwhite mb-3">You're on the list.</h3>
            <p className="font-outfit text-charcoal/55 dark:text-warmwhite/50">We'll be in touch soon.</p>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Section ─────────────────────────────────────────────────────────── */
const Pricing = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    gsap.from('.pricing-card', {
      scrollTrigger: { trigger: sectionRef.current, start: 'top 75%' },
      y: 40,
      opacity: 0,
      stagger: 0.12,
      ease: 'power3.out',
      duration: 1,
    });
  }, { scope: sectionRef });

  const tiers = [
    {
      id: 'starter',
      tier: 'STARTER',
      name: 'Essential',
      price: 'Free',
      priceSub: '(beta)',
      featured: false,
      features: [
        'Real-time pose detection (5 sessions/week)',
        'Basic progress dashboard',
        '10 guided yoga sequences',
        'Email coaching summaries',
      ],
      cta: 'Join Waitlist',
      ctaFn: () => setModalOpen(true),
    },
    {
      id: 'pro',
      tier: 'PERFORMANCE',
      name: 'Pro',
      price: '$19',
      priceSub: '/mo',
      featured: true,
      features: [
        'Unlimited real-time AI sessions',
        'Full performance analytics suite',
        'Adaptive weekly programming',
        'Injury prevention insights',
        'Priority model updates',
      ],
      cta: 'Join Waitlist →',
      ctaFn: () => setModalOpen(true),
    },
    {
      id: 'studio',
      tier: 'STUDIO',
      name: 'Enterprise',
      price: 'Custom',
      priceSub: '',
      featured: false,
      features: [
        'Multi-user studio dashboard',
        'White-label options',
        'API access for integrations',
        'Dedicated success manager',
      ],
      cta: 'Contact Us',
      ctaFn: () => setModalOpen(true),
    },
  ];

  return (
    <>
      <section
        ref={sectionRef}
        id="pricing"
        className="relative w-full bg-warmwhite-dark dark:bg-forest-dark py-32 px-6 md:px-12 lg:px-20 z-30"
      >
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gold/6 blur-[160px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto mb-16 text-center relative z-10">
          <div className="section-label mb-5 justify-center">Pricing</div>
          <h2 className="font-serif italic text-[clamp(2.5rem,5vw,4rem)] text-forest dark:text-warmwhite leading-tight mb-4">
            One plan for every body.<br className="hidden md:block" /> Three tiers.
          </h2>
          <p className="font-outfit text-charcoal/50 dark:text-warmwhite/45 text-lg max-w-lg mx-auto">
            Start free during beta. Upgrade when you're ready to go deeper.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl mx-auto items-center relative z-10">
          {tiers.map(tier => (
            <div
              key={tier.id}
              className={`pricing-card flex flex-col transition-transform duration-500
                ${tier.featured
                  ? 'bg-forest border-2 border-gold/30 rounded-[2.5rem] p-10 h-[560px] shadow-2xl relative z-10 scale-[1.03] hover:scale-[1.05]'
                  : 'bg-warmwhite dark:bg-forest-dark/60 border border-charcoal/8 dark:border-warmwhite/8 rounded-[2rem] p-10 h-[500px] hover:-translate-y-1'
                }`}
            >
              {/* Most popular badge */}
              {tier.featured && (
                <div className="absolute top-0 right-10 -translate-y-1/2 bg-gold text-forest text-[10px] font-mono font-bold tracking-widest py-1 px-4 rounded-full flex items-center gap-1.5">
                  <Zap size={10} />
                  MOST POPULAR
                </div>
              )}

              <div className={`font-mono text-xs tracking-widest mb-3 ${tier.featured ? 'text-gold/60' : 'text-charcoal/35 dark:text-warmwhite/30'}`}>
                {tier.tier}
              </div>
              <h3 className={`text-3xl font-bold mb-1.5 ${tier.featured ? 'text-warmwhite' : 'text-charcoal dark:text-warmwhite'}`}>
                {tier.name}
              </h3>
              <div className={`text-xl font-medium mb-8 flex items-baseline gap-1 ${tier.featured ? 'text-gold' : 'text-charcoal/55 dark:text-warmwhite/45'}`}>
                {tier.price}
                {tier.priceSub && <span className="text-sm font-normal opacity-70">{tier.priceSub}</span>}
              </div>

              <ul className="flex flex-col gap-3.5 flex-1">
                {tier.features.map(f => (
                  <li key={f} className={`flex gap-3 text-sm ${tier.featured ? 'text-warmwhite/85' : 'text-charcoal/70 dark:text-warmwhite/60'}`}>
                    <Check className={`w-4 h-4 mt-0.5 shrink-0 ${tier.featured ? 'text-gold' : 'text-forest dark:text-sage'}`} />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={tier.ctaFn}
                className={`w-full mt-6 font-bold py-3.5 rounded-full transition-all duration-300
                  ${tier.featured
                    ? 'btn-primary !rounded-full !w-full !py-3.5'
                    : tier.id === 'studio'
                      ? 'border border-charcoal/20 dark:border-warmwhite/20 text-charcoal dark:text-warmwhite hover:bg-charcoal/6 dark:hover:bg-warmwhite/6'
                      : 'border border-forest/25 dark:border-warmwhite/20 text-forest dark:text-warmwhite hover:bg-forest/6 dark:hover:bg-warmwhite/6'
                  }`}
              >
                {tier.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center items-center gap-6 mt-14 relative z-10">
          <div className="flex items-center gap-2 text-charcoal/40 dark:text-warmwhite/30 text-xs font-mono">
            <Shield size={14} />
            <span>30-DAY MONEY BACK</span>
          </div>
          <div className="w-px h-4 bg-charcoal/15 dark:bg-warmwhite/10" />
          <div className="flex items-center gap-2 text-charcoal/40 dark:text-warmwhite/30 text-xs font-mono">
            <Check size={14} />
            <span>NO CREDIT CARD FOR FREE TIER</span>
          </div>
          <div className="w-px h-4 bg-charcoal/15 dark:bg-warmwhite/10" />
          <div className="flex items-center gap-2 text-charcoal/40 dark:text-warmwhite/30 text-xs font-mono">
            <Check size={14} />
            <span>CANCEL ANYTIME</span>
          </div>
        </div>
      </section>

      <WaitlistModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};

export default Pricing;
