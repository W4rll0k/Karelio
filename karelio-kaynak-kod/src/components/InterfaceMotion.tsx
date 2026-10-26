import { useEffect, useRef } from 'react';

/** One-time section arrivals and small UI responses; no pointer tracking. */
export default function InterfaceMotion() {
  const revealed = useRef(new WeakSet<HTMLElement>());

  useEffect(() => {
    const root = document.documentElement;
    const preference = window.matchMedia('(prefers-reduced-motion: no-preference)');
    const targets = [...document.querySelectorAll<HTMLElement>('.step-card, .faq-section, #gizlilik')];
    const visible = new Set<HTMLElement>();
    let observer: IntersectionObserver | null = null;

    function reveal(element: HTMLElement) {
      if (document.hidden || !preference.matches || revealed.current.has(element)) return;
      revealed.current.add(element);
      element.classList.add('ui-motion-reveal');
      observer?.unobserve(element);
      visible.delete(element);
    }

    function syncVisibility() {
      root.classList.toggle('ui-motion-paused', document.hidden);
      if (!document.hidden) visible.forEach(reveal);
    }

    function syncPreference() {
      observer?.disconnect();
      observer = null;
      visible.clear();
      root.classList.toggle('ui-motion', preference.matches);
      targets.forEach((element) => element.classList.remove('ui-motion-reveal'));
      if (!preference.matches || !('IntersectionObserver' in window)) return;

      observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          const element = entry.target as HTMLElement;
          if (entry.isIntersecting) {
            visible.add(element);
            reveal(element);
          } else visible.delete(element);
        }
      }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });

      targets.forEach((element, index) => {
        // The three explanatory cards arrive in a short, quiet sequence.
        element.style.setProperty('--ui-arrival-delay', element.classList.contains('step-card') ? `${index * 45}ms` : '0ms');
        if (!revealed.current.has(element)) observer?.observe(element);
      });
    }

    preference.addEventListener('change', syncPreference);
    document.addEventListener('visibilitychange', syncVisibility);
    syncVisibility();
    syncPreference();

    return () => {
      observer?.disconnect();
      preference.removeEventListener('change', syncPreference);
      document.removeEventListener('visibilitychange', syncVisibility);
      root.classList.remove('ui-motion', 'ui-motion-paused');
      targets.forEach((element) => {
        element.classList.remove('ui-motion-reveal');
        element.style.removeProperty('--ui-arrival-delay');
      });
    };
  }, []);

  return null;
}
