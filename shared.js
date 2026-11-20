// Shared motion: smooth scrolling and scroll reveals.
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js');

  // Smooth scrolling (Lenis). Falls back to native scroll if it didn't load.
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 4), smoothWheel: true });
    const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  window.__lenis = lenis;

  // In-page anchor links go through Lenis.
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const el = id.length > 1 && document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(el, { offset: -24 });
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
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      en.target.dispatchEvent(new CustomEvent('reveal'));
      io.unobserve(en.target);
    });
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
