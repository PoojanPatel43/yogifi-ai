import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Ribbons from './Ribbons';

// ── Typing constants ──────────────────────────────────────────────────────────
const HEADLINE        = 'Move Smarter.';
const TOTAL_CHARS     = HEADLINE.length;  // 13
const MOVE_END        = 4;               // "Move"  → indices 0-3
const SMARTER_START   = 5;               // "Smarter" starts after the space
const SMARTER_END     = 12;             // "Smarter" ends at index 12 (exclusive)
const SMARTER_LENGTH  = SMARTER_END - SMARTER_START; // 7

// ── SVG path (wobbly hand-drawn underline in 250-unit viewport) ───────────────
const UNDERLINE_PATH  = 'M 2 5 C 25 1, 58 8, 88 4 C 118 1, 148 7, 178 4 C 202 1, 228 6, 248 4';

const Hero = () => {
  const [charCount,    setCharCount]    = useState(0);
  const [sectionInView, setSectionInView] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const pathRef    = useRef<SVGPathElement>(null);

  // ── 1. Typing animation — 50 ms/char, starts after 300 ms ────────────────
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    const timeoutId = setTimeout(() => {
      intervalId = setInterval(() => {
        setCharCount(n => {
          if (n >= TOTAL_CHARS) { clearInterval(intervalId); return n; }
          return n + 1;
        });
      }, 50);
    }, 300);
    return () => { clearTimeout(timeoutId); clearInterval(intervalId); };
  }, []);

  // ── 2. IntersectionObserver — watch hero section ──────────────────────────
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setSectionInView(true); io.disconnect(); } },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // ── 3. Draw SVG underline once typing is done AND section is in view ──────
  useEffect(() => {
    const path = pathRef.current;
    if (!path || charCount < TOTAL_CHARS || !sectionInView) return;

    const len = path.getTotalLength();
    path.style.strokeDasharray  = `${len}`;
    path.style.strokeDashoffset = `${len}`;
    // Double-RAF: first frame sets the initial dashoffset in the browser,
    // second frame triggers the CSS transition so it's guaranteed to animate.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        path.style.transition      = 'stroke-dashoffset 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        path.style.strokeDashoffset = '0';
      }),
    );
  }, [charCount, sectionInView]);

  // ── Derived display values ────────────────────────────────────────────────
  const movePart       = HEADLINE.slice(0, Math.min(charCount, MOVE_END));
  const showLine2      = charCount > SMARTER_START;            // first "S" typed
  const smarterPart    = showLine2
    ? HEADLINE.slice(SMARTER_START, Math.min(charCount, SMARTER_END))
    : '';
  const dotPart        = charCount >= TOTAL_CHARS ? '.' : '';
  const isTypingDone   = charCount >= TOTAL_CHARS;
  const showUnderline  = smarterPart.length === SMARTER_LENGTH;

  return (
    <section
      ref={sectionRef}
      style={{ maxWidth: '1200px', margin: '0 auto', padding: 'calc(5rem + 56px) 2rem 4rem', position: 'relative' }}
    >
      {/* ── Ribbons WebGL background — z-index 0, opacity 0.35 ─────────────── */}
      <div style={{
        position: 'absolute', inset: 0,
        zIndex: 0, opacity: 0.35,
        pointerEvents: 'none', overflow: 'hidden',
      }}>
        <Ribbons
          colors={['#C9472F', '#D4CFC6', '#1A1816']}
          baseThickness={25}
          speedMultiplier={0.4}
          maxAge={500}
          enableFade={true}
          enableShaderEffect={true}
          effectAmplitude={1.2}
          backgroundColor={[0.969, 0.957, 0.933, 0]}
        />
      </div>

      {/* ── Hero content — z-index 10, always above ribbons ────────────────── */}
      <div style={{ position: 'relative', zIndex: 10 }}>
      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'end', gap: '4rem' }}
        className="max-lg:grid-cols-1 max-lg:gap-8"
      >
        {/* Left — giant italic heading with typing + SVG underline */}
        <div style={{ position: 'relative' }}>

          {/* ── Acid sticker badge — floats top-right of the heading column ── */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '0.25rem',
              right: '-0.5rem',
              background: 'var(--acid)',
              border: '2px solid var(--brutal)',
              boxShadow: '4px 4px 0 0 var(--brutal)',
              transform: 'rotate(-2deg)',
              padding: '0.4rem 0.9rem',
              zIndex: 15,
              pointerEvents: 'none',
            }}
          >
            <span style={{
              fontFamily: '"Space Grotesk", sans-serif',
              fontWeight: 700,
              fontSize: '0.68rem',
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              color: 'var(--brutal)',
              whiteSpace: 'nowrap',
            }}>
              AI-Powered ✦
            </span>
          </div>
          <p className="ck-label mb-6 animate-fade-up-0" style={{ color: 'var(--accent)' }}>
            AI Yoga Coach — Beta
          </p>

          <h1
            className="animate-fade-up-1"
            style={{
              fontFamily: '"Playfair Display", serif',
              fontStyle: 'italic',
              fontWeight: 700,
              fontSize: 'clamp(4rem, 10vw, 9rem)',
              letterSpacing: '-0.03em',
              lineHeight: 0.9,
              color: 'var(--ink)',
              // Reserve space for two lines so layout doesn't shift during typing
              minHeight: 'clamp(7.2rem, 18vw, 16.2rem)',
            }}
          >
            {/* Line 1 — "Move" */}
            {movePart}

            {/* Line 2 — "Smarter" (accent) + "." (ink) */}
            {showLine2 && (
              <>
                <br />
                {/* Wrapper span: position:relative anchor for the SVG underline */}
                <span style={{ position: 'relative', display: 'inline-block' }}>
                  <span style={{ color: 'var(--accent)' }}>{smarterPart}</span>

                  {/* Hand-drawn SVG underline — revealed via stroke-dashoffset */}
                  {showUnderline && (
                    <svg
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        left: 0,
                        bottom: '-0.14em',   // sits just below the text baseline
                        width: '100%',
                        height: '8px',
                        overflow: 'visible', // path extends slightly beyond the box
                        pointerEvents: 'none',
                        display: 'block',
                      }}
                      viewBox="0 0 250 8"
                      preserveAspectRatio="none"
                    >
                      <path
                        ref={pathRef}
                        d={UNDERLINE_PATH}
                        fill="none"
                        stroke="var(--accent)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        // Start fully hidden; the effect will animate to 0
                        style={{ strokeDasharray: '1000', strokeDashoffset: '1000' }}
                      />
                    </svg>
                  )}
                </span>
              </>
            )}

            {/* Dot on line 2 (ink color, outside accent span) */}
            {dotPart}

            {/* Blinking cursor — visible while typing, gone when done */}
            {!isTypingDone && <span className="typing-cursor">|</span>}
          </h1>
        </div>

        {/* Right — copy + CTA */}
        <div className="animate-fade-up-2">
          <p style={{
            color: 'var(--muted)', fontWeight: 300, fontSize: '1.1rem',
            lineHeight: 1.75, marginBottom: '2.5rem', maxWidth: '380px',
          }}>
            Real-time pose detection meets AI coaching. Get instant form feedback,
            personalised sessions, and track your yoga progress — all from your browser.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/signup" className="btn-ink">
              Start practicing <ArrowRight size={14} />
            </Link>
            <Link
              to="/#how-it-works"
              style={{
                fontFamily: '"DM Sans", sans-serif', fontSize: '0.8rem', letterSpacing: '0.1em',
                textTransform: 'uppercase', color: 'var(--muted)',
                textDecoration: 'underline', textUnderlineOffset: '4px',
                textDecorationColor: 'var(--line)', transition: 'text-decoration-color 0.2s',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.textDecorationColor = 'var(--accent)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.textDecorationColor = 'var(--line)')}
            >
              See how it works
            </Link>
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--line)', marginTop: '4rem' }} className="animate-fade-up-3" />

      {/* Stats row */}
      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', marginTop: '2.5rem' }}
        className="animate-fade-up-3 max-sm:grid-cols-1"
      >
        {[
          { value: '94.2%',   label: 'Avg form accuracy' },
          { value: '< 500ms', label: 'AI feedback latency' },
          { value: '3 poses', label: 'Tracked in real-time' },
        ].map(stat => (
          <div key={stat.label}>
            <p style={{
              fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: 700,
              fontSize: '2.5rem', letterSpacing: '-0.03em', lineHeight: 1, color: 'var(--ink)',
            }}>
              {stat.value}
            </p>
            <p className="ck-label mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
      </div>{/* end z-index:10 content wrapper */}
    </section>
  );
};

export default Hero;
