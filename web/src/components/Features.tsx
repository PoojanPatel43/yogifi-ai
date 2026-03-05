import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Activity, Target, Flame } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

/* ── Animated metric cards ──────────────────────────────────────────── */
const DiagnosticShuffler = () => {
  const [items, setItems] = useState([
    { id: 1, icon: <Target size={15} className="text-gold" />, title: 'Alignment Score', desc: 'Warrior II — 94.2% accuracy', stat: '+12%' },
    { id: 2, icon: <Flame  size={15} className="text-gold" />, title: 'Streak Active',   desc: '21 consecutive sessions',    stat: '🏆'   },
    { id: 3, icon: <Activity size={15} className="text-gold" />, title: 'Mobility Index', desc: 'Hip flexors — 78th pct',    stat: '↑8'   },
  ]);

  useEffect(() => {
    const iv = setInterval(() => {
      setItems(prev => { const a = [...prev]; a.unshift(a.pop()!); return a; });
    }, 3000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="relative w-full h-40 mt-4 perspective-[1000px]">
      {items.map((item, index) => (
        <div
          key={item.id}
          className="absolute top-0 left-0 w-full bg-forest-dark/80 border border-gold/10 rounded-2xl p-4 flex items-center justify-between transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          style={{
            transform: `translateY(${index * 12}px) scale(${1 - index * 0.05})`,
            opacity: 1 - index * 0.22,
            zIndex: 30 - index,
            boxShadow: index === 0 ? '0 10px 30px -10px rgba(0,0,0,0.5)' : 'none',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
              {item.icon}
            </div>
            <div className="flex flex-col items-start text-left">
              <p className="text-warmwhite text-sm font-sans font-bold">{item.title}</p>
              <p className="text-warmwhite/45 text-[11px] font-outfit truncate max-w-[140px]">{item.desc}</p>
            </div>
          </div>
          <div className="text-gold font-mono text-sm font-medium">{item.stat}</div>
        </div>
      ))}
    </div>
  );
};

/* ── AI typewriter feed ─────────────────────────────────────────────── */
const TelemetryTypewriter = () => {
  const [text, setText] = useState('');
  const [msgIdx, setMsgIdx] = useState(0);
  const messages = [
    'Adjusting core engagement cue for today...',
    'New sequence unlocked: Hip Flow Advanced',
    'Weekly goal: 85% achieved — nice work',
    'Shoulder mobility improved +6° this week',
  ];

  useEffect(() => {
    let current = '';
    let charIdx = 0;
    setText('');
    const iv = setInterval(() => {
      if (charIdx < messages[msgIdx].length) {
        current += messages[msgIdx][charIdx++];
        setText(current);
      } else {
        clearInterval(iv);
        setTimeout(() => setMsgIdx(p => (p + 1) % messages.length), 2200);
      }
    }, 58);
    return () => clearInterval(iv);
  }, [msgIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="w-full h-full bg-forest-dark/80 rounded-2xl border border-gold/10 overflow-hidden flex flex-col mt-4">
      <div className="px-4 py-3 bg-forest-dark border-b border-gold/8 flex items-center justify-between">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-sage animate-pulse" />
          <span className="text-[10px] text-warmwhite/35 font-mono tracking-wider">AI COACH</span>
        </div>
      </div>
      <div className="p-4 flex-1">
        <p className="font-mono text-xs text-warmwhite/80 leading-relaxed text-left">
          <span className="text-sage mr-2">›</span>
          {text}
          <span className="inline-block w-2 bg-gold h-3 ml-1 animate-pulse" />
        </p>
      </div>
    </div>
  );
};

/* ── Cursor schedule demo ───────────────────────────────────────────── */
const CursorProtocol = () => {
  const container = useRef<HTMLDivElement>(null);
  const days  = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const dates = [18, 19, 20, 21, 22, 23, 24];

  useGSAP(() => {
    const tl = gsap.timeline({ repeat: -1 });
    gsap.set('.proto-cursor', { x: 150, y: 150, opacity: 0 });

    tl.to('.proto-cursor', { duration: 0.6, x: 50,  y: 10,  opacity: 1, ease: 'power3.out' })
      .to('.proto-cursor', { duration: 0.5, x: 45,  y: 35,  ease: 'power2.inOut' })
      .to('.proto-cursor', { duration: 0.1, scale: 0.8 })
      .to('.day-1', { duration: 0.2, backgroundColor: '#1B4332', borderColor: '#D4AF37', color: '#D4AF37' }, '<')
      .to('.proto-cursor', { duration: 0.1, scale: 1 })
      .to('.proto-cursor', { duration: 0.5, x: 135, y: 35,  ease: 'power2.inOut', delay: 0.2 })
      .to('.proto-cursor', { duration: 0.1, scale: 0.8 })
      .to('.day-3', { duration: 0.2, backgroundColor: '#1B4332', borderColor: '#D4AF37', color: '#D4AF37' }, '<')
      .to('.proto-cursor', { duration: 0.1, scale: 1 })
      .to('.proto-cursor', { duration: 0.5, x: 225, y: 35,  ease: 'power2.inOut', delay: 0.2 })
      .to('.proto-cursor', { duration: 0.1, scale: 0.8 })
      .to('.day-5', { duration: 0.2, backgroundColor: '#1B4332', borderColor: '#D4AF37', color: '#D4AF37' }, '<')
      .to('.proto-cursor', { duration: 0.1, scale: 1 })
      .to('.proto-cursor', { duration: 0.6, x: 100, y: 95,  ease: 'power2.inOut', delay: 0.3 })
      .to('.proto-cursor', { duration: 0.1, scale: 0.8 })
      .to('.proto-btn',    { duration: 0.2, backgroundColor: '#D4AF37', color: '#1B4332' }, '<')
      .to('.proto-cursor', { duration: 0.1, scale: 1 })
      .to('.proto-cursor', { duration: 0.4, y: 150, opacity: 0, delay: 0.5 })
      .set(['.day-1', '.day-3', '.day-5'], { backgroundColor: 'transparent', borderColor: 'rgba(212,175,55,0.08)', color: 'rgba(250,250,248,0.4)' })
      .set('.proto-btn', { backgroundColor: 'transparent', color: '#D4AF37' });
  }, { scope: container });

  return (
    <div ref={container} className="relative w-full h-full mt-6">
      <div className="grid grid-cols-7 gap-1 lg:gap-2 mb-6 pointer-events-none">
        {days.map((day, i) => (
          <div key={day} className={`day-${i} flex flex-col items-center justify-center py-2 px-1 rounded-xl border border-gold/8 text-warmwhite/40 bg-transparent transition-colors`}>
            <span className="text-[8px] md:text-[9px] font-mono mb-1">{day}</span>
            <span className="text-xs md:text-sm font-sans font-bold">{dates[i]}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between items-center mt-6">
        <div className="font-mono text-[10px] text-warmwhite/35 px-3 py-1.5 bg-forest-dark rounded-full border border-gold/10">Accuracy 96.4%</div>
        <button className="proto-btn px-4 py-1.5 rounded-full border border-gold text-gold text-xs font-sans font-bold transition-colors">
          Save session →
        </button>
      </div>
      <div className="proto-cursor absolute top-0 left-0 z-50 pointer-events-none drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)]">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path d="M4.334 2.067c-.628-.216-1.129.585-.688 1.09l4.575 5.23c.125.143.2.327.202.518l.019 6.843c.022.753.864 1.144 1.488.665l4.825-3.69c.14-.107.306-.17.476-.18l3.193-.186c.642-.037.935-.863.468-1.28L10.394 3.52a.71.71 0 0 0-.46-.178l-5.6-.276z" fill="#D4AF37" stroke="#0F2419" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
};

/* ── Section ────────────────────────────────────────────────────────── */
const Features = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    gsap.from('.feature-card', {
      scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' },
      y: 50,
      opacity: 0,
      stagger: 0.15,
      ease: 'power3.out',
      duration: 1,
    });
  }, { scope: sectionRef });

  const cards = [
    {
      tag: '01 / ANALYTICS',
      title: 'Progress Tracking & Performance',
      desc: 'Every session quantified. Trends surfaced. Growth made visible.',
      demo: <DiagnosticShuffler />,
    },
    {
      tag: '02 / AI COACH',
      title: 'Personalized Adaptation',
      desc: 'Live intelligence, not static programs. Your coach learns every session.',
      demo: <TelemetryTypewriter />,
    },
    {
      tag: '03 / REAL-TIME',
      title: 'Detection & Correction',
      desc: 'MoveNet skeleton tracking. Corrections delivered under 50ms.',
      demo: <CursorProtocol />,
    },
  ];

  return (
    <section
      ref={sectionRef}
      id="features"
      className="relative w-full bg-forest rounded-[3rem_3rem_0_0] -mt-8 pt-24 pb-32 px-6 md:px-12 lg:px-20 z-30"
    >
      {/* Subtle radial glow */}
      <div className="absolute top-0 right-1/3 w-[500px] h-[400px] bg-gold/6 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto mb-16">
        <div className="section-label mb-5">Features</div>
        <h2 className="font-serif italic text-[clamp(2.5rem,5vw,4.5rem)] text-warmwhite leading-tight mb-4">
          Interactive Intelligence,<br className="hidden md:block" /> in real time.
        </h2>
        <p className="font-outfit text-warmwhite/55 text-lg max-w-2xl">
          Every component feels alive — responding to your body and your progress as it happens.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {cards.map(({ tag, title, desc, demo }) => (
          <div
            key={tag}
            className="feature-card bg-warmwhite/[0.04] border border-warmwhite/8 rounded-[2rem] h-[340px] p-8
              flex flex-col hover:-translate-y-1 hover:border-gold/30 transition-all duration-500 ease-out
              text-left overflow-hidden"
          >
            <div className="font-mono text-gold text-xs tracking-widest mb-3">{tag}</div>
            <h3 className="font-sans font-bold text-warmwhite text-xl mb-2 tracking-tight">{title}</h3>
            <p className="font-outfit text-warmwhite/45 text-sm mb-4">{desc}</p>
            <div className="flex-1 overflow-visible">{demo}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Features;
