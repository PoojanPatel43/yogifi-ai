/**
 * CTA — full-width --ink dark closing section with PrismBackground WebGL.
 *
 * Layout:  centred column, maxWidth 760 px, generous vertical padding.
 * Heading: Outfit 700, sentence-case, --bg colour.
 * Accent:  "reinvented." in Reenie Beanie cursive, --accent colour.
 * Subtext: #9e9992, DM Sans 300.
 * Button:  btn-light (border --bg, transparent bg, hover fills --bg/ink).
 *
 * Clauaskee rules: no border-radius on any element.
 */
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import PrismBackground from './PrismBackground';

const CTA = () => (
  <section style={{ backgroundColor: 'var(--ink)', position: 'relative', overflow: 'hidden', padding: '9rem 2rem' }}>

    {/* ── PrismBackground WebGL — z-index 0, opacity 0.25 ─────────────────── */}
    <div style={{
      position: 'absolute', inset: 0,
      zIndex: 0, opacity: 0.25,
      pointerEvents: 'none',
    }}>
      <PrismBackground
        animationType="hover"
        hueShift={0.3}
        colorFrequency={0.8}
        glow={0.6}
        bloom={0.8}
        noise={0.3}
        scale={4.0}
        timeScale={0.4}
        transparent={true}
        suspendWhenOffscreen={true}
        inertia={0.04}
      />
    </div>

    {/* ── Content — z-index 10 ─────────────────────────────────────────────── */}
    <div style={{ position: 'relative', zIndex: 10, maxWidth: '760px', margin: '0 auto', textAlign: 'center' }}>

      {/* Eyebrow label */}
      <p className="ck-label" style={{ color: 'rgba(247,244,238,0.35)', marginBottom: '2.5rem' }}>
        Start today
      </p>

      {/* Main heading — Outfit for display weight, Reenie Beanie for accent */}
      <h2 style={{
        fontFamily: '"Outfit", sans-serif',
        fontWeight: 700,
        fontSize: 'clamp(3rem, 9vw, 6rem)',
        letterSpacing: '-0.025em',
        lineHeight: 1.0,
        color: 'var(--bg)',
        marginBottom: '0.15em',
      }}>
        Your practice,
      </h2>
      {/* Accent word — Reenie Beanie cursive, slightly larger for emphasis */}
      <p style={{
        fontFamily: '"Reenie Beanie", cursive',
        fontWeight: 400,
        fontSize: 'clamp(3.6rem, 11vw, 7.2rem)',
        lineHeight: 0.95,
        letterSpacing: '-0.01em',
        color: 'var(--accent)',
        marginBottom: '3rem',
      }}>
        reinvented.
      </p>

      {/* Subtext */}
      <p style={{
        color: '#9e9992',
        fontWeight: 300,
        fontSize: '1.1rem',
        lineHeight: 1.8,
        maxWidth: '480px',
        margin: '0 auto 3.5rem',
      }}>
        Real-time pose detection, biomechanical scoring, and an AI coach that
        remembers every session — running entirely in your browser.
      </p>

      {/* CTA button — btn-light variant (light border, transparent fill) */}
      <Link to="/signup" className="btn-brutalist" style={{ display: 'inline-flex' }}>
        Begin your practice <ArrowRight size={14} />
      </Link>

      {/* Social proof micro-line */}
      <p className="ck-label" style={{ color: 'rgba(247,244,238,0.22)', marginTop: '2.5rem' }}>
        No app download · No data uploaded · Free to start
      </p>
    </div>
  </section>
);

export default CTA;
