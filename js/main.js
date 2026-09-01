/* ============================================================
   iTeach-inspired Tutor Services — interactions
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Header scroll ---------- */
  const header = document.querySelector('.site-header');
  const backTop = document.querySelector('.back-top');
  const onScroll = () => {
    const y = window.scrollY;
    if (header) header.classList.toggle('scrolled', y > 60);
    if (backTop) backTop.classList.toggle('show', y > 500);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (backTop) backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ---------- Hero video cross-fade loop ---------- */
  const heroVideos = [document.getElementById('heroVideo1'), document.getElementById('heroVideo2')].filter(Boolean);
  if (heroVideos.length === 2) {
    const [v1, v2] = heroVideos;
    let current = v1;

    v2.pause();
    v2.currentTime = 0;

    const fadeIn = (video) => {
      video.classList.add('is-active');
    };

    const switchTo = (next) => {
      if (current === next) return;
      next.currentTime = 0;
      const onPlaying = () => {
        next.removeEventListener('playing', onPlaying);
        fadeIn(next);
        current.classList.remove('is-active');
        current.pause();
        current = next;
      };
      next.addEventListener('playing', onPlaying);
      next.play().catch(() => {});
    };

    const showV1 = () => {
      v1.removeEventListener('playing', showV1);
      fadeIn(v1);
    };
    v1.addEventListener('playing', showV1);
    if (!v1.paused) showV1();

    v1.addEventListener('ended', () => switchTo(v2));
    v2.addEventListener('ended', () => switchTo(v1));
  }

  /* ---------- Mobile menu ---------- */
  const navToggle = document.querySelector('.nav-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  const closeMenu = document.querySelector('.mobile-menu .close-btn');
  const openMenu = () => {
    if (!mobileMenu) return;
    mobileMenu.classList.add('open');
    document.body.style.overflow = 'hidden';
    mobileMenu.querySelectorAll('nav li').forEach((li, i) => {
      li.style.transitionDelay = (0.08 + i * 0.06) + 's';
    });
  };
  const hideMenu = () => {
    if (!mobileMenu) return;
    mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
  };
  if (navToggle) navToggle.addEventListener('click', openMenu);
  if (closeMenu) closeMenu.addEventListener('click', hideMenu);
  if (mobileMenu) mobileMenu.addEventListener('click', (e) => {
    if (e.target === mobileMenu) hideMenu();
  });
  document.querySelectorAll('.mobile-menu nav a').forEach(a => a.addEventListener('click', hideMenu));

  /* ---------- Login modal ---------- */
  const loginTriggers = document.querySelectorAll('.header-login, .login-trigger');
  const modal = document.getElementById('loginModal');
  const closeModal = document.querySelector('.close-modal');
  if (modal) {
    loginTriggers.forEach(btn => btn.addEventListener('click', (e) => {
      e.preventDefault();
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }));
    const closeFn = () => {
      modal.classList.remove('open');
      document.body.style.overflow = '';
      setTimeout(() => {
        const success = modal.querySelector('.login-success');
        if (success) success.style.display = 'none';
        const form = modal.querySelector('.login-form');
        if (form) form.style.display = '';
      }, 300);
    };
    if (closeModal) closeModal.addEventListener('click', closeFn);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeFn(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeFn(); });
    const form = modal.querySelector('.login-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        form.style.display = 'none';
        const success = modal.querySelector('.login-success');
        if (success) success.style.display = 'block';
      });
    }
  }

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('visible'));
  }

  /* ---------- Animated counters ---------- */
  const counters = document.querySelectorAll('[data-count]');
  const animateCount = (el) => {
    const target = parseFloat(el.dataset.count);
    const decimals = (el.dataset.decimals || '0');
    const dur = 2000;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toLocaleString('en-US', { minimumFractionDigits: +decimals, maximumFractionDigits: +decimals });
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if ('IntersectionObserver' in window) {
    const cObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          cObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach(c => cObs.observe(c));
  } else {
    counters.forEach(c => c.textContent = c.dataset.count);
  }

  /* ---------- Testimonials slider ---------- */
  document.querySelectorAll('[data-slider]').forEach(slider => {
    const track = slider.querySelector('.tst-track');
    const dotsWrap = slider.querySelector('.tst-dots');
    const slides = slider.querySelectorAll('.tst-slide');
    if (!track || slides.length === 0) return;
    let idx = 0;
    const count = slides.length;
    const go = (i) => {
      idx = (i + count) % count;
      track.style.transform = `translateX(-${idx * 100}%)`;
      slider.querySelectorAll('.tst-dots button').forEach((d, k) => d.classList.toggle('active', k === idx));
    };
    const prevBtn = slider.querySelector('[data-prev]');
    const nextBtn = slider.querySelector('[data-next]');
    if (prevBtn) prevBtn.addEventListener('click', () => go(idx - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => go(idx + 1));
    if (dotsWrap) {
      slides.forEach((_, i) => {
        const b = document.createElement('button');
        if (i === 0) b.classList.add('active');
        b.addEventListener('click', () => go(i));
        dotsWrap.appendChild(b);
      });
    }
    let timer = setInterval(() => go(idx + 1), 6000);
    slider.addEventListener('mouseenter', () => clearInterval(timer));
    slider.addEventListener('mouseleave', () => { timer = setInterval(() => go(idx + 1), 6000); });
  });

  /* ---------- Horizontal news slider ---------- */
  document.querySelectorAll('[data-news-slider]').forEach(prev => {
    const wrap = prev.closest('.news-slider-wrap');
    if (!wrap) return;
    const scroller = wrap.querySelector('.news-track');
    const step = () => 320;
    const nextBtn = wrap.querySelector('[data-news-next]');
    if (nextBtn) nextBtn.addEventListener('click', () => scroller.scrollBy({ left: step(), behavior: 'smooth' }));
    prev.addEventListener('click', () => scroller.scrollBy({ left: -step(), behavior: 'smooth' }));
  });

  /* ---------- Accordion ---------- */
  document.querySelectorAll('.acc-item').forEach(item => {
    const head = item.querySelector('.acc-head');
    const body = item.querySelector('.acc-body');
    if (!head || !body) return;
    head.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.acc-item.open').forEach(o => {
        o.classList.remove('open');
        o.querySelector('.acc-body').style.maxHeight = null;
      });
      if (!isOpen) {
        item.classList.add('open');
        body.style.maxHeight = body.scrollHeight + 'px';
      }
    });
  });

  /* ---------- Shared email validation ----------
     Allowed characters: letters (A-Z, a-z), numbers (0-9), "@" and "."
     No other special characters (_, -, +, #, %, etc.) are permitted. */
  const isValidEmail = (value) => {
    value = (value || '').trim();
    if (!value || !/^[a-zA-Z0-9@.]+$/.test(value)) return false;
    const at = value.indexOf('@');
    if (at < 1 || at === value.length - 1) return false;
    if (value.indexOf('@', at + 1) !== -1) return false;
    if (value.indexOf('.', at + 1) < 0) return false;
    return value.slice(value.lastIndexOf('.') + 1).length >= 2;
  };
  const EMAIL_MSG = 'Only letters, numbers, "@" and "." are allowed in an email address.';

  /* ---------- Newsletter forms (validate + success) ---------- */
  document.querySelectorAll('.newsletter-form').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      const msg = form.querySelector('.newsletter-msg');
      const email = (input ? input.value : '').trim();

      function showMsg(text, type) {
        form.classList.remove('invalid');
        if (msg) {
          msg.textContent = text;
          msg.className = 'newsletter-msg ' + type;
        }
      }

      if (!email) {
        form.classList.add('invalid');
        showMsg('Please enter an email address to subscribe.', 'error');
        return;
      }
      if (!isValidEmail(email)) {
        form.classList.add('invalid');
        showMsg(/^[a-zA-Z0-9@.]+$/.test(email)
          ? 'Please enter a valid email address.'
          : 'Only letters, numbers, "@" and "." are allowed in an email address.');
        return;
      }
      form.classList.remove('invalid');
      showMsg("Subscribed! You're all set — watch your inbox.", 'success');
      form.reset();
    });
  });

  /* ---------- Contact form ---------- */
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    const emailField = contactForm.querySelector('#cEmail');
    const field = emailField ? emailField.closest('.form-field') : null;
    const status = document.getElementById('formStatus');

    if (emailField && field) {
      emailField.addEventListener('input', () => {
        if (!emailField.value.trim()) {
          field.classList.remove('invalid');
        } else if (!isValidEmail(emailField.value)) {
          field.classList.add('invalid');
        } else {
          field.classList.remove('invalid');
        }
        if (status) status.style.display = 'none';
      });
    }

    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (emailField && !isValidEmail(emailField.value)) {
        if (field) field.classList.add('invalid');
        if (status) {
          status.style.display = 'block';
          status.style.color = '#F1503C';
          status.textContent = 'Please enter a valid email address. ' + EMAIL_MSG;
        }
        return;
      }
      if (status) {
        status.style.display = 'block';
        status.style.color = '#23A455';
        status.textContent = '✓ Thank you! We\'ll reach out within 24 hours.';
      }
      contactForm.reset();
      if (field) field.classList.remove('invalid');
    });
  }

  /* ---------- Active nav by body data-page ---------- */
  const page = document.body.dataset.page;
  if (page) {
    document.querySelectorAll('.main-nav a[data-page], .mobile-menu nav a[data-page]').forEach(a => {
      if (a.dataset.page === page) a.classList.add('active');
    });
  }
})();