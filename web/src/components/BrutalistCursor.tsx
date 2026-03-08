/**
 * BrutalistCursor — mix-blend-difference tracking cursor.
 *
 * Replaces the default cursor on pointer devices (cursor:none is set in
 * index.css for `@media (hover:hover) and (pointer:fine)`).
 *
 * - 32 px white circle, mix-blend-mode:difference, z-index:99999
 * - Follows mouse with 0.2 exponential-lerp per RAF frame
 * - Scales to 80 px when over any <a> or <button>
 * - Scales back to 32 px on mouseout
 *
 * Clauaskee rules: no border-radius on the cursor pill — it is circular
 * because that's the b-cursor class definition (border-radius:50%).
 */
import { useEffect, useRef } from 'react';

const BrutalistCursor = () => {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    /* ── State ──────────────────────────────────────────────────────────── */
    let targetX  = -200;   // start off-screen until first mousemove
    let targetY  = -200;
    let currentX = -200;
    let currentY = -200;
    let isLarge  = false;
    let rafId: number;

    /* ── Mouse tracking ─────────────────────────────────────────────────── */
    const onMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };

    /* ── Scale up on interactive elements ───────────────────────────────── */
    const onMouseOver = (e: MouseEvent) => {
      if (!isLarge && (e.target as Element).closest('a, button')) {
        isLarge = true;
        cursor.style.width  = '80px';
        cursor.style.height = '80px';
      }
    };

    const onMouseOut = (e: MouseEvent) => {
      if (isLarge && (e.target as Element).closest('a, button')) {
        isLarge = false;
        cursor.style.width  = '32px';
        cursor.style.height = '32px';
      }
    };

    /* ── RAF loop — exponential smoothing at lerp 0.2 ────────────────────── */
    const loop = () => {
      rafId = requestAnimationFrame(loop);

      currentX += (targetX - currentX) * 0.2;
      currentY += (targetY - currentY) * 0.2;

      // Centre on the mouse pointer: offset by half the current target size
      const half = isLarge ? 40 : 16;
      cursor.style.transform = `translate(${currentX - half}px, ${currentY - half}px)`;
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mouseover', onMouseOver, { passive: true });
    window.addEventListener('mouseout',  onMouseOut,  { passive: true });
    rafId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseover', onMouseOver);
      window.removeEventListener('mouseout',  onMouseOut);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return <div ref={cursorRef} className="b-cursor" aria-hidden="true" />;
};

export default BrutalistCursor;
