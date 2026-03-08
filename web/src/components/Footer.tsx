/**
 * Footer — two-part layout.
 *
 * Top:    Newsletter signup strip — email input + btn-brutalist submit.
 * Bottom: Brand wordmark · copyright · Privacy / Terms / GitHub links.
 *
 * Clauaskee rules: no border-radius on any element.
 */
import { ArrowRight } from 'lucide-react';

const Footer = () => (
  <footer style={{ borderTop: '1px solid var(--line)', backgroundColor: 'var(--bg)' }}>

    {/* ── Newsletter strip ──────────────────────────────────────────────── */}
    <div style={{ borderBottom: '1px solid var(--line)', padding: '3.5rem 2rem' }}>
      <div
        style={{
          maxWidth: '1200px', margin: '0 auto',
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          alignItems: 'center', gap: '4rem',
        }}
        className="max-lg:grid-cols-1 max-lg:gap-6"
      >
        {/* Heading */}
        <div>
          <p className="ck-label mb-3" style={{ color: 'var(--accent)' }}>Stay in the loop</p>
          <h3 style={{
            fontFamily: '"Playfair Display", serif',
            fontStyle: 'italic',
            fontWeight: 700,
            fontSize: 'clamp(1.6rem, 3vw, 2.4rem)',
            letterSpacing: '-0.025em',
            lineHeight: 1,
            color: 'var(--ink)',
          }}>
            Early access &amp; updates.
          </h3>
        </div>

        {/* Form */}
        <form
          onSubmit={e => e.preventDefault()}
          style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem' }}
        >
          <input
            type="email"
            placeholder="your@email.com"
            className="ck-input"
            style={{ flex: 1 }}
            aria-label="Email address"
          />
          <button type="submit" className="btn-brutalist" style={{ flexShrink: 0 }}>
            Subscribe <ArrowRight size={13} />
          </button>
        </form>
      </div>
    </div>

    {/* ── Copyright bar ─────────────────────────────────────────────────── */}
    <div
      style={{
        maxWidth: '1200px', margin: '0 auto', padding: '2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '1rem',
      }}
    >
      <span style={{
        fontFamily: '"Playfair Display", serif',
        fontStyle: 'italic',
        fontWeight: 700,
        fontSize: '1.1rem',
        color: 'var(--ink)',
        letterSpacing: '-0.02em',
      }}>
        Yogifi
      </span>

      <p className="ck-label">© 2026 Yogifi AI. All rights reserved.</p>

      <div className="flex items-center gap-6">
        {[
          { label: 'Privacy', href: '#' },
          { label: 'Terms',   href: '#' },
          { label: 'GitHub',  href: '#' },
        ].map(link => (
          <a
            key={link.label}
            href={link.href}
            className="ck-label"
            style={{ textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--accent)')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--muted)')}
          >
            {link.label}
          </a>
        ))}
      </div>
    </div>

  </footer>
);

export default Footer;
