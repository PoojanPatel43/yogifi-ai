const steps = [
  { n: '1', title: 'Choose a pose', body: 'Browse Warrior II, Tree, or Mountain. Each pose has a target duration and difficulty rating.' },
  { n: '2', title: 'Face your camera', body: 'Your browser activates MoveNet — a lightweight pose model that runs entirely locally at 30fps.' },
  { n: '3', title: 'Hold & receive feedback', body: 'Live accuracy score + colour-coded corrections update every 500ms. Adjust and improve in real time.' },
  { n: '4', title: 'Review your session', body: 'See your per-pose score breakdown, AI insights, and accuracy trend after each practice session.' },
];

const Protocol = () => (
  <section id="pricing" style={{ maxWidth: '1200px', margin: '0 auto', padding: '6rem 2rem' }}>
    <div style={{ borderTop: '1px solid var(--line)', paddingTop: '4rem', marginBottom: '4rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'start' }} className="max-lg:grid-cols-1">
        <div>
          <p className="ck-label mb-4" style={{ color: 'var(--accent)' }}>How it works</p>
          <h2 style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(2.5rem, 5vw, 5rem)', letterSpacing: '-0.03em', lineHeight: 0.9, color: 'var(--ink)' }}>
            Four steps to
            <br />
            <em style={{ color: 'var(--accent)' }}>better form.</em>
          </h2>
        </div>
        <p style={{ color: 'var(--muted)', fontWeight: 300, fontSize: '1.05rem', lineHeight: 1.75, alignSelf: 'end' }}>
          No hardware required. No app to install. Open your browser, allow camera access,
          and start your practice in under 60 seconds.
        </p>
      </div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5px', background: 'var(--line)' }}>
      {steps.map(step => (
        <div
          key={step.n}
          style={{ background: 'var(--bg)', padding: '2.5rem 2rem', transition: 'background 0.2s ease' }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--surface)')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'var(--bg)')}
        >
          <p style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '3rem', fontWeight: 700, color: 'var(--line)', lineHeight: 1, marginBottom: '1.5rem' }}>
            {step.n}
          </p>
          <h3 style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: 700, fontSize: '1.2rem', letterSpacing: '-0.02em', color: 'var(--ink)', marginBottom: '0.75rem' }}>
            {step.title}
          </h3>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.7, fontWeight: 300 }}>
            {step.body}
          </p>
        </div>
      ))}
    </div>
  </section>
);

export default Protocol;
