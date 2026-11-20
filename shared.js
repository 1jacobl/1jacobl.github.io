// Shared motion: smooth scrolling and scroll reveals.
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Smooth scrolling (Lenis). Falls back to native scroll if it didn't load.
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 4), smoothWheel: true });
    const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  window.__lenis = lenis;
  // Reloads always start at the top (the browser would otherwise restore the old position).
  const nav0 = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
  if (nav0 && nav0.type === 'reload') { window.scrollTo(0, 0); if (lenis) lenis.scrollTo(0, { immediate: true }); }

  // In-page anchor links go through Lenis.
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const el = id.length > 1 && document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      if (lenis) {
        // Longer, ease-in-out glide for in-page jumps (feels smoother than the wheel easing over a long distance).
        const dist = Math.abs(el.getBoundingClientRect().top);
        const duration = Math.min(2.1, Math.max(1.1, 0.9 + dist / 1400));
        lenis.scrollTo(el, { offset: -24, duration, easing: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2) });
      }
      else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  // Reveal on scroll. Children of [data-stagger] get increasing delays.
  document.querySelectorAll('[data-stagger]').forEach((group) => {
    const step = parseFloat(group.dataset.stagger) || 70;
    [...group.children].forEach((c, i) => {
      c.classList.add('reveal');
      c.style.setProperty('--d', `${i * step}ms`);
    });
  });
  // Whatever is already on screen when the page opens shows at once (the page fade is its entrance);
  // only things you scroll to animate in. This stops the "loads twice" stutter.
  const root = document.documentElement;
  root.classList.add('settling');
  let first = true;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      en.target.dispatchEvent(new CustomEvent('reveal'));
      io.unobserve(en.target);
    });
    if (first) { first = false; requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('settling'))); }
  }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('.reveal, [data-on-view], .line').forEach((el) => io.observe(el));

  // Fixed nav gets a backdrop once the page has scrolled.
  const nav = document.querySelector('nav.top');
  if (nav) {
    const solid = () => nav.classList.toggle('solid', scrollY > 30);
    addEventListener('scroll', solid, { passive: true });
    solid();
  }
})();
