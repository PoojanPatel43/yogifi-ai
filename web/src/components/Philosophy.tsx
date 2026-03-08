const Philosophy = () => (
  <section style={{ backgroundColor: 'var(--ink)', color: 'var(--bg)', padding: '8rem 2rem', textAlign: 'center' }}>
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <p className="ck-label mb-8" style={{ color: 'var(--muted)' }}>Our philosophy</p>
      <h2 style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(2.5rem, 6vw, 6rem)', letterSpacing: '-0.03em', lineHeight: 0.9, marginBottom: '2.5rem' }}>
        Yoga is a{' '}
        <em style={{ color: 'var(--accent)' }}>practice,</em>
        <br />
        not a performance.
      </h2>
      <p style={{ color: 'rgba(247,244,238,0.55)', fontSize: '1.1rem', fontWeight: 300, lineHeight: 1.8, maxWidth: '520px', margin: '0 auto 3.5rem' }}>
        Technology should disappear into the background and let the practice speak.
        Yogifi gives you real feedback without judgment — so you can focus on breath,
        alignment, and presence.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3rem', borderTop: '1px solid rgba(212,207,198,0.15)', paddingTop: '3.5rem' }} className="max-sm:grid-cols-1">
        {[
          { heading: 'Private by design', body: 'Your camera feed never leaves your device. No cloud AI, no data collection, no surveillance.' },
          { heading: 'Science-backed', body: 'Biomechanical angle rules calibrated against certified yoga teacher guidelines and sports science research.' },
          { heading: 'Always improving', body: 'The model learns from aggregate (anonymised) feedback to score poses more accurately over time.' },
        ].map(item => (
          <div key={item.heading} style={{ textAlign: 'left' }}>
            <h3 style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '1.15rem', letterSpacing: '-0.01em', color: 'var(--bg)', marginBottom: '0.75rem' }}>
              {item.heading}
            </h3>
            <p style={{ color: 'rgba(247,244,238,0.45)', fontSize: '0.9rem', fontWeight: 300, lineHeight: 1.7 }}>
              {item.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Philosophy;
