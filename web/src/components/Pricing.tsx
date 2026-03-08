import { Link } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';

const tiers = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Get started with AI pose detection.',
    features: ['3 poses (Mountain, Warrior II, Tree)', 'Live form score', 'Basic corrections', '5 sessions / month'],
    cta: 'Start for free',
    href: '/signup',
    featured: false,
  },
  {
    name: 'Pro',
    price: '$12',
    period: 'per month',
    description: 'Unlimited practice with full AI coaching.',
    features: ['All poses + new additions', 'Unlimited sessions', 'AI coach chat', 'Nutrition & fitness plans', 'Progress analytics'],
    cta: 'Get Pro',
    href: '/signup',
    featured: true,
  },
  {
    name: 'Studio',
    price: 'Custom',
    period: 'for teams',
    description: 'White-label solution for yoga studios.',
    features: ['Everything in Pro', 'Team dashboards', 'Custom pose library', 'Priority support', 'API access'],
    cta: 'Contact us',
    href: 'mailto:hello@yogifi.app',
    featured: false,
  },
];

const Pricing = () => (
  <section style={{ backgroundColor: 'var(--surface)', padding: '6rem 2rem' }}>
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '4rem' }}>
        <p className="ck-label mb-4" style={{ color: 'var(--accent)' }}>Pricing</p>
        <h2 style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(2.5rem, 5vw, 5rem)', letterSpacing: '-0.03em', lineHeight: 0.9, color: 'var(--ink)' }}>
          Simple,
          <br />
          <em style={{ color: 'var(--accent)' }}>transparent.</em>
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5px', background: 'var(--line)' }} className="max-lg:grid-cols-1">
        {tiers.map(tier => (
          <div
            key={tier.name}
            style={{
              background: tier.featured ? 'var(--ink)' : 'var(--bg)',
              padding: '2.5rem',
              display: 'flex', flexDirection: 'column',
              position: 'relative',
              /* ── Wellness Brutalism: Pro card acid border + hard shadow ── */
              ...(tier.featured ? {
                border: '2px solid var(--acid)',
                boxShadow: '8px 8px 0 0 var(--acid)',
              } : {}),
            }}
          >
            {/* Most Popular pill — acid sticker on the Pro card */}
            {tier.featured && (
              <div style={{
                position: 'absolute',
                top: '-1.1rem',
                right: '1.5rem',
                background: 'var(--acid)',
                border: '2px solid var(--brutal)',
                boxShadow: '3px 3px 0 0 var(--brutal)',
                transform: 'rotate(-2deg)',
                padding: '0.28rem 0.85rem',
                zIndex: 5,
              }}>
                <span style={{
                  fontFamily: '"Space Grotesk", sans-serif',
                  fontWeight: 700,
                  fontSize: '0.62rem',
                  letterSpacing: '0.11em',
                  textTransform: 'uppercase',
                  color: 'var(--brutal)',
                  whiteSpace: 'nowrap',
                }}>Most Popular</span>
              </div>
            )}
            <div>
              <p className="ck-label mb-3" style={{ color: tier.featured ? 'rgba(247,244,238,0.45)' : 'var(--muted)' }}>{tier.name}</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '0.5rem' }}>
                <span style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: 700, fontSize: '3rem', letterSpacing: '-0.03em', color: tier.featured ? 'var(--bg)' : 'var(--ink)' }}>
                  {tier.price}
                </span>
                <span className="ck-label" style={{ color: tier.featured ? 'rgba(247,244,238,0.35)' : 'var(--muted)' }}>{tier.period}</span>
              </div>
              <p style={{ color: tier.featured ? 'rgba(247,244,238,0.55)' : 'var(--muted)', fontSize: '0.9rem', fontWeight: 300, marginBottom: '2rem', lineHeight: 1.6 }}>
                {tier.description}
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {tier.features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.9rem', color: tier.featured ? 'rgba(247,244,238,0.75)' : 'var(--ink)', fontWeight: 300 }}>
                    <Check size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ marginTop: 'auto' }}>
              <Link
                to={tier.href}
                className={tier.featured ? 'btn-light' : 'btn-ink'}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {tier.cta} <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Pricing;
