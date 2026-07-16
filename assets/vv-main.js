(() => {
  const navToggle = document.getElementById('nav-toggle');
  const mobileNav = document.getElementById('mobile-nav');
  const vinePath = document.getElementById('vine-path');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Announcement bar + header — measure real height so page content sits flush beneath both */
  const announceBar = document.getElementById('announce-bar');
  const siteHeader = document.getElementById('site-header');
  const syncChromeHeight = () => {
    if (announceBar) document.documentElement.style.setProperty('--announce-h', `${announceBar.offsetHeight}px`);
    if (siteHeader) document.documentElement.style.setProperty('--header-h', `${siteHeader.offsetHeight}px`);
  };
  syncChromeHeight();
  window.addEventListener('resize', syncChromeHeight);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncChromeHeight);

  /* Preloader — brief branded curtain, then reveal */
  const preloader = document.getElementById('preloader');
  if (preloader) {
    if (prefersReduced) {
      document.body.classList.add('is-loaded');
      preloader.classList.add('is-hidden');
    } else {
      requestAnimationFrame(() => preloader.classList.add('is-ready'));
      const finish = () => {
        document.body.classList.add('is-loaded');
        preloader.classList.add('is-hidden');
      };
      window.addEventListener('load', () => setTimeout(finish, 500));
      setTimeout(finish, 2200);
    }
  } else {
    document.body.classList.add('is-loaded');
  }

  /* Mobile nav toggle */
  if (navToggle && mobileNav) {
    navToggle.addEventListener('click', () => {
      const open = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!open));
      mobileNav.classList.toggle('is-open', !open);
      navToggle.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
    });
    mobileNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navToggle.setAttribute('aria-expanded', 'false');
        mobileNav.classList.remove('is-open');
      });
    });
  }

  /* Search toggle + live predictive search against Shopify's own catalog */
  const searchToggle = document.getElementById('search-toggle');
  const searchBar = document.getElementById('search-bar');
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');

  if (searchToggle && searchBar) {
    searchToggle.addEventListener('click', () => {
      const open = searchToggle.getAttribute('aria-expanded') === 'true';
      searchToggle.setAttribute('aria-expanded', String(!open));
      searchBar.classList.toggle('is-open', !open);
      if (!open) searchInput.focus();
    });
  }

  if (searchInput && searchResults) {
    let debounceTimer;
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim();
      clearTimeout(debounceTimer);
      if (!q) {
        searchResults.classList.remove('has-results');
        searchResults.innerHTML = '';
        return;
      }
      debounceTimer = setTimeout(() => {
        fetch(`/search/suggest.json?q=${encodeURIComponent(q)}&resources[type]=product&resources[limit]=6`)
          .then((res) => res.json())
          .then((data) => {
            const products = (data.resources && data.resources.results && data.resources.results.products) || [];
            searchResults.classList.add('has-results');
            if (products.length === 0) {
              searchResults.innerHTML = '<p class="search-empty">No pieces match — try “co-ord” or “abaya”.</p>';
              return;
            }
            searchResults.innerHTML = products
              .map(
                (p) => `
              <a class="search-result" href="${p.url}">
                <img src="${p.image}" alt="">
                <span>
                  <span class="search-result-name">${p.title}</span><br>
                  <span class="search-result-meta">${p.price}</span>
                </span>
              </a>`
              )
              .join('');
          })
          .catch(() => {});
      }, 200);
    });
  }

  /* Reveal-on-scroll — re-callable so pages can register elements added after load */
  const revealIo = 'IntersectionObserver' in window && !prefersReduced
    ? new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              revealIo.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
      )
    : null;

  window.VV_initReveal = () => {
    document.querySelectorAll('.reveal:not(.is-visible)').forEach((el) => {
      if (revealIo) revealIo.observe(el);
      else el.classList.add('is-visible');
    });
  };
  window.VV_initReveal();

  /* Vine thread — draws in with scroll progress (signature motif) */
  if (vinePath && !prefersReduced) {
    const length = vinePath.getTotalLength();
    vinePath.style.strokeDasharray = `${length}`;

    const updateVine = () => {
      const doc = document.documentElement;
      const scrollTop = window.scrollY;
      const maxScroll = doc.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? Math.min(scrollTop / maxScroll, 1) : 0;
      vinePath.style.strokeDashoffset = `${length * (1 - progress)}`;
    };
    updateVine();
    window.addEventListener('scroll', updateVine, { passive: true });
    window.addEventListener('resize', updateVine);
  } else if (vinePath) {
    vinePath.style.strokeDasharray = 'none';
  }

  /* Hero parallax — subtle depth on the diptych photos */
  const parallaxEls = document.querySelectorAll('[data-parallax] img');
  if (parallaxEls.length && !prefersReduced) {
    const updateParallax = () => {
      const y = window.scrollY;
      parallaxEls.forEach((img) => {
        const shift = Math.min(y * 0.08, 60);
        img.style.transform = `translateY(${shift}px) scale(1.08)`;
      });
    };
    updateParallax();
    window.addEventListener('scroll', updateParallax, { passive: true });
    window.addEventListener('resize', updateParallax);
  }
})();
