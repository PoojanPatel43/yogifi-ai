/**
 * BrutalistMarquee — dark brutalist ticker band.
 *
 * #09090B (--brutal) background, #D2E823 (--acid) text, Space Grotesk uppercase.
 * Placed between <Pricing /> and <CTA /> in Landing.tsx as a visual separator.
 *
 * Content loops seamlessly: items array is duplicated inside ticker-inner so the
 * translateX(-50%) animation creates a perfect infinite scroll without a gap.
 */

const ITEMS = [
  'Form', '✦', 'Flow', '✦', 'Function', '✦',
  'Pose by Pose', '✦', 'AI Coaching', '✦',
  'Real-Time', '✦', 'In-Browser', '✦', 'Private', '✦',
];

const BrutalistMarquee = () => (
  <div className="brutalist-ticker-wrap">
    <div className="brutalist-ticker-inner">
      {/* Duplicate for seamless loop */}
      {[...ITEMS, ...ITEMS].map((item, i) => (
        <span
          key={i}
          style={{
            fontFamily: '"Space Grotesk", sans-serif',
            fontWeight: item === '✦' ? 500 : 700,
            fontSize:   item === '✦' ? '1.1rem' : '0.7rem',
            letterSpacing: item === '✦' ? '0' : '0.13em',
            textTransform: 'uppercase',
            color: item === '✦' ? 'rgba(210,232,35,0.30)' : 'var(--acid)',
          }}
        >
          {item}
        </span>
      ))}
    </div>
  </div>
);

export default BrutalistMarquee;
