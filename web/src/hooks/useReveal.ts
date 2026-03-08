import { useEffect } from 'react';

/**
 * Attaches an IntersectionObserver to all `.reveal` elements on the page.
 * When they enter the viewport (threshold 0.15) the `visible` class is added,
 * which transitions opacity + translateY to their natural state.
 * Call this once at the top level of each page/layout.
 */
export function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('.reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}
