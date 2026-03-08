/**
 * Features — bento-grid feature showcase.
 *
 * Layout: 3-column CSS grid.
 *   - Card 01 (Real-time pose detection): .bento-large (2×2 span), dark --brutal bg.
 *   - Cards 02–06: .card-brutalist (1×1, light bg, 4px hard shadow).
 *
 * Wellness Brutalism injections:
 *   - Ticker ✦ separators in --acid yellow-green (was --accent coral).
 *   - Section h2 includes a .glitch-word "AI" in Dela Gothic One.
 *   - Bento-large card accent detail uses --accent coral dot.
 *
 * Clauaskee rules: no border-radius on any element.
 */
import { useEffect, useRef } from 'react';

const features = [
  {
    number: '02',
    title: 'AI form scoring',
    body: 'Every frame is scored against biomechanical angle and alignment rules. Get a live 0–100 accuracy score as you hold each pose.',
  },
  {
    number: '03',
    title: 'Instant corrections',
    body: 'Colour-coded correction cues (major / moderate / minor) tell you exactly which joint to adjust — in real time, not after the session.',
  },
  {
    number: '04',
    title: 'Personalised AI coach',
    body: 'Ask the AI coach anything about your practice. It remembers your history and adapts its advice to your level and goals over time.',
  },
  {
    number: '05',
    title: 'Nutrition & fitness plans',
    body: 'AI-generated meal plans and workout programmes tailored to your goal — weight loss, flexibility, strength, or mindfulness.',
  },
  {
    number: '06',
    title: 'Progress analytics',
    body: 'Track accuracy trends, streaks, and improvement over weeks. See exactly which poses need work and where you\'ve grown.',
  },
];

const Features = () => {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gridRef.current) return;
    const cards = gridRef.current.querySelectorAll<HTMLElement>('.feat-card');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              (entry.target as HTMLElement).style.opacity = '1';
              (entry.target as HTMLElement).style.transform = 'translateY(0)';
            }, i * 80);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 }
    );
    cards.forEach(c => observer.observe(c));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="how-it-works" style={{ backgroundColor: 'var(--bg)' }}>

      {/* ── Ticker strip — light editorial, ✦ in acid ───────────────────── */}
      <div className="ticker-wrap">
        <div className="ticker-inner">
          {Array.from({ length: 2 }).flatMap(() =>
            ['Pose Detection', '✦', 'AI Coaching', '✦', 'Form Scoring', '✦', 'Real-time', '✦', 'In-browser', '✦', 'Private', '✦']
          ).map((item, i) => (
            <span
              key={i}
              style={{
                fontFamily: '"Playfair Display", serif',
                fontStyle: item === '✦' ? 'normal' : 'italic',
                fontSize: '0.95rem',
                /* ── Wellness Brutalism: ✦ separator now in acid ── */
                color: item === '✦' ? 'var(--acid)' : 'var(--muted)',
              }}
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '6rem 2rem' }}>

        {/* ── Section heading — Playfair + Dela Gothic One glitch on "AI" ── */}
        <div style={{ marginBottom: '4rem' }}>
          <p className="ck-label mb-4" style={{ color: 'var(--accent)' }}>What you get</p>
          <h2 style={{
            fontFamily: '"Playfair Display", serif',
            fontStyle: 'italic',
            fontWeight: 700,
            fontSize: 'clamp(2.5rem, 5vw, 5rem)',
            letterSpacing: '-0.03em',
            lineHeight: 0.9,
            color: 'var(--ink)',
            maxWidth: '620px',
          }}>
            Everything your{' '}
            {/* ── Glitch word: Dela Gothic One, acid, glitch on hover ── */}
            <span
              className="glitch-word"
              data-text="AI"
              style={{ color: 'var(--acid)', fontStyle: 'normal' }}
            >
              AI
            </span>
            <br />
            <em style={{ color: 'var(--accent)' }}>practice needs.</em>
          </h2>
        </div>

        {/* ── Bento grid ───────────────────────────────────────────────── */}
        <div
          ref={gridRef}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1.25rem',
          }}
          className="max-lg:grid-cols-1"
        >

          {/* Card 01 — bento-large: 2×2, dark, hero feature card */}
          <div
            className="bento-large feat-card"
            style={{
              background: 'var(--brutal)',
              padding: '3rem 2.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              opacity: 0,
              transform: 'translateY(20px)',
              transition: 'opacity 0.6s ease, transform 0.6s ease',
            }}
          >
            <div>
              <p className="ck-label mb-6" style={{ color: 'rgba(210,232,35,0.45)' }}>01</p>
              <h3 style={{
                fontFamily: '"Playfair Display", serif',
                fontStyle: 'italic',
                fontWeight: 700,
                fontSize: 'clamp(1.8rem, 3vw, 2.6rem)',
                letterSpacing: '-0.025em',
                lineHeight: 1.05,
                color: '#F7F4EE',
                marginBottom: '1.5rem',
              }}>
                Real-time<br />pose detection
              </h3>
              <p style={{
                color: 'rgba(247,244,238,0.50)',
                fontSize: '0.95rem',
                lineHeight: 1.75,
                fontWeight: 300,
                maxWidth: '340px',
              }}>
                MoveNet Thunder runs at 30fps directly in your browser — no app download,
                no cloud upload. Your camera feed never leaves your device.
              </p>
            </div>

            {/* Accent detail: coral square + stat line */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '3rem' }}>
              <div style={{ width: '10px', height: '10px', background: 'var(--accent)', flexShrink: 0 }} />
              <span className="ck-label" style={{ color: 'rgba(247,244,238,0.28)' }}>
                30 fps · In-browser · Fully private
              </span>
            </div>
          </div>

          {/* Cards 02–06 — card-brutalist small */}
          {features.map((f) => (
            <div
              key={f.number}
              className="card-brutalist feat-card"
              style={{
                padding: '2.5rem 2rem',
                opacity: 0,
                transform: 'translateY(20px)',
                transition: `opacity 0.6s ease, transform 0.6s ease, box-shadow 0.1s ease`,
              }}
            >
              <p className="ck-label mb-4" style={{ color: 'var(--line)' }}>{f.number}</p>
              <h3 style={{
                fontFamily: '"Playfair Display", serif',
                fontStyle: 'italic',
                fontWeight: 700,
                fontSize: '1.2rem',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                color: 'var(--ink)',
                marginBottom: '1rem',
              }}>
                {f.title}
              </h3>
              <p style={{ color: 'var(--muted)', fontSize: '0.92rem', lineHeight: 1.7, fontWeight: 300 }}>
                {f.body}
              </p>
            </div>
          ))}

        </div>
      </div>
    </section>
  );
};

export default Features;
