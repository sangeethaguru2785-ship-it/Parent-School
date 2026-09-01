/* ============================================================
   Motion One + Three.js page enhancements
   Loaded on every page after the vendor libraries.
   Degrades silently when Motion (window.Motion) or WebGL,
   intersection support, or reduced-motion preferences are absent.
   ============================================================ */
(function () {
  'use strict';

  var MotionLib = (typeof window !== 'undefined' && window.Motion) || null;
  var reduceMotion = typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var supportsIO = typeof IntersectionObserver !== 'undefined';
  var canHoverFine = typeof window.matchMedia === 'function' &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  var EASE = [0.22, 1, 0.36, 1];

  function clearInline(el) {
    el.style.opacity = '';
    el.style.transform = '';
    el.style.removeProperty('--motion-scale');
    el.style.removeProperty('--motion-x');
    el.style.removeProperty('--motion-y');
    el.style.removeProperty('--motion-z');
  }

  function settle(el) {
    el.classList.add('visible');
    clearInline(el);
  }

  /* ---------- 1. Upgrade .reveal with Motion One ---------- */
  if (MotionLib && !reduceMotion && supportsIO) {
    var reveals = document.querySelectorAll('.reveal');
    [].forEach.call(reveals, function (el, i) {
      /* Hero/banner/error regions are animated by module 2 instead. */
      if (typeof el.closest !== 'function' || el.closest('.hero, .page-banner, .error-page')) return;

      var start;
      if (el.classList.contains('reveal-left')) start = 'translateX(-60px)';
      else if (el.classList.contains('reveal-right')) start = 'translateX(60px)';
      else if (el.classList.contains('reveal-zoom')) start = 'scale(.88)';
      else start = 'translateY(44px)';
      var delay = (i % 3) * 0.07;
      MotionLib.inView(el, function () {
        try {
          MotionLib.animate(el, {
            opacity: [0, 1],
            transform: [start, 'none']
          }, {
            duration: 0.75,
            delay: delay,
            easing: EASE
          }).finished
            .then(function () { settle(el); })
            .catch(function () { settle(el); });
        } catch (err) {
          settle(el);
        }
      }, { amount: 0.15 });
    });
  }

  /* ---------- 2. Hero, banner & error content entrance (staggered) ---------- */
  if (MotionLib && !reduceMotion) {
    var regions = document.querySelectorAll('.hero, .page-banner, .error-page');

    /* Reveals inside these regions are covered by the stagger below. */
    [].forEach.call(regions, function (region) {
      [].forEach.call(region.querySelectorAll('.reveal'), function (r) {
        r.classList.add('visible');
        r.style.transition = 'none';
      });
    });

    [].forEach.call(regions, function (region) {
      var kind = region.classList.contains('page-banner') ? 'banner'
        : region.classList.contains('error-page') ? 'error'
        : 'hero';

      var selectors = kind === 'hero' ? ['.hero-tag', 'h1', 'p', '.hero-cta .btn', '.hm-item']
        : kind === 'banner' ? ['.breadcrumbs', 'h1', 'p', '.btn']
        : ['.error-code', 'h1', 'p', '.error-cta .btn'];

      var els = [];
      selectors.forEach(function (sel) {
        [].forEach.call(region.querySelectorAll(sel), function (n) {
          if (els.indexOf(n) === -1) els.push(n);
        });
      });
      if (!els.length) return;

      /* Stop CSS entrance keyframes so Motion One drives the entrance. */
      [].forEach.call(region.querySelectorAll('.hero-cta, .hero-meta, .error-cta'), function (wrap) {
        wrap.style.animation = 'none';
      });
      els.forEach(function (el) {
        el.style.animation = 'none';
      });

      var startDelay = kind === 'hero' ? 0.1 : 0.15;
      var step = kind === 'hero' ? 0.1 : 0.12;
      els.forEach(function (el, i) {
        try {
          MotionLib.animate(el, {
            opacity: [0, 1],
            transform: ['translateY(34px)', 'none']
          }, {
            duration: 0.85,
            delay: startDelay + i * step,
            easing: EASE
          }).finished
            .then(function () { clearInline(el); })
            .catch(function () { clearInline(el); });
        } catch (err) {
          clearInline(el);
        }
      });
    });
  }

  /* ---------- 3. Hero button hover (Motion One, pointing devices) ---------- */
  if (MotionLib && !reduceMotion && canHoverFine) {
    var heroBtns = document.querySelectorAll('.hero .hero-cta .btn, .page-banner .btn, .error-page .btn');
    [].forEach.call(heroBtns, function (btn) {
      btn.dataset.hovered = '0';
      btn.addEventListener('pointerenter', function () {
        btn.dataset.hovered = '1';
        try {
          MotionLib.animate(btn, { y: -3, scale: 1.02 }, { duration: 0.3, easing: EASE }).finished.catch(function () {});
        } catch (err) {}
      });
      btn.addEventListener('pointerleave', function () {
        btn.dataset.hovered = '0';
        try {
          MotionLib.animate(btn, { y: 0, scale: 1 }, { duration: 0.3, easing: EASE }).finished
            .then(function () { clearInline(btn); })
            .catch(function () { clearInline(btn); });
        } catch (err) {
          clearInline(btn);
        }
      });
    });
  }

  /* ---------- 4. Button press feedback ---------- */
  if (MotionLib && !reduceMotion) {
    var btns = document.querySelectorAll('.btn');
    [].forEach.call(btns, function (btn) {
      var pressed = false;
      btn.addEventListener('pointerdown', function () {
        pressed = true;
        try {
          MotionLib.animate(btn, { scale: 0.97 }, { duration: 0.12 }).finished.catch(function () {});
        } catch (err) {}
      });
      var release = function () {
        if (!pressed) return;
        pressed = false;
        try {
          MotionLib.animate(btn, { scale: 1 }, { duration: 0.25, easing: EASE }).finished
            .then(function () {
              if (btn.dataset.hovered === '1') {
                /* Keep the Motion hover lift going after a click. */
                btn.style.setProperty('--motion-scale', '1');
              } else {
                clearInline(btn);
              }
            })
            .catch(function () {
              if (btn.dataset.hovered !== '1') clearInline(btn);
            });
        } catch (err) {
          if (btn.dataset.hovered !== '1') clearInline(btn);
        }
      };
      btn.addEventListener('pointerup', release);
      btn.addEventListener('pointerleave', release);
    });
  }

  /* ---------- 5. Home hero particles (Three.js) ---------- */
  var canvas = document.getElementById('heroCanvas');
  if (canvas && window.THREE && !reduceMotion) {
    var THREE = window.THREE;
    var isMobile = window.innerWidth < 768;
    var COUNT = isMobile ? 70 : 130;
    var renderer = null;
    var scene, camera, points, velocities;
    var mouse = { x: 0, y: 0 };
    var paused = true;
    var rafId = 0;

    function build() {
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
      camera.position.z = 20;

      renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: false, powerPreference: 'low-power' });
      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

      var positions = new Float32Array(COUNT * 3);
      velocities = new Float32Array(COUNT * 3);
      var spread = isMobile ? 16 : 24;
      for (var i = 0; i < COUNT; i++) {
        positions[i * 3] = (Math.random() - 0.5) * spread;
        positions[i * 3 + 1] = (Math.random() - 0.5) * spread;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
        velocities[i * 3] = (Math.random() - 0.5) * 0.015;
        velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
        velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
      }

      var geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      var material = new THREE.PointsMaterial({
        color: 0xFFB606,
        size: isMobile ? 0.18 : 0.26,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true
      });

      points = new THREE.Points(geometry, material);
      scene.add(points);
      resize();
      return true;
    }

    function resize() {
      if (!renderer) return;
      var w = canvas.clientWidth || window.innerWidth;
      var h = canvas.clientHeight || window.innerHeight;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }

    function tick() {
      if (paused) return;
      rafId = requestAnimationFrame(tick);
      if (!points) return;
      if (camera) {
        camera.position.x += (mouse.x * 1.2 - camera.position.x) * 0.04;
        camera.position.y += (-mouse.y * 0.9 - camera.position.y) * 0.04;
        camera.lookAt(scene.position);
      }
      var pos = points.geometry.attributes.position.array;
      for (var i = 0; i < COUNT; i++) {
        pos[i * 3] += velocities[i * 3];
        pos[i * 3 + 1] += velocities[i * 3 + 1];
        pos[i * 3 + 2] += velocities[i * 3 + 2];
        if (pos[i * 3 + 1] > 12 || pos[i * 3 + 1] < -12) velocities[i * 3 + 1] *= -1;
        if (pos[i * 3] > 12 || pos[i * 3] < -12) velocities[i * 3] *= -1;
      }
      points.geometry.attributes.position.needsUpdate = true;
      points.rotation.y += 0.0004;
      renderer.render(scene, camera);
    }

    function start() {
      if (paused === false) return;
      paused = false;
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(tick);
    }

    function stop() {
      paused = true;
      cancelAnimationFrame(rafId);
    }

    try {
      build();
    } catch (err) {
      renderer = null;
    }

    if (renderer) {
      window.addEventListener('resize', resize, { passive: true });
      window.addEventListener('pointermove', function (e) {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
      }, { passive: true });
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) stop(); else start();
      });
      if (supportsIO) {
        var heroObs = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) start(); else stop();
          });
        }, { threshold: 0.05 });
        var hero = canvas.closest('.hero');
        if (hero) heroObs.observe(hero);
      }
      start();
    } else {
      canvas.style.display = 'none';
    }
  }
})();