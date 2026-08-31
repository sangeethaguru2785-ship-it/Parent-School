/* ============================================================
   Stackly Portal — Teacher & Parent dashboard engine
   Hash routing, SPA views, charts, modals, toasts, interactions
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Sidebar (mobile) ---------- */
  var side = document.getElementById('dashSide');
  var toggle = document.getElementById('menuToggle');
  var backdrop = document.getElementById('sideBackdrop');
  if (toggle && backdrop && side) {
    var open = function () { side.classList.add('open'); backdrop.classList.add('open'); document.body.style.overflow = 'hidden'; };
    var close = function () { side.classList.remove('open'); backdrop.classList.remove('open'); document.body.style.overflow = ''; };
    toggle.addEventListener('click', open);
    backdrop.addEventListener('click', close);
    side.querySelectorAll('.side-nav a').forEach(function (a) {
      a.addEventListener('click', function () { if (window.innerWidth <= 991) close(); });
    });
  }

  /* ---------- Logout ---------- */
  document.querySelectorAll('.js-signout').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      try { localStorage.removeItem('portal_user'); } catch (err) {}
      window.location.href = 'login.html';
    });
  });

  /* ---------- View routing ---------- */
  var defaultView = (document.body.getAttribute('data-default') || 'overview');
  var viewEls = Array.prototype.slice.call(document.querySelectorAll('.dash-view'));
  var navEls = Array.prototype.slice.call(document.querySelectorAll('.side-nav a[data-view]'));

  function animateCharts(scope) {
    scope.querySelectorAll('.bar-row .b-fill[data-w]').forEach(function (bar) {
      var w = bar.getAttribute('data-w');
      bar.style.width = '0%';
      setTimeout(function () { bar.style.width = w + '%'; }, 70);
    });
    scope.querySelectorAll('.cc-bar[data-h]').forEach(function (bar) {
      var h = bar.getAttribute('data-h');
      bar.style.height = '3px';
      setTimeout(function () { bar.style.height = h + '%'; }, 90 + Math.random() * 140);
    });
  }

  var animated = {};
  function animateCounters(scope) {
    scope.querySelectorAll('[data-count]').forEach(function (el) {
      if (animated[el.dataset.count]) return;
      animated[el.dataset.count] = true;
      var target = parseFloat(el.dataset.count);
      var decimals = +(el.dataset.decimals || 0);
      var dur = 1400;
      var start = performance.now();
      function step(now) {
        var p = Math.min((now - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = (target * eased).toFixed(decimals) + (el.dataset.suffix || '');
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  function showView(name) {
    var matched = false;
    viewEls.forEach(function (v) {
      var on = v.getAttribute('data-view') === name;
      if (on) matched = true;
      v.classList.toggle('active', on);
      if (on) {
        if (!v.dataset.booted) {
          v.dataset.booted = '1';
          animateCharts(v);
        }
        animateCounters(v);
      }
    });
    if (!matched) {
      if (name === defaultView) {
        if (viewEls.length) { viewEls[0].classList.add('active'); }
      } else {
        location.hash = '/#' + defaultView;
        showView(defaultView);
        return;
      }
    }
    navEls.forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('data-view') === name);
    });
    var label = '';
    navEls.forEach(function (a) {
      if (a.getAttribute('data-view') === name) label = a.getAttribute('data-label') || '';
    });
    if (label) document.title = label + ' – Parent–School Communication Portal';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function route() {
    var h = location.hash.replace(/^#\/?/, '');
    showView(h || defaultView);
  }

  navEls.forEach(function (a) {
    a.addEventListener('click', function () {
      location.hash = '/' + a.getAttribute('data-view');
    });
  });

  document.querySelectorAll('[data-goto]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      location.hash = '/' + el.getAttribute('data-goto');
    });
  });

  window.addEventListener('hashchange', route);
  if (!location.hash) {
    history.replaceState(null, '', '#/' + defaultView);
  }
  route();

  /* ---------- Toast helper ---------- */
  window.dashToast = function (msg, type) {
    var wrap = document.querySelector('.toast-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'toast-wrap';
      document.body.appendChild(wrap);
    }
    var t = document.createElement('div');
    t.className = 'toast' + (type ? ' ' + type : '');
    t.innerHTML = '<span class="t-ic">' + (type === 'success' ? '&#10003;' : type === 'danger' ? '!' : 'i') + '</span><span>' + msg + '</span>';
    wrap.appendChild(t);
    setTimeout(function () {
      t.style.opacity = '0';
      t.style.transform = 'translateX(40px)';
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 320);
    }, 2800);
  };

  document.querySelectorAll('[data-save]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      window.dashToast(btn.getAttribute('data-save'), 'success');
    });
  });
  document.querySelectorAll('[data-toast]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      window.dashToast(btn.getAttribute('data-toast'), btn.getAttribute('data-save') ? 'success' : '');
    });
  });

  /* ---------- Line chart renderer ---------- */
  function renderLineChart(el) {
    var vals = (el.getAttribute('data-values') || '').split(',').map(function (s) { return parseFloat(s); }).filter(function (n) { return !isNaN(n); });
    if (!vals.length) return;
    var labels = (el.getAttribute('data-labels') || '').split('|');
    var unit = el.getAttribute('data-unit') || '%';
    var w = 600, h = 220, pad = 30, grad = 'grad' + ('id' + Math.random()).replace(/\./g, '');
    var max = el.getAttribute('data-max') ? parseFloat(el.getAttribute('data-max')) : 100;
    var n = vals.length;
    var step = n > 1 ? (w - pad * 2) / (n - 1) : 0;
    function pt(i) {
      return [pad + step * i, (h - pad) - (vals[i] / max) * (h - pad * 2)];
    }
    var line = vals.map(function (_, i) { return pt(i).map(function (v) { return v.toFixed(1); }).join(','); }).join(' ');
    var p0 = pt(0), pN = pt(n - 1);
    var area = line + ' ' + pN[0].toFixed(1) + ',' + (h - pad).toFixed(1) + ' ' + p0[0].toFixed(1) + ',' + (h - pad).toFixed(1);
    var grid = '';
    for (var k = 0; k <= 4; k++) {
      var gy = (pad) + (k / 4) * (h - pad * 2);
      grid += '<line class="grid" x1="' + pad + '" y1="' + gy + '" x2="' + (w - pad) + '" y2="' + gy + '"/>';
      grid += '<text x="0" y="' + (gy + 3) + '" fill="#A5A6AA" font-size="9">' + Math.round(max * (1 - k / 4)) + '</text>';
    }
    var dots = vals.map(function (_, i) {
      var p = pt(i);
      return '<circle class="dot" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="4.5"/>' +
        '<text x="' + p[0].toFixed(1) + '" y="' + (p[1] - 10).toFixed(1) + '" text-anchor="middle" fill="#442E66" font-size="11" font-weight="700">' + vals[i] + unit + '</text>' +
        '<text x="' + p[0].toFixed(1) + '" y="' + (h - 8) + '" text-anchor="middle" fill="#A5A6AA" font-size="11">' + (labels[i] !== undefined ? labels[i] : '') + '</text>';
    }).join('');
    var svg =
      '<svg viewBox="0 0 600 225" preserveAspectRatio="none">' +
      '<defs><linearGradient id="' + grad + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#525FE1" stop-opacity="0.28"/>' +
      '<stop offset="1" stop-color="#525FE1" stop-opacity="0"/>' +
      '</linearGradient></defs>' +
      grid +
      '<polygon points="' + area + '" fill="url(#' + grad + ')"/>' +
      '<polyline class="line" points="' + line + '"/>' +
      dots +
      '</svg>';
    el.innerHTML = svg;
  }
  document.querySelectorAll('.line-chart[data-values]').forEach(renderLineChart);

  /* ---------- Chips filter ---------- */
  document.querySelectorAll('.chips[data-target]').forEach(function (group) {
    group.querySelectorAll('.chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        group.querySelectorAll('.chip').forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        var scope = document.querySelector(group.getAttribute('data-target'));
        if (!scope) return;
        var cat = chip.getAttribute('data-cat');
        scope.querySelectorAll('[data-cat]').forEach(function (el) {
          el.style.display = (cat === 'all' || el.getAttribute('data-cat') === cat) ? '' : 'none';
        });
      });
    });
  });

  /* ---------- Tabs ---------- */
  document.querySelectorAll('.tabs[data-target]').forEach(function (tabs) {
    tabs.querySelectorAll('.tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.querySelectorAll('.tab').forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        var scope = document.querySelector(tabs.getAttribute('data-target'));
        if (!scope) return;
        var pane = tab.getAttribute('data-pane');
        scope.querySelectorAll('.tab-pane').forEach(function (el) {
          el.classList.toggle('active', el.getAttribute('data-pane') === pane);
        });
      });
    });
  });

  /* ---------- Modals ---------- */
  function openModal(id) { var m = document.getElementById(id); if (m) m.classList.add('open'); }
  function closeModal(m) { if (m) m.classList.remove('open'); }
  document.querySelectorAll('[data-modal]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      openModal(btn.getAttribute('data-modal'));
    });
  });
  document.querySelectorAll('.dash-modal').forEach(function (m) {
    m.querySelectorAll('.modal-x, [data-close]').forEach(function (b) {
      b.addEventListener('click', function () { closeModal(m); });
    });
    m.addEventListener('click', function (e) { if (e.target === m) closeModal(m); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') document.querySelectorAll('.dash-modal.open').forEach(closeModal);
  });

  /* ---------- Messages ---------- */
  (function initThreads() {
    var layouts = document.querySelectorAll('.msg-layout');
    layouts.forEach(function (wrap) {
      var convs = wrap.querySelectorAll('.conv');
      var threads = wrap.querySelectorAll('.msg-thread');
      function select(id) {
        convs.forEach(function (c) { c.classList.toggle('active', c.getAttribute('data-thread') === id); });
        threads.forEach(function (t) { t.classList.toggle('active', t.getAttribute('data-thread') === id); });
      }
      if (convs.length) select(convs[0].getAttribute('data-thread'));
      convs.forEach(function (c) {
        c.addEventListener('click', function () {
          select(c.getAttribute('data-thread'));
          wrap.classList.add('show-thread');
        });
      });
      wrap.querySelectorAll('.thread-back').forEach(function (b) {
        b.addEventListener('click', function () { wrap.classList.remove('show-thread'); });
      });
      wrap.querySelectorAll('.ms-search input').forEach(function (inp) {
        inp.addEventListener('input', function () {
          var q = inp.value.toLowerCase().trim();
          convs.forEach(function (c) {
            c.style.display = (q === '' || c.getAttribute('data-name').toLowerCase().indexOf(q) !== -1) ? '' : 'none';
          });
        });
      });
    });
  })();

  /* ---------- Generic live search (tables with [data-name] rows) ---------- */
  function attachSearch(input) {
    input.addEventListener('input', function () {
      var q = input.value.toLowerCase().trim();
      var scope = document.querySelector(input.getAttribute('data-search'));
      if (!scope) return;
      scope.querySelectorAll('[data-name]').forEach(function (row) {
        row.style.display = (q === '' || (row.getAttribute('data-name') || '').toLowerCase().indexOf(q) !== -1) ? '' : 'none';
      });
    });
  }
  document.querySelectorAll('[data-search]').forEach(attachSearch);
  var globalSearch = document.getElementById('globalSearch');
  if (globalSearch) {
    globalSearch.addEventListener('input', function () {
      var v = document.querySelector('.dash-view.active');
      var q = globalSearch.value.toLowerCase().trim();
      if (!v) return;
      v.querySelectorAll('[data-name]').forEach(function (row) {
        row.style.display = (q === '' || (row.getAttribute('data-name') || '').toLowerCase().indexOf(q) !== -1) ? '' : 'none';
      });
    });
  }

  /* ---------- Toast-wired forms ---------- */
  document.querySelectorAll('form[data-toast]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = form.getAttribute('data-toast');
      window.dashToast(msg, 'success');
      form.reset();
      if (form.closest('.dash-modal')) closeModal(form.closest('.dash-modal'));
    });
  });

  /* ---------- Student quick-view modal ---------- */
  document.querySelectorAll('[data-view-student]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var row = btn.closest('tr');
      if (!row) return;
      var title = document.getElementById('studentModalTitle');
      var body = document.getElementById('studentModalBody');
      if (!title || !body) { window.dashToast('Student profile opened'); return; }
      var name = row.getAttribute('data-name');
      var cls = row.getAttribute('data-class') || 'Class 4-B';
      var att = row.getAttribute('data-att') || '—';
      var grades = (row.getAttribute('data-grades') || '').split(',');
      var subjects = (row.getAttribute('data-subjects') || 'Maths,Science,Language').split(',');
      title.textContent = name;
      var rows = grades.map(function (g, i) {
        return '<tr><td><strong style="color:var(--dark)">' + (subjects[i] || 'Subject ' + (i + 1)) + '</strong></td><td><span class="tag purple">' + g + '</span></td></tr>';
      }).join('');
      body.innerHTML =
        '<div class="stu-meta" style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:16px;">' +
        '<div class="stu-chip" style="padding:10px 16px;background:var(--paper);border-radius:12px;"><span class="muted" style="display:block;font-size:.75rem;">Class</span><b style="color:var(--dark);">' + cls + '</b></div>' +
        '<div class="stu-chip" style="padding:10px 16px;background:var(--paper);border-radius:12px;"><span class="muted" style="display:block;font-size:.75rem;">Attendance</span><b style="color:var(--dark);">' + att + '%</b></div>' +
        '</div>' +
        '<table class="dash-table"><thead><tr><th>Subject</th><th>Score</th></tr></thead><tbody>' + rows + '</tbody></table>';
      openModal('studentModal');
    });
  });
})();