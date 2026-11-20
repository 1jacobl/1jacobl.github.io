// Shared motion: smooth scrolling, scroll reveals, page-to-page wipe.
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

  // Scroll progress bar.
  const bar = document.querySelector('.progress');
  if (bar) {
    const update = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    };
    addEventListener('scroll', update, { passive: true });
    update();
  }

  // Page wipe between pages: a panel in the destination's colour slides up, then we navigate.
  const wipe = document.querySelector('.wipe');
  document.querySelectorAll('a[data-wipe]').forEach((a) => {
    a.addEventListener('click', (e) => {
      if (reduce || !wipe || e.metaKey || e.ctrlKey) return;
      e.preventDefault();
      wipe.style.background = a.dataset.wipe;
      wipe.classList.add('cover');
      setTimeout(() => { location.href = a.href; }, 520);
    });
  });
  // Arriving: the wipe starts covering and slides away.
  if (wipe && wipe.classList.contains('arrive')) {
    requestAnimationFrame(() => requestAnimationFrame(() => wipe.classList.add('leave')));
  }
  // Coming back with the back button restores a page that may still be covered.
  addEventListener('pageshow', (e) => { if (e.persisted && wipe) wipe.classList.remove('cover'); });
})();
