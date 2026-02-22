import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { Activity, Target, Flame } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const DiagnosticShuffler = () => {
  const [items, setItems] = useState([
    { id: 1, icon: <Target size={16} className="text-clay" />, title: "Alignment Score", desc: "Warrior II — 94.2% accuracy", stat: "+12%" },
    { id: 2, icon: <Flame size={16} className="text-clay" />, title: "Streak Active", desc: "21 consecutive sessions", stat: "🏆" },
    { id: 3, icon: <Activity size={16} className="text-clay" />, title: "Mobility Index", desc: "Hip flexors — 78th percentile", stat: "↑8" },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setItems(prev => {
        const newArray = [...prev];
        const last = newArray.pop()!;
        newArray.unshift(last);
        return newArray;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-40 mt-4 perspective-[1000px]">
      {items.map((item, index) => {
        const isFront = index === 0;
        const translateY = index * 12;
        const scale = 1 - index * 0.05;
        const opacity = 1 - index * 0.2;
        const zIndex = 30 - index;

        return (
          <div
            key={item.id}
            className="absolute top-0 left-0 w-full bg-[#1A1A1A] border border-cream/10 rounded-2xl p-4 flex items-center justify-between transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
            style={{
              transform: `translateY(${translateY}px) scale(${scale})`,
              opacity,
              zIndex,
              boxShadow: isFront ? '0 10px 30px -10px rgba(0,0,0,0.5)' : 'none'
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-moss/50 flex items-center justify-center">
                {item.icon}
              </div>
              <div className="flex flex-col items-start text-left">
                <p className="text-cream text-sm font-sans font-bold">{item.title}</p>
                <p className="text-cream/50 text-[11px] font-outfit truncate max-w-[140px]">{item.desc}</p>
              </div>
            </div>
            <div className="text-clay font-mono text-sm font-medium">{item.stat}</div>
          </div>
        );
      })}
    </div>
  );
};

const TelemetryTypewriter = () => {
  const [text, setText] = useState('');
  const [messageIndex, setMessageIndex] = useState(0);
  const messages = [
    "Adjusting core engagement cue for today...",
    "New sequence unlocked: Hip Flow Advanced",
    "Weekly goal: 85% achieved — nice work",
    "Shoulder mobility improved +6° this week"
  ];

  useEffect(() => {
    let currentText = '';
    let charIndex = 0;
    let typingInterval: ReturnType<typeof setInterval> | undefined;
    
    setText('');

    const startTyping = () => {
      typingInterval = setInterval(() => {
        if (charIndex < messages[messageIndex].length) {
          currentText += messages[messageIndex].charAt(charIndex);
          setText(currentText);
          charIndex++;
        } else {
          clearInterval(typingInterval);
          setTimeout(() => {
            setMessageIndex(prev => (prev + 1) % messages.length);
          }, 2000);
        }
      }, 60);
    };

    startTyping();
    return () => clearInterval(typingInterval);
  }, [messageIndex, messages]); // added messages to dependency array

  return (
    <div className="w-full h-full bg-[#111] rounded-2xl border border-cream/10 overflow-hidden flex flex-col mt-4">
      <div className="px-4 py-3 bg-[#1A1A1A] border-b border-cream/5 flex items-center justify-between">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
          <span className="text-[10px] text-cream/40 font-mono tracking-wider">LIVE FEED</span>
        </div>
      </div>
      <div className="p-4 flex-1">
        <p className="font-mono text-xs text-cream/80 leading-relaxed text-left">
          <span className="text-moss mr-2">{'>'}</span>{text}<span className="inline-block w-2 bg-clay h-3 ml-1 animate-pulse"></span>
        </p>
      </div>
    </div>
  );
};

const CursorProtocol = () => {
  const container = useRef<HTMLDivElement>(null);
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const dates = [18, 19, 20, 21, 22, 23, 24];

  useGSAP(() => {
     const tl = gsap.timeline({ repeat: -1 });
     
     gsap.set('.proto-cursor', { x: 150, y: 150, opacity: 0 });
     
     tl.to('.proto-cursor', { duration: 0.6, x: 50, y: 10, opacity: 1, ease: 'power3.out' })
       .to('.proto-cursor', { duration: 0.5, x: 45, y: 35, ease: 'power2.inOut' })
       .to('.proto-cursor', { duration: 0.1, scale: 0.8 })
       .to('.day-1', { duration: 0.2, backgroundColor: '#2E4036', borderColor: '#CC5833', color: '#CC5833' }, "<")
       .to('.proto-cursor', { duration: 0.1, scale: 1 })
       .to('.proto-cursor', { duration: 0.5, x: 135, y: 35, ease: 'power2.inOut', delay: 0.2 })
       .to('.proto-cursor', { duration: 0.1, scale: 0.8 })
       .to('.day-3', { duration: 0.2, backgroundColor: '#2E4036', borderColor: '#CC5833', color: '#CC5833' }, "<")
       .to('.proto-cursor', { duration: 0.1, scale: 1 })
       .to('.proto-cursor', { duration: 0.5, x: 225, y: 35, ease: 'power2.inOut', delay: 0.2 })
       .to('.proto-cursor', { duration: 0.1, scale: 0.8 })
       .to('.day-5', { duration: 0.2, backgroundColor: '#2E4036', borderColor: '#CC5833', color: '#CC5833' }, "<")
       .to('.proto-cursor', { duration: 0.1, scale: 1 })
       .to('.proto-cursor', { duration: 0.6, x: 100, y: 95, ease: 'power2.inOut', delay: 0.3 })
       .to('.proto-cursor', { duration: 0.1, scale: 0.8 })
       .to('.proto-btn', { duration: 0.2, backgroundColor: '#CC5833', color: '#F2F0E9' }, "<")
       .to('.proto-cursor', { duration: 0.1, scale: 1 })
       .to('.proto-cursor', { duration: 0.4, y: 150, opacity: 0, delay: 0.5 })
       .set(['.day-1', '.day-3', '.day-5'], { backgroundColor: 'transparent', borderColor: 'rgba(242, 240, 233, 0.05)', color: 'rgba(242, 240, 233, 0.5)' })
       .set('.proto-btn', { backgroundColor: 'transparent', color: '#CC5833' });
       
  }, { scope: container });

  return (
    <div ref={container} className="relative w-full h-full mt-6">
      <div className="grid grid-cols-7 gap-1 lg:gap-2 mb-6 pointer-events-none">
        {days.map((day, i) => (
          <div key={day} className={`day-${i} flex flex-col items-center justify-center py-2 px-1 rounded-xl border border-cream/5 text-cream/50 bg-transparent transition-colors`}>
            <span className="text-[8px] md:text-[9px] font-mono mb-1">{day}</span>
            <span className="text-xs md:text-sm font-sans font-bold">{dates[i]}</span>
          </div>
        ))}
      </div>
      
      <div className="flex justify-between items-center mt-6">
        <div className="font-mono text-[10px] text-cream/40 px-3 py-1.5 bg-[#111] rounded-full border border-cream/5">Accuracy 96.4%</div>
        <button className="proto-btn px-4 py-1.5 rounded-full border border-clay text-clay text-xs font-sans font-bold transition-colors">
          Save session &rarr;
        </button>
      </div>

      <div className="proto-cursor absolute top-0 left-0 z-50 pointer-events-none drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)]">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4.33398 2.06738c-.628-.216-1.129.585-.688 1.09l4.575 5.23c.125.143.2.327.202.518l.019 6.843c.022.753.864 1.144 1.488.665l4.825-3.69c.14-.107.306-.17.476-.18l3.193-.186c.642-.037.935-.863.468-1.28l-8.498-7.556a.71.71 0 0 0-.46-.178l-5.6-.276z" fill="#CC5833" stroke="#1A1A1A" strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  );
};

const Features = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    gsap.from('.feature-card', {
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 80%',
      },
      y: 50,
      opacity: 0,
      stagger: 0.15,
      ease: 'power3.out',
      duration: 1
    });
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} id="features" className="relative w-full bg-charcoal rounded-[3rem_3rem_0_0] -mt-8 pt-24 pb-32 px-6 md:px-12 lg:px-20 z-30">
      
      <div className="max-w-7xl mx-auto mb-16 text-center md:text-left">
        <div className="font-mono tracking-widest text-clay text-sm justify-center md:justify-start flex uppercase mb-4">Features</div>
        <h2 className="font-serif italic text-[clamp(2.5rem,5vw,4.5rem)] text-cream leading-tight mb-4">
          Interactive Functional Artifacts
        </h2>
        <p className="font-outfit text-cream/60 text-lg max-w-2xl mx-auto md:mx-0">
          We don't do static dashboards. Every component is designed to feel alive, responding to your body and your progress in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        
        <div className="feature-card bg-cream/[0.04] border border-cream/10 rounded-[2rem] h-[340px] p-8 flex flex-col hover:-translate-y-[3px] hover:border-clay/40 transition-all duration-500 ease-out text-left overflow-hidden">
          <div className="font-mono text-clay text-xs tracking-widest mb-3">01 / ANALYTICS</div>
          <h3 className="font-sans font-bold text-cream text-xl mb-2 tracking-tight">Progress Tracking & Performance</h3>
          <p className="font-outfit text-cream/50 text-sm mb-4">Every session quantified. Trends surfaced. Growth made visible.</p>
          <div className="flex-1 overflow-visible">
            <DiagnosticShuffler />
          </div>
        </div>

        <div className="feature-card bg-cream/[0.04] border border-cream/10 rounded-[2rem] h-[340px] p-8 flex flex-col hover:-translate-y-[3px] hover:border-clay/40 transition-all duration-500 ease-out text-left">
          <div className="font-mono text-clay text-xs tracking-widest mb-3">02 / AI COACH</div>
          <h3 className="font-sans font-bold text-cream text-xl mb-2 tracking-tight">Personalized Adaptation</h3>
          <p className="font-outfit text-cream/50 text-sm mb-4">Live intelligence, not static programs. Your coach learns every session.</p>
          <div className="flex-1">
            <TelemetryTypewriter />
          </div>
        </div>

        <div className="feature-card bg-cream/[0.04] border border-cream/10 rounded-[2rem] h-[340px] p-8 flex flex-col hover:-translate-y-[3px] hover:border-clay/40 transition-all duration-500 ease-out text-left overflow-hidden">
          <div className="font-mono text-clay text-xs tracking-widest mb-3">03 / REAL-TIME</div>
          <h3 className="font-sans font-bold text-cream text-xl mb-2 tracking-tight">Detection & Correction</h3>
          <p className="font-outfit text-cream/50 text-sm mb-4">MoveNet skeleton tracking. Corrections delivered under 50ms.</p>
          <div className="flex-1 mt-auto relative">
            <CursorProtocol />
          </div>
        </div>

      </div>

    </section>
  );
};

export default Features;
